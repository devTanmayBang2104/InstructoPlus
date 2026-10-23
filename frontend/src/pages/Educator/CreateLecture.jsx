import axios from 'axios';
import React, { useEffect, useState, useRef, useContext } from 'react';
import { FaArrowLeft, FaCloudUploadAlt, FaYoutube, FaVideo, FaTimes, FaCheckCircle } from 'react-icons/fa';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { serverUrl } from '../../App';
import { ClipLoader } from 'react-spinners';
import { useDispatch, useSelector } from 'react-redux';
import { setLectureData } from '../../redux/lectureSlice';
import { motion } from 'framer-motion';
import { AnimationContext } from '../../App';

function CreateLecture() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const dispatch = useDispatch();
  const { lectureData } = useSelector(state => state.lecture);

  const [lectureTitle, setLectureTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [isPreviewFree, setIsPreviewFree] = useState(false);

  const [loading, setLoading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [loadingLectures, setLoadingLectures] = useState(true);

  const fileInputRef = useRef(null);
  const { fadeIn, slideIn } = useContext(AnimationContext);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("video/")) {
        toast.error("Please select a valid video file (.mp4, .mov, etc.)");
        return;
      }
      setVideoFile(file);
      setYoutubeUrl(""); // Clear YouTube URL if file is selected
    }
  };

  const handleRemoveFile = () => {
    setVideoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const createLectureHandler = async (e) => {
    if (e) e.preventDefault();
    if (!lectureTitle.trim()) {
      toast.error("Please enter a lecture title");
      return;
    }

    setLoading(true);
    setUploadPercent(0);

    try {
      const formData = new FormData();
      formData.append("lectureTitle", lectureTitle.trim());
      if (description.trim()) {
        formData.append("description", description.trim());
      }
      if (videoFile) {
        formData.append("video", videoFile);
      } else if (youtubeUrl.trim()) {
        formData.append("videoUrl", youtubeUrl.trim());
      }
      formData.append("isPreviewFree", isPreviewFree);

      const result = await axios.post(
        `${serverUrl}/api/course/createlecture/${courseId}`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          withCredentials: true,
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadPercent(percent);
            }
          },
        }
      );

      if (result.data.lectures) {
        dispatch(setLectureData([...(lectureData || []), ...result.data.lectures]));
      } else if (result.data.lecture) {
        dispatch(setLectureData([...(lectureData || []), result.data.lecture]));
      }

      toast.success("Lecture Created Successfully!");
      setLectureTitle("");
      setDescription("");
      setVideoFile(null);
      setYoutubeUrl("");
      setIsPreviewFree(false);
      setUploadPercent(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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
          `${serverUrl}/api/course/getlectures/${courseId}`,
          { withCredentials: true }
        );
        dispatch(setLectureData(result.data.course.lectures || []));
      } catch (error) {
        toast.error(error.response?.data?.message || "Error loading lectures");
      } finally {
        setLoadingLectures(false);
      }
    };
    getLecture();
  }, [courseId, dispatch]);

  return (
    <div className="min-h-screen bg-gray-100 pt-20 pb-12 flex items-center justify-center p-4">
      <motion.div
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 md:p-8"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <button
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 font-medium transition"
            onClick={() => navigate(`/courses`)}
          >
            <FaArrowLeft /> Back to Courses
          </button>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Create Lecture</h1>
        </div>

        <form onSubmit={createLectureHandler} className="space-y-5">
          {/* Lecture Title */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Lecture Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Introduction to MERN Stack"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              value={lectureTitle}
              onChange={(e) => setLectureTitle(e.target.value)}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">
              Description <span className="text-gray-400 font-normal">(Optional)</span>
            </label>
            <textarea
              placeholder="Brief overview of what students will learn in this lecture..."
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Video Section */}
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-4">
            <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <FaVideo className="text-indigo-600" /> Video Content (MP4 or YouTube)
            </h2>

            {/* MP4 File Upload */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">
                Upload MP4 File <span className="text-gray-400">(Saved to Cloudinary)</span>
              </label>

              {!videoFile ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-indigo-500 hover:bg-indigo-50/40 rounded-xl p-4 text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5"
                >
                  <FaCloudUploadAlt className="text-2xl text-indigo-500" />
                  <span className="text-sm font-medium text-gray-700">Click to select MP4 video</span>
                  <span className="text-xs text-gray-400">Supports .mp4, .mov, .webm</span>
                </div>
              ) : (
                <div className="flex items-center justify-between bg-white border border-green-300 p-3 rounded-xl shadow-xs">
                  <div className="flex items-center gap-2.5 truncate">
                    <FaCheckCircle className="text-green-500 shrink-0" />
                    <div className="truncate">
                      <p className="text-sm font-medium text-gray-800 truncate">{videoFile.name}</p>
                      <p className="text-xs text-gray-500">{(videoFile.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="Remove selected video"
                  >
                    <FaTimes />
                  </button>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="video/mp4,video/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {/* Divider */}
            <div className="relative flex items-center justify-center">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink mx-3 text-xs font-medium text-gray-400 uppercase">OR</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* YouTube Link */}
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5 flex items-center gap-1">
                <FaYoutube className="text-red-500" /> Paste YouTube Video or Playlist URL
              </label>
              <input
                type="text"
                placeholder="e.g. https://www.youtube.com/watch?v=... or playlist link"
                className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                value={youtubeUrl}
                onChange={(e) => {
                  setYoutubeUrl(e.target.value);
                  if (videoFile) handleRemoveFile();
                }}
              />
            </div>

            {/* Free Preview Checkbox */}
            <div className="flex items-center gap-2.5 pt-1">
              <input
                id="freePreview"
                type="checkbox"
                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                checked={isPreviewFree}
                onChange={(e) => setIsPreviewFree(e.target.checked)}
              />
              <label htmlFor="freePreview" className="text-xs md:text-sm text-gray-700 cursor-pointer select-none">
                Allow free preview (non-enrolled students can watch this lecture)
              </label>
            </div>
          </div>

          {/* Upload Progress Bar if uploading */}
          {loading && videoFile && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-indigo-700 font-medium">
                <span>Uploading video to Cloudinary...</span>
                <span>{uploadPercent}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadPercent}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Form Action Buttons */}
          <div className="flex gap-4 pt-2">
            <button
              type="button"
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition flex-1"
              onClick={() => navigate(`/editcourses/${courseId}`)}
            >
              Back to Course
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition shadow-md flex-1 disabled:opacity-60 flex items-center justify-center gap-2"
              disabled={!lectureTitle.trim() || loading}
            >
              {loading ? (
                <>
                  <ClipLoader size={18} color="white" />
                  <span>{videoFile ? "Uploading Video..." : "Creating..."}</span>
                </>
              ) : (
                "Create Lecture"
              )}
            </button>
          </div>
        </form>

        {/* Existing Lectures List */}
        <div className="pt-8 border-t border-gray-200 mt-8">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Course Lectures</h2>

          {loadingLectures ? (
            <div className="flex justify-center py-6">
              <ClipLoader size={26} color="#4f46e5" />
            </div>
          ) : lectureData?.length > 0 ? (
            <motion.div
              className="space-y-2.5 max-h-72 overflow-y-auto pr-1"
              variants={slideIn}
              initial="hidden"
              animate="visible"
            >
              {lectureData.map((lecture, index) => (
                <motion.div
                  key={lecture._id}
                  variants={fadeIn}
                  className="flex justify-between items-center bg-gray-50 hover:bg-gray-100 p-3.5 rounded-xl border border-gray-200 transition"
                >
                  <div className="truncate mr-3">
                    <p className="font-medium text-gray-800 text-sm truncate">
                      {index + 1}. {lecture.lectureTitle}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                      {lecture.isYoutubeVideo ? (
                        <span className="text-red-600 flex items-center gap-1 font-medium">
                          <FaYoutube /> YouTube
                        </span>
                      ) : lecture.videoUrl ? (
                        <span className="text-indigo-600 flex items-center gap-1 font-medium">
                          <FaVideo /> MP4 Upload
                        </span>
                      ) : (
                        <span className="text-gray-400">No video attached</span>
                      )}
                      {lecture.isPreviewFree && (
                        <span className="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[11px] font-medium">
                          Free Preview
                        </span>
                      )}
                    </div>
                  </div>
                  <button
                    className="text-xs md:text-sm font-semibold text-indigo-600 hover:text-indigo-800 px-3 py-1.5 rounded-lg hover:bg-indigo-50 transition"
                    onClick={() => navigate(`/editlecture/${courseId}/${lecture._id}`)}
                  >
                    Edit
                  </button>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-6 text-gray-500 text-sm">
              No lectures yet. Add your first lecture above.
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default CreateLecture;
