import React, { useContext } from "react";
import { SiViaplay } from "react-icons/si";
import { TbDeviceDesktopAnalytics } from "react-icons/tb";
import { LiaUikit } from "react-icons/lia";
import { MdAppShortcut } from "react-icons/md";
import { FaHackerrank } from "react-icons/fa";
import { TbBrandOpenai } from "react-icons/tb";
import { SiGoogledataproc } from "react-icons/si";
import { BsClipboardDataFill } from "react-icons/bs";
import { SiOpenaigym } from "react-icons/si";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { AnimationContext } from "../App";

const categories = [
  {
    icon: <TbDeviceDesktopAnalytics className="w-12 h-12 text-indigo-600" />,
    name: "Web Development",
    bgColor: "bg-indigo-50",
  },
  {
    icon: <LiaUikit className="w-12 h-12 text-pink-600" />,
    name: "UI/UX Design",
    bgColor: "bg-pink-50",
  },
  {
    icon: <MdAppShortcut className="w-12 h-12 text-green-600" />,
    name: "App Development",
    bgColor: "bg-green-50",
  },
  {
    icon: <FaHackerrank className="w-12 h-12 text-red-600" />,
    name: "Ethical Hacking",
    bgColor: "bg-red-50",
  },
  {
    icon: <TbBrandOpenai className="w-12 h-12 text-blue-600" />,
    name: "AI/ML",
    bgColor: "bg-blue-50",
  },
  {
    icon: <SiGoogledataproc className="w-12 h-12 text-purple-600" />,
    name: "Data Science",
    bgColor: "bg-purple-50",
  },
  {
    icon: <BsClipboardDataFill className="w-12 h-12 text-yellow-600" />,
    name: "Data Analytics",
    bgColor: "bg-yellow-50",
  },
  {
    icon: <SiOpenaigym className="w-12 h-12 text-teal-600" />,
    name: "AI Tools",
    bgColor: "bg-teal-50",
  },
];

function ExploreCourses() {
  const navigate = useNavigate();
  const { staggerChildren, fadeUpItem } = useContext(AnimationContext);

  return (
    <section className="py-16 bg-gradient-to-b from-gray-50 to-indigo-50 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-100 rounded-full blur-3xl opacity-50"></div>
      <div className="absolute bottom-10 left-10 w-40 h-40 bg-pink-100 rounded-full blur-3xl opacity-50"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="lg:flex justify-between items-center">
          <div className="lg:w-1/3 mb-12 lg:mb-0">
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl font-bold text-gray-900 mb-4"
            >
              Explore Our Courses
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-lg text-gray-600 mb-6"
            >
              Discover a world of knowledge with our expertly crafted courses
              designed to help you achieve your learning goals and advance your career.
            </motion.p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/allcourses")}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full font-medium hover:from-indigo-700 hover:to-purple-700 transition-colors duration-300 shadow-lg"
            >
              Explore Courses
              <SiViaplay className="ml-2 w-5 h-5" />
            </motion.button>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerChildren}
            className="lg:w-2/3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4"
          >
            {categories.map((category, index) => (
              <motion.div
                key={index}
                variants={fadeUpItem}
                whileHover={{
                  y: -10,
                  scale: 1.05,
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1)"
                }}
                className={`${category.bgColor} p-4 rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:shadow-lg`}
              >
                <motion.div
                  className="mb-3"
                  whileHover={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 0.5 }}
                >
                  {category.icon}
                </motion.div>
                <span className="text-sm font-medium text-gray-700 text-center">
                  {category.name}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default ExploreCourses;