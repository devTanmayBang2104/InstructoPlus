import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from "react-redux";
import axios from "axios";
import { FaArrowLeft, FaChartLine, FaUsers, FaBook, FaMoneyBillWave } from "react-icons/fa";
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AnimationContext } from '../../App.jsx';
import { useContext } from 'react';
import Nav from '../../components/Nav.jsx';
import { serverUrl } from '../../App.jsx';

function Dashboard() {
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  const { creatorCourseData } = useSelector((state) => state.course);
  const { fadeIn, slideIn } = useContext(AnimationContext);

  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalStudents: 0,
    publishedCourses: 0,
    draftCourses: 0,
    enrollmentRate: 0,
  });

  const [recentCourses, setRecentCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (creatorCourseData) {
      const courses = creatorCourseData;

      const totalEarnings = courses.reduce((sum, course) => {
        const studentCount = course.enrolledStudents?.length || 0;
        const courseRevenue = course.price ? course.price * studentCount : 0;
        return sum + courseRevenue;
      }, 0);

      const totalStudents = courses.reduce((sum, course) =>
        sum + (course.enrolledStudents?.length || 0), 0);

      const publishedCourses = courses.filter(course => course.isPublished).length;
      const draftCourses = courses.filter(course => !course.isPublished).length;

      setStats({
        totalEarnings,
        totalStudents,
        publishedCourses,
        draftCourses,
        enrollmentRate: publishedCourses > 0 ? Math.round((totalStudents / publishedCourses) * 100) / 100 : 0,
      });

      setRecentCourses(courses.slice(0, 3));
      setLoading(false);
    } else {
      setLoading(true);
    }
  }, [creatorCourseData]);

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-6">


      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <FaArrowLeft
            className="text-gray-600 cursor-pointer"
            onClick={() => navigate("/")}
          />
          <h1 className="text-2xl font-bold text-gray-800">Educator Dashboard</h1>
        </div>

        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
          variants={slideIn}
          initial="hidden"
          animate="visible"
        >
          <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
              <FaMoneyBillWave size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Earnings</p>
              <p className="text-2xl font-bold text-gray-800">₹{stats.totalEarnings.toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600">
              <FaUsers size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total Students</p>
              <p className="text-2xl font-bold text-gray-800">{stats.totalStudents}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
              <FaBook size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Published Courses</p>
              <p className="text-2xl font-bold text-gray-800">{stats.publishedCourses}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
              <FaBook size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Draft Courses</p>
              <p className="text-2xl font-bold text-gray-800">{stats.draftCourses}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600">
              <FaChartLine size={20} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Avg. Enrollment</p>
              <p className="text-2xl font-bold text-gray-800">{stats.enrollmentRate}/course</p>
            </div>
          </div>
        </motion.div>

        {/* Welcome Card */}
        <motion.div
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl shadow-lg p-8 mb-8 text-white"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
        >
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="bg-white bg-opacity-20 p-2 rounded-full">
              <div className="w-24 h-24 rounded-full bg-white text-indigo-600 flex items-center justify-center text-3xl font-bold">
                {userData?.user.name.charAt(0)}
              </div>
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold mb-2">
                Welcome back, {userData?.user.name} 👋
              </h1>
              <p className="text-indigo-100 max-w-xl">
                {userData?.user.description || "Start creating amazing courses for your students!"}
              </p>
              <button
                className="mt-4 px-6 py-3 bg-white text-indigo-600 rounded-xl font-medium hover:bg-indigo-50 transition-all"
                onClick={() => navigate("/createcourses")}
              >
                Create New Course
              </button>
            </div>
          </div>
        </motion.div>

        {/* Recent Courses */}
        <motion.div
          className="bg-white rounded-2xl shadow-md p-6"
          variants={fadeIn}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.2 }}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Your Recent Courses</h2>
            <button
              className="text-indigo-600 hover:text-indigo-800 font-medium"
              onClick={() => navigate("/courses")}
            >
              View All
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : recentCourses.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recentCourses.map((course, index) => (
                <div
                  key={index}
                  className="border rounded-xl overflow-hidden hover:shadow-md transition-all cursor-pointer"
                  onClick={() => navigate(`/editcourses/${course._id}`)}
                >
                  <div className="h-40 bg-gray-200 relative">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                        <FaBook className="text-indigo-400 text-3xl" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3 px-2 py-1 bg-white rounded-full text-xs font-medium">
                      {course.isPublished ? "Published" : "Draft"}
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-bold text-gray-800 truncate">{course.title}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-indigo-600 font-semibold">₹{course.price}</span>
                      <span className="text-sm text-gray-500">
                        {course?.enrolledStudents?.length || 0} students
                      </span>
                    </div>
                    <button
                      className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent navigating to editcourses
                        navigate(`/enrolledstudents/${course._id}`);
                      }}
                    >
                      Check Students
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10">
              <div className="text-5xl mb-4">📚</div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No courses yet</h3>
              <p className="text-gray-500 mb-4">Create your first course to get started</p>
              <button
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
                onClick={() => navigate("/createcourses")}
              >
                Create Course
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </div>
    </>
  );
}

export default Dashboard;
