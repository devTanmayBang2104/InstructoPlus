import express from "express";
import {
  createAnnouncement,
  getEducatorAnnouncements,
  getAnnouncementById,
} from "../controller/announcement.controller.js";
import isAuth from "../middleware/isAuth.js";
import upload from "../middleware/multer.js";
import { isEducator } from "../middleware/rbac.js";

const router = express.Router();

// Only Educators & Admins can create announcements
router.post("/announcements", isAuth, isEducator, upload.single("attachment"), createAnnouncement);
router.get("/announcements", isAuth, getEducatorAnnouncements);
router.get("/announcements/:id", isAuth, getAnnouncementById);

export default router;
