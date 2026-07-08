import React, { useState, useRef, useEffect } from "react";
import logo from "../assets/logo.jpg";
import { IoMdPerson, IoMdAdd, IoMdNotifications } from "react-icons/io";
import { GiHamburgerMenu, GiSplitCross } from "react-icons/gi";
import { useNavigate } from "react-router-dom";
import { serverUrl } from "../App";
import axios from "axios";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { setUserData } from "../redux/userSlice";
import { motion, AnimatePresence } from "framer-motion";
import { AnimationContext } from "../App";
import { useContext } from "react";

function Nav() {
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { userData } = useSelector((state) => state.user);
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const addRef = useRef(null);
  const { fadeIn } = useContext(AnimationContext);

  // Fetch unread notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (userData) {
        try {
          const response = await axios.get(`${serverUrl}/api/notifications/unread/count`, {
            withCredentials: true,
          });
          setUnreadNotificationCount(response.data.count);
        } catch (error) {
          console.error("Failed to fetch unread notification count:", error);
        }
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [userData]);

  // Fetch notifications when dropdown is opened
  const fetchNotifications = async () => {
    if (!userData || loadingNotifications) return;

    setLoadingNotifications(true);
    try {
      const response = await axios.get(`${serverUrl}/api/notifications`, {
        withCredentials: true,
      });
      setNotifications(response.data.notifications || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      toast.error("Failed to load notifications");
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId) => {
    try {
      await axios.put(`${serverUrl}/api/notifications/${notificationId}/read`, {}, {
        withCredentials: true,
      });

      // Update local state
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId ? { ...notif, isRead: true } : notif
        )
      );

      // Update unread count
      setUnreadNotificationCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error("Failed to mark notification as read:", error);
    }
  };

  // Handle notification click
  const handleNotificationClick = () => {
    setShowNotificationDropdown(!showNotificationDropdown);
    if (!showNotificationDropdown) {
      fetchNotifications();
    }
  };

  // Handle view all notifications
  const handleViewAllNotifications = () => {
    navigate("/notifications");
    setShowNotificationDropdown(false);
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setShowProfileMenu(false);
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotificationDropdown(false);
      }
      if (addRef.current && !addRef.current.contains(event.target)) {
        setShowAddDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post(
        serverUrl + "/api/auth/logout",
        {},
        { withCredentials: true }
      );
      dispatch(setUserData(null));
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  // Animation variants
  const dropdownVariants = {
    hidden: { opacity: 0, y: -10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
  };

  const notificationDropdownVariants = {
    hidden: { opacity: 0, y: -20, scale: 0.95 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: "easeOut" } }
  };

  const mobileMenuVariants = {
    hidden: { x: "100%" },
    visible: { x: 0, transition: { duration: 0.3 } },
    exit: { x: "100%" }
  };

  // Format notification time
  const formatNotificationTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInHours = diffInMs / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <nav className="fixed w-full bg-white shadow-sm z-50 mb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="flex-shrink-0 flex items-center"
          >
            <img
              src={logo}
              className="h-10 w-auto rounded-md cursor-pointer"
              onClick={() => navigate("/")}
              alt="InstructoPlus Logo"
            />
            <span className="ml-2 text-xl font-bold text-gray-900 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              InstructoPlus
            </span>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {userData && userData?.user?.role === "educator" && (
              <div className="relative" ref={addRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowAddDropdown(!showAddDropdown)}
                  className="p-2 rounded-full bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none flex items-center justify-center h-10 w-10"
                  title="Add New"
                >
                  <IoMdAdd className="h-5 w-5" />
                </motion.button>

                {/* Add Dropdown Menu */}
                <AnimatePresence>
                  {showAddDropdown && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={dropdownVariants}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50"
                    >
                      <button
                        onClick={() => {
                          navigate("/educator/create-announcement");
                          setShowAddDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        New Announcement
                      </button>
                      <button
                        onClick={() => {
                          navigate("/createcourses");
                          setShowAddDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        New Course
                      </button>
                      <button
                        onClick={() => {
                          navigate("/courses");
                          setShowAddDropdown(false);
                        }}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Add Lecture
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {userData && (
              <div className="relative" ref={notificationRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setShowNotificationDropdown(!showNotificationDropdown);
                    if (!showNotificationDropdown) {
                      fetchNotifications();
                    }
                  }}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 focus:outline-none relative"
                  title="Notifications"
                >
                  <IoMdNotifications className="h-6 w-6" />
                  {unreadNotificationCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                      {unreadNotificationCount}
                    </span>
                  )}
                </motion.button>

                {/* Notification Dropdown */}
                <AnimatePresence>
                  {showNotificationDropdown && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={notificationDropdownVariants}
                      className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 flex flex-col"
                      style={{ maxHeight: '24rem' }}
                    >
                      <div className="p-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                      </div>

                      <div className="flex-1 overflow-y-auto">
                        {loadingNotifications ? (
                          <div className="p-4 text-center">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                            <p className="text-sm text-gray-500 mt-2">Loading notifications...</p>
                          </div>
                        ) : notifications.length === 0 ? (
                          <div className="p-4 text-center text-gray-500">
                            <IoMdNotifications className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">No notifications yet</p>
                          </div>
                        ) : (
                          notifications.map((notification) => (
                            <motion.div
                              key={notification._id}
                              whileHover={{ backgroundColor: "#f9fafb" }}
                              onClick={() => {
                                if (notification.announcementId) {
                                  navigate(`/announcements/${notification.announcementId._id}`);
                                }
                                markAsRead(notification._id)}}
                              className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                                !notification.isRead ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="flex items-start space-x-3">
                                <div className="flex-shrink-0">
                                  {notification.announcementId?.sender?.photoUrl ? (
                                    <img
                                      src={notification.announcementId.sender.photoUrl}
                                      className="h-8 w-8 rounded-full"
                                      alt="Sender"
                                    />
                                  ) : (
                                    <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-medium">
                                      {notification.announcementId?.sender?.name?.charAt(0) || 'A'}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {notification.announcementId?.title || 'New Announcement'}
                                  </p>
                                  <p className="text-sm text-gray-500 line-clamp-2">
                                    {notification.announcementId?.description || 'No description available'}
                                  </p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    {formatNotificationTime(notification.createdAt)}
                                  </p>
                                </div>
                                {!notification.isRead && (
                                  <div className="flex-shrink-0">
                                    <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          ))
                        )}
                      </div>

                      {/* Always show View All button */}
                      <div className="sticky bottom-0 left-0 right-0 p-3 bg-white border-t border-gray-200">
                        <button
                          onClick={handleViewAllNotifications}
                          className={`w-full py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                            notifications.length === 0
                              ? 'text-gray-600 bg-gray-100 hover:bg-gray-200'
                              : 'text-white bg-indigo-600 hover:bg-indigo-700'
                          }`}
                        >
                          View all notifications
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {userData && (
              <div className="relative" ref={profileRef}>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  {userData?.user?.photoUrl ? (
                    <img
                      src={userData.user.photoUrl}
                      className="h-10 w-10 rounded-full object-cover border-2 border-gray-200"
                      alt="Profile"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-lg font-medium border-2 border-gray-200">
                      {userData?.user?.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="text-gray-700 font-medium">
                    {userData?.user?.name}
                  </span>
                </motion.button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial="hidden"
                      animate="visible"
                      exit="hidden"
                      variants={dropdownVariants}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200"
                    >
                      <motion.button
                        whileHover={{ backgroundColor: "#f3f4f6" }}
                        onClick={() => {
                          navigate("/profile");
                          setShowProfileMenu(false);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 w-full text-left"
                      >
                        My Profile
                      </motion.button>
                      <motion.button
                        whileHover={{ backgroundColor: "#f3f4f6" }}
                        onClick={() => {
                          navigate("/enrolledcourses");
                          setShowProfileMenu(false);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 w-full text-left"
                      >
                        My Courses
                      </motion.button>
                      {userData?.user?.role === "educator" && (
                        <motion.button
                          whileHover={{ backgroundColor: "#f3f4f6" }}
                          onClick={() => {
                            navigate("/dashboard");
                            setShowProfileMenu(false);
                          }}
                          className="block px-4 py-2 text-sm text-gray-700 w-full text-left"
                        >
                          Dashboard
                        </motion.button>
                      )}
                      <motion.button
                        whileHover={{ backgroundColor: "#f3f4f6" }}
                        onClick={handleLogout}
                        className="block px-4 py-2 text-sm text-gray-700 w-full text-left"
                      >
                        Logout
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {!userData && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/login")}
                className="px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
              >
                Login
              </motion.button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            >
              {showMobileMenu ? (
                <GiSplitCross className="h-6 w-6" />
              ) : (
                <GiHamburgerMenu className="h-6 w-6" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {showMobileMenu && (
          <motion.div
            initial="hidden"
            animate="visible"
            exit="exit"
            variants={mobileMenuVariants}
            className="md:hidden fixed inset-y-0 right-0 w-4/5 bg-white z-40 shadow-xl"
          >
            <div className="h-full flex flex-col py-8 px-6">
              <div className="flex justify-end mb-8">
                <motion.button
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-full bg-gray-100"
                >
                  <GiSplitCross className="h-5 w-5" />
                </motion.button>
              </div>

              {userData ? (
                <>
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center space-x-3 mb-8 p-4 bg-gray-50 rounded-lg"
                  >
                    {userData?.user?.photoUrl ? (
                      <img
                        src={userData.user.photoUrl}
                        className="h-12 w-12 rounded-full object-cover border-2 border-gray-200"
                        alt="Profile"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white flex items-center justify-center text-lg font-medium border-2 border-gray-200">
                        {userData?.user?.name?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {userData?.user?.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {userData?.user?.role}
                      </p>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="space-y-4"
                  >
                    {userData?.user?.role === "educator" && (
                      <motion.button
                        whileHover={{ x: 10 }}
                        onClick={() => {
                          navigate("/educator/create-announcement");
                          setShowMobileMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                      >
                        <IoMdAdd className="h-5 w-5 mr-3 text-indigo-600" />
                        Send Announcement
                      </motion.button>
                    )}
                    {userData && (
                      <motion.button
                        whileHover={{ x: 10 }}
                        onClick={handleNotificationClick}
                        className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center relative"
                      >
                        <IoMdNotifications className="h-5 w-5 mr-3 text-indigo-600" />
                        Notifications
                        {unreadNotificationCount > 0 && (
                          <span className="absolute right-4 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-red-100 bg-red-600 rounded-full">
                            {unreadNotificationCount}
                          </span>
                        )}
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ x: 10 }}
                      onClick={() => {
                        navigate("/profile");
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                    >
                      <IoMdPerson className="mr-3 text-indigo-600" />
                      My Profile
                    </motion.button>
                    <motion.button
                      whileHover={{ x: 10 }}
                      onClick={() => {
                        navigate("/enrolledcourses");
                        setShowMobileMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-indigo-600" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      My Courses
                    </motion.button>
                    {userData?.user?.role === "educator" && (
                      <motion.button
                        whileHover={{ x: 10 }}
                        onClick={() => {
                          navigate("/dashboard");
                          setShowMobileMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                      >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-indigo-600" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                          <path fillRule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm11 1H6v8l4-2 4 2V6z" clipRule="evenodd" />
                      </svg>
                        Dashboard
                      </motion.button>
                    )}
                    <motion.button
                      whileHover={{ x: 10 }}
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-base font-medium text-gray-700 hover:bg-gray-100 rounded-md flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-indigo-600" viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                      </svg>
                      Logout
                    </motion.button>
                  </motion.div>
                </>
              ) : (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  onClick={() => {
                    navigate("/login");
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 mt-8"
                >
                  Login
                </motion.button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

export default Nav;
