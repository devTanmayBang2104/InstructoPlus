import express from "express";
import {
  signup,
  verifySignupOTP,
  resendSignupOTP,
  login,
  logout,
  sendOTP,
  verifyOTP,
  resetPassword,
  googleAuth,
  refreshAccessToken,
} from "../controller/auth.controller.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import {
  validate,
  signupSchema,
  loginSchema,
  sendOtpSchema,
  resetPasswordSchema,
} from "../middleware/validateSchema.js";

const router = express.Router();

// Apply strict authentication rate-limiter to prevent brute force & OTP spam
router.post("/signup", authLimiter, validate(signupSchema), signup);
router.post("/verify-signup-otp", authLimiter, verifySignupOTP);
router.post("/resend-signup-otp", authLimiter, resendSignupOTP);
router.post("/login", authLimiter, validate(loginSchema), login);
router.post("/logout", logout);
router.post("/refresh", authLimiter, refreshAccessToken);
router.post("/sendotp", authLimiter, validate(sendOtpSchema), sendOTP);
router.post("/verifyotp", authLimiter, verifyOTP);
router.post("/resetpassword", authLimiter, validate(resetPasswordSchema), resetPassword);
router.post("/googleauth", authLimiter, googleAuth);

export default router;