import jwt from "jsonwebtoken";
import crypto from "crypto";
import RefreshToken from "../model/refreshToken.Model.js";
import User from "../model/user.Model.js";
import { safeGet, safeSet, safeDel, safeDelPattern, isRedisAvailable } from "./redis.js";

const ACCESS_TOKEN_EXPIRY = "15m";
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days in seconds
const REFRESH_TOKEN_TTL_MS = REFRESH_TOKEN_TTL_SECONDS * 1000;

export const getJwtSecret = () => {
  return process.env.JWT_SECRET || "instructoplus_jwt_secret_development_key_123";
};

/**
 * Generate Access Token (short-lived, 15 minutes by default)
 */
export const genToken = (userId, expiresIn = ACCESS_TOKEN_EXPIRY) => {
  try {
    const secret = getJwtSecret();
    return jwt.sign({ userId }, secret, { expiresIn });
  } catch (error) {
    console.error("Token generation error:", error);
    throw error;
  }
};

/**
 * Generate a cryptographically secure opaque refresh token
 */
export const generateRefreshTokenString = () => {
  return crypto.randomBytes(40).toString("hex");
};

/**
 * Generate Access + Refresh Token pair with Token Family tracking (RTR)
 */
export const generateTokenPair = async (userId, existingFamilyId = null) => {
  const familyId = existingFamilyId || crypto.randomUUID();
  const accessToken = genToken(userId, ACCESS_TOKEN_EXPIRY);
  const refreshToken = generateRefreshTokenString();
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

  // 1. Cache for sub-millisecond lookups (Redis with in-memory fallback)
  const redisPayload = {
    userId: userId.toString(),
    familyId,
    isUsed: false,
    expiresAt: expiresAt.toISOString(),
  };
  await safeSet(`rt:${refreshToken}`, redisPayload, REFRESH_TOKEN_TTL_SECONDS);

  // 2. Persist in MongoDB with TTL index
  try {
    if (RefreshToken.db?.readyState === 1) {
      await RefreshToken.create({
        token: refreshToken,
        userId,
        familyId,
        isUsed: false,
        expiresAt,
      });
    }
  } catch (dbError) {
    console.warn("[Token Pair DB Warning]", dbError.message);
  }

  return {
    accessToken,
    refreshToken,
    familyId,
    expiresAt,
  };
};

/**
 * Rotate Refresh Token with Automatic Token Reuse Detection (Theft Defense)
 */
export const rotateRefreshToken = async (oldRefreshTokenString) => {
  if (!oldRefreshTokenString) {
    return { error: "INVALID_TOKEN", message: "No refresh token provided" };
  }

  let tokenRecord = null;

  // 1. Check cache first (Redis / in-memory fallback)
  const cached = await safeGet(`rt:${oldRefreshTokenString}`);
  if (cached) {
    try {
      tokenRecord = typeof cached === "string" ? JSON.parse(cached) : cached;
    } catch (e) {
      tokenRecord = null;
    }
  }

  // 2. Check MongoDB if not in Redis or Redis offline
  if (!tokenRecord) {
    try {
      if (RefreshToken.db?.readyState === 1) {
        tokenRecord = await RefreshToken.findOne({ token: oldRefreshTokenString });
      }
    } catch (dbError) {
      console.warn("[Rotate Token DB Lookup Warning]", dbError.message);
    }
  }

  if (!tokenRecord) {
    return {
      error: "INVALID_TOKEN",
      message: "Refresh token is invalid or expired. Please log in again.",
    };
  }

  const { userId, familyId, isUsed } = tokenRecord;

  // 🚨 3. REUSE DETECTION: If this token was already consumed, revocation is triggered!
  if (isUsed) {
    console.warn(`[SECURITY ALERT] Refresh token reuse detected for family: ${familyId}. Revoking all family sessions.`);
    await revokeFamily(familyId);
    return {
      error: "REUSE_DETECTED",
      message: "Security alert: Token reuse detected. All active sessions have been terminated. Please log in again.",
    };
  }

  // 4. Mark the old token as consumed (used)
  // Keep in cache as used for 60 seconds to detect concurrent reuse attacks
  await safeSet(
    `rt:${oldRefreshTokenString}`,
    { ...tokenRecord, isUsed: true },
    60
  );

  try {
    if (RefreshToken.db?.readyState === 1) {
      await RefreshToken.findOneAndUpdate(
        { token: oldRefreshTokenString },
        { isUsed: true }
      );
    }
  } catch (dbError) {
    console.warn("[Rotate Token DB Update Warning]", dbError.message);
  }

  // 5. Issue NEW Access Token + NEW Refresh Token with the SAME familyId
  const newTokens = await generateTokenPair(userId, familyId);

  return {
    success: true,
    accessToken: newTokens.accessToken,
    refreshToken: newTokens.refreshToken,
    familyId,
    userId,
  };
};

/**
 * Revoke an individual refresh token (e.g. on manual logout)
 */
export const revokeRefreshToken = async (tokenString) => {
  if (!tokenString) return;

  await safeDel(`rt:${tokenString}`);

  try {
    if (RefreshToken.db?.readyState === 1) {
      await RefreshToken.deleteOne({ token: tokenString });
    }
  } catch (dbError) {
    console.warn("[Revoke Token DB Warning]", dbError.message);
  }
};

/**
 * Revoke all tokens belonging to a Token Family (called during reuse attack or logout all)
 */
export const revokeFamily = async (familyId) => {
  if (!familyId) return;

  try {
    if (RefreshToken.db?.readyState === 1) {
      await RefreshToken.deleteMany({ familyId });
    }
  } catch (dbError) {
    console.warn("[Revoke Family DB Warning]", dbError.message);
  }

  // Clear any matching keys or mark family revoked
  await safeSet(`rt_revoked_family:${familyId}`, "revoked", 86400); // 24 hours
};

/**
 * Instant Access Token Revocation:
 * Records revocation timestamp for user in Redis / Cache (15m TTL) and MongoDB (durable).
 */
export const revokeUserSessions = async (userId) => {
  if (!userId) return;
  const now = Date.now();

  // 1. Cache lookup (fast, <1ms) with 15m TTL (matches Access Token lifetime)
  await safeSet(`user_revoked_at:${userId}`, now, 15 * 60);

  // 2. Persist in MongoDB
  try {
    if (User.db?.readyState === 1) {
      await User.findByIdAndUpdate(userId, { lastLogoutAt: new Date(now) });
    }
  } catch (err) {
    console.warn("[Revoke Session DB Warning]", err.message);
  }
};

/**
 * Check whether an access token was issued prior to the user's latest revocation
 */
export const isTokenRevoked = async (userId, tokenIssuedAtSeconds) => {
  if (!userId || !tokenIssuedAtSeconds) return false;
  const tokenIatMs = tokenIssuedAtSeconds * 1000;

  // 1. Check cache first (< 1ms)
  const revokedAt = await safeGet(`user_revoked_at:${userId}`);
  if (revokedAt) {
    const revokedAtMs = Number(revokedAt);
    if (tokenIatMs < revokedAtMs) {
      return true;
    }
  }

  // 2. Fallback check in MongoDB
  try {
    if (User.db?.readyState === 1) {
      const user = await User.findById(userId).select("lastLogoutAt");
      if (user?.lastLogoutAt) {
        const lastLogoutMs = new Date(user.lastLogoutAt).getTime();
        // Allow a 1000ms margin for clock skew
        if (tokenIatMs < lastLogoutMs - 1000) {
          return true;
        }
      }
    }
  } catch (err) {
    console.warn("[isTokenRevoked DB Warning]", err.message);
  }

  return false;
};

export default genToken;