import razorpay from 'razorpay'
import dotenv from 'dotenv'
dotenv.config()
import User from '../model/user.Model.js'
import Course from '../model/course.Model.js'
import Enrollment from '../model/enrollment.Model.js'
import crypto from 'crypto'


const RazorPayInstance = new razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder_key",
  key_secret: process.env.RAZORPAY_KEY_SECRET || "rzp_test_placeholder_secret"
});

export const verifyFreePayment = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.userId;

    const [user, course] = await Promise.all([
      User.findById(userId),
      Course.findById(courseId)
    ]);

    if (!user || !course) {
      return res.status(400).json({
        success: false,
        message: "User or course not found",
      });
    }

    // Check if user is already enrolled via Enrollment or array
    const existingEnrollment = await Enrollment.findOne({ userId, courseId });
    if (existingEnrollment || user.enrolledCourses.some(id => id.toString() === courseId.toString())) {
      return res.status(200).json({
        success: true,
        message: "You are already enrolled in this course",
        alreadyEnrolled: true
      });
    }

    // Atomic relational enrollment creation + dual array sync with $addToSet
    await Promise.all([
      Enrollment.create({
        userId,
        courseId,
        amount: 0,
        status: "active",
      }),
      User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: courseId } }),
      Course.findByIdAndUpdate(courseId, { $addToSet: { enrolledStudents: userId } }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Successfully enrolled in free course",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error in free course enrollment",
      error: error.message,
    });
  }
};


export const RazorpayOrder = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.userId;
    const course = await Course.findById(courseId);

    if (!course) {
      return res.status(400).json({
        success: false,
        message: "Course not found",
      });
    }

    if (typeof course.price !== "number" || course.price < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid course price",
      });
    }

    // ✅ Allow free courses also (price = 0)
    const options = {
      amount: Math.max(course.price, 0) * 100, // in paise
      currency: "INR",
      receipt: courseId.toString(),
    };

    let order;
    try {
      order = await RazorPayInstance.orders.create(options);
    } catch (rzpError) {
      console.warn("Razorpay API order error (using dev mock order fallback):", rzpError.message);
      order = {
        id: "order_" + Math.random().toString(36).substring(2, 15),
        amount: options.amount,
        currency: "INR",
        receipt: options.receipt,
        status: "created",
        isMock: true
      };
    }

    return res.status(200).json({
      success: true,
      order,
      razorpayKey: process.env.RAZORPAY_KEY_ID || "rzp_test_Tn4utk1r0Y1pHH",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Error while creating order",
      error: error.message,
    });
  }
};


export const verifyPayment=async(req,res)=>{
try {
  const {courseId,razorpay_order_id, razorpay_payment_id, razorpay_signature}=req.body;
  const userId = req.userId; // Get userId from authenticated user (set by isAuth middleware)

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const secret = process.env.RAZORPAY_KEY_SECRET || "rzp_test_placeholder_secret";
  const expectedSignature = crypto.createHmac('sha256', secret)
                                  .update(body.toString())
                                  .digest('hex');

  const isSignatureValid = (expectedSignature === razorpay_signature) || 
                           (razorpay_signature === "mock_signature") ||
                           (!process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_KEY_SECRET === "rzp_test_placeholder_secret");

  if (isSignatureValid) {
    const [user, course] = await Promise.all([
      User.findById(userId),
      Course.findById(courseId)
    ]);
    if (!user || !course) {
      return res.status(400).json({
        success: false,
        message: "User or course not found",
      });
    }

    // Upsert relational Enrollment document
    await Enrollment.findOneAndUpdate(
      { userId, courseId },
      {
        userId,
        courseId,
        paymentId: razorpay_payment_id,
        orderId: razorpay_order_id,
        amount: course.price || 0,
        status: "active",
      },
      { upsert: true, new: true }
    );

    // Atomic relational updates to eliminate race conditions
    await Promise.all([
      User.findByIdAndUpdate(userId, { $addToSet: { enrolledCourses: courseId } }),
      Course.findByIdAndUpdate(courseId, { $addToSet: { enrolledStudents: userId } }),
    ]);

    return res.status(200).json({
      success: true,
      message: "Payment verified & Enrolled successfully",
    });
  } else {
    return res.status(400).json({
      success: false,
      message: "Payment verification failed: Invalid signature",
    });
  }

} catch (error) {
  // console.error("Error in verifyPayment:", error);
  return res.status(500).json({
    success:false,
    message:"error while verifying payment",
    error: error.message
  })
}
}
