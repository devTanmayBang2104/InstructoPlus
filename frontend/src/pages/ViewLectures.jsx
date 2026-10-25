import React, { useState, useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import {
  FaPlayCircle,
  FaRegClock,
  FaCheckCircle,
  FaRegCircle,
  FaChevronLeft,
  FaChevronRight,
  FaTrophy,
  FaStickyNote,
  FaBook,
} from "react-icons/fa";
import { FaArrowLeftLong, FaArrowRotateLeft } from "react-icons/fa6";
import { serverUrl } from "../App.jsx";
import LectureNotes from "../components/LectureNotes.jsx";

function ViewLecture() {
  const formatDuration = (duration) => {
    if (!duration) return "N/A";
    if (typeof duration === "number") {
      const mins = Math.floor(duration / 60);
      const secs = Math.round(duration % 60);
      return `${mins} min ${secs} sec`;
    }
    const str = String(duration).trim();
    if (str.startsWith("PT")) {
      const minMatch = str.match(/(\d+)M/);
      const secMatch = str.match(/(\d+)S/);
      const mins = minMatch ? parseInt(minMatch[1], 10) : 0;
      const secs = secMatch ? parseInt(secMatch[1], 10) : 0;
      return `${mins} min ${secs} sec`;
    }
    if (str.includes(":")) {
      const parts = str.split(":");
      const mins = parseInt(parts[0], 10) || 0;
      const secs = parseInt(parts[1], 10) || 0;
      return `${mins} min ${secs} sec`;
    }
    const num = parseFloat(str);
    if (!isNaN(num)) {
      const mins = Math.floor(num / 60);
      const secs = Math.round(num % 60);
      return `${mins} min ${secs} sec`;
    }
    return duration;
  };

  const formatSeconds = (seconds) => {
    if (!seconds || isNaN(seconds)) return "00:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const { courseId } = useParams();
  const { courseData } = useSelector((state) => state.course);
  const { userData } = useSelector((state) => state.user);
  const selectedCourse = courseData?.find((course) => course._id === courseId);
  const navigate = useNavigate();

  const [selectedLecture, setSelectedLecture] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [progressData, setProgressData] = useState({
    completedLectures: [],
    lectureProgress: [],
    lastWatchedLecture: null,
    isCompleted: false,
    completionPercentage: 0,
  });
  const [savedPlaybackTime, setSavedPlaybackTime] = useState(0);
  const [currentVideoTime, setCurrentVideoTime] = useState(0);
  const [loadingProgress, setLoadingProgress] = useState(true);
  const [rightPanelTab, setRightPanelTab] = useState("lectures"); // 'lectures' | 'notes'

  const videoRef = useRef(null);
  const lastSavedTimeRef = useRef(0);
  const hasResumedRef = useRef(false);

  // Fetch course progress from backend
  const fetchProgress = async () => {
    try {
      setLoadingProgress(true);
      const res = await axios.get(`${serverUrl}/api/progress/${courseId}`, {
        withCredentials: true,
      });

      if (res.data?.success && res.data.progress) {
        const prog = res.data.progress;
        setProgressData(prog);

        // Resume last watched lecture if available, otherwise default to first lecture
        if (selectedCourse?.lectures?.length > 0) {
          const lastId = prog.lastWatchedLecture?._id || prog.lastWatchedLecture;
          const targetLecture =
            selectedCourse.lectures.find(
              (l) => l._id?.toString() === lastId?.toString()
            ) || selectedCourse.lectures[0];

          setSelectedLecture((prev) => prev || targetLecture);

          // Get saved playback time for this lecture
          const lp = prog.lectureProgress?.find(
            (p) => p.lectureId?.toString() === targetLecture?._id?.toString()
          );
          if (lp?.currentTime) {
            setSavedPlaybackTime(lp.currentTime);
            setCurrentVideoTime(lp.currentTime);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching course progress:", err);
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchProgress();
    }
  }, [courseId]);

  // When courseData is loaded, ensure a selected lecture is chosen if not already
  useEffect(() => {
    if (selectedCourse?.lectures?.length > 0 && !selectedLecture) {
      setSelectedLecture(selectedCourse.lectures[0]);
    }
  }, [selectedCourse]);

  // When selectedLecture changes, update savedPlaybackTime and reset resume flag
  useEffect(() => {
    if (selectedLecture && progressData?.lectureProgress) {
      const lp = progressData.lectureProgress.find(
        (p) => p.lectureId?.toString() === selectedLecture._id?.toString()
      );
      const time = lp?.currentTime || 0;
      setSavedPlaybackTime(time);
      setCurrentVideoTime(time);
      lastSavedTimeRef.current = time;
      hasResumedRef.current = false;
    }
  }, [selectedLecture, progressData?.lectureProgress]);

  // Handle switching lectures
  const handleLectureSelect = (lecture) => {
    if (selectedLecture?._id === lecture._id) return;
    // Save current lecture time before switching if playing native video
    if (videoRef.current && selectedLecture) {
      savePlaybackTime(
        Math.floor(videoRef.current.currentTime),
        Math.floor(videoRef.current.duration || 0),
        false
      );
    }
    setSelectedLecture(lecture);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Seek video to specific timestamp (from notes / bookmarks)
  const handleSeekToTime = (timestamp) => {
    const time = Math.max(0, Number(timestamp) || 0);
    setCurrentVideoTime(time);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      videoRef.current.play().catch(() => {});
    } else if (selectedLecture?.isYoutubeVideo) {
      setSavedPlaybackTime(time);
    }
  };

  // Save playback time to backend (debounced / on pause / on end)
  const savePlaybackTime = async (currentTime, duration, autoMarkComplete = false) => {
    if (!selectedLecture) return;
    try {
      const res = await axios.post(
        `${serverUrl}/api/progress/${courseId}/update-time`,
        {
          lectureId: selectedLecture._id,
          currentTime,
          duration,
          autoMarkComplete,
        },
        { withCredentials: true }
      );

      if (res.data?.success && res.data.progress) {
        setProgressData(res.data.progress);
        if (autoMarkComplete) {
          toast.success("Lecture completed automatically! 🎉");
        }
      }
    } catch (err) {
      console.error("Error updating playback time:", err);
    }
  };

  // Video event handlers for native HTML5 video
  const handleLoadedMetadata = () => {
    if (videoRef.current && savedPlaybackTime > 0 && !hasResumedRef.current) {
      videoRef.current.currentTime = savedPlaybackTime;
      hasResumedRef.current = true;
    }
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = Math.floor(videoRef.current.currentTime);
    setCurrentVideoTime(current);
    const duration = Math.floor(videoRef.current.duration || 0);

    // Save every 8 seconds of continuous playback
    if (Math.abs(current - lastSavedTimeRef.current) >= 8) {
      lastSavedTimeRef.current = current;
      savePlaybackTime(current, duration, false);
    }
  };

  const handlePause = () => {
    if (!videoRef.current) return;
    const current = Math.floor(videoRef.current.currentTime);
    setCurrentVideoTime(current);
    const duration = Math.floor(videoRef.current.duration || 0);
    lastSavedTimeRef.current = current;
    savePlaybackTime(current, duration, false);
  };

  const handleEnded = () => {
    if (!videoRef.current) return;
    const duration = Math.floor(videoRef.current.duration || 0);
    savePlaybackTime(duration, duration, true);
  };

  // Toggle lecture completion manually
  const handleToggleComplete = async (lectureId, e) => {
    if (e) e.stopPropagation();
    try {
      const isCurrentlyCompleted = isLectureCompleted(lectureId);

      // Optimistic update
      setProgressData((prev) => {
        const idStr = lectureId.toString();
        const updatedCompleted = isCurrentlyCompleted
          ? prev.completedLectures.filter((id) => id.toString() !== idStr)
          : [...prev.completedLectures, lectureId];
        const total = selectedCourse?.lectures?.length || 1;
        const newPct = Math.min(100, Math.round((updatedCompleted.length / total) * 100));
        return {
          ...prev,
          completedLectures: updatedCompleted,
          completionPercentage: newPct,
          isCompleted: newPct === 100,
        };
      });

      const res = await axios.post(
        `${serverUrl}/api/progress/${courseId}/toggle-complete`,
        { lectureId },
        { withCredentials: true }
      );

      if (res.data?.success && res.data.progress) {
        setProgressData(res.data.progress);
        if (res.data.isCompleted) {
          toast.success("Marked as completed! 🏆");
        } else {
          toast.info("Marked as incomplete");
        }
      }
    } catch (err) {
      console.error("Error toggling completion:", err);
      toast.error("Failed to update lecture status");
      fetchProgress(); // Revert on failure
    }
  };

  // Reset progress
  const handleResetProgress = async () => {
    if (
      !window.confirm(
        "Are you sure you want to reset your progress for this course? This cannot be undone."
      )
    ) {
      return;
    }

    try {
      const res = await axios.post(
        `${serverUrl}/api/progress/${courseId}/reset`,
        {},
        { withCredentials: true }
      );

      if (res.data?.success && res.data.progress) {
        setProgressData(res.data.progress);
        setSavedPlaybackTime(0);
        setCurrentVideoTime(0);
        lastSavedTimeRef.current = 0;
        toast.success("Course progress reset successfully");
      }
    } catch (err) {
      console.error("Error resetting progress:", err);
      toast.error("Failed to reset progress");
    }
  };

  // Helper check if lecture is completed
  const isLectureCompleted = (lectureId) => {
    if (!progressData?.completedLectures) return false;
    const idStr = lectureId?.toString();
    return progressData.completedLectures.some(
      (id) => (id?._id || id)?.toString() === idStr
    );
  };

  if (!selectedCourse) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-slate-950">
        <p className="text-gray-600 dark:text-gray-300">Course not found</p>
      </div>
    );
  }

  const lectures = selectedCourse.lectures || [];
  const currentLectureIndex = selectedLecture
    ? lectures.findIndex((l) => l._id?.toString() === selectedLecture._id?.toString())
    : -1;

  const hasPrevious = currentLectureIndex > 0;
  const hasNext = currentLectureIndex >= 0 && currentLectureIndex < lectures.length - 1;

  const handlePreviousLecture = () => {
    if (hasPrevious) {
      handleLectureSelect(lectures[currentLectureIndex - 1]);
    }
  };

  const handleNextLecture = () => {
    if (hasNext) {
      handleLectureSelect(lectures[currentLectureIndex + 1]);
    }
  };

  const filteredLectures = lectures.filter((lecture) =>
    lecture.lectureTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const completedLecturesCount = progressData?.completedLectures?.length || 0;
  const totalLecturesCount = lectures.length;
  const completionPercentage = progressData?.completionPercentage || 0;
  const isSelectedCompleted = selectedLecture && isLectureCompleted(selectedLecture._id);

  // Helper to format YouTube URL with resume time
  const getYoutubeEmbedUrl = () => {
    if (!selectedLecture?.videoUrl) return "";
    const startSec = Math.floor(savedPlaybackTime);
    const separator = selectedLecture.videoUrl.includes("?") ? "&" : "?";
    return startSec > 0
      ? `${selectedLecture.videoUrl}${separator}start=${startSec}`
      : selectedLecture.videoUrl;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 p-4 md:p-6 flex flex-col transition-colors">
      {/* Top Navigation */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white transition"
        >
          <FaArrowLeftLong className="text-xl" />
          <span className="font-medium">Back to Courses</span>
        </button>

        {/* Course completion badge in header */}
        {completionPercentage === 100 && (
          <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold">
            <FaTrophy className="text-emerald-500" />
            <span>Course Completed!</span>
          </div>
        )}
      </div>

      <div className="flex flex-col lg:flex-row gap-6 flex-grow">
        {/* Left - Video & Course Info */}
        <div className="w-full lg:w-2/3 flex flex-col gap-6">
          {/* Video Player */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md overflow-hidden border border-gray-200 dark:border-slate-800 transition-colors">
            {selectedLecture?.videoUrl ? (
              selectedLecture.isYoutubeVideo ? (
                <div className="aspect-video bg-black relative">
                  <iframe
                    key={`${selectedLecture._id}-${savedPlaybackTime}`}
                    className="w-full h-full object-contain"
                    src={getYoutubeEmbedUrl()}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : (
                <div className="aspect-video bg-black relative">
                  <video
                    ref={videoRef}
                    key={selectedLecture._id}
                    src={selectedLecture.videoUrl}
                    controls
                    className="w-full h-full object-contain"
                    onLoadedMetadata={handleLoadedMetadata}
                    onTimeUpdate={handleTimeUpdate}
                    onPause={handlePause}
                    onEnded={handleEnded}
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

            {/* Video Controls & Progress Bar Strip */}
            {selectedLecture && (
              <div className="p-4 bg-gray-50 dark:bg-slate-800/80 border-t border-gray-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={handlePreviousLecture}
                    disabled={!hasPrevious}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      hasPrevious
                        ? "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600"
                        : "bg-gray-100 dark:bg-slate-800/50 text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-slate-800 cursor-not-allowed"
                    }`}
                  >
                    <FaChevronLeft className="text-xs" />
                    <span>Previous</span>
                  </button>

                  <button
                    onClick={handleNextLecture}
                    disabled={!hasNext}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                      hasNext
                        ? "bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-300 dark:border-slate-600"
                        : "bg-gray-100 dark:bg-slate-800/50 text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-slate-800 cursor-not-allowed"
                    }`}
                  >
                    <span>Next</span>
                    <FaChevronRight className="text-xs" />
                  </button>

                  {/* Quick Take Note shortcut button */}
                  <button
                    type="button"
                    id="quick-note-btn"
                    data-testid="quick-note-btn"
                    onClick={() => setRightPanelTab("notes")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900 transition cursor-pointer"
                    title="Take a note at current time"
                  >
                    <FaStickyNote className="text-xs" />
                    <span>Take Note ({formatSeconds(currentVideoTime)})</span>
                  </button>

                  {savedPlaybackTime > 5 && (
                    <span className="hidden sm:inline-block text-xs text-gray-500 dark:text-gray-400 bg-gray-200/80 dark:bg-slate-700 px-2 py-1 rounded">
                      Resumed at {formatSeconds(savedPlaybackTime)}
                    </span>
                  )}
                </div>

                {/* Mark as Complete Toggle Button */}
                <button
                  onClick={(e) => handleToggleComplete(selectedLecture._id, e)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm ${
                    isSelectedCompleted
                      ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white"
                  }`}
                >
                  <FaCheckCircle className="text-base" />
                  <span>
                    {isSelectedCompleted
                      ? "Completed (Click to Undo)"
                      : "Mark as Completed"}
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Lecture Details */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-6 border border-gray-200 dark:border-slate-800 transition-colors">
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                    {selectedLecture?.lectureTitle || "No Lecture Selected"}
                  </h2>
                  {isSelectedCompleted && (
                    <span className="px-2.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-full text-xs font-semibold flex items-center gap-1">
                      <FaCheckCircle className="text-xs" />
                      Completed
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-gray-600 dark:text-gray-400 text-sm">
                  <span className="flex items-center gap-1">
                    <FaRegClock className="text-gray-500 dark:text-gray-400" />
                    {selectedLecture?.duration
                      ? formatDuration(selectedLecture.duration)
                      : "N/A"}
                  </span>
                  {savedPlaybackTime > 0 && (
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                      Last watched at {formatSeconds(savedPlaybackTime)}
                    </span>
                  )}
                </div>
              </div>

              {selectedLecture?.resources?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
                    Resources
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedLecture.resources.map((resource, index) => (
                      <a
                        key={index}
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-md text-sm hover:bg-indigo-100 dark:hover:bg-indigo-900 transition"
                      >
                        {resource.name}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {selectedLecture?.documents?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">
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
                        className="px-3 py-1 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 rounded-md text-sm hover:bg-green-100 dark:hover:bg-green-900 transition flex items-center gap-1"
                      >
                        <span>{document.title || "Document"}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {selectedLecture?.description && (
              <div className="mt-6 pt-6 border-t border-gray-100 dark:border-slate-800">
                <h3 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
                  Description
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {selectedLecture.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right - Progress, Tabs (Lectures vs Notes) & Instructor */}
        <div className="w-full lg:w-1/3 flex flex-col gap-6">
          {/* Course Info & Progress Bar Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-5 border border-gray-200 dark:border-slate-800 transition-colors">
            <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">
              {selectedCourse.title}
            </h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 rounded-full text-xs font-medium">
                {selectedCourse.category}
              </span>
              <span className="px-2.5 py-1 bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 rounded-full text-xs font-medium">
                {selectedCourse.level}
              </span>
              <span className="px-2.5 py-1 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded-full text-xs font-medium">
                {totalLecturesCount} lectures
              </span>
            </div>

            {/* Progress Bar Widget */}
            <div className="pt-4 border-t border-gray-100 dark:border-slate-800">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Course Progress
                </span>
                <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                  {completedLecturesCount} of {totalLecturesCount} completed ({completionPercentage}%)
                </span>
              </div>

              <div className="w-full bg-gray-200 dark:bg-slate-800 rounded-full h-3 overflow-hidden">
                <div
                  className={`h-3 rounded-full transition-all duration-500 ${
                    completionPercentage === 100
                      ? "bg-emerald-500"
                      : "bg-gradient-to-r from-indigo-500 to-indigo-600"
                  }`}
                  style={{ width: `${completionPercentage}%` }}
                ></div>
              </div>

              {completionPercentage === 100 && (
                <div className="mt-3 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 flex items-center gap-2 text-emerald-800 dark:text-emerald-300 text-xs">
                  <FaTrophy className="text-base text-emerald-600 shrink-0" />
                  <span>
                    <strong>Congratulations!</strong> You have completed all lectures in this course.
                  </span>
                </div>
              )}

              {completionPercentage > 0 && (
                <div className="mt-3 flex justify-end">
                  <button
                    onClick={handleResetProgress}
                    className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 transition"
                  >
                    <FaArrowRotateLeft className="text-[10px]" />
                    <span>Reset Progress</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel Tab Switcher: Lectures vs Notes */}
          <div className="flex bg-gray-200/70 dark:bg-slate-800 p-1 rounded-xl gap-1">
            <button
              id="tab-lectures-btn"
              data-testid="tab-lectures-btn"
              onClick={() => setRightPanelTab("lectures")}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                rightPanelTab === "lectures"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <FaBook className="text-xs" />
              <span>Lectures ({totalLecturesCount})</span>
            </button>
            <button
              id="tab-notes-btn"
              data-testid="tab-notes-btn"
              onClick={() => setRightPanelTab("notes")}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition flex items-center justify-center gap-1.5 cursor-pointer ${
                rightPanelTab === "notes"
                  ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs"
                  : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              <FaStickyNote className="text-xs" />
              <span>Notes & Bookmarks</span>
            </button>
          </div>

          {/* Tab Content: Notes & Bookmarks Component OR Lectures List */}
          {rightPanelTab === "notes" ? (
            <LectureNotes
              courseId={courseId}
              selectedLecture={selectedLecture}
              currentVideoTime={currentVideoTime}
              onSeek={handleSeekToTime}
              onSwitchLecture={handleLectureSelect}
              courseTitle={selectedCourse.title}
            />
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-5 border border-gray-200 dark:border-slate-800 transition-colors">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                  Course Content
                </h2>
                <span className="text-xs font-medium bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                  {completedLecturesCount}/{totalLecturesCount} done
                </span>
              </div>

              <div className="mb-4">
                <input
                  type="text"
                  placeholder="Search lectures..."
                  className="w-full px-4 py-2 border border-gray-300 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-lg text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-indigo-300 outline-none transition"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="max-h-[500px] overflow-y-auto pr-1 flex flex-col gap-2.5">
                {filteredLectures.length > 0 ? (
                  filteredLectures.map((lecture, index) => {
                    const completed = isLectureCompleted(lecture._id);
                    const isCurrent = selectedLecture?._id === lecture._id;

                    return (
                      <div
                        key={lecture._id}
                        onClick={() => handleLectureSelect(lecture)}
                        className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isCurrent
                            ? "bg-indigo-50 dark:bg-indigo-950/60 border-indigo-400 dark:border-indigo-500 ring-1 ring-indigo-300 dark:ring-indigo-800 shadow-xs"
                            : completed
                            ? "bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50/80 dark:hover:bg-emerald-950/40"
                            : "border-gray-200 dark:border-slate-800 hover:bg-gray-50 dark:hover:bg-slate-800/60"
                        }`}
                      >
                        {/* Checkmark Button */}
                        <button
                          type="button"
                          onClick={(e) => handleToggleComplete(lecture._id, e)}
                          title={completed ? "Mark as Incomplete" : "Mark as Completed"}
                          className={`shrink-0 p-1 rounded-full transition-transform hover:scale-110 ${
                            completed
                              ? "text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                              : "text-gray-300 dark:text-gray-600 hover:text-indigo-600 dark:hover:text-indigo-400"
                          }`}
                        >
                          {completed ? (
                            <FaCheckCircle className="text-xl" />
                          ) : (
                            <FaRegCircle className="text-xl" />
                          )}
                        </button>

                        {/* Lecture Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 dark:text-gray-500 font-semibold">
                              {(index + 1).toString().padStart(2, "0")}
                            </span>
                            <h4
                              className={`text-sm font-semibold truncate ${
                                isCurrent
                                  ? "text-indigo-900 dark:text-indigo-300"
                                  : completed
                                  ? "text-gray-700 dark:text-gray-400 line-through opacity-80"
                                  : "text-gray-800 dark:text-gray-200"
                              }`}
                            >
                              {lecture.lectureTitle}
                            </h4>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <FaRegClock className="text-[10px]" />
                            <span>{formatDuration(lecture.duration)}</span>
                            {completed && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-medium ml-1">
                                • Done
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Play Indicator */}
                        <div className="shrink-0 text-gray-400 dark:text-gray-500">
                          {isCurrent ? (
                            <FaPlayCircle className="text-indigo-600 dark:text-indigo-400 text-lg animate-pulse" />
                          ) : (
                            <FaPlayCircle className="text-gray-300 dark:text-gray-600 hover:text-gray-500 text-lg" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No lectures found matching your search
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Instructor Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-md p-5 border border-gray-200 dark:border-slate-800 transition-colors">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
              Instructor
            </h3>
            <div className="flex items-start gap-4">
              <img
                onClick={() => navigate(`/user/${selectedCourse.creator?._id}`)}
                src={selectedCourse.creator?.photoUrl || "/default-avatar.png"}
                alt="Instructor"
                className="w-14 h-14 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-xs cursor-pointer"
              />
              <div>
                <h4 className="font-medium text-gray-800 dark:text-gray-100">
                  {selectedCourse.creator?.name || "Unknown Instructor"}
                </h4>
                <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">
                  {selectedCourse.creator?.description || "No bio available"}
                </p>
                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
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
