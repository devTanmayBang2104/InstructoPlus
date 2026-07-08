import razorpay from 'razorpay'
import dotenv from 'dotenv'
dotenv.config()
import User from '../model/user.Model.js'
import Course from '../model/course.Model.js'
import crypto from 'crypto'


const RazorPayInstance = new razorpay({
  key_id:process.env.RAZORPAY_KEY_ID,
  key_secret:process.env.RAZORPAY_KEY_SECRET
})

export const verifyFreePayment = async (req, res) => {
  try {
    const { courseId } = req.body;
    const userId = req.userId;

    const user = await User.findById(userId);
    const course = await Course.findById(courseId);

    if (!user || !course) {
      return res.status(400).json({
        success: false,
        message: "User or course not found",
      });
    }

    // Check if user is already enrolled
    if (user.enrolledCourses.includes(courseId)) {
      return res.status(200).json({
        success: true,
        message: "You are already enrolled in this course",
        alreadyEnrolled: true
      });
    }

    // Enroll user in course
    user.enrolledCourses.push(courseId);
    await user.save();

    // Add user to course's enrolled students
    if (!course.enrolledStudents.includes(userId)) {
      course.enrolledStudents.push(userId);
      await course.save();
    }

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

    const order = await RazorPayInstance.orders.create(options);

    return res.status(200).json({
      success: true,
      order,
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
  const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                                  .update(body.toString())
                                  .digest('hex');

  if (expectedSignature === razorpay_signature) {
    const user=await User.findById(userId);
    if(!user){
      return res.status(400).json({
        success:false,
        message:"User not found"
      })
    }
    if(!user.enrolledCourses.includes(courseId)){
      await user.enrolledCourses.push(courseId);
      await user.save();
    }
    const course=await Course.findById(courseId).populate("lectures");
    if(!course.enrolledStudents.includes(userId)){
      await course.enrolledStudents.push(userId);
      await course.save();
    }
    return res.status(200).json({
      success:true,
      message:"Payment verified successfully"
    })
  } else {
    return res.status(400).json({
      success:false,
      message:"Payment verification failed: Invalid signature"
    })
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
