import mongoose from "mongoose";
import dotenv from "dotenv"

dotenv.config();

const connectDb = async () => {
  try {
    const mongoUrl = process.env.MONGODB_URL || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/instructoplus";
    await mongoose.connect(mongoUrl);
    console.log("Connected to MongoDB successfully:", mongoUrl.split("@").pop());
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};

export default connectDb