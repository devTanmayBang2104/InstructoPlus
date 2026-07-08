import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { FaArrowLeft } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App';
import { ClipLoader } from 'react-spinners';
import { useDispatch, useSelector } from 'react-redux';
import { setLectureData } from '../../redux/lectureSlice';
import { motion } from 'framer-motion';
import { AnimationContext } from '../../App';
import { useContext } from 'react';
import Nav from '../../components/Nav';

function CreateLecture() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [lectureTitle, setLectureTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();
  const { lectureData } = useSelector(state => state.lecture);
  const [loadingLectures, setLoadingLectures] = useState(true);
  const { fadeIn, slideIn } = useContext(AnimationContext);

  const createLectureHandler = async () => {
    setLoading(true);
    try {
      const result = await axios.post(
        serverUrl + `/api/course/createlecture/${courseId}`,
        { lectureTitle, videoUrl: lectureTitle.startsWith('http') ? lectureTitle : undefined }, // Assuming lectureTitle can be a URL
        { withCredentials: true }
      );
      if (result.data.lectures) { // If multiple lectures (e.g., from a playlist)
        dispatch(setLectureData([...lectureData, ...result.data.lectures]));
      } else if (result.data.lecture) { // If a single lecture
        dispatch(setLectureData([...lectureData, result.data.lecture]));
      }
      toast.success("Lecture Created");
      setLectureTitle("");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error creating lecture");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const getLecture = async () => {
      try {
        const result = await axios.get(
          serverUrl + `/api/course/getlectures/${courseId}`,
          { withCredentials: true }
        );
        dispatch(setLectureData(result.data.course.lectures));
      } catch (error) {
        toast.error(error.response?.data?.message || "Error loading lectures");
      } finally {
        setLoadingLectures(false);
      }
    };
    getLecture();
  }, [courseId]);

  return (
    <>
    <div className="min-h-screen bg-gray-100 pt-20 flex items-center justify-center p-4">

      <motion.div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <div className="flex justify-between items-center mb-8">
          <button
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            onClick={() => navigate(`/courses`)}
          >
            <FaArrowLeft /> Back to Courses
          </button>
          <h1 className="text-xl font-bold text-gray-800">Create Lecture</h1>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lecture Title</label>
            <input
              type="text"
              placeholder="e.g. Introduction to Mern Stack"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              value={lectureTitle}
              onChange={(e) => setLectureTitle(e.target.value)}
            />
          </div>

          <div className="flex gap-4">
            <button
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition flex-1"
              onClick={() => navigate(`/editcourses/${courseId}`)}
            >
              Back to Course
            </button>
            <button
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition shadow-md flex-1 disabled:opacity-70"
              disabled={!lectureTitle || loading}
              onClick={createLectureHandler}
            >
              {loading ? <ClipLoader size={20} color="white" /> : "Create Lecture"}
            </button>
          </div>

          <div className="pt-6">
            <h2 className="text-lg font-medium text-gray-800 mb-4">Lecture List</h2>

            {loadingLectures ? (
              <div className="flex justify-center py-8">
                <ClipLoader size={30} color="#4f46e5" />
              </div>
            ) : lectureData?.length > 0 ? (
              <motion.div
                className="space-y-3"
                variants={slideIn}
                initial="hidden"
                animate="visible"
              >
                {lectureData.map((lecture, index) => (
                  <motion.div
                    key={lecture._id}
                    variants={fadeIn}
                    className="flex justify-between items-center bg-gray-50 p-4 rounded-xl border border-gray-200"
                  >
                    <div>
                      <h3 className="font-medium">Lecture {index + 1}: {lecture.lectureTitle}</h3>
                    </div>
                    <button
                      className="text-indigo-600 hover:text-indigo-800"
                      onClick={() => navigate(`/editlecture/${courseId}/${lecture._id}`)}
                    >
                      Edit
                    </button>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No lectures yet. Create your first lecture above.
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
    </>
  );
}

export default CreateLecture;
