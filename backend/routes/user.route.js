import express from "express";
import  isAuth  from "../middleware/isAuth.js";
import { getCurrentUser, updateProfile, getUserById } from "../controller/user.controller.js";
import upload from "../middleware/multer.js";

const userRouter = express.Router();

userRouter.get("/getcurrentuser", isAuth, getCurrentUser);
userRouter.get("/:userId", isAuth, getUserById);
userRouter.post("/updateprofile", isAuth, upload.single("photoUrl"), updateProfile);

export default userRouter;