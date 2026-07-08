import React, { useEffect, useState } from 'react'
import Card from "./Card.jsx"
import { useSelector } from 'react-redux';
import { SiViaplay } from "react-icons/si";
import { useNavigate } from 'react-router-dom';
import { motion } from "framer-motion";
import { AnimationContext } from "../App";
import { useContext } from "react";

function Cardspage() {
  const [popularCourses, setPopularCourses] = useState([]);
  const { courseData } = useSelector(state => state.course);
  const navigate = useNavigate();
  const { staggerChildren } = useContext(AnimationContext);

  useEffect(() => {
    // console.log("Cardspage - courseData:", courseData); // Debugging line
    if (courseData && courseData.length > 0) {
      setPopularCourses(courseData.slice(0, 6));
    } else {
      setPopularCourses([]); // Ensure it's an empty array if no data
    }
  }, [courseData]);

  // console.log("Cardspage - popularCourses:", popularCourses); // Debugging line

  return (
    <section className="py-16 bg-gradient-to-b from-indigo-50 to-white relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -top-20 left-10 w-64 h-64 bg-purple-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-3xl font-bold text-gray-900 mb-4"
          >
            Our Popular Courses
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-lg text-gray-600 max-w-3xl mx-auto"
          >
            Explore top-rated courses designed to boost your skills, enhance careers,
            and unlock opportunities in tech, AI, business, and beyond.
          </motion.p>
        </div>

        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {popularCourses.map((course, index) => (
            <Card
              key={index}
              id={course._id}
              thumbnail={course.thumbnail}
              title={course.title}
              price={course.price}
              category={course.category}
              reviews={course.reviews}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/allcourses")}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            View all Courses
            <SiViaplay className="ml-2 w-5 h-5" />
          </motion.button>
        </div>
      </div>
    </section>
  );
}

export default Cardspage;
