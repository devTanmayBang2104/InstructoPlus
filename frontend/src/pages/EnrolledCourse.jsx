import React from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeftLong, FaBookOpen, FaClock, FaChartLine } from 'react-icons/fa6';
import Nav from '../components/Nav';

function EnrolledCourse() {
  const navigate = useNavigate();
  const { userData } = useSelector((state) => state.user);
  // console.log(userData?.user?.enrolledCourses);

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
              {userData.user.enrolledCourses.length > 0
                ? "Continue your learning adventure"
                : "Your future courses will appear here"}
            </p>
          </div>
        </div>

        {/* Empty State */}
        {userData.user.enrolledCourses.length === 0 && (
          <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm p-8 text-center border border-gray-200">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaBookOpen className="text-indigo-600 text-3xl" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">No Enrolled Courses Yet</h2>
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

        {/* Course Grid */}
        {userData.user.enrolledCourses.length > 0 && (
          <div className="max-w-7xl mx-auto">
            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <FaBookOpen className="text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Enrolled Courses</p>
                    <p className="text-xl font-semibold">{userData.user.enrolledCourses.length}</p>
                  </div>
                </div>
              </div>

              {/* <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <FaClock className="text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hours Learning</p>
                    <p className="text-xl font-semibold">12.5</p>
                  </div>
                </div>
              </div> */}

              {/* <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <FaChartLine className="text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completion Rate</p>
                    <p className="text-xl font-semibold">65%</p>
                  </div>
                </div>
              </div> */}
            </div>

            {/* Courses */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {userData.user.enrolledCourses.map((course) => (
                <div
                  key={course._id}
                  className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-all duration-300 group"
                >
                  <div className="relative">
                    <img
                      src={course.thumbnail || '/course-placeholder.jpg'}
                      alt={course.title}
                      className="w-full h-48 object-cover"
                      onError={(e) => {
                        e.target.src = '/course-placeholder.jpg';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                      <span className="text-white font-medium">Continue Learning</span>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h2 className="text-lg font-semibold text-gray-800 line-clamp-2 mb-1">
                          {course.title}
                        </h2>
                        <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          {course.category}
                        </span>
                      </div>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                        course.level === 'Beginner' ? 'bg-green-100 text-green-800' :
                        course.level === 'Intermediate' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {course.level}
                      </span>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <span>Lectures: {course.lectures.length}</span>
                    </div>


                    <button
                      onClick={() => navigate(`/viewlecture/${course._id}`)}
                      className="w-full mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <FaBookOpen className="text-sm" />
                      Continue Course
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default EnrolledCourse;