import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUser } from 'react-icons/fa';
import axios from 'axios';
import { serverUrl } from '../../App';
import Nav from '../../components/Nav';
import { toast } from 'react-toastify';

function EnrolledStudents() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const getEnrolledStudents = async () => {
      try {
        const response = await axios.get(`${serverUrl}/api/course/enrolledstudents/${courseId}`, { withCredentials: true });
        setStudents(response.data.enrolledStudents);
        setCourse(response.data.course);
      } catch (error) {
        toast.error("Error while getting enrolled students");
      } finally {
        setLoading(false);
      }
    };
    getEnrolledStudents();
  }, [courseId]);

  const handleStudentClick = (studentId) => {
    navigate(`/user/${studentId}`);
  };

  return (
    <>
   
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <FaArrowLeft
              className="text-gray-600 cursor-pointer"
              onClick={() => navigate("/dashboard")}
            />
            <h1 className="text-2xl font-bold text-gray-800">Enrolled Students</h1>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-md p-6">
              {course && (
                <div className="mb-6 p-4 bg-indigo-50 rounded-xl">
                  <h2 className="text-xl font-bold text-gray-800">{course.title}</h2>
                  <p className="text-gray-600">{course.subTitle}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                      {course.category}
                    </span>
                    <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                      {students.length} students enrolled
                    </span>
                  </div>
                </div>
              )}

              {students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Student
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {students.map((student) => (
                        <tr
                          key={student._id}
                          className="hover:bg-gray-50 cursor-pointer transition-colors"
                          onClick={() => handleStudentClick(student._id)}
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {student.photoUrl ? (
                                  <img className="h-10 w-10 rounded-full" src={student.photoUrl} alt={student.name} />
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                                    <FaUser className="text-indigo-500" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 hover:text-indigo-600 transition-colors">
                                  {student.name}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-10">
                  <div className="text-5xl mb-4">👨‍🎓</div>
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No students enrolled yet</h3>
                  <p className="text-gray-500">Share your course to get students enrolled</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default EnrolledStudents;
