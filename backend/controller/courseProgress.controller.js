import CourseProgress from "../model/courseProgress.Model.js";
import Course from "../model/course.Model.js";

// Helper to calculate completion percentage and isCompleted status
const calculateProgress = (completedLectures, totalLecturesCount) => {
  if (!totalLecturesCount || totalLecturesCount === 0) {
    return { percentage: 0, isCompleted: false };
  }
  const percentage = Math.min(
    100,
    Math.round((completedLectures.length / totalLecturesCount) * 100)
  );
  return {
    percentage,
    isCompleted: percentage === 100 && completedLectures.length >= totalLecturesCount,
  };
};

// 1. Get Course Progress for a user
export const getCourseProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;

    const course = await Course.findById(courseId).select("lectures title");
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let progress = await CourseProgress.findOne({ userId, courseId });

    if (!progress) {
      // Create initial progress record
      progress = await CourseProgress.create({
        userId,
        courseId,
        completedLectures: [],
        lectureProgress: [],
        lastWatchedLecture: course.lectures.length > 0 ? course.lectures[0] : null,
        isCompleted: false,
        completionPercentage: 0,
      });
    } else {
      // Verify completedLectures against current course lectures (to filter deleted lectures)
      const validLectureIdStrings = new Set(
        course.lectures.map((id) => id.toString())
      );
      const filteredCompleted = progress.completedLectures.filter((id) =>
        validLectureIdStrings.has(id.toString())
      );

      const { percentage, isCompleted } = calculateProgress(
        filteredCompleted,
        course.lectures.length
      );

      if (
        progress.completionPercentage !== percentage ||
        progress.isCompleted !== isCompleted ||
        filteredCompleted.length !== progress.completedLectures.length
      ) {
        progress.completedLectures = filteredCompleted;
        progress.completionPercentage = percentage;
        progress.isCompleted = isCompleted;
        await progress.save();
      }
    }

    return res.status(200).json({
      success: true,
      progress,
      totalLectures: course.lectures.length,
    });
  } catch (error) {
    console.error("Error in getCourseProgress:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching course progress",
      error: error.message,
    });
  }
};

// 2. Toggle lecture completion (complete / incomplete)
export const toggleLectureComplete = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;
    const { lectureId } = req.body;

    if (!lectureId) {
      return res.status(400).json({
        success: false,
        message: "lectureId is required",
      });
    }

    const course = await Course.findById(courseId).select("lectures");
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let progress = await CourseProgress.findOne({ userId, courseId });

    if (!progress) {
      progress = new CourseProgress({
        userId,
        courseId,
        completedLectures: [],
        lectureProgress: [],
        lastWatchedLecture: lectureId,
      });
    }

    const lectureIdStr = lectureId.toString();
    const isAlreadyCompleted = progress.completedLectures.some(
      (id) => id.toString() === lectureIdStr
    );

    // Toggle completion status
    if (isAlreadyCompleted) {
      progress.completedLectures = progress.completedLectures.filter(
        (id) => id.toString() !== lectureIdStr
      );
    } else {
      progress.completedLectures.push(lectureId);
    }

    // Update lectureProgress entry
    const existingIndex = progress.lectureProgress.findIndex(
      (lp) => lp.lectureId.toString() === lectureIdStr
    );

    const now = new Date();
    if (existingIndex > -1) {
      progress.lectureProgress[existingIndex].isCompleted = !isAlreadyCompleted;
      if (!isAlreadyCompleted) {
        progress.lectureProgress[existingIndex].completedAt = now;
      }
    } else {
      progress.lectureProgress.push({
        lectureId,
        isCompleted: !isAlreadyCompleted,
        currentTime: 0,
        completedAt: !isAlreadyCompleted ? now : null,
      });
    }

    progress.lastWatchedLecture = lectureId;

    const { percentage, isCompleted } = calculateProgress(
      progress.completedLectures,
      course.lectures.length
    );
    progress.completionPercentage = percentage;
    progress.isCompleted = isCompleted;

    await progress.save();

    return res.status(200).json({
      success: true,
      message: !isAlreadyCompleted
        ? "Lecture marked as completed"
        : "Lecture marked as incomplete",
      progress,
      isLectureCompleted: !isAlreadyCompleted,
      totalLectures: course.lectures.length,
    });
  } catch (error) {
    console.error("Error in toggleLectureComplete:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating lecture completion status",
      error: error.message,
    });
  }
};

