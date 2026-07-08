import Announcement from "../model/announcement.Model.js";
import Course from "../model/course.Model.js";
import User from "../model/user.Model.js";
import uploadOnCloudinary  from "../config/cloudinary.js";
import { sendAnnouncementMail } from "../config/Mail.js";
import Notification from "../model/notification.Model.js";

export const createAnnouncement = async (req, res) => {
  try {
    const { title, description, allCourses, selectedCourses, deliveryOptions, selectedStudents } = req.body;
    const sender = req.userId;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required." });
    }

    const parsedSelectedCourses = JSON.parse(selectedCourses || "[]");
    const parsedDeliveryOptions = JSON.parse(deliveryOptions || "{}");
    const parsedSelectedStudents = JSON.parse(selectedStudents || "[]");

    if (!parsedDeliveryOptions.inapp && !parsedDeliveryOptions.email) {
      return res.status(400).json({ message: "At least one delivery option (In-app or Email) must be selected." });
    }

    let attachmentUrl = null;
    if (req.file) {
      const attachmentLocalPath = req.file.path;
      const cloudinaryResponse = await uploadOnCloudinary(attachmentLocalPath);
      if (!cloudinaryResponse) {
        return res.status(500).json({ message: "Failed to upload attachment." });
      }
      attachmentUrl = cloudinaryResponse.url;
    }

    let courseIdsToTarget = [];
    let recipientStudents = [];

    // Get sender info for email
    const senderUser = await User.findById(sender).select("name");

    if (parsedSelectedStudents.length > 0) {
      // Direct student selection takes priority
      recipientStudents = parsedSelectedStudents;
    } else if (allCourses === "true") {
      // Fetch all courses created by the educator
      const educatorCourses = await Course.find({ creator: sender });
      courseIdsToTarget = educatorCourses.map(course => course._id);
    } else if (parsedSelectedCourses.length > 0) {
      courseIdsToTarget = parsedSelectedCourses;
    } else {
      return res.status(400).json({ message: "Please select courses or target specific students." });
    }

    const newAnnouncement = await Announcement.create({
      title,
      description,
      attachmentUrl,
      courseIds: courseIdsToTarget.length > 0 ? courseIdsToTarget : undefined,
      recipientStudents: recipientStudents.length > 0 ? recipientStudents : undefined,
      sender,
      deliveryType: parsedDeliveryOptions.inapp && parsedDeliveryOptions.email ? "both" : parsedDeliveryOptions.inapp ? "inapp" : "email",
    });

    // Get students to notify
    let studentsToNotify = [];

    if (recipientStudents.length > 0) {
      studentsToNotify = await User.find({ _id: { $in: recipientStudents } });
    } else if (courseIdsToTarget.length > 0) {
      const coursesWithStudents = await Course.find({ _id: { $in: courseIdsToTarget } }).populate("enrolledStudents");
      const enrolledStudentIds = new Set();
      coursesWithStudents.forEach(course => {
        course.enrolledStudents.forEach(student => enrolledStudentIds.add(student._id.toString()));
      });
      studentsToNotify = await User.find({ _id: { $in: Array.from(enrolledStudentIds) } });
    }

    if (parsedDeliveryOptions.email && studentsToNotify.length > 0) {
      const studentEmails = studentsToNotify.map(student => student.email);
      const emailSubject = `New Announcement: ${title}`;

      // Send emails individually to avoid showing other recipients
      for (const student of studentsToNotify) {
        await sendAnnouncementMail(
          student.email,
          emailSubject,
          title,
          description,
          attachmentUrl,
          senderUser.name
        );
      }
      console.log(`Sent announcement emails to ${studentsToNotify.length} students`);
    }

    if (parsedDeliveryOptions.inapp && studentsToNotify.length > 0) {
      // Create in-app notifications for each student
      const notifications = studentsToNotify.map(student => ({
        userId: student._id,
        announcementId: newAnnouncement._id,
        isRead: false,
      }));
      await Notification.insertMany(notifications);
      console.log(`Creating in-app notifications for ${studentsToNotify.length} students.`);
    }

    res.status(201).json({ message: "Announcement created successfully!", announcement: newAnnouncement });
  } catch (error) {
    console.error("Error creating announcement:", error);
    res.status(500).json({ message: "Server error while creating announcement." });
  }
};

// Controller for getting announcements (e.g., for educator dashboard)
export const getEducatorAnnouncements = async (req, res) => {
  try {
    const sender = req.userId;
    const announcements = await Announcement.find({ sender }).sort({ createdAt: -1 });
    res.status(200).json({ announcements });
  } catch (error) {
    console.error("Error fetching educator announcements:", error);
    res.status(500).json({ message: "Server error while fetching announcements." });
  }
};

// Controller for getting a single announcement by ID
export const getAnnouncementById = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id).populate("sender", "name photoUrl");
    if (!announcement) {
      return res.status(404).json({ message: "Announcement not found." });
    }
    res.status(200).json({ announcement });
  } catch (error) {
    console.error("Error fetching announcement by ID:", error);
    res.status(500).json({ message: "Server error while fetching announcement." });
  }
};
