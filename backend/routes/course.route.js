import express from "express";
import { addDocuments, createCourse, createLectue, editCourse, editLecuture, getCourseById, getCourseLectures, getCreator, getCreatorCourses, getPublishedCourses, removeCourse, removeLecture, getCoursesByCreatorId, getEnrolledStudents } from "../controller/course.controller.js";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { searchWithAi } from "../controller/search.controller.js";

const courseRouter = express.Router();

courseRouter.post("/create",isAuth, createCourse);
courseRouter.get("/getpublished",getPublishedCourses)
courseRouter.get("/get-creator-course",isAuth, getCreatorCourses) // Changed route name
courseRouter.get("/getcreator",isAuth, getCreatorCourses) // Add the route frontend expects
courseRouter.post("/getcreatorbyid",isAuth, getCreator)
courseRouter.post("/editcourse/:courseId",isAuth,upload.single("thumbnail"),editCourse)
courseRouter.get("/getcourse/:courseId",isAuth,getCourseById)
courseRouter.delete("/remove/:courseId",isAuth,removeCourse)
courseRouter.get("/getbycreator/:creatorId", getCoursesByCreatorId);


// for lecture
courseRouter.post("/createlecture/:courseId",isAuth,createLectue)
courseRouter.get("/getlectures/:courseId",isAuth,getCourseLectures)
courseRouter.post("/editlecture/:lectureId",isAuth,upload.fields([{ name: 'videoUrl', maxCount: 1 }, { name: 'documents' }]),editLecuture)
courseRouter.delete("/removelecture/:lectureId",isAuth,removeLecture)
courseRouter.post("/addDocuments/:lectureId",isAuth,upload.array("documents"),addDocuments)
courseRouter.post("/getcreator", getCreator)


// for search
courseRouter.post("/search",isAuth,searchWithAi)

// for enrolled students
courseRouter.get("/enrolledstudents/:courseId", isAuth, getEnrolledStudents)

export default courseRouter;
