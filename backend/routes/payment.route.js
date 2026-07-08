import express from "express";
import isAuth from "../middleware/isAuth.js";
import { RazorpayOrder, verifyFreePayment, verifyPayment } from "../controller/order.controller.js";

const paymentRouter = express.Router();

paymentRouter.post("/razorpay-order",isAuth,RazorpayOrder)
paymentRouter.post("/verify-payment",isAuth,verifyPayment)
paymentRouter.post("/verify-free",isAuth,verifyFreePayment)

export default paymentRouter;