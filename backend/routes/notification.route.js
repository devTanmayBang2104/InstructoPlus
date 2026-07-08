import express from "express";
import { getNotifications, markNotificationAsRead, getUnreadNotificationCount } from "../controller/notification.controller.js";
import  isAuth  from "../middleware/isAuth.js";

const router = express.Router();

router.get("/notifications", isAuth, getNotifications);
router.put("/notifications/:id/read", isAuth, markNotificationAsRead);
router.get("/notifications/unread/count", isAuth, getUnreadNotificationCount);

export default router;
