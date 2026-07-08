import express from "express";
import { createAnnouncement, getEducatorAnnouncements, getAnnouncementById } from "../controller/announcement.controller.js";
import  isAuth  from "../middleware/isAuth.js";
import  upload  from "../middleware/multer.js";

const router = express.Router();

router.post("/announcements", isAuth, upload.single("attachment"), createAnnouncement);
router.get("/announcements", isAuth, getEducatorAnnouncements);
router.get("/announcements/:id", isAuth, getAnnouncementById);

export default router;
