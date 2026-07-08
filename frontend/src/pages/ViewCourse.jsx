import axios from "axios";
import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { serverUrl } from "../App";
import { FaArrowLeftLong, FaClone, FaRobot } from "react-icons/fa6";
import img from "../assets/empty.jpg";
import Card from "../components/Card.jsx";
import { setSelectedCourseData } from "../redux/courseSlice";
import { FaLock, FaPlayCircle, FaDownload } from "react-icons/fa";
import { toast } from "react-toastify";
import { FaStar } from "react-icons/fa6";
import { ClipLoader } from "react-spinners";
import useGetCurrentUser from "../customHooks/getCurrentUser.js";
import getCouseData from "../customHooks/getPublishedCourse.js";

function ViewCourse() {
  getCouseData();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { courseData, selectedCourseData } = useSelector(
    (state) => state.course
  );
  const { userData } = useSelector((state) => state.user);
  const dispatch = useDispatch();
  // Call the custom hook and create an enhanced fetchUser function
  const fetchUserHook = useGetCurrentUser();
  const fetchUser = async () => {
    await fetchUserHook();
    // After fetching user data, we'll check enrollment status again in the useEffect
    // console.log("User data refreshed after enrollment");
  };
  const [creatorData, setCreatorData] = useState(null);
  const [selectedLecture, setSelectedLecture] = useState(null);
  const [selectedCreatorCourse, setSelectedCreatorCourse] = useState([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [courseReviews, setCourseReviews] = useState([]); // New state for reviews
  const [loadingReviews, setLoadingReviews] = useState(true); // State for loading reviews

  // console.log("SelectedCreatorCourse", selectedCreatorCourse);


  // Calculate average rating
  const avgRating = (reviews) => {
    // console.log(reviews);

    // Check if reviews is undefined, null, or an empty array
    if (!reviews || reviews.length === 0) return 0;

    const totalRating = reviews.reduce((acc, review) => acc + review.rating, 0);
     const avg=totalRating / reviews.length;
    //  console.log("average",avg);
     return avg.toFixed(1);
  };

  // Initialize data on component mount
  useEffect(() => {
    if (courseData) {
      const course = courseData.find((item) => item && item._id === courseId);
      if (course) dispatch(setSelectedCourseData(course));
    }

    // console.log("ViewCourse useEffect - userData:", userData);
    // console.log("ViewCourse useEffect - courseId:", courseId);

    // Check if user is enrolled in this course
    const checkEnrollmentStatus = () => {
      if (!userData?.user?.enrolledCourses || !courseId) {
        setIsEnrolled(false);
        // console.log("ViewCourse useEffect - isEnrolled (no user data/enrolled courses):", false);
        return;
      }

      const verify = userData.user.enrolledCourses.some((c) => {
        const enrolledId = typeof c === "string" ? c : c?._id;
        const isMatch = enrolledId?.toString() === courseId?.toString();
        // console.log(`  Checking enrollment: course ${enrolledId} vs ${courseId}, Match: ${isMatch}`);
        return isMatch;
      });

      setIsEnrolled(!!verify);
      // console.log("ViewCourse useEffect - isEnrolled (after check):", !!verify);
    };

    checkEnrollmentStatus();

  }, [courseId, courseData, userData, dispatch]);

  // Fetch creator data
  useEffect(() => {
    const fetchCreatorData = async () => {
      if (selectedCourseData?.creator) {
        try {
          const creatorRes = await axios.post(
            `${serverUrl}/api/course/getcreator`,
            { userId: selectedCourseData.creator },
            { withCredentials: true }
          );
          const creator = creatorRes.data.user;
          setCreatorData(creator);

          if (creator) {
            const coursesRes = await axios.get(
              `${serverUrl}/api/course/getbycreator/${creator._id}`,
              { withCredentials: true }
            );
            const otherCourses = coursesRes.data.courses.filter(
              (course) => course._id !== courseId
            );
            setSelectedCreatorCourse(otherCourses);
          }
        } catch (error) {
          console.error("Error fetching creator data:", error);
        }
      }
    };
    fetchCreatorData();
  }, [selectedCourseData, courseId]);

  // Fetch course reviews
  useEffect(() => {
    const fetchReviews = async () => {
      setLoadingReviews(true);
      try {
        // Corrected route based on reviewController.js
        const response = await axios.get(`${serverUrl}/api/review/courseReview/${courseId}`); // Removed withCredentials: true
        setCourseReviews(response.data); // Assuming response.data is the array of reviews
        // console.log("Fetched reviews:", response.data);
      } catch (error) {
        // console.error("Error fetching reviews:", error);
        toast.error("Failed to fetch reviews.");
      } finally {
        setLoadingReviews(false);
      }
    };
    if (courseId) {
      fetchReviews();
    }
  }, [courseId]);


  // review
  const handleReview = async () => {
    try {
      await axios.post(
        serverUrl + "/api/review/givereview",
        { rating, comment, courseId },
        { withCredentials: true }
      );
      toast.success("Review Added");
      setRating(0);
      setComment("");
      // Refetch reviews after adding a new one
      const response = await axios.get(`${serverUrl}/api/review/courseReview/${courseId}`); // Removed withCredentials: true
      setCourseReviews(response.data);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error adding review");
    }
  };


  const handleEnroll = async (userId, courseId) => {
    try {
      // console.log("sending request");
      // Check if the course is free (price is 0)
      if (selectedCourseData?.price === 0) {
        try {
          // Handle free course enrollment
          const verifyRes = await axios.post(
            serverUrl + "/api/payment/verify-free",
            { courseId },
            { withCredentials: true }
          );
          // console.log("Free enrollment response:", verifyRes.data);
          setIsEnrolled(true);

          // Check if user was already enrolled
          if (verifyRes.data.alreadyEnrolled) {
            toast.info(verifyRes.data.message);
          } else {
            toast.success(verifyRes.data.message);
          }

          fetchUser(); // Re-fetch user data to update enrolled courses
          return;
        } catch (freeEnrollError) {
          // console.error("Free enrollment error:", freeEnrollError);
          // Show the error message
          toast.error(freeEnrollError.response?.data?.message || "Error enrolling in free course");
          return;
        }
      }

      // Handle paid course enrollment
      const orderData = await axios.post(
        serverUrl + "/api/payment/razorpay-order",
        { courseId },
        { withCredentials: true }
      );
      // console.log("Order Data from Backend:", orderData);
      // console.log("request send");

      // Check if Razorpay is available
      if (!window.Razorpay) {
        // console.error("Razorpay SDK not loaded");
        toast.error("Payment gateway not available. Please try again later.");
        return;
      }

      try {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID,
          amount: orderData.data.order.amount,
          currency: "INR",
          name: "IntructoPlus",
          description: "Course Enrollment Payment",
          order_id: orderData.data.order.id,
          handler: async function (response) {
            // console.log("Razorpay Handler Response:", response);
            try {
              const verifyRes = await axios.post(
                serverUrl + "/api/payment/verify-payment",
                {
                  razorpay_order_id: response.razorpay_order_id,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature,
                  courseId,
                },
                { withCredentials: true }
              );
              // console.log("Payment verification response:", verifyRes.data);
              setIsEnrolled(true);
              toast.success(verifyRes.data.message);
              fetchUser(); // Re-fetch user data to update enrolled courses
            } catch (verifyError) {
              // console.error("Payment verification error:", verifyError);
              toast.error(verifyError.response?.data?.message || "Payment verification failed.");
            }
          },
          // Add these options to improve the Razorpay experience
          prefill: {
            name: userData?.user?.name || "",
            email: userData?.user?.email || "",
          },
          theme: {
            color: "#3399cc"
          },
          modal: {
            ondismiss: function() {
              console.log("Payment modal closed");
            }
          }
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } catch (razorpayError) {
        // console.error("Razorpay error:", razorpayError);
        toast.error("Payment gateway error. Please try again later.");
      }
    } catch (err) {
      // console.error("Enrollment error:", err);
      toast.error(err.response?.data?.message || "Something went wrong while enrolling.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 relative">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 mb-4 hover:text-black"
        >
          <FaArrowLeftLong className="w-5 h-5" />
          <span>Back to Courses</span>
        </button>

        {/* Course Header */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-2/5">
              <img
                src={selectedCourseData?.thumbnail || img}
                alt="Course Thumbnail"
                className="rounded-xl w-full object-cover aspect-video"
              />
            </div>

            <div className="md:w-3/5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    {selectedCourseData?.title}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {selectedCourseData?.subTitle}

                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-1 bg-yellow-50 px-3 py-1 rounded-full">
                  <FaStar className="text-yellow-500" />
                  {/* Use courseReviews for avg rating and count */}
                  <span className="font-medium">{avgRating(courseReviews)}</span>
                  <span className="text-gray-500 ml-1">
                    ({courseReviews.length} reviews)
                  </span>
                </div>
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                  {selectedCourseData?.lectures?.length || 0} Lectures
                </div>
                <div className="bg-gray-100 px-3 py-1 rounded-full text-sm">
                  {selectedCourseData?.category}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xl font-semibold text-black">
                    ₹{selectedCourseData?.price}
                  </span>
                  <span className="line-through text-gray-400 ml-2">
                    ₹{Math.round(selectedCourseData?.price * 1.5)}
                  </span>
                </div>
                {!isEnrolled ? (
                  <button
                    onClick={() => {
                      if (!userData || !userData.user) {
                        toast.error("Please login to enroll in this course");
                        navigate("/login");
                        return;
                      }
                      handleEnroll(userData.user._id, courseId);
                    }}
                    className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800"
                  >
                    Enroll Now
                  </button>
                ) : (
                  <button
                    onClick={() => navigate(`/viewlecture/${courseId}`)}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
                  >
                    Continue Learning
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Video Player */}
          <div className="lg:w-7/12">
            <div className="bg-white rounded-xl shadow-md p-4">
              <div className="aspect-video w-full rounded-lg overflow-hidden bg-black flex items-center justify-center">
                {selectedLecture?.videoUrl ? (
                  selectedLecture.isYoutubeVideo ? (
                    <iframe
                      className="w-full h-full object-contain"
                      src={selectedLecture.videoUrl}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                  ) : (
                    <video
                      src={selectedLecture.videoUrl}
                      controls
                      className="w-full h-full object-contain"
                    />
                  )
                ) : (
                  <div className="text-center p-6 text-white">
                    <FaPlayCircle className="text-5xl mx-auto mb-4 opacity-70" />
                    <p className="text-lg">
                      Select a lecture to start watching
                    </p>
                  </div>
                )}
              </div>

              {selectedLecture && (
                <div className="mt-4">
                  <h2 className="text-xl font-bold mb-2">
                    {selectedLecture.lectureTitle}
                  </h2>
                  <p className="text-gray-600 mb-4">
                    {selectedLecture.description}
                  </p>

                  {selectedLecture.documents?.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedLecture.documents.map((doc, index) => (
                        <a
                          key={index}
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={doc.title || doc.name || `Document ${index + 1}`}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg hover:bg-indigo-50"
                        >
                          <FaDownload className="text-indigo-600" />
                          <span className="font-medium">
                            {doc.title || doc.name || `Document ${index + 1}`}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Curriculum */}
          <div className="lg:w-5/12">
            <div className="bg-white rounded-xl shadow-md p-5 mb-6">
              <h2 className="text-xl font-bold mb-4">Course Curriculum</h2>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {selectedCourseData?.lectures?.map((lecture, index) => (
                  <button
                    key={lecture._id}
                    disabled={!lecture.isPreviewFree && !isEnrolled}
                    onClick={() =>
                      (lecture.isPreviewFree || isEnrolled) &&
                      setSelectedLecture(lecture)
                    }
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-lg transition ${
                      lecture.isPreviewFree || isEnrolled
                        ? "hover:bg-indigo-50 cursor-pointer"
                        : "opacity-50 cursor-not-allowed"
                    } ${
                      selectedLecture?._id === lecture._id
                        ? "bg-indigo-50 border-l-4 border-indigo-600"
                        : ""
                    }`}
                  >
                    {lecture.isPreviewFree || isEnrolled ? (
                      <FaPlayCircle className="text-indigo-600" />
                    ) : (
                      <FaLock className="text-gray-500" />
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{lecture.lectureTitle}</p>
                      <p className="text-xs text-gray-500">
                        {lecture.duration ? `${Math.floor(lecture.duration / 60)} min ${Math.round(lecture.duration % 60)} sec` : "N/A"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Instructor */}
            <div className="bg-white rounded-xl shadow-md p-6">
              <h2 className="text-xl font-bold mb-4">Instructor</h2>
              <div className="flex gap-4">
                <img
                  onClick={() => navigate(`/user/${creatorData?._id}`)}
                  src={creatorData?.photoUrl || img}
                  alt="Instructor"
                  className="w-16 h-16 rounded-full object-cover"
                />
                <div>
                  <h3 className="font-bold text-lg">
                    {creatorData?.name || "Instructor"}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {creatorData?.email}
                  </p>
                  <p className="text-gray-700 mt-2">
                    {creatorData?.description || "Experienced educator"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {isEnrolled ? (
          <>
            <h2 className="text-xl font-semibold mb-2">Write a Review</h2>
            <div className="mb-4">
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (

                    <FaStar
                      key={star}
                      onClick={() => setRating(star)}
                      className={star <= rating ? "fill-yellow-500" : "fill-gray-300"}
                    />

                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Write your comment here..."
                className="w-full border border-gray-300 rounded-lg p-2"
                rows="3"
              />
              <button
                className="bg-black text-white mt-3 px-4 py-2 rounded hover:bg-gray-800"
                onClick={handleReview}
              >
                Submit Review
              </button>
            </div>
          </>
        ) : (
          ""
        )}

        {/* Display Existing Reviews */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4">Reviews</h2>
          {loadingReviews ? (
            <div className="flex justify-center items-center h-24">
              <ClipLoader color="#4A90E2" size={30} />
            </div>
          ) : courseReviews.length === 0 ? (
            <p className="text-gray-500">No reviews yet for this course.</p>
          ) : (
            <div className="space-y-4">
              {courseReviews.map((review) => (
                <div key={review._id} className="border-b pb-4 last:border-b-0 last:pb-0">
                  <div className="flex items-center gap-3 mb-2">
                    <img
                      src={review.user?.photoUrl || img}
                      alt="Reviewer"
                      className="w-10 h-10 rounded-full object-cover"
                      onClick={() => navigate(`/user/${review.user?._id}`)}
                    />
                    <div>
                      <h3 className="font-semibold">{review.user?.name || "Anonymous"}</h3>
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <FaStar key={i} className={i < review.rating ? "fill-yellow-500 w-4 h-4" : "fill-gray-300 w-4 h-4"} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Other Courses by Creator */}
        {selectedCreatorCourse.length > 0 && (
          <div
            onClick={() => {
              window.scrollTo({ top: 0 });
              setSelectedLecture(null);
              setSelectedCreatorCourse([]);
            }}
          >
            <h2 className="text-2xl font-bold mb-6">
              More Courses by {creatorData?.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {selectedCreatorCourse.slice(0, 3).map((course) => (
                <Card
                  key={course._id}
                  thumbnail={course.thumbnail}
                  title={course.title}
                  id={course._id}
                  price={course.price}
                  category={course.category}
                  level={course.level}
                  reviews={course.reviews}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ViewCourse;
