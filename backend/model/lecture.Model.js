import mongoose from "mongoose";

const lectureSchema = new mongoose.Schema(
  {
    lectureTitle: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    duration: {
      type: String,
      default: "PT0S",
    },
    isYoutubeVideo: {
      type: Boolean,
      default: false,
    },
    youtubeVideoId: {
      type: String,
    },
    youtubePlaylistId: {
      type: String,
    },
    isPreviewFree: {
      type: Boolean,
      default: false,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },
    documents: [
      {
        description: String,
        title: String,
        url: String,
      },
    ],
  },
  { timestamps: true }
);

// --- RELATIONAL CONSTRAINTS & DECOUPLING ---
// When a lecture is deleted, cleanly pull its reference from parent Course and CourseProgress
lectureSchema.pre(["findOneAndDelete", "deleteOne"], async function () {
  try {
    const doc = await this.model.findOne(this.getQuery());
    if (doc) {
      const lectureId = doc._id;
      const courseId = doc.courseId;

      // 1. Remove reference from parent Course
      await mongoose.model("Course").findByIdAndUpdate(courseId, {
        $pull: { lectures: lectureId },
      });

      // 2. Remove lecture from student CourseProgress documents
      if (mongoose.models.CourseProgress) {
        await mongoose.model("CourseProgress").updateMany(
          { courseId },
          {
            $pull: {
              completedLectures: lectureId,
              lectureProgress: { lectureId },
            },
          }
        );
      }
    }
  } catch (error) {
    console.error("Error in Lecture decoupling middleware:", error);
  }
});

const Lecture = mongoose.models.Lecture || mongoose.model("Lecture", lectureSchema);

export default Lecture;
