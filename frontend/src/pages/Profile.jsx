import React from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { FaArrowLeftLong, FaBookOpen } from "react-icons/fa6";
import { FaCalendarAlt } from "react-icons/fa";
import { FaChalkboardTeacher } from "react-icons/fa";
import { FaEdit } from "react-icons/fa";
import Nav from "../components/Nav";
import useGetCurrentUser from "../customHooks/getCurrentUser";

function Profile() {
  useGetCurrentUser();
  let { userData } = useSelector((state) => state.user);
  let navigate = useNavigate();

  if (!userData?.user) {
    return (
      <>
        <div className="min-h-screen bg-gray-100 px-4 py-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-24 w-24 bg-gray-300 rounded-full mb-4"></div>
              <div className="h-6 bg-gray-300 rounded w-48 mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-32"></div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-100 px-4 py-10 flex items-center justify-center">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-xl w-full relative">
          <FaArrowLeftLong
            className="absolute top-[8%] left-[5%] w-[22px] h-[22px] cursor-pointer hover:text-gray-600 transition-colors"
            onClick={() => navigate("/")}
          />

          {/* Profile Header */}
          <div className="flex flex-col items-center text-center">
            {userData.user.photoUrl ? (
              <img
                src={userData.user.photoUrl}
                alt={userData.user.name}
                className="w-24 h-24 rounded-full object-cover border-4 border-black"
              />
            ) : (
              <div className="w-24 h-24 rounded-full text-white flex items-center justify-center text-[30px] border-2 bg-black border-white">
                {userData.user.name.slice(0, 1).toUpperCase()}
              </div>
            )}
            <h2 className="text-2xl font-bold mt-4 text-gray-800">
              {userData.user.name}
            </h2>
            <p className="text-sm text-gray-500 capitalize">{userData.user.role}</p>
          </div>

          {/* Profile Info */}
          <div className="mt-6 space-y-4">
            <div className="text-sm">
              <span className="font-semibold text-gray-700">Email: </span>
              <span className="text-gray-600">{userData.user.email}</span>
            </div>

            {userData.user.description && (
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Bio: </span>
                <span className="text-gray-600">{userData.user.description}</span>
              </div>
            )}

            <div className="text-sm">
              <span className="font-semibold text-gray-700">
                Enrolled Courses:
              </span>
              <span className="text-gray-600 ml-1">
                {userData.user.enrolledCourses?.length || 0}
              </span>
            </div>

            {userData.user.role === 'educator' && (
              <div className="text-sm">
                <span className="font-semibold text-gray-700">Role: </span>
                <span className="inline-block px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  Course Educator
                </span>
              </div>
            )}
          </div>

          {/* Enrolled Courses Preview */}
          {userData.user.enrolledCourses && userData.user.enrolledCourses.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-100">
              <h3 className="font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <FaBookOpen className="text-sm" />
                My Enrolled Courses
              </h3>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {userData.user.enrolledCourses.slice(0, 5).map((course) => (
                  <div
                    key={course._id}
                    onClick={() => navigate(`/viewcourse/${course._id}`)}
                    className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
                  >
                    {course.thumbnail && (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-10 h-10 rounded object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {course.title}
                      </p>
                      <div className="flex gap-2">
                        <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded">
                          {course.category}
                        </span>
                        <span className="text-xs text-gray-500 bg-white px-2 py-0.5 rounded">
                          {course.level}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                {userData.user.enrolledCourses.length > 5 && (
                  <p className="text-xs text-gray-500 text-center">
                    +{userData.user.enrolledCourses.length - 5} more courses
                  </p>
                )}
              </div>

              {/* View All Courses Button */}
              <div className="mt-3 text-center">
                <button
                  onClick={() => navigate("/enrolledcourses")}
                  className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  View All Enrolled Courses →
                </button>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <h3 className="font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                className="flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm"
                onClick={() => navigate("/editprofile")}
              >
                <FaEdit className="text-xs" />
                Edit Profile
              </button>

              {userData.user.role === 'educator' && (
                <button
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                  onClick={() => navigate("/dashboard")}
                >
                  Dashboard
                </button>
              )}

              <button
                className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                onClick={() => navigate("/allcourses")}
              >
                Browse Courses
              </button>

              {userData.user.enrolledCourses?.length > 0 && (
                <button
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                  onClick={() => navigate("/enrolledcourses")}
                >
                  My Learning
                </button>
              )}

              {userData.user.role === 'educator' && (
                <button
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm col-span-2"
                  onClick={() => navigate(`/user/${userData.user._id}`)}
                >
                  <FaChalkboardTeacher className="text-sm" />
                  View My Instructor Profile
                </button>
              )}
            </div>
          </div>

          {/* Join Date */}
          <div className="mt-6 pt-4 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
              <FaCalendarAlt className="text-xs" />
              Member since {new Date(userData.user.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long'
              })}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default Profile;
