import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  getCourseProgress,
  toggleLectureComplete,
  updateLecturePlaybackTime,
  getAllUserCourseProgress,
  resetCourseProgress,
} from "../controller/courseProgress.controller.js";

const progressRouter = express.Router();

// Get all progress records for current user (for EnrolledCourse dashboard)
progressRouter.get("/user/all", isAuth, getAllUserCourseProgress);

// Get progress for a specific course
progressRouter.get("/:courseId", isAuth, getCourseProgress);

// Toggle completion of a lecture
progressRouter.post("/:courseId/toggle-complete", isAuth, toggleLectureComplete);

// Update playback timestamp (resume playback)
progressRouter.post("/:courseId/update-time", isAuth, updateLecturePlaybackTime);

// Reset course progress
progressRouter.post("/:courseId/reset", isAuth, resetCourseProgress);

export default progressRouter;
