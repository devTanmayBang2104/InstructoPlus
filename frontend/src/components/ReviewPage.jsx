import React, { useEffect, useState } from 'react';
import ReviewCard from './ReviewCard';
import { motion } from 'framer-motion';
import { ClipLoader } from 'react-spinners';
import { useSelector } from 'react-redux';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const ReviewPage = () => {
  const [latestReviews, setLatestReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { allReview = [] } = useSelector(state => state.review || {});

  useEffect(() => {
    if (allReview && allReview.length > 0) {
      setLatestReviews(allReview.slice(0, 6));
      setIsLoading(false);
    } else {
      setIsLoading(false);
    }
  }, [allReview]);

  const toggleShowAll = () => {
    if (latestReviews.length > 6) {
      setLatestReviews(allReview.slice(0, 6));
    } else {
      setLatestReviews([...allReview]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <ClipLoader color="#4F46E5" size={40} />
      </div>
    );
  }

  return (
    <section className="w-full py-16 md:py-20 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="inline-block text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Students Say
          </h2>
          <p className="text-gray-600 text-lg">
            Join thousands of satisfied learners who have transformed their skills with our courses
          </p>
        </div>

        {/* Reviews Grid */}
        {latestReviews && latestReviews.length > 0 ? (
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={container}
            initial="hidden"
            animate="show"
          >
            {latestReviews.map((review, index) => (
              <motion.div key={review._id || index} variants={item}>
                <ReviewCard
                  id={review._id}
                  text={review.comment}
                  name={review.user?.name}
                  image={review.user?.photoUrl}
                  rating={review.rating}
                  role={review.user?.role}
                  title={review.course?.title}
                />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
              <p className="text-gray-600">Be the first to share your experience!</p>
            </div>
          </div>
        )}

        {/* Load More Button */}
        {allReview.length > 6 && (
          <div className="mt-12 text-center">
            <button
              onClick={toggleShowAll}
              className="inline-flex items-center px-5 py-2.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              {latestReviews.length > 6 ? (
                <>
                  <span>Show Less</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7"></path>
                  </svg>
                </>
              ) : (
                <>
                  <span>View All Reviews ({allReview.length})</span>
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                  </svg>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default ReviewPage;
