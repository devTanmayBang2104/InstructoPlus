import jwt from "jsonwebtoken";
import { isTokenRevoked } from "../config/token.js";

const isAuth = async (req, res, next) => {
  try {
    let token = req.cookies?.token;
    if (!token && req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
      token = req.headers.authorization.split(" ")[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication token missing",
      });
    }

    const secret = process.env.JWT_SECRET || "instructoplus_jwt_secret_development_key_123";
    let verifyToken;
    try {
      verifyToken = jwt.verify(token, secret);
    } catch (jwtErr) {
      return res.status(401).json({
        success: false,
        message: "Token expired or invalid",
        error: jwtErr.message,
      });
    }

    if (!verifyToken || !verifyToken.userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // Instant Access Token Revocation Check (Redis / MongoDB)
    const revoked = await isTokenRevoked(verifyToken.userId, verifyToken.iat);
    if (revoked) {
      return res.status(401).json({
        success: false,
        message: "Session has been revoked. Please log in again.",
        sessionRevoked: true,
      });
    }

    req.userId = verifyToken.userId;
    next();
  } catch (error) {
    console.error("isAuth error:", error);
    return res.status(500).json({
      success: false,
      message: `Authentication error: ${error.message || error}`,
    });
  }
};

export default isAuth;