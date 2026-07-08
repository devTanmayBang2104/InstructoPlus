import express from "express";
import { signup, login, logout, sendOTP, verifyOTP, resetPassword, googleAuth } from "../controller/auth.controller.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/sendotp", sendOTP)
router.post('/verifyotp',verifyOTP)
router.post('/resetpassword',resetPassword)
router.post('/googleauth/',googleAuth)

export default router;