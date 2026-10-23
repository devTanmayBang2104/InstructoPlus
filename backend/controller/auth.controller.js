import User from '../model/user.Model.js'
import validator from "validator"
import jwt from "jsonwebtoken"
import genToken, { generateTokenPair, rotateRefreshToken, revokeRefreshToken, revokeUserSessions } from "../config/token.js"
import { checkAccountLockout, recordFailedLogin, clearFailedLogins } from "../config/accountLockout.js"
import cookieParser from 'cookie-parser'
import bcrypt from "bcryptjs"
import sendMail, { sendSignupVerificationMail } from '../config/Mail.js'

// Helper to set Access Token (15m) and Refresh Token (7d) cookies
export const setAuthCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === "production";
  
  // Short-lived Access Token cookie (15 minutes)
  res.cookie("token", accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 15 * 60 * 1000,
  });

  // Long-lived Single-Use Refresh Token cookie (7 days)
  if (refreshToken) {
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? "none" : "lax",
      path: "/api/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }
};

// Helper to clear both auth cookies on logout or revocation
export const clearAuthCookies = (res) => {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie("token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/api/auth",
  });
};

export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let existingUser = await User.findOne({ email });

    if (existingUser && existingUser.isAccountVerified) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    if (!validator.isEmail(email)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid email",
      });
    }
    if (password.length < 5) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 5 characters long",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const hashPassword = await bcrypt.hash(password, 10);
    const otpExpiry = Date.now() + 10 * 60 * 1000; // 10 minutes expiry

    let user;
    if (existingUser) {
      existingUser.name = name;
      existingUser.password = hashPassword;
      existingUser.role = role || "student";
      existingUser.resetOtp = otp;
      existingUser.otpExpiry = otpExpiry;
      existingUser.isAccountVerified = false;
      user = await existingUser.save();
    } else {
      user = await User.create({
        name,
        email,
        password: hashPassword,
        role: role || "student",
        resetOtp: otp,
        otpExpiry,
        isAccountVerified: false,
      });
    }

    const hasCredentials = Boolean(process.env.USER_EMAIL && process.env.USER_PASSWORD);
    await sendSignupVerificationMail(email, otp);

    return res.status(200).json({
      success: true,
      message: hasCredentials
        ? "Verification code sent to your email"
        : `Verification code: ${otp} (Dev Mode)`,
      devOtp: !hasCredentials ? otp : undefined,
      requiresOtp: true,
      email,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while signing up",
      error: error.message,
    });
  }
};

export const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and verification code are required",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found. Please sign up again.",
      });
    }

    if (user.otpExpiry && user.otpExpiry < Date.now()) {
      return res.status(400).json({
        success: false,
        message: "Verification code has expired. Please request a new code.",
      });
    }

    if (user.resetOtp !== otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification code",
      });
    }

    user.isAccountVerified = true;
    user.resetOtp = undefined;
    user.otpExpiry = undefined;
    await user.save();

    const { accessToken, refreshToken } = await generateTokenPair(user._id);
    setAuthCookies(res, accessToken, refreshToken);

    return res.status(201).json({
      success: true,
      message: "Email verified & account activated successfully!",
      user,
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error verifying email code",
      error: error.message,
    });
  }
};

export const resendSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetOtp = otp;
    user.otpExpiry = Date.now() + 10 * 60 * 1000;
    await user.save();

    const hasCredentials = Boolean(process.env.USER_EMAIL && process.env.USER_PASSWORD);
    await sendSignupVerificationMail(email, otp);

    return res.status(200).json({
      success: true,
      message: hasCredentials
        ? "New verification code sent"
        : `New code: ${otp} (Dev Mode)`,
      devOtp: !hasCredentials ? otp : undefined,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error resending verification code",
      error: error.message,
    });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Account Lockout Check (Distributed Brute-Force Defense)
    const lockStatus = await checkAccountLockout(email);
    if (lockStatus.isLocked) {
      const remainingMins = Math.ceil((lockStatus.remainingSeconds || 900) / 60);
      return res.status(423).json({
        success: false,
        message: `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingMins} minute${remainingMins > 1 ? "s" : ""}.`,
        isLocked: true,
        remainingSeconds: lockStatus.remainingSeconds,
      });
    }

    let user = await User.findOne({ email });
    if (!user) {
      // Record failed attempt even if user not found to prevent user enumeration timing attacks
      await recordFailedLogin(email);
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    let isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      const failInfo = await recordFailedLogin(email);
      if (failInfo.isLocked) {
        return res.status(423).json({
          success: false,
          message: "Account has been locked for 15 minutes due to 5 consecutive failed login attempts.",
          isLocked: true,
        });
      }
      return res.status(400).json({
        success: false,
        message: `Invalid credentials. ${failInfo.remainingAttempts} attempt${failInfo.remainingAttempts > 1 ? "s" : ""} remaining before account lockout.`,
        remainingAttempts: failInfo.remainingAttempts,
      });
    }

    // 2. Successful Login: Clear failed attempts and reset lockout counter
    await clearFailedLogins(email);

    const { accessToken, refreshToken } = await generateTokenPair(user._id);
    setAuthCookies(res, accessToken, refreshToken);

    res.status(200).json({
      success: true,
      message: "User logged in successfully",
      user,
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error while login",
      error: error.message || error,
    });
  }
};

