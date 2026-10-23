import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeftLong, FaBookOpen, FaChartLine, FaTrophy, FaCircleCheck } from 'react-icons/fa6';
import { serverUrl } from '../App';

function EnrolledCourse() {
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  const [progressMap, setProgressMap] = useState({});
  const [loadingProgress, setLoadingProgress] = useState(true);

  const enrolledCourses = userData?.user?.enrolledCourses || [];

  // Fetch all course progress records for the user
  useEffect(() => {
    const fetchUserProgress = async () => {
      try {
        setLoadingProgress(true);
        const res = await axios.get(`${serverUrl}/api/progress/user/all`, {
          withCredentials: true,
        });
        if (res.data?.success && res.data.progressMap) {
          setProgressMap(res.data.progressMap);
        }
      } catch (err) {
        console.error("Error fetching user course progress:", err);
      } finally {
        setLoadingProgress(false);
      }
    };

    if (userData?.user?._id) {
      fetchUserProgress();
    }
  }, [userData]);

  // Compute overall stats
  const completedCoursesCount = enrolledCourses.filter((course) => {
    const prog = progressMap[course._id];
    return prog?.isCompleted || prog?.completionPercentage === 100;
  }).length;

  const totalPercentageSum = enrolledCourses.reduce((sum, course) => {
    const prog = progressMap[course._id];
    return sum + (prog?.completionPercentage || 0);
  }, 0);

  const averageCompletionRate =
    enrolledCourses.length > 0
      ? Math.round(totalPercentageSum / enrolledCourses.length)
      : 0;

  if (!userData?.user?.enrolledCourses) {
    return (
      <div className="min-h-screen w-full px-4 py-20 bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-12 w-12 bg-gray-300 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen w-full pt-20 px-4 md:px-8 lg:px-12 bg-gray-50 pb-12">
        {/* Header with back button */}
        <div className="max-w-7xl mx-auto mb-8 relative">
          <button
            onClick={() => navigate("/")}
            className="absolute left-0 top-0 flex items-center gap-2 text-gray-600 hover:text-black transition-colors"
          >
            <FaArrowLeftLong className="w-5 h-5" />
            <span className="hidden sm:inline">Back to Home</span>
          </button>

          <div className="text-center px-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              My Learning Journey
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {enrolledCourses.length > 0
                ? "Track your progress and continue learning where you left off"
                : "Your enrolled courses will appear here"}
            </p>
          </div>
        </div>

        {/* Empty State */}
        {enrolledCourses.length === 0 && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-xs p-8 text-center border border-gray-200">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBookOpen className="text-indigo-600 text-3xl" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              No Enrolled Courses Yet
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              You haven't enrolled in any courses yet. Explore our catalog to find courses that match your interests.
            </p>
            <button
              onClick={() => navigate("/courses")}
              className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Browse Courses
            </button>
          </div>
        )}

        {/* Course Grid & Stats */}
        {enrolledCourses.length > 0 && (
          <div className="max-w-7xl mx-auto">
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              {/* Enrolled Courses */}
              <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                    <FaBookOpen className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                      Enrolled Courses
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {enrolledCourses.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Completed Courses */}
              <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-emerald-100 rounded-xl text-emerald-600">
                    <FaTrophy className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                      Completed Courses
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {completedCoursesCount} of {enrolledCourses.length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Completion Rate */}
              <div className="bg-white p-5 rounded-xl shadow-xs border border-gray-200">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-purple-100 rounded-xl text-purple-600">
                    <FaChartLine className="text-xl" />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-500 font-medium">
                      Average Completion
                    </p>
                    <p className="text-2xl font-bold text-gray-800">
                      {averageCompletionRate}%
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Courses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((course) => {
                const prog = progressMap[course._id];
                const totalLectures = course.lectures?.length || 0;
                const completedCount = prog?.completedLectures?.length || 0;
                const percent = prog?.completionPercentage || 0;
                const isFinished = prog?.isCompleted || percent === 100;

                return (
                  <div
                    key={course._id}
                    className="bg-white rounded-xl shadow-xs overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-300 flex flex-col group"
                  >
                    <div className="relative">
                      <img
                        src={course.thumbnail || "/course-placeholder.jpg"}
                        alt={course.title}
                        className="w-full h-48 object-cover"
                        onError={(e) => {
                          e.target.src = "/course-placeholder.jpg";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-white text-sm font-medium">
                          {isFinished ? "Review Course" : "Continue Learning"}
                        </span>
                      </div>

                      {/* Status Overlay Badge */}
                      <div className="absolute top-3 right-3">
                        {isFinished ? (
                          <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-full text-xs font-semibold shadow-xs flex items-center gap-1">
                            <FaCircleCheck className="text-xs" />
                            Completed
                          </span>
                        ) : percent > 0 ? (
                          <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-full text-xs font-semibold shadow-xs">
                            {percent}% Done
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-gray-800/80 text-white rounded-full text-xs font-medium backdrop-blur-xs">
                            Not Started
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-grow justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2 mb-2">
                          <h2 className="text-lg font-bold text-gray-800 line-clamp-2">
                            {course.title}
                          </h2>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 mb-4">
                          <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                            {course.category}
                          </span>
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                              course.level === "Beginner"
                                ? "bg-green-100 text-green-800"
                                : course.level === "Intermediate"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {course.level}
                          </span>
                        </div>

                        {/* Progress Bar Display */}
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex justify-between items-center text-xs text-gray-600 mb-1.5 font-medium">
                            <span>
                              {completedCount} of {totalLectures} lectures completed
                            </span>
                            <span className="font-bold text-indigo-600">
                              {percent}%
                            </span>
                          </div>

                          <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                            <div
                              className={`h-2.5 rounded-full transition-all duration-500 ${
                                isFinished
                                  ? "bg-emerald-500"
                                  : "bg-gradient-to-r from-indigo-500 to-indigo-600"
                              }`}
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => navigate(`/viewlecture/${course._id}`)}
                        className={`w-full mt-5 px-4 py-2.5 rounded-lg text-white font-medium transition-colors flex items-center justify-center gap-2 shadow-xs ${
                          isFinished
                            ? "bg-emerald-600 hover:bg-emerald-700"
                            : percent > 0
                            ? "bg-indigo-600 hover:bg-indigo-700"
                            : "bg-indigo-600 hover:bg-indigo-700"
                        }`}
                      >
                        <FaBookOpen className="text-sm" />
                        <span>
                          {isFinished
                            ? "Review Course"
                            : percent > 0
                            ? "Continue Course"
                            : "Start Course"}
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default EnrolledCourse;