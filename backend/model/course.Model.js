import mongoose from "mongoose";

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    subTitle: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    thumbnail: {
      type: String,
    },
    enrolledStudents: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    lectures: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Lecture",
      },
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    price: {
      type: Number,
      min: 0,
      default: 0,
    },
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Review",
      },
    ],
  },
  { timestamps: true }
);

// --- RELATIONAL CONSTRAINTS & CASCADING DELETES ---
// Automatically clean up child lectures, reviews, progress, and student enrollments
courseSchema.pre(["findOneAndDelete", "deleteOne"], async function () {
  try {
    const doc = await this.model.findOne(this.getQuery());
    if (doc) {
      const courseId = doc._id;

      // 1. Cascade delete all child lectures
      await mongoose.model("Lecture").deleteMany({ courseId });

      // 2. Cascade delete all course reviews
      await mongoose.model("Review").deleteMany({ course: courseId });

      // 3. Cascade delete all student progress records
      await mongoose.model("CourseProgress").deleteMany({ courseId });

      // 4. Cascade delete all enrollment records
      if (mongoose.models.Enrollment) {
        await mongoose.model("Enrollment").deleteMany({ courseId });
      }

      // 5. Clean up dangling references in users' enrolledCourses
      await mongoose.model("User").updateMany(
        { enrolledCourses: courseId },
        { $pull: { enrolledCourses: courseId } }
      );
    }
  } catch (error) {
    console.error("Error in Course cascading delete middleware:", error);
  }
});

const Course = mongoose.models.Course || mongoose.model("Course", courseSchema);

export default Course;