export const logout = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (incomingRefreshToken) {
      await revokeRefreshToken(incomingRefreshToken);
    }

    // Instant Access Token Revocation: revoke all active access tokens for this user
    let userId = req.userId;
    if (!userId) {
      const token = req.cookies?.token || (req.headers.authorization?.startsWith("Bearer ") ? req.headers.authorization.split(" ")[1] : null);
      if (token) {
        try {
          const decoded = jwt.decode(token);
          if (decoded?.userId) userId = decoded.userId;
        } catch (_) {}
      }
    }
    if (userId) {
      await revokeUserSessions(userId);
    }

    clearAuthCookies(res);
    res.status(200).json({
      success: true,
      message: "User logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error while logout",
      error: error.message || error,
    });
  }
};

/**
 * Refresh Access Token with Token Rotation and Reuse Detection
 */
export const refreshAccessToken = async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if (!incomingRefreshToken) {
      return res.status(401).json({
        success: false,
        message: "Refresh token is required",
      });
    }

    const result = await rotateRefreshToken(incomingRefreshToken);

    if (result.error === "REUSE_DETECTED") {
      clearAuthCookies(res);
      return res.status(403).json({
        success: false,
        error: "REUSE_DETECTED",
        message: result.message,
      });
    }

    if (result.error || !result.success) {
      clearAuthCookies(res);
      return res.status(401).json({
        success: false,
        error: result.error || "INVALID_TOKEN",
        message: result.message || "Invalid or expired refresh token",
      });
    }

    setAuthCookies(res, result.accessToken, result.refreshToken);

    return res.status(200).json({
      success: true,
      message: "Token refreshed successfully",
      token: result.accessToken,
      refreshToken: result.refreshToken,
    });
  } catch (error) {
    console.error("Refresh token rotation error:", error);
    return res.status(500).json({
      success: false,
      message: "Error rotating refresh token",
      error: error.message,
    });
  }
};

export const sendOTP= async (req, res) => {
  try {
    const {email}=req.body
    const user=await User.findOne({email})
    if(!user){
      return res.status(400).json({
        success:false,
        message:"User not found"
      })
    }
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    user.resetOtp = otp;
    user.otpExpiry = Date.now() + 5 * 60 * 1000;
    user.isOtpVerified = false;
    await user.save();

    const hasCredentials = Boolean(process.env.USER_EMAIL && process.env.USER_PASSWORD);
    await sendMail(email, otp);
    return res.status(200).json({
      success: true,
      message: hasCredentials
        ? "OTP sent successfully to your email"
        : `OTP: ${otp} (Dev Mode)`,
      devOtp: !hasCredentials ? otp : undefined,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "error while sending otp",
      error: error.message || error,
    });
  }
};

export const verifyOTP=async(req,res)=>{
  try {
    const {email,otp}=req.body
    const user=await User.findOne({email})
    if(!user){
      return res.status(400).json({
        success:false,
        message:"User not found"
      })
    }
    if(user.otpExpiry<Date.now()){
      return res.status(400).json({
        success:false,
        message:"OTP expired"
      })
    }
    if(user.resetOtp!==otp){
      return res.status(400).json({
        success:false,
        message:"Invalid OTP"
      })
    }
    user.resetOtp=undefined
    user.otpExpiry=undefined
    user.isOtpVerified=true
    await user.save()
    return res.status(200).json({
      success:true,
      message:"OTP verified successfully"
    })
  } catch (error) {
    return res.status(500).json({
      success:false,
      message:"error while verifying otp",
      error
    })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const password = req.body.password || req.body.newPassword;
    const user = await User.findOne({ email });
    if(!user){
      return res.status(400).json({
        success:false,
        message:"User not found"
      })
    }
    if (!user.isOtpVerified) {
      return res.status(400).json({
        success: false,
        message: "OTP not verified",
      });
    }

    // Security constraint: Prevent reusing the current password
    const isSamePassword = await bcrypt.compare(password, user.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password cannot be the same as your previous password. Please choose a new password.",
      });
    }

    let hashPassword = await bcrypt.hash(password, 10);
    user.password = hashPassword;
    user.isOtpVerified = false;
    await user.save();

    // Instant Access Token Revocation across all sessions upon password reset
    await revokeUserSessions(user._id);

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success:false,
      message:"error while resetting password",
      error
    })
  }
}

export const googleAuth = async (req, res) => {
  try {
    const { name, email, role, photo } = req.body;

    let user = await User.findOne({ email });
    if (!user) {
      user = await User.create({ name, email, role, password: "defaultPassword", photoUrl: photo });
    }
    const { accessToken, refreshToken } = await generateTokenPair(user._id);
    setAuthCookies(res, accessToken, refreshToken);
    res.status(200).json({
      success: true,
      message: "Authenticated successfully",
      user,
      token: accessToken,
      refreshToken,
    });
  } catch (error) {
    console.log('auth error server side', error);
    return res.status(500).json({
      success: false,
      message: "error while google auth",
      error,
    });
  }
}
