import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../App";
import { Link, useNavigate } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";

function AllNotificationsPage() {
  const { userData } = useSelector((state) => state.user);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!userData) {
      toast.error("Please log in to view notifications.");
      navigate("/login");
      return;
    }

    const fetchNotifications = async () => {
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
    };

    fetchNotifications();
  }, [userData, navigate]);

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
    } catch (error) {
      toast.error("Failed to mark notification as read.");
      console.error("Error marking notification as read:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-lg text-gray-700">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow-lg">
        <h1 className="text-3xl font-extrabold text-gray-900 mb-6">All Notifications</h1>
        {notifications.length === 0 ? (
          <div className="p-4 text-lg text-gray-500 text-center">You have no notifications.</div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div
                key={notification._id}
                className={`p-4 rounded-lg shadow-sm cursor-pointer ${
                  notification.isRead ? "bg-gray-50 text-gray-600" : "bg-indigo-50 text-gray-900 font-semibold"
                } hover:bg-gray-100 transition duration-150 ease-in-out`}
                onClick={() => handleNotificationClick(notification._id, notification.announcementId._id)}
              >
                <p className="text-lg">{notification.announcementId.title}</p>
                <p className="text-sm text-gray-500 mt-1">
                  {notification.announcementId.sender?.name ? `From ${notification.announcementId.sender.name}` : "From an Educator"} -{" "}
                  {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AllNotificationsPage;
