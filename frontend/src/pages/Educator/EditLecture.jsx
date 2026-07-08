import axios from 'axios'
import React, { useState } from 'react'
import { FaArrowLeft, FaDownload, FaTrash } from "react-icons/fa"
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { serverUrl } from '../../App'
import { setLectureData } from '../../redux/lectureSlice'
import { toast } from 'react-toastify'
import { ClipLoader } from 'react-spinners'
import { motion } from 'framer-motion';
import { AnimationContext } from '../../App';
import { useContext } from 'react';
import Nav from '../../components/Nav'

function EditLecture() {
  const [loading, setLoading] = useState('');
  const [loadingDelete, setLoadingDelete] = useState(false);
  const { courseId, lectureId } = useParams();
  const { lectureData } = useSelector(state => state.lecture);
  const dispatch = useDispatch();
  const selectedLecture = lectureData.find(lecture => lecture._id === lectureId);
  const [videoFile, setVideoFile] = useState(null); // For Cloudinary uploads
  const [youtubeLink, setYoutubeLink] = useState(selectedLecture?.isYoutubeVideo ? selectedLecture.videoUrl : ""); // For YouTube links
  const [lectureTitle, setLectureTitle] = useState(selectedLecture?.lectureTitle || "");
  const [description, setDescription] = useState(selectedLecture?.description || '');
  const [documents, setDocuments] = useState(selectedLecture?.documents || []);
  const [newDocuments, setNewDocuments] = useState([]);
  const [removeVideo, setRemoveVideo] = useState(false);
  const [removeDocuments, setRemoveDocuments] = useState([]);
  const [isPreviewFree, setIsPreviewFree] = useState(selectedLecture?.isPreviewFree || false);
  const navigate = useNavigate();
  const { fadeIn } = useContext(AnimationContext);

  const handleRemoveDocument = (docId) => {
    setDocuments(documents.filter(doc => doc._id !== docId));
    setRemoveDocuments([...removeDocuments, docId]);
  };

  const handleAddDocument = () => {
    setNewDocuments([...newDocuments, { title: '', description: '', file: null }]);
  };

  const handleNewDocumentChange = (index, field, value) => {
    const updatedDocuments = [...newDocuments];
    updatedDocuments[index][field] = value;
    setNewDocuments(updatedDocuments);
  };

  const formData = new FormData();
  formData.append("lectureTitle", lectureTitle);
  formData.append("description", description);
  if (videoFile) {
    formData.append("videoUrl", videoFile); // Send file for Cloudinary
  } else if (youtubeLink) {
    formData.append("videoUrl", youtubeLink); // Send YouTube URL
  }
  formData.append("removeVideo", removeVideo);
  formData.append("removeDocuments", JSON.stringify(removeDocuments));
  formData.append("isPreviewFree", isPreviewFree);

  const documentInfos = [];
  newDocuments.forEach((doc) => {
    if (doc.file) {
      formData.append(`documents`, doc.file);
      documentInfos.push({ title: doc.title, description: doc.description });
    }
  });

  if (documentInfos.length > 0) {
    formData.append('documentInfos', JSON.stringify(documentInfos));
  }

  const editLecture = async () => {
    setLoading('Saving changes...');
    try {
      const result = await axios.post(
        serverUrl + `/api/course/editlecture/${lectureId}`,
        formData,
        { withCredentials: true }
      );

      // Update lecture data in store
      const updatedLectures = lectureData.map(lecture =>
        lecture._id === lectureId ? result.data.lecture : lecture
      );

      dispatch(setLectureData(updatedLectures));
      toast.success("Lecture Updated");
      navigate(`/createlecture/${courseId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error updating lecture");
    } finally {
      setLoading('');
    }
  }

  const removeLecture = async () => {
    setLoadingDelete(true);
    try {
      await axios.delete(
        serverUrl + `/api/course/removelecture/${lectureId}`,
        { withCredentials: true }
      );
      toast.success("Lecture Removed");
      const updatedLectures = lectureData.filter(lecture => lecture._id !== lectureId);
      dispatch(setLectureData(updatedLectures));
      navigate(`/createlecture/${courseId}`);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error removing lecture");
    } finally {
      setLoadingDelete(false);
    }
  }

  if (!selectedLecture) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <ClipLoader size={40} color="#4f46e5" />
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">

      <motion.div
        className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-8 mt-20"
        variants={fadeIn}
        initial="hidden"
        animate="visible"
      >
        <div className="flex justify-between items-center mb-8">
          <button
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800"
            onClick={() => navigate(`/createlecture/${courseId}`)}
          >
            <FaArrowLeft /> Back to Lectures
          </button>
          <h1 className="text-xl font-bold text-gray-800">Edit Lecture</h1>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition flex items-center gap-2"
            onClick={removeLecture}
            disabled={loadingDelete}
          >
            {loadingDelete ? <ClipLoader size={16} color="white" /> : <><FaTrash /> Delete</>}
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Lecture Title</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Lecture title"
              value={lectureTitle}
              onChange={(e) => setLectureTitle(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent min-h-[100px]"
              placeholder="Lecture description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Video Section */}
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-gray-800">Video Content</h2>

              {selectedLecture.videoUrl && !removeVideo && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Current video:</p>
                  {selectedLecture.isYoutubeVideo ? (
                    <iframe
                      className="w-full aspect-video rounded-xl"
                      src={selectedLecture.videoUrl}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video
                      src={selectedLecture.videoUrl}
                      controls
                      className="w-full rounded-xl"
                    ></video>
                  )}
                  <button
                    onClick={() => {
                      setRemoveVideo(true);
                      setVideoFile(null);
                      setYoutubeLink("");
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition text-sm flex items-center gap-2"
                  >
                    <FaTrash size={12} /> Remove Video
                  </button>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedLecture.videoUrl && !removeVideo ? "Replace with YouTube URL" : "YouTube Video URL (Optional)"}
                </label>
                <input
                  type="text"
                  placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  value={youtubeLink}
                  onChange={(e) => {
                    setYoutubeLink(e.target.value);
                    setVideoFile(null); // Clear file input if YouTube link is being entered
                    setRemoveVideo(false); // If a new link is provided, don't remove
                  }}
                />
              </div>

              <div className="relative flex py-5 items-center">
                <div className="flex-grow border-t border-gray-300"></div>
                <span className="flex-shrink mx-4 text-gray-400 text-sm">OR</span>
                <div className="flex-grow border-t border-gray-300"></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {selectedLecture.videoUrl && !removeVideo ? "Replace with File Upload" : "Upload Video File (Optional)"}
                </label>
                <input
                  type="file"
                  accept="video/*"
                  className="w-full border border-gray-300 rounded-xl p-2 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:bg-indigo-600 file:text-white hover:file:bg-indigo-700"
                  onChange={(e) => {
                    setVideoFile(e.target.files[0]);
                    setYoutubeLink(""); // Clear YouTube link if file is being uploaded
                    setRemoveVideo(false); // If a new file is provided, don't remove
                  }}
                />
              </div>

              <div className="flex items-center gap-3 mt-4">
                <input
                  id="isFree"
                  type="checkbox"
                  className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                  checked={isPreviewFree}
                  onChange={() => setIsPreviewFree(!isPreviewFree)}
                />
                <label htmlFor="isFree" className="text-sm text-gray-700">Allow free preview</label>
              </div>
            </div>

            {/* Documents Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium text-gray-800">Documents</h2>
                <button
                  onClick={handleAddDocument}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition text-sm"
                >
                  + Add Document
                </button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {documents.map((doc) => (
                  <div key={doc._id} className="border p-4 rounded-xl flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{doc.title}</h3>
                      <p className="text-sm text-gray-600">{doc.description}</p>
                      <a
                        href={doc.url}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 text-sm flex items-center gap-1 mt-2"
                      >
                        <FaDownload size={12} /> Download
                      </a>
                    </div>
                    <button
                      onClick={() => handleRemoveDocument(doc._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}

                {newDocuments.map((doc, index) => (
                  <div key={index} className="border p-4 rounded-xl">
                    <input
                      type="text"
                      className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg"
                      placeholder="Document title"
                      value={doc.title}
                      onChange={(e) => handleNewDocumentChange(index, 'title', e.target.value)}
                    />
                    <textarea
                      className="w-full px-3 py-2 mb-2 border border-gray-300 rounded-lg"
                      placeholder="Document description"
                      value={doc.description}
                      onChange={(e) => handleNewDocumentChange(index, 'description', e.target.value)}
                    />
                    <input
                      type="file"
                      className="w-full border border-gray-300 rounded-lg p-2"
                      onChange={(e) => handleNewDocumentChange(index, 'file', e.target.files[0])}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {loading && (
            <div className="text-center py-4 text-indigo-600">
              {loading} Please wait...
            </div>
          )}

          <button
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
            onClick={editLecture}
            disabled={!!loading}
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
    </>
  )
}

export default EditLecture
