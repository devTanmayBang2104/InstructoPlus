import Notification from "../model/notification.Model.js";
import Announcement from "../model/announcement.Model.js"; // To populate announcement details

export const getNotifications = async (req, res) => {
  try {
    const userId = req.userId;
    const notifications = await Notification.find({ userId })
      .populate({
        path: "announcementId",
        select: "title description attachmentUrl createdAt",
        populate: {
          path: "sender",
          select: "name photoUrl",
        },
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ notifications });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ message: "Server error while fetching notifications." });
  }
};

export const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const notification = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: "Notification not found or unauthorized." });
    }

    res.status(200).json({ message: "Notification marked as read.", notification });
  } catch (error) {
    console.error("Error marking notification as read:", error);
    res.status(500).json({ message: "Server error while marking notification as read." });
  }
};

export const getUnreadNotificationCount = async (req, res) => {
  try {
    const userId = req.userId;
    const count = await Notification.countDocuments({ userId, isRead: false });
    res.status(200).json({ count });
  } catch (error) {
    console.error("Error fetching unread notification count:", error);
    res.status(500).json({ message: "Server error while fetching unread notification count." });
  }
};
