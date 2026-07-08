import mongoose from "mongoose";


const lectureSchema = new mongoose.Schema(
  {
    lectureTitle: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    videoUrl: {
      type: String,
    },
    duration: { // New field to store video duration
      type: String, // Changed to String to store ISO 8601 duration from YouTube API
      default: 'PT0S',
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

const Lecture = mongoose.model("Lecture", lectureSchema);
export default Lecture;
