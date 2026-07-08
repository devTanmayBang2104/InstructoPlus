import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { FaPlayCircle, FaRegClock, FaCheckCircle } from "react-icons/fa";
import { FaArrowLeftLong } from "react-icons/fa6";
import ReactPlayer from "react-player";

function ViewLecture() {
  const { courseId } = useParams();
  const { courseData } = useSelector((state) => state.course);
  const { userData } = useSelector((state) => state.user);
  const selectedCourse = courseData?.find((course) => course._id === courseId);
  // console.log(selectedCourse);


  const [selectedLecture, setSelectedLecture] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  // Initialize selected lecture
  useEffect(() => {
    if (selectedCourse?.lectures?.length > 0) {
      setSelectedLecture(selectedCourse.lectures[0]);
      // console.log(selectedCourse.lectures);

    }
  }, [courseId, selectedCourse]);

  // Handle lecture selection
  const handleLectureSelect = (lecture) => {
    setSelectedLecture(lecture);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Filter lectures based on search term
  const filteredLectures =
    selectedCourse?.lectures?.filter((lecture) =>
      lecture.lectureTitle.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  if (!selectedCourse) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Course Not Found
          </h1>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
          >
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 flex flex-col">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 hover:text-black transition"
        >
          <FaArrowLeftLong className="text-xl" />
          <span className="font-medium">Back to Courses</span>
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow">
        {/* Left - Video & Course Info */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          {/* Video Player */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
            {selectedLecture?.videoUrl ? (
              selectedLecture.isYoutubeVideo ? (
                <div className="aspect-video bg-black">
                  <iframe
                    className="w-full h-full object-contain"
                    src={selectedLecture.videoUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="aspect-video bg-black">
                  <video
                    src={selectedLecture.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                  />
                </div>
              )
            ) : (
              <div className="aspect-video bg-gray-900 flex items-center justify-center">
                <div className="text-center text-white p-6">
                  <FaPlayCircle className="text-4xl mx-auto mb-3" />
                  <h3 className="text-xl font-medium">
                    Select a lecture to start watching
                  </h3>
                </div>
              </div>
            )}
          </div>

          {/* Lecture Details */}
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-200">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-2">
                  {selectedLecture?.lectureTitle || "No Lecture Selected"}
                </h2>
                <div className="flex items-center gap-3 text-gray-600 text-sm">
                  <span className="flex items-center gap-1">
                    <FaRegClock className="text-gray-500" />
                    {selectedLecture?.duration ? `${Math.floor(selectedLecture.duration / 60)} min ${Math.round(selectedLecture.duration % 60)} sec` : "N/A"}
                  </span>
                </div>
              </div>

              {selectedLecture?.resources?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Resources
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedLecture.resources.map((resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-md text-sm hover:bg-indigo-100 transition"
                      >
                        {resource.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedLecture?.documents?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2">
                    Documents
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedLecture.documents.map((document, index) => (
                      <a
                        key={index}
                        href={document.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={document.title || "document"}
                        className="px-3 py-1 bg-green-50 text-green-700 rounded-md text-sm hover:bg-green-100 transition flex items-center gap-1"
                      >
                        <span>{document.title || "Document"}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedLecture?.description && (
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="font-semibold text-gray-700 mb-3">
                  Description
                </h3>
                <p className="text-gray-600">{selectedLecture.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Right - Lectures List & Instructor */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          {/* Course Info Card */}
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
            <h1 className="text-xl font-bold text-gray-800 mb-3">
              {selectedCourse.title}
            </h1>
            <div className="flex flex-wrap gap-3 mb-4">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                {selectedCourse.category}
              </span>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
                {selectedCourse.level}
              </span>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm">
                {selectedCourse.lectures?.length || 0} lectures
              </span>
            </div>
          </div>

          {/* Lectures List */}
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-800">
                Course Content
              </h2>
              <span className="text-sm text-gray-600">
                {selectedCourse.lectures?.length} lectures
              </span>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Search lectures..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-300 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-[500px] overflow-y-auto pr-2">
              {filteredLectures.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {filteredLectures.map((lecture, index) => (
                    <div
                      key={lecture._id}
                      className={`p-3 rounded-lg border transition-all cursor-pointer ${
                        selectedLecture?._id === lecture._id
                          ? "bg-indigo-50 border-indigo-300"
                          : "border-gray-200 hover:bg-gray-50"
                      }`}
                      onClick={() => handleLectureSelect(lecture)}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-500 text-sm">
                              {(index + 1).toString().padStart(2, "0")}
                            </span>
                            <h4 className="font-medium text-gray-800">
                              {lecture.lectureTitle}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-gray-500 text-sm mt-1">
                            <FaRegClock className="text-xs" />
                            <span>{lecture.duration ? `${Math.floor(lecture.duration / 60)} min ${Math.round(lecture.duration % 60)} sec` : "N/A"}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <FaPlayCircle className="text-gray-500" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No lectures found matching your search
                </div>
              )}
            </div>
          </div>

          {/* Instructor Card */}
          <div className="bg-white rounded-xl shadow-md p-5 border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Instructor
            </h3>
            <div className="flex items-start gap-4">
              <img
                onClick={() => navigate(`/user/${selectedCourse.creator?._id}`)}
                src={selectedCourse.creator?.photoUrl || "/default-avatar.png"}
                alt="Instructor"
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
              />
              <div>
                <h4 className="font-medium text-gray-800">
                  {selectedCourse.creator?.name || "Unknown Instructor"}
                </h4>
                <p className="text-gray-600 text-sm mt-1">
                  {selectedCourse.creator?.description || "No bio available"}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  {selectedCourse.creator?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewLecture;
