import mongoose  from "mongoose";

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    required: true,
    enum: ["student", "educator"],
    default: "student",
    required: true,
  },
  photoUrl:{
    type: String,
    default: null
  },
  enrolledCourses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
  ],
  resetOtp: {
    type: String,
  },
  otpExpiry: {
    type: Date,
  },
  isOtpVerified: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

export default mongoose.model("User", userSchema);
