import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeftLong, FaBookOpen, FaUsers, FaStar, FaRegStar, FaRegClock } from "react-icons/fa6";
import { FaChalkboardTeacher } from "react-icons/fa";
import { FaCalendarAlt, FaGraduationCap, FaGlobe, FaTwitter, FaLinkedin, FaGithub } from "react-icons/fa";
import Nav from "../components/Nav";
import { serverUrl } from "../App";
import axios from "axios";

export default function InstructorProfile() {
  const { instructorId } = useParams();
  const navigate = useNavigate();
  const [instructor, setInstructor] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInstructorData = async () => {
      try {
        setLoading(true);
        // Fetch instructor data
        const [instructorRes, coursesRes] = await Promise.all([
          axios.get(`${serverUrl}/api/user/user/${instructorId}`),
          axios.get(`${serverUrl}/api/course/instructor/${instructorId}`)
        ]);

        if (instructorRes.data.success) {
          setInstructor(instructorRes.data.user);
        } else {
          setError("Instructor not found");
        }

        if (coursesRes.data.success) {
          setCourses(coursesRes.data.courses);
        }
      } catch (error) {
        console.error("Error fetching instructor data:", error);
        setError("Failed to load instructor profile");
      } finally {
        setLoading(false);
      }
    };

    if (instructorId) {
      fetchInstructorData();
    }
  }, [instructorId]);

  if (loading) {
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

  if (error || !instructor) {
    return (
      <>
        <Nav />
        <div className="min-h-screen bg-gray-100 px-4 py-10 flex items-center justify-center">
          <div className="bg-white shadow-lg rounded-2xl p-8 max-w-xl w-full text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaChalkboardTeacher className="text-red-500 text-2xl" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {error || "Instructor Not Found"}
            </h2>
            <p className="text-gray-600 mb-6">
              The instructor profile you're looking for doesn't exist or couldn't be loaded.
            </p>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </>
    );
  }

  // Calculate average rating
  const averageRating = instructor.averageRating?.toFixed(1) || 0;
  const fullStars = Math.floor(averageRating);
  const hasHalfStar = averageRating % 1 >= 0.5;

  return (
    <>
      <Nav />
      <div className="min-h-screen bg-gray-50">
        {/* Instructor Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="flex-shrink-0">
                {instructor.photoUrl ? (
                  <img
                    src={instructor.photoUrl}
                    alt={instructor.name}
                    className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-indigo-700 text-white flex items-center justify-center text-4xl font-bold border-4 border-white">
                    {instructor.name.slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>
              <div className="text-center md:text-left">
                <h1 className="text-3xl font-bold">{instructor.name}</h1>
                <p className="text-indigo-100 mt-1">{instructor.headline || 'Instructor'}</p>

                {/* Rating */}
                <div className="flex items-center justify-center md:justify-start mt-2">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      i < fullStars ?
                        <FaStar key={i} className="text-yellow-400" /> :
                        (i === fullStars && hasHalfStar ?
                          <FaStar key={i} className="text-yellow-400" /> :
                          <FaRegStar key={i} className="text-yellow-400" />
                        )
                    ))}
                  </div>
                  <span className="ml-2 text-sm text-indigo-100">
                    {averageRating} ({instructor.totalRatings || 0} ratings)
                  </span>
                </div>

                {/* Stats */}
                <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-4 text-sm">
                  <div className="flex items-center">
                    <FaUsers className="mr-1" />
                    <span>{instructor.totalStudents || 0} students</span>
                  </div>
                  <div className="flex items-center">
                    <FaBookOpen className="mr-1" />
                    <span>{courses.length} courses</span>
                  </div>
                  <div className="flex items-center">
                    <FaGraduationCap className="mr-1" />
                    <span>{instructor.totalReviews || 0} reviews</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column */}
            <div className="lg:col-span-2">
              {/* About Section */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                <h2 className="text-xl font-bold mb-4">About Me</h2>
                <p className="text-gray-700 whitespace-pre-line">
                  {instructor.description || 'This instructor has not provided a description yet.'}
                </p>

                {/* Skills */}
                {instructor.skills?.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold mb-2">Skills & Expertise</h3>
                    <div className="flex flex-wrap gap-2">
                      {instructor.skills.map((skill, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Courses Section */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold">My Courses</h2>
                  <span className="text-sm text-gray-500">{courses.length} courses</span>
                </div>

                {courses.length > 0 ? (
                  <div className="space-y-4">
                    {courses.map(course => (
                      <div
                        key={course._id}
                        className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/viewcourse/${course._id}`)}
                      >
                        <div className="md:flex">
                          <div className="md:flex-shrink-0 md:w-48 h-32 bg-gray-200">
                            {course.thumbnail && (
                              <img
                                src={course.thumbnail}
                                alt={course.title}
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <div className="p-4 flex-1">
                            <h3 className="font-semibold text-lg text-gray-900">{course.title}</h3>
                            <p className="mt-1 text-sm text-gray-600 line-clamp-2">{course.description}</p>
                            <div className="mt-2 flex items-center text-sm text-gray-500">
                              <span className="flex items-center">
                                <FaUsers className="mr-1" />
                                {course.enrolledStudents?.length || 0} students
                              </span>
                              <span className="mx-2">•</span>
                              <span className="flex items-center">
                                <FaRegClock className="mr-1" />
                                {course.duration || 'N/A'}
                              </span>
                            </div>
                            <div className="mt-2">
                              <span className="px-2 py-1 text-xs bg-indigo-100 text-indigo-800 rounded-full">
                                {course.level}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FaBookOpen className="mx-auto text-4xl text-gray-300 mb-3" />
                    <p className="text-gray-500">No courses published yet</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column */}
            <div>
              {/* Contact & Info */}
              <div className="bg-white rounded-xl shadow-sm p-6 mb-6 sticky top-6">
                <h3 className="font-semibold mb-4">Instructor Information</h3>

                {instructor.website && (
                  <div className="flex items-center mb-3">
                    <FaGlobe className="text-gray-500 mr-3 w-5" />
                    <a
                      href={instructor.website.startsWith('http') ? instructor.website : `https://${instructor.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      {instructor.website.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                )}

                {instructor.linkedin && (
                  <div className="flex items-center mb-3">
                    <FaLinkedin className="text-blue-600 text-lg mr-3 w-5" />
                    <a
                      href={instructor.linkedin.startsWith('http') ? instructor.linkedin : `https://linkedin.com/in/${instructor.linkedin}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      LinkedIn Profile
                    </a>
                  </div>
                )}

                {instructor.github && (
                  <div className="flex items-center mb-3">
                    <FaGithub className="text-gray-700 text-lg mr-3 w-5" />
                    <a
                      href={instructor.github.startsWith('http') ? instructor.github : `https://github.com/${instructor.github}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      GitHub Profile
                    </a>
                  </div>
                )}

                {instructor.twitter && (
                  <div className="flex items-center mb-3">
                    <FaTwitter className="text-blue-400 text-lg mr-3 w-5" />
                    <a
                      href={instructor.twitter.startsWith('http') ? instructor.twitter : `https://twitter.com/${instructor.twitter}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline"
                    >
                      @{instructor.twitter.replace('@', '')}
                    </a>
                  </div>
                )}

                <div className="pt-4 mt-4 border-t border-gray-100">
                  <div className="flex items-center">
                    <FaCalendarAlt className="text-gray-500 mr-3 w-5" />
                    <div>
                      <p className="text-sm text-gray-500">Member since</p>
                      <p className="font-medium">
                        {new Date(instructor.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Stats Card */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold mb-4">Instructor Stats</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Students</p>
                    <p className="text-2xl font-bold">{instructor.totalStudents || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Courses</p>
                    <p className="text-2xl font-bold">{courses.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reviews</p>
                    <p className="text-2xl font-bold">{instructor.totalReviews || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Average Rating</p>
                    <div className="flex items-center">
                      <span className="text-2xl font-bold mr-2">{averageRating}</span>
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          i < fullStars ?
                            <FaStar key={i} className="text-yellow-400 text-sm" /> :
                            (i === fullStars && hasHalfStar ?
                              <FaStar key={i} className="text-yellow-400 text-sm" /> :
                              <FaRegStar key={i} className="text-yellow-400 text-sm" />
                            )
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
