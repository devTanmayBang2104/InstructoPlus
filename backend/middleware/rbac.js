import User from "../model/user.Model.js";
import Course from "../model/course.Model.js";
import Lecture from "../model/lecture.Model.js";

/**
 * Role-Based Access Control (RBAC) & Resource Ownership Middleware
 */

// 1. Enforce specific roles (e.g., 'educator', 'admin')
export const requireRole = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.userId) {
        return res.status(401).json({
          success: false,
          message: "Authentication required before role check",
        });
      }

      const user = await User.findById(req.userId).select("-password");
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      req.user = user;

      // Allow if user's role is in the allowed list, or if user is superadmin
      if (!allowedRoles.includes(user.role) && user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: `Access denied. Requires one of [${allowedRoles.join(", ")}] roles. Your role is '${user.role}'.`,
        });
      }

      next();
    } catch (error) {
      console.error("RBAC requireRole error:", error);
      return res.status(500).json({
        success: false,
        message: "Error verifying role permissions",
        error: error.message,
      });
    }
  };
};

export const isEducator = requireRole("educator", "admin");
export const isAdmin = requireRole("admin");

// 2. Verify that the authenticated user owns the course (or is platform admin)
export const verifyCourseOwnership = async (req, res, next) => {
  try {
    const courseId = req.params.courseId || req.body.courseId;
    if (!courseId) {
      return res.status(400).json({
        success: false,
        message: "courseId parameter is required",
      });
    }

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found",
      });
    }

    // Admins bypass ownership checks
    if (req.user && req.user.role === "admin") {
      req.course = course;
      return next();
    }

    // Check if the caller is the course creator
    if (!course.creator || course.creator.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not own this course and cannot modify it.",
      });
    }

    req.course = course;
    next();
  } catch (error) {
    console.error("Error in verifyCourseOwnership:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying course ownership",
      error: error.message,
    });
  }
};

// 3. Verify that the authenticated user owns the parent course of the lecture
export const verifyLectureOwnership = async (req, res, next) => {
  try {
    const lectureId = req.params.lectureId || req.body.lectureId;
    if (!lectureId) {
      return res.status(400).json({
        success: false,
        message: "lectureId parameter is required",
      });
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
      return res.status(404).json({
        success: false,
        message: "Lecture not found",
      });
    }

    // Admins bypass ownership checks
    if (req.user && req.user.role === "admin") {
      req.lecture = lecture;
      return next();
    }

    const course = await Course.findById(lecture.courseId);
    if (!course || !course.creator || course.creator.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: You do not own the course containing this lecture.",
      });
    }

    req.lecture = lecture;
    req.course = course;
    next();
  } catch (error) {
    console.error("Error in verifyLectureOwnership:", error);
    return res.status(500).json({
      success: false,
      message: "Error verifying lecture ownership",
      error: error.message,
    });
  }
};
