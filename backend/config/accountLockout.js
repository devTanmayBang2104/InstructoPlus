import User from "../model/user.Model.js";
import { safeGet, safeSet, safeDel, safeIncr, safeTtl } from "./redis.js";

export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_DURATION_SECONDS = 15 * 60; // 15 minutes in seconds
export const LOCKOUT_DURATION_MS = LOCKOUT_DURATION_SECONDS * 1000;

/**
 * Check if an account is currently locked due to too many failed login attempts
 */
export const checkAccountLockout = async (email) => {
  if (!email) return { isLocked: false };
  const cleanEmail = email.trim().toLowerCase();

  // 1. Fast Cache check (< 1ms, Redis or in-memory fallback)
  const isLocked = await safeGet(`lockout:${cleanEmail}`);
  if (isLocked) {
    let remainingSeconds = await safeTtl(`lockout:${cleanEmail}`);
    if (remainingSeconds <= 0) remainingSeconds = LOCKOUT_DURATION_SECONDS;
    return { isLocked: true, remainingSeconds };
  }

  // 2. Fallback check in MongoDB
  try {
    if (User.db?.readyState === 1) {
      const user = await User.findOne({ email: cleanEmail }).select("lockUntil failedLoginAttempts");
      if (user?.lockUntil && new Date(user.lockUntil) > new Date()) {
        const remainingSeconds = Math.ceil((new Date(user.lockUntil).getTime() - Date.now()) / 1000);
        return { isLocked: true, remainingSeconds: Math.max(1, remainingSeconds) };
      }
    }
  } catch (dbErr) {
    console.warn("[Lockout DB Warning]", dbErr.message);
  }

  return { isLocked: false };
};

/**
 * Record a failed login attempt and automatically lock the account after 5 consecutive failures
 */
export const recordFailedLogin = async (email) => {
  if (!email) return { isLocked: false, attempts: 0, remainingAttempts: MAX_FAILED_ATTEMPTS };
  const cleanEmail = email.trim().toLowerCase();

  // 1. Increment failed attempts count in cache (Redis or in-memory fallback)
  const currentAttempts = await safeIncr(`failed_attempts:${cleanEmail}`, LOCKOUT_DURATION_SECONDS);

  if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
    await safeSet(`lockout:${cleanEmail}`, "locked", LOCKOUT_DURATION_SECONDS);
  }

  // 2. Persist in MongoDB
  try {
    if (User.db?.readyState === 1) {
      const user = await User.findOne({ email: cleanEmail });
      if (user) {
        const updateData = { failedLoginAttempts: currentAttempts };
        if (currentAttempts >= MAX_FAILED_ATTEMPTS) {
          updateData.lockUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
        }
        await User.findByIdAndUpdate(user._id, updateData);
      }
    }
  } catch (dbErr) {
    console.warn("[Record Failed Login DB Warning]", dbErr.message);
  }

  const isLocked = currentAttempts >= MAX_FAILED_ATTEMPTS;
  const remainingAttempts = Math.max(0, MAX_FAILED_ATTEMPTS - currentAttempts);

  return {
    isLocked,
    attempts: currentAttempts,
    remainingAttempts,
    lockDurationMinutes: 15,
  };
};

/**
 * Clear failed login attempts and unlock the account upon successful login
 */
export const clearFailedLogins = async (email) => {
  if (!email) return;
  const cleanEmail = email.trim().toLowerCase();

  // 1. Clear cache keys
  await safeDel(`failed_attempts:${cleanEmail}`);
  await safeDel(`lockout:${cleanEmail}`);

  // 2. Clear MongoDB fields
  try {
    if (User.db?.readyState === 1) {
      await User.findOneAndUpdate(
        { email: cleanEmail },
        { failedLoginAttempts: 0, lockUntil: null }
      );
    }
  } catch (dbErr) {
    console.warn("[Clear Failed Login DB Warning]", dbErr.message);
  }
};
