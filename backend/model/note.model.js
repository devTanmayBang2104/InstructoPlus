import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    lectureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Lecture",
      required: true,
      index: true,
    },
    timestamp: {
      type: Number,
      default: 0, // Video timestamp in seconds
      min: 0,
    },
    content: {
      type: String,
      required: true,
      trim: true,
      maxLength: 5000,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

// Compound index for querying user notes by course and lecture efficiently
noteSchema.index({ userId: 1, courseId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, lectureId: 1, timestamp: 1 });

const Note = mongoose.model("Note", noteSchema);
export default Note;
