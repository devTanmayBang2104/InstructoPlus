import User from '../model/user.Model.js'
import validator from "validator"
import genToken from "../config/token.js"
import cookieParser from 'cookie-parser'
import bcrypt from "bcryptjs"
import sendMail from '../config/Mail.js'
export const signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    let existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
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
    let hashPassword = await bcrypt.hash(password, 10);
    let user = await User.create({
      name,
      email,
      password: hashPassword,
      role,
    });
    let token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true, // Set to true for HTTPS in production
      sameSite: "None", // Required for cross-site cookies with secure: true
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({
      success: true,
      message: "User signed up successfully",
      user,
      token,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while signing up",
    });
    console.log(error);
  }
};

export const login=async(req,res)=>{
  try {
    const {email,password}=req.body
    let user=await User.findOne({email})
    if(!user){
      return res.status(400).json({
        success:false,
        message:"User not found"
      })
    }
    let isMatch=await bcrypt.compare(password,user.password)
    if(!isMatch){
      return res.status(400).json({
        success:false,
        message:"Invalid credentials"
      })
    }
    let token=await genToken(user._id);
    res.cookie("token",token,{
      httpOnly:true,
      secure:true, // Set to true for HTTPS in production
      sameSite:"false", // Required for cross-site cookies with secure: true
      maxAge:7*24*60*60*1000
    })
    res.status(200).json({
      success:true,
      message:"User logged in successfully",
      user,
      token
    })
  } catch (error) {
    return res.status(500).json({
      success:false,
      message:"error while login",
      error
    })
  }
}

export const logout=async(req,res)=>{
  try {
    await res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "None",
    });
    res.status(200).json({
      success:true,
      message:"User logged out successfully"
    })
  } catch (error) {
    return res.status(500).json({
      success:false,
      message:"error while logout",
    })
  }
}

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
    const otp= Math.floor(1000+Math.random()*9000).toString();
    user.resetOtp=otp
    user.otpExpiry=Date.now()+5*60*1000
    user.isOtpVerified=false
    await user.save()
    await sendMail(email,otp)
    return res.status(200).json({
      success:true,
      message:"OTP sent successfully"
    })
  } catch (error) {
    return res.status(500).json({
      success:false,
      message:"error while sending otp",
      error
    })
  }
}

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

export const resetPassword =async(req,res)=>{
  try {
    const {email,password}=req.body
    const user=await User.findOne({email})
    if(!user){
      return res.status(400).json({
        success:false,
        message:"User not found"
      })
    }
    if(!user.isOtpVerified){
      return res.status(400).json({
        success:false,
        message:"OTP not verified"
      })
    }
    let hashPassword=await bcrypt.hash(password,10)
    user.password=hashPassword
    user.isOtpVerified=false
    await user.save()
    return res.status(200).json({
      success:true,
      message:"Password reset successfully"
    })
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
    let token = await genToken(user._id);
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "None",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      success: true,
      message: "Authenticated successfully",
      user,
      token,
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
