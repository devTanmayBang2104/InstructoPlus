import express from "express";
import {
  addDocuments,
  createCourse,
  createLectue,
  editCourse,
  editLecuture,
  getCourseById,
  getCourseLectures,
  getCreator,
  getCreatorCourses,
  getPublishedCourses,
  removeCourse,
  removeLecture,
  getCoursesByCreatorId,
  getEnrolledStudents,
} from "../controller/course.controller.js";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { searchWithAi } from "../controller/search.controller.js";
import { isEducator, verifyCourseOwnership, verifyLectureOwnership } from "../middleware/rbac.js";
import { aiSearchLimiter } from "../middleware/rateLimiter.js";
import {
  validate,
  createCourseSchema,
  createLectureSchema,
} from "../middleware/validateSchema.js";
import { cacheMiddleware, invalidateCourseCacheMiddleware } from "../middleware/cache.js";

const courseRouter = express.Router();

// --- Course Routes ---
// Protected: Only authenticated Educators/Admins can create courses
courseRouter.post("/create", isAuth, isEducator, validate(createCourseSchema), invalidateCourseCacheMiddleware, createCourse);

// Public / Read courses (Cached in Redis for high read performance)
courseRouter.get("/getpublished", cacheMiddleware(180), getPublishedCourses);
courseRouter.get("/get-creator-course", isAuth, isEducator, getCreatorCourses);
courseRouter.get("/getcreator", isAuth, isEducator, getCreatorCourses);
courseRouter.post("/getcreatorbyid", isAuth, getCreator);
courseRouter.get("/getcourse/:courseId", isAuth, cacheMiddleware(120), getCourseById);
courseRouter.get("/getbycreator/:creatorId", cacheMiddleware(180), getCoursesByCreatorId);
courseRouter.post("/getcreator", getCreator);

// Protected: Only the course creator (or Admin) can edit or delete a course
courseRouter.post(
  "/editcourse/:courseId",
  isAuth,
  isEducator,
  verifyCourseOwnership,
  invalidateCourseCacheMiddleware,
  upload.single("thumbnail"),
  editCourse
);
courseRouter.delete(
  "/remove/:courseId",
  isAuth,
  isEducator,
  verifyCourseOwnership,
  invalidateCourseCacheMiddleware,
  removeCourse
);

// --- Lecture Routes ---
// Protected: Only course owner (or Admin) can add lectures
courseRouter.post(
  "/createlecture/:courseId",
  isAuth,
  isEducator,
  verifyCourseOwnership,
  upload.single("video"),
  validate(createLectureSchema),
  invalidateCourseCacheMiddleware,
  createLectue
);
courseRouter.get("/getlectures/:courseId", isAuth, getCourseLectures);

// Protected: Only lecture owner (or Admin) can edit or delete lectures
courseRouter.post(
  "/editlecture/:lectureId",
  isAuth,
  isEducator,
  verifyLectureOwnership,
  invalidateCourseCacheMiddleware,
  upload.fields([{ name: "videoUrl", maxCount: 1 }, { name: "documents" }]),
  editLecuture
);
courseRouter.delete(
  "/removelecture/:lectureId",
  isAuth,
  isEducator,
  verifyLectureOwnership,
  invalidateCourseCacheMiddleware,
  removeLecture
);
courseRouter.post(
  "/addDocuments/:lectureId",
  isAuth,
  isEducator,
  verifyLectureOwnership,
  upload.array("documents"),
  addDocuments
);

// --- AI Search Route (Rate-limited) ---
courseRouter.post("/search", isAuth, aiSearchLimiter, searchWithAi);

// --- Enrolled Students (Educator/Admin Only) ---
courseRouter.get("/enrolledstudents/:courseId", isAuth, isEducator, verifyCourseOwnership, getEnrolledStudents);

export default courseRouter;