// 3. Update video playback timestamp (Resume Playback)
export const updateLecturePlaybackTime = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;
    const { lectureId, currentTime, duration, autoMarkComplete } = req.body;

    if (!lectureId || typeof currentTime === "undefined") {
      return res.status(400).json({
        success: false,
        message: "lectureId and currentTime are required",
      });
    }

    const course = await Course.findById(courseId).select("lectures");
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    let progress = await CourseProgress.findOne({ userId, courseId });
    if (!progress) {
      progress = new CourseProgress({
        userId,
        courseId,
        completedLectures: [],
        lectureProgress: [],
      });
    }

    const lectureIdStr = lectureId.toString();
    progress.lastWatchedLecture = lectureId;

    const existingIndex = progress.lectureProgress.findIndex(
      (lp) => lp.lectureId.toString() === lectureIdStr
    );

    const safeCurrentTime = Math.max(0, Math.floor(Number(currentTime) || 0));
    const safeDuration = duration ? Math.max(0, Math.floor(Number(duration) || 0)) : 0;

    let shouldMarkCompleted = false;
    if (autoMarkComplete) {
      shouldMarkCompleted = true;
    } else if (safeDuration > 0 && safeCurrentTime >= safeDuration * 0.9) {
      // If watched at least 90% of the video
      shouldMarkCompleted = true;
    }

    if (existingIndex > -1) {
      progress.lectureProgress[existingIndex].currentTime = safeCurrentTime;
      if (safeDuration > 0) {
        progress.lectureProgress[existingIndex].duration = safeDuration;
      }
      if (shouldMarkCompleted && !progress.lectureProgress[existingIndex].isCompleted) {
        progress.lectureProgress[existingIndex].isCompleted = true;
        progress.lectureProgress[existingIndex].completedAt = new Date();
      }
    } else {
      progress.lectureProgress.push({
        lectureId,
        currentTime: safeCurrentTime,
        duration: safeDuration,
        isCompleted: shouldMarkCompleted,
        completedAt: shouldMarkCompleted ? new Date() : null,
      });
    }

    if (shouldMarkCompleted) {
      const alreadyInCompleted = progress.completedLectures.some(
        (id) => id.toString() === lectureIdStr
      );
      if (!alreadyInCompleted) {
        progress.completedLectures.push(lectureId);
      }
    }

    const { percentage, isCompleted } = calculateProgress(
      progress.completedLectures,
      course.lectures.length
    );
    progress.completionPercentage = percentage;
    progress.isCompleted = isCompleted;

    await progress.save();

    return res.status(200).json({
      success: true,
      message: "Playback time updated",
      savedTime: safeCurrentTime,
      progress,
    });
  } catch (error) {
    console.error("Error in updateLecturePlaybackTime:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating playback time",
      error: error.message,
    });
  }
};

// 4. Get all course progress for a user (used for My Learning Journey / Enrolled Courses dashboard)
export const getAllUserCourseProgress = async (req, res) => {
  try {
    const userId = req.userId;

    const allProgress = await CourseProgress.find({ userId })
      .populate("lastWatchedLecture", "lectureTitle duration isYoutubeVideo videoUrl")
      .lean();

    // Map progress by courseId for easy lookup on frontend
    const progressMap = {};
    for (const item of allProgress) {
      progressMap[item.courseId.toString()] = item;
    }

    return res.status(200).json({
      success: true,
      progressList: allProgress,
      progressMap,
    });
  } catch (error) {
    console.error("Error in getAllUserCourseProgress:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching user course progress",
      error: error.message,
    });
  }
};

// 5. Reset progress for a course (start over)
export const resetCourseProgress = async (req, res) => {
  try {
    const userId = req.userId;
    const { courseId } = req.params;

    const course = await Course.findById(courseId).select("lectures");
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    const progress = await CourseProgress.findOneAndUpdate(
      { userId, courseId },
      {
        $set: {
          completedLectures: [],
          lectureProgress: [],
          lastWatchedLecture: course.lectures.length > 0 ? course.lectures[0] : null,
          isCompleted: false,
          completionPercentage: 0,
        },
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Course progress has been reset",
      progress,
    });
  } catch (error) {
    console.error("Error in resetCourseProgress:", error);
    return res.status(500).json({
      success: false,
      message: "Error resetting course progress",
      error: error.message,
    });
  }
};
