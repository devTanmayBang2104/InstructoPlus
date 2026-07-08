import React, { useEffect } from "react";
import homeBg from "../assets/home1.jpg";
import Nav from "../components/Nav";
import { SiViaplay } from "react-icons/si";
import aiIcon from "../assets/ai.png";
import aiMobileIcon from "../assets/SearchAi.png";
import Logos from "../components/Logos";
import { useNavigate } from "react-router-dom";
import ExploreCourses from "../components/ExploreCourses";
import Cardspage from "../components/Cardspage";
import getCouseData from "../customHooks/getPublishedCourse";
import { motion } from "framer-motion";
import { AnimationContext } from "../App";
import { useContext } from "react";
import About from "../components/About";
import Footer from "../components/Footer";
import ReviewPage from "../components/ReviewPage";
import useGetCurrentUser from "../customHooks/getCurrentUser";
import getAllReviews from "../customHooks/getAllReviews";


function Home() {
  const navigate = useNavigate();
  const { fadeIn, slideIn } = useContext(AnimationContext);
    useGetCurrentUser();
      getCouseData();
  getAllReviews();
  // Particle effect for background
  useEffect(() => {


    const canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.zIndex = '0';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.querySelector('.hero-container').appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const particles = [];
    const particleCount = 100;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        speed: Math.random() * 0.5 + 0.1,
        angle: Math.random() * Math.PI * 2,
        distance: Math.random() * 20 + 10
      });
    }

    function drawParticles() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';

      particles.forEach(p => {
        p.x += Math.cos(p.angle) * p.speed;
        p.y += Math.sin(p.angle) * p.speed;

        // Boundary check
        if (p.x < 0 || p.x > canvas.width) p.angle = Math.PI - p.angle;
        if (p.y < 0 || p.y > canvas.height) p.angle = -p.angle;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();

        // Draw connecting lines
        particles.forEach(other => {
          const dx = p.x - other.x;
          const dy = p.y - other.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < p.distance) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${0.2 * (1 - dist/p.distance)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        });
      });

      requestAnimationFrame(drawParticles);
    }

    drawParticles();

    return () => {
      canvas.remove();
    };
  }, []);

  return (
    <div className="w-full overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative w-full h-screen overflow-hidden hero-container">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/80 to-purple-900/80 z-0" />
        <img
          src={homeBg}
          className="absolute inset-0 w-full h-full object-cover z-0 mix-blend-overlay"
          alt="Students learning"
        />


        <div className="relative z-10 h-full flex flex-col justify-center items-center text-center px-4">
          <motion.h1
            initial="hidden"
            animate="visible"
            variants={slideIn}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4"
          >
            Grow Your Skills to Advance
          </motion.h1>

          <motion.h2
            initial="hidden"
            animate="visible"
            variants={slideIn}
            className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-8"
          >
            Your Career Path
          </motion.h2>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="flex flex-wrap justify-center gap-6 mt-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/allcourses")}
              className="px-8 py-3 bg-transparent border-2 border-white text-white rounded-full text-lg font-medium hover:bg-white hover:text-indigo-900 transition-all duration-300 flex items-center gap-2 shadow-lg"
            >
              View all Courses
              <SiViaplay className="w-6 h-6" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/search")}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full text-lg font-medium hover:from-cyan-600 hover:to-blue-600 transition-all duration-300 flex items-center gap-2 shadow-lg"
            >
              Search with AI
              <img
                src={aiIcon}
                className="w-6 h-6 rounded-full hidden lg:block"
                alt="AI icon"
              />
              <img
                src={aiMobileIcon}
                className="w-7 h-7 rounded-full lg:hidden"
                alt="AI mobile icon"
              />
            </motion.button>
          </motion.div>

          {/* Floating elements */}
          <motion.div
            className="absolute bottom-10 left-10 w-8 h-8 bg-yellow-400 rounded-full shadow-xl"
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-1/3 right-20 w-10 h-10 bg-pink-500 rounded-full shadow-xl"
            animate={{ y: [0, -15, 0], scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-1/4 left-1/4 w-6 h-6 bg-cyan-400 rounded-full shadow-xl"
            animate={{ y: [0, -10, 0], rotate: [0, 180, 0] }}
            transition={{ duration: 5, repeat: Infinity }}
          />
        </div>
      </div>

      <Logos />
      <ExploreCourses />
      <Cardspage />
      <About/>
      <ReviewPage/>
      <Footer/>
    </div>
  );
}

export default Home;