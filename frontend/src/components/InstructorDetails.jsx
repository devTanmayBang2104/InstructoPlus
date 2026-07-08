import React from 'react';
import { Link } from 'react-router-dom';
import { FaChalkboardTeacher, FaBook, FaStar } from 'react-icons/fa';

const InstructorDetails = ({ instructor, courses }) => {
  if (!instructor) return null;

  // Filter out the current course if it's in the list
  const otherCourses = courses.filter(course => course._id !== instructor._id);

  return (
    <div className="space-y-8">
      {/* Instructor Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
            {instructor.avatar ? (
              <img
                src={instructor.avatar}
                alt={instructor.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <FaChalkboardTeacher className="w-8 h-8 text-indigo-500" />
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{instructor.name}</h3>
            <p className="text-gray-600 mt-1">{instructor.title || 'Instructor'}</p>

            <div className="flex items-center mt-2">
              <div className="flex text-yellow-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <FaStar
                    key={star}
                    className={`w-4 h-4 ${star <= (instructor.rating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                  />
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {instructor.rating?.toFixed(1) || 'No ratings yet'}
              </span>
              <span className="mx-2 text-gray-300">•</span>
              <span className="text-sm text-gray-600">
                {instructor.studentsCount || 0} students
              </span>
            </div>

            {instructor.bio && (
              <p className="mt-3 text-gray-600 text-sm">
                {instructor.bio}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Other Courses by Instructor */}
      {otherCourses.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <FaBook className="mr-2 text-indigo-500" />
            Other Courses by {instructor.name.split(' ')[0]}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {otherCourses.slice(0, 4).map((course) => (
              <Link
                key={course._id}
                to={`/course/${course._id}`}
                className="group block"
              >
                <div className="flex items-center p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="w-16 h-16 rounded-md bg-gray-100 overflow-hidden flex-shrink-0">
                    {course.thumbnail ? (
                      <img
                        src={course.thumbnail}
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-50 flex items-center justify-center">
                        <FaBook className="text-indigo-300" />
                      </div>
                    )}
                  </div>
                  <div className="ml-3 overflow-hidden">
                    <h4 className="text-sm font-medium text-gray-900 truncate group-hover:text-indigo-600">
                      {course.title}
                    </h4>
                    <div className="flex items-center mt-1">
                      <div className="flex text-yellow-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <FaStar
                            key={star}
                            className={`w-3 h-3 ${star <= (course.rating || 0) ? 'text-yellow-400' : 'text-gray-200'}`}
                          />
                        ))}
                      </div>
                      <span className="ml-1 text-xs text-gray-500">
                        ({course.reviewCount || 0})
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 mt-1">
                      ${course.price || 'Free'}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
          {otherCourses.length > 4 && (
            <div className="text-center mt-4">
              <button className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                View all {otherCourses.length} courses →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InstructorDetails;
