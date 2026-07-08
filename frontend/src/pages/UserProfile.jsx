import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FaArrowLeftLong,
  FaBookOpen,
  FaUser,
  FaEnvelope,
  FaGraduationCap,
  FaStar,
  FaUsers,
  FaClock
} from "react-icons/fa6";
import { FaChalkboardTeacher } from "react-icons/fa";
import { serverUrl } from "../App";
import Nav from "../components/Nav";
import axios from "axios";

function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState('created');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${serverUrl}/api/user/${userId}`, {
          withCredentials: true
        });
        if (response.data.success) {
          setUserData(response.data.user);
        } else {
          setError("User not found");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        setError("Failed to load user profile");
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="animate-pulse space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
              <div className="w-full md:w-1/3 lg:w-1/4">
                <div className="bg-white rounded-xl shadow-sm p-6 h-80">
                  <div className="flex flex-col items-center">
                    <div className="h-32 w-32 bg-gray-200 rounded-full mb-4"></div>
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
                    <div className="w-full space-y-3">
                      <div className="h-4 bg-gray-100 rounded w-full"></div>
                      <div className="h-4 bg-gray-100 rounded w-5/6"></div>
                      <div className="h-4 bg-gray-100 rounded w-2/3"></div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 space-y-6">
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-48 bg-gray-100 rounded-lg"></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Nav />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <FaUser className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Profile Not Found</h3>
            <p className="mt-2 text-sm text-gray-500">{error || 'The requested user profile could not be found.'}</p>
            <div className="mt-6">
              <button
                onClick={() => navigate('/')}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
              >
                <FaArrowLeftLong className="mr-2 -ml-1 h-4 w-4" />
                Back to Home
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Update stats based on user role
  const stats = userData.role === 'educator' ? [
    {
      name: 'Total Students',
      value: userData.createdCourses?.reduce((total, course) => total + (course.enrolledStudents?.length || 0), 0) || 0,
      icon: FaUsers
    },
    {
      name: 'Total Courses',
      value: userData.createdCourses?.length || 0,
      icon: FaBookOpen
    },
    {
      name: 'Average Rating',
      value: (() => {
        const coursesWithReviews = userData.createdCourses?.filter(course =>
          course.reviews?.length > 0
        ) || [];

        if (coursesWithReviews.length === 0) return '—';

        const totalRating = coursesWithReviews.reduce((sum, course) => {
          const ratings = course.reviews.map(r => r.rating);
          const avg = ratings.reduce((a, b) => a + b, 0) / ratings.length;
          return sum + avg;
        }, 0);

        return (totalRating / coursesWithReviews.length).toFixed(1);
      })(),
      icon: FaStar
    },
  ] : [
    {
      name: 'Enrolled Courses',
      value: userData.enrolledCourses?.length || 0,
      icon: FaBookOpen
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center text-sm font-medium text-gray-600 hover:text-indigo-600 transition-colors duration-200"
        >
          <FaArrowLeftLong className="mr-2 h-4 w-4" />
          Back
        </button>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar */}
          <div className="w-full lg:w-1/4">
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="px-6 py-8 text-center">
                <div className="relative mx-auto h-32 w-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                  {userData.photoUrl ? (
                    <img
                      src={userData.photoUrl}
                      alt={userData.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                      {userData.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <h2 className="mt-4 text-xl font-bold text-gray-900">{userData.name}</h2>

                {userData.role && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mt-2 ${
                    userData.role === 'educator'
                      ? 'bg-indigo-100 text-indigo-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {userData.role === 'educator' ? (
                      <>
                        <FaChalkboardTeacher className="mr-1.5 h-3.5 w-3.5" />
                        Instructor
                      </>
                    ) : (
                      <>
                        <FaGraduationCap className="mr-1.5 h-3.5 w-3.5" />
                        Student
                      </>
                    )}
                  </span>
                )}

                <div className="mt-6 space-y-3 text-left">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaEnvelope className="flex-shrink-0 mr-2 h-4 w-4 text-gray-400" />
                    <span className="truncate">{userData.email}</span>
                  </div>

                  {userData.description && (
                    <div className="pt-4">
                      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">About</h4>
                      <p className="text-sm text-gray-600">{userData.description}</p>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="mt-6 pt-6 border-t border-gray-100">
                  <dl className="grid grid-cols-2 gap-4">
                    {stats.map((stat) => (
                      <div key={stat.name} className="text-center">
                        <dt className="text-xs font-medium text-gray-500">{stat.name}</dt>
                        <dd className="mt-1 flex items-center justify-center text-lg font-semibold text-gray-900">
                          <stat.icon className="mr-1.5 h-4 w-4 text-indigo-500" />
                          {stat.value}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Tabs - Only show relevant tabs based on role */}
            {userData.role === 'educator' ? (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    <span className="py-4 px-6 text-center border-b-2 font-medium text-sm border-indigo-500 text-indigo-600">
                      Created Courses
                    </span>
                  </nav>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
                <div className="border-b border-gray-200">
                  <nav className="flex -mb-px">
                    <span className="py-4 px-6 text-center border-b-2 font-medium text-sm border-indigo-500 text-indigo-600">
                      Enrolled Courses
                    </span>
                  </nav>
                </div>
              </div>
            )}

            {/* Course Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-6">
              {userData.role === 'educator' ? (
                userData.createdCourses?.length > 0 ? (
                  userData.createdCourses.map((course) => (
                    <CourseCard key={course._id} course={course} isInstructor={true} />
                  ))
                ) : (
                  <div className="col-span-2 py-12 text-center">
                    <FaBookOpen className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No courses created yet</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      This instructor has not created any courses yet.
                    </p>
                  </div>
                )
              ) : userData.enrolledCourses?.length > 0 ? (
                userData.enrolledCourses.map((course) => (
                  <CourseCard key={course._id} course={course} isInstructor={false} />
                ))
              ) : (
                <div className="col-span-2 py-12 text-center">
                  <FaBookOpen className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No courses enrolled yet</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    This user has not enrolled in any courses yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Reusable Course Card Component
function CourseCard({ course, isInstructor }) {
  return (
    <Link
      to={`/viewcourse/${course._id}`}
      className="group block transition-transform duration-200 hover:-translate-y-1"
    >
      <div className="bg-white rounded-xl shadow-sm overflow-hidden h-full border border-gray-200 hover:shadow-md transition-shadow duration-200">
        <div className="relative pt-[56.25%] bg-gray-100 overflow-hidden">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title}
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
              <FaBookOpen className="h-12 w-12 opacity-20" />
            </div>
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              course.isPublished
                ? 'bg-green-100 text-green-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {course.isPublished ? 'Published' : 'Draft'}
            </span>
          </div>
        </div>
        <div className="p-5">
          <h4 className="text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 mb-2">
            {course.title}
          </h4>
          <p className="text-sm text-gray-500 line-clamp-2 mb-4">
            {course.description || 'No description available'}
          </p>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <FaBookOpen className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                {course.lectures?.length || 0} lectures
              </span>
              {course.duration && (
                <span className="flex items-center">
                  <FaClock className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                  {course.duration}
                </span>
              )}
            </div>
            {course.rating && course.reviews?.length > 0 && (
              <span className="inline-flex items-center bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full text-xs font-medium">
                <FaStar className="mr-1 h-3 w-3 text-yellow-400" />
                {course.rating.toFixed(1)}
              </span>
            )}
          </div>
          {isInstructor && course.enrolledStudents && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex items-center text-sm text-gray-500">
                <FaUsers className="mr-1.5 h-3.5 w-3.5 text-gray-400" />
                {course.enrolledStudents?.length || 0} students enrolled
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export default UserProfile;
