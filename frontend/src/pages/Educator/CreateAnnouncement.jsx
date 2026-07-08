import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import axios from "axios";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { IoMdSearch, IoMdClose, IoMdCheckmark, IoMdPerson, IoMdBook, IoMdMail, IoMdNotifications } from "react-icons/io";
import { serverUrl } from "../../App";

function CreateAnnouncement() {
  const navigate = useNavigate();
  const location = useLocation();
  const { targetedStudents } = location.state || {};
  const { userData } = useSelector((state) => state.user);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState(targetedStudents || []);
  const [allCourses, setAllCourses] = useState(false);
  const [deliveryOptions, setDeliveryOptions] = useState({
    inapp: true,
    email: false,
  });
  const [courses, setCourses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [studentSearchTerm, setStudentSearchTerm] = useState("");
  const [targetMode, setTargetMode] = useState(targetedStudents ? "students" : "courses");

  useEffect(() => {
    if (!userData || userData.user.role !== "educator") {
      toast.error("Unauthorized access.");
      navigate("/");
    }

    const fetchData = async () => {
      try {
        // Fetch courses
        const coursesResponse = await axios.get(`${serverUrl}/api/course/get-creator-course`, {
          withCredentials: true,
        });
        setCourses(coursesResponse.data.courses || []);

        // Fetch all enrolled students from educator's courses
        const studentsSet = new Set();
        const studentsData = [];

        for (const course of coursesResponse.data.courses || []) {
          try {
            const enrolledResponse = await axios.get(`${serverUrl}/api/course/enrolledstudents/${course._id}`, {
              withCredentials: true,
            });
            enrolledResponse.data.enrolledStudents?.forEach(student => {
              if (!studentsSet.has(student._id)) {
                studentsSet.add(student._id);
                studentsData.push({
                  ...student,
                  courseName: course.title
                });
              }
            });
          } catch (error) {
            console.error(`Error fetching students for course ${course._id}:`, error);
          }
        }
        setAllStudents(studentsData);
      } catch (error) {
        toast.error("Failed to fetch data.");
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, [userData, navigate]);

  const filteredCourses = courses.filter(course =>
    course.title.toLowerCase().includes(courseSearchTerm.toLowerCase())
  );

  const filteredStudents = allStudents.filter(student =>
    student.name.toLowerCase().includes(studentSearchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(studentSearchTerm.toLowerCase())
  );

  const handleCourseChange = (courseId) => {
    setSelectedCourses(prev =>
      prev.includes(courseId)
        ? prev.filter(id => id !== courseId)
        : [...prev, courseId]
    );
  };

  const handleStudentChange = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleAllCoursesChange = (checked) => {
    setAllCourses(checked);
    if (checked) {
      setSelectedCourses([]);
    }
  };

  const handleTargetModeChange = (mode) => {
    setTargetMode(mode);
    if (mode === "courses") {
      setSelectedStudents([]);
    } else {
      setSelectedCourses([]);
      setAllCourses(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!title || !description) {
      toast.error("Title and Description are required.");
      setLoading(false);
      return;
    }

    if (targetMode === "courses" && !allCourses && selectedCourses.length === 0) {
      toast.error("Please select at least one course or 'All Courses'.");
      setLoading(false);
      return;
    }

    if (targetMode === "students" && selectedStudents.length === 0) {
      toast.error("Please select at least one student.");
      setLoading(false);
      return;
    }

    if (!deliveryOptions.inapp && !deliveryOptions.email) {
      toast.error("Please select at least one delivery option.");
      setLoading(false);
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);

    if (attachment) {
      formData.append("attachment", attachment);
    }

    if (targetMode === "students") {
      formData.append("selectedStudents", JSON.stringify(selectedStudents));
    } else {
      formData.append("allCourses", allCourses);
      formData.append("selectedCourses", JSON.stringify(selectedCourses));
    }

    formData.append("deliveryOptions", JSON.stringify(deliveryOptions));

    try {
      await axios.post(`${serverUrl}/api/announcements`, formData, {
        withCredentials: true,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      toast.success("Announcement sent successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to send announcement.");
      console.error("Error sending announcement:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto"
      >
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-6">
            <h2 className="text-3xl font-bold text-white">
              {targetedStudents ? "Send Targeted Announcement" : "Create New Announcement"}
            </h2>
            {targetedStudents && (
              <p className="text-indigo-100 mt-2">
                Sending to {targetedStudents.length} selected student(s)
              </p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            {/* Basic Information */}
            <div className="space-y-6">
              <div>
                <label htmlFor="title" className="block text-sm font-semibold text-gray-700 mb-2">
                  Announcement Title *
                </label>
                <input
                  id="title"
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  placeholder="Enter announcement title..."
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Description *
                </label>
                <textarea
                  id="description"
                  required
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-none"
                  placeholder="Enter announcement description..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="attachment" className="block text-sm font-semibold text-gray-700 mb-2">
                  Attachment (Optional)
                </label>
                <input
                  id="attachment"
                  type="file"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 transition-colors"
                  onChange={(e) => setAttachment(e.target.files[0])}
                />
              </div>
            </div>

            {/* Target Selection */}
            {!targetedStudents && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-4">
                    Target Audience *
                  </label>
                  <div className="flex space-x-4 mb-6">
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTargetModeChange("courses")}
                      className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                        targetMode === "courses"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <IoMdBook className="mr-2" />
                      By Courses
                    </motion.button>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleTargetModeChange("students")}
                      className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg border-2 transition-all ${
                        targetMode === "students"
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-300 bg-white text-gray-700 hover:border-gray-400"
                      }`}
                    >
                      <IoMdPerson className="mr-2" />
                      By Students
                    </motion.button>
                  </div>
                </div>

                {/* Course Selection */}
                {targetMode === "courses" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                  >
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                      <input
                        id="all-courses"
                        type="checkbox"
                        className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        checked={allCourses}
                        onChange={(e) => handleAllCoursesChange(e.target.checked)}
                      />
                      <label htmlFor="all-courses" className="text-sm font-medium text-gray-900">
                        Send to all my courses
                      </label>
                    </div>

                    {!allCourses && (
                      <div className="space-y-4">
                        <div className="relative">
                          <IoMdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search courses..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            value={courseSearchTerm}
                            onChange={(e) => setCourseSearchTerm(e.target.value)}
                          />
                        </div>

                        <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                          {filteredCourses.length > 0 ? (
                            filteredCourses.map((course) => (
                              <motion.div
                                key={course._id}
                                whileHover={{ backgroundColor: "#f9fafb" }}
                                className="flex items-center space-x-3 p-4 border-b border-gray-100 last:border-b-0"
                              >
                                <input
                                  id={`course-${course._id}`}
                                  type="checkbox"
                                  className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                  checked={selectedCourses.includes(course._id)}
                                  onChange={() => handleCourseChange(course._id)}
                                />
                                <label htmlFor={`course-${course._id}`} className="flex-1 text-sm text-gray-900 cursor-pointer">
                                  {course.title}
                                </label>
                                <span className="text-xs text-gray-500">
                                  {course.enrolledStudents?.length || 0} students
                                </span>
                              </motion.div>
                            ))
                          ) : (
                            <div className="p-4 text-center text-gray-500">
                              No courses found
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {/* Student Selection */}
                {targetMode === "students" && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="space-y-4"
                  >
                    <div className="relative">
                      <IoMdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search students by name or email..."
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={studentSearchTerm}
                        onChange={(e) => setStudentSearchTerm(e.target.value)}
                      />
                    </div>

                    <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg">
                      {filteredStudents.length > 0 ? (
                        filteredStudents.map((student) => (
                          <motion.div
                            key={student._id}
                            whileHover={{ backgroundColor: "#f9fafb" }}
                            className="flex items-center space-x-3 p-4 border-b border-gray-100 last:border-b-0"
                          >
                            <input
                              id={`student-${student._id}`}
                              type="checkbox"
                              className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              checked={selectedStudents.includes(student._id)}
                              onChange={() => handleStudentChange(student._id)}
                            />
                            <div className="flex-shrink-0">
                              {student.photoUrl ? (
                                <img
                                  src={student.photoUrl}
                                  className="h-8 w-8 rounded-full"
                                  alt={student.name}
                                />
                              ) : (
                                <div className="h-8 w-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-sm font-medium">
                                  {student.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <label htmlFor={`student-${student._id}`} className="flex-1 cursor-pointer">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                              <div className="text-xs text-gray-500">{student.email}</div>
                            </label>
                          </motion.div>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          No students found
                        </div>
                      )}
                    </div>

                    {selectedStudents.length > 0 && (
                      <div className="p-3 bg-indigo-50 rounded-lg">
                        <p className="text-sm text-indigo-700">
                          {selectedStudents.length} student(s) selected
                        </p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            )}

            {/* Delivery Options */}
            <div className="space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Delivery Options *
              </label>
              <div className="grid grid-cols-2 gap-4">
                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    deliveryOptions.inapp
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                  onClick={() => setDeliveryOptions(prev => ({ ...prev, inapp: !prev.inapp }))}
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={deliveryOptions.inapp}
                    readOnly
                  />
                  <IoMdNotifications className="text-indigo-600" />
                  <span className="text-sm font-medium text-gray-900">In-app Notification</span>
                </motion.div>

                <motion.div
                  whileHover={{ scale: 1.02 }}
                  className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    deliveryOptions.email
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-300 bg-white hover:border-gray-400"
                  }`}
                  onClick={() => setDeliveryOptions(prev => ({ ...prev, email: !prev.email }))}
                >
                  <input
                    type="checkbox"
                    className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    checked={deliveryOptions.email}
                    readOnly
                  />
                  <IoMdMail className="text-indigo-600" />
                  <span className="text-sm font-medium text-gray-900">Email</span>
                </motion.div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate("/dashboard")}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
              >
                Cancel
              </motion.button>
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                className="flex-1 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium rounded-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  "Send Announcement"
                )}
              </motion.button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default CreateAnnouncement;
