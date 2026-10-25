import express from "express";
import isAuth from "../middleware/isAuth.js";
import {
  createNote,
  getCourseNotes,
  getLectureNotes,
  updateNote,
  deleteNote,
  exportCourseNotes,
} from "../controller/note.controller.js";

const noteRouter = express.Router();

// All note routes require user authentication
noteRouter.post("/", isAuth, createNote);
noteRouter.get("/course/:courseId", isAuth, getCourseNotes);
noteRouter.get("/lecture/:lectureId", isAuth, getLectureNotes);
noteRouter.put("/:noteId", isAuth, updateNote);
noteRouter.delete("/:noteId", isAuth, deleteNote);
noteRouter.get("/export/:courseId", isAuth, exportCourseNotes);

export default noteRouter;
