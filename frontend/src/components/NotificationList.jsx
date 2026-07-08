import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../App";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns"; // You might need to install date-fns: npm install date-fns

function NotificationList({ onClose }) {
  const { userData } = useSelector((state) => state.user);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchNotifications = async () => {
      if (userData) {
        try {
          setLoading(true);
          const response = await axios.get(`${serverUrl}/api/notifications`, {
            withCredentials: true,
          });
          setNotifications(response.data.notifications);
        } catch (error) {
          toast.error("Failed to fetch notifications.");
          console.error("Error fetching notifications:", error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchNotifications();
  }, [userData]);

  const handleNotificationClick = async (notificationId, announcementId) => {
    try {
      await axios.put(`${serverUrl}/api/notifications/${notificationId}/read`, {}, {
        withCredentials: true,
      });
      // Update the notification status in the local state
      setNotifications((prevNotifications) =>
        prevNotifications.map((notif) =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );
      navigate(`/announcements/${announcementId}`);
      onClose(); // Close the notification list after clicking
    } catch (error) {
      toast.error("Failed to mark notification as read.");
      console.error("Error marking notification as read:", error);
    }
  };

  if (loading) {
    return (
      <div className="p-4 text-center text-gray-500">Loading notifications...</div>
    );
  }

  return (
    <div className="w-80 bg-white rounded-md shadow-lg py-1 border border-gray-200">
      <div className="px-4 py-2 text-sm font-medium text-gray-800 border-b border-gray-200">
        Notifications
      </div>
      {notifications.length === 0 ? (
        <div className="p-4 text-sm text-gray-500 text-center">No new notifications.</div>
      ) : (
        <div className="max-h-80 overflow-y-auto">
          {notifications.map((notification) => (
            <div
              key={notification._id}
              className={`block px-4 py-3 text-sm ${
                notification.isRead ? "text-gray-600" : "text-gray-900 font-semibold bg-indigo-50"
              } hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0`}
              onClick={() => handleNotificationClick(notification._id, notification.announcementId._id)}
            >
              <p className="truncate">{notification.announcementId.title}</p>
              <p className="text-xs text-gray-500 mt-1">
                {notification.announcementId.sender?.name ? `From ${notification.announcementId.sender.name}` : "From an Educator"} -{" "}
                {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
              </p>
            </div>
          ))}
        </div>
      )}
      <div className="px-4 py-2 text-center border-t border-gray-200">
        <Link to="/notifications" className="text-sm text-indigo-600 hover:text-indigo-800" onClick={onClose}>
          View All
        </Link>
      </div>
    </div>
  );
}

export default NotificationList;
