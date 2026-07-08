import React, { useEffect, useState } from 'react'
import { MdCastForEducation } from "react-icons/md";
import { SiOpenaccess } from "react-icons/si";
import { FaSackDollar } from "react-icons/fa6";
import { BiSupport } from "react-icons/bi";
import { FaUsers } from "react-icons/fa";
import { motion } from "framer-motion";

const features = [
  {
    icon: <MdCastForEducation className="w-8 h-8 text-indigo-600" />,
    text: "20k+ Online Courses",
  },
  {
    icon: <SiOpenaccess className="w-7 h-7 text-indigo-600" />,
    text: "Lifetime Access",
  },
  {
    icon: <FaSackDollar className="w-7 h-7 text-indigo-600" />,
    text: "Value For Money",
  },
  {
    icon: <BiSupport className="w-8 h-8 text-indigo-600" />,
    text: "Lifetime Support",
  },
  {
    icon: <FaUsers className="w-7 h-7 text-indigo-600" />,
    text: "Community Support",
  },
  {
    icon: <MdCastForEducation className="w-8 h-8 text-indigo-600" />,
    text: "20k+ Online Courses",
  },
  {
    icon: <SiOpenaccess className="w-7 h-7 text-indigo-600" />,
    text: "Lifetime Access",
  },
  {
    icon: <FaSackDollar className="w-7 h-7 text-indigo-600" />,
    text: "Value For Money",
  },
  {
    icon: <BiSupport className="w-8 h-8 text-indigo-600" />,
    text: "Lifetime Support",
  },
  {
    icon: <FaUsers className="w-7 h-7 text-indigo-600" />,
    text: "Community Support",
  },
];

function Logos() {
  const [duplicatedFeatures, setDuplicatedFeatures] = useState([]);

  useEffect(() => {
    // Duplicate features for infinite scrolling
    setDuplicatedFeatures([...features, ...features]);
  }, []);

  return (
    <div className="py-8 bg-white border-t border-b border-gray-200 overflow-hidden">
      <div className="relative max-w-7xl mx-auto">
        <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-white to-transparent z-10"></div>
        <div className="absolute top-0 right-0 h-full w-24 bg-gradient-to-l from-white to-transparent z-10"></div>

        <motion.div
          className="flex"
          animate={{
            x: ["0%", "-100%"]
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          {duplicatedFeatures.map((feature, index) => (
            <motion.div
              key={index}
              className="flex items-center px-6 py-3 bg-white rounded-full border border-gray-200 hover:shadow-md transition-shadow duration-300 mx-2"
              whileHover={{
                y: -5,
                backgroundColor: "#f5f3ff"
              }}
            >
              <div className="mr-3">{feature.icon}</div>
              <span className="text-sm font-medium text-gray-700">{feature.text}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

export default Logos;