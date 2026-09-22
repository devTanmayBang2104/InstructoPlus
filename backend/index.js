import express from "express";
import dotenv from "dotenv";
import connectDb from "./config/connectdb.js";
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth.route.js";
import cors from "cors"
import userRouter from "./routes/user.route.js";
import courseRouter from "./routes/course.route.js";
import paymentRouter from "./routes/payment.route.js";
import reviewRouter from "./routes/reviewRoute.js";
import announcementRouter from "./routes/announcement.route.js"; // Import announcement router
import notificationRouter from "./routes/notification.route.js"; // Import notification router
const app = express();
dotenv.config();

app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://instructoplus.onrender.com",
  "https://instructo-plus.vercel.app",
  "https://instructo-plus2.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true); // Alternatively allow all or specify
    }
  },
  credentials: true
}));
const port = process.env.PORT || 8000;


app.use("/api/auth",authRouter);
app.use("/api/user",userRouter);
app.use("/api/course",courseRouter);
app.use('/api/payment',paymentRouter);
app.use("/api/review", reviewRouter);
app.use("/api", announcementRouter); // Use announcement router
app.use("/api", notificationRouter); // Use notification router

app.get("/", (req, res) => {
  res.send("Hello from backend");
})


app.listen(port, () => {
  console.log(`Server is running on port http://localhost:${port}`);
  connectDb();
})
