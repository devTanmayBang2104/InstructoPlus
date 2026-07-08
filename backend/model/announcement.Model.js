import mongoose from "mongoose";

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  attachmentUrl: {
    type: String,
    default: null,
  },
  courseIds: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  recipientStudents: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  deliveryType: {
    type: String,
    enum: ["inapp", "email", "both"],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Announcement = mongoose.model("Announcement", announcementSchema);

export default Announcement;
