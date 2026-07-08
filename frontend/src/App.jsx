import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import SignUp from './pages/SignUp'
import Login from './pages/Login'
import Dashboard from './pages/Educator/Dashboard'
import Courses from './pages/Educator/Courses'
// export const serverUrl = "http://localhost:8000"
export const serverUrl = "https://backend-instructoplus.onrender.com"

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import getCurrentUser from './customHooks/getCurrentUser.js'
import { useSelector } from 'react-redux'
import Profile from './pages/Profile.jsx'
import UserProfile from './pages/UserProfile.jsx'
import ForgotPassword from "./pages/ForgotPassword.jsx"
import EditProfile from './pages/EditProfile.jsx'
import EditCourse from './pages/Educator/EditCourse.jsx'
import CreateCourse from './pages/Educator/CreateCourse.jsx'
import getCreatorCourse from './customHooks/getCreatorCourse.js'
import AllCourses from './pages/AllCourses.jsx'
import CreateLecture from './pages/Educator/CreateLecture.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import ViewCourse from './pages/ViewCourse.jsx'
import EditLecture from './pages/Educator/EditLecture.jsx'
import Nav from './components/Nav.jsx'
import ViewLecture from './pages/ViewLectures.jsx'
import EnrolledCourse from './pages/EnrolledCourse.jsx'
import getAllReviews from './customHooks/getAllReviews.jsx'
import SearchWithAi from './pages/SearchWithAi.jsx'
import getcourseData from './customHooks/getPublishedCourse.js'
import EnrolledStudents from './pages/Educator/EnrolledStudents.jsx'
import CreateAnnouncement from './pages/Educator/CreateAnnouncement.jsx'
import AllNotificationsPage from './pages/AllNotificationsPage.jsx' // Import AllNotificationsPage
import AnnouncementDetail from './pages/AnnouncementDetail.jsx' // Import AnnouncementDetail


// Animation context
export const AnimationContext = React.createContext({
  fadeIn: {},
  slideIn: {},
  staggerChildren: {}
});

function App() {
  getCurrentUser();
  const {userData} = useSelector((state) => state.user);
  getCreatorCourse(); // Call the hook inside the functional component
  getAllReviews();
  getcourseData();

  // Animation variants
  const animationVariants = {
    fadeIn: {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.6 } }
    },
    slideIn: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
    },
    staggerChildren: {
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: 0.1
        }
      }
    },
    fadeUpItem: {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }
  };

  return (
    <AnimationContext.Provider value={animationVariants}>
      <div className="min-h-screen flex flex-col">
        <Nav />
        <main className="flex-grow pt-16">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="" element={<Home />} />
              <Route path="/home" element={<Home />} />
              <Route path="/signup" element={!userData ? <SignUp /> : <Navigate to="/" />} />
              <Route path="/login" element={!userData ? <Login /> : <Navigate to="/" />} />
              <Route path="/profile" element={!userData ? <Navigate to="/" /> : <Profile />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/forgotpassword" element={<ForgotPassword />} />
              <Route path="/editprofile" element={!userData ? <Navigate to="/login" /> : <EditProfile />} />
              <Route path="/dashboard" element={userData && userData.user && userData.user.role==="educator" ? <Dashboard/> : <Navigate to="/" />}/>
              <Route path="/courses" element={userData && userData.user && userData.user.role==="educator" ? <Courses/> : <Navigate to="/" />}/>
              <Route path="/editcourses/:courseId" element={userData && userData.user && userData.user.role==="educator" ? <EditCourse/> : <Navigate to="/" />}/>
              <Route path="/createcourses" element={userData && userData.user && userData.user.role==="educator" ? <CreateCourse/> : <Navigate to="/" />}/>
              <Route path="/allcourses" element={<AllCourses />} />
              <Route path="/createlecture/:courseId" element={userData && userData.user && userData.user.role==="educator" ? <CreateLecture/> : <Navigate to="/signup" />}/>
              <Route path="/educator/create-announcement" element={userData && userData.user && userData.user.role==="educator" ? <CreateAnnouncement/> : <Navigate to="/" />}/>
              <Route path="/viewcourse/:courseId" element={<ViewCourse/>} />
              <Route path="/editlecture/:courseId/:lectureId" element={userData && userData.user && userData.user.role==="educator" ? <EditLecture/> : <Navigate to="/signup" />} />
              <Route path="/viewlecture/:courseId" element={<ViewLecture />} />
              <Route path="/enrolledcourses/" element={userData?<EnrolledCourse/> : <Navigate to="/login" />} />
              <Route path="/search" element={userData ? <SearchWithAi /> : <Navigate to="/login" />} />
              <Route path="/notifications" element={<AllNotificationsPage />} />
              <Route path="/announcements/:id" element={<AnnouncementDetail />} />
              <Route path="/enrolledstudents/:courseId" element={userData && userData.user && userData.user.role==="educator" ? <EnrolledStudents /> : <Navigate to="/" />} />
            </Routes>
          </AnimatePresence>
        </main>
      </div>
      <ToastContainer position="bottom-right" autoClose={3000} />
    </AnimationContext.Provider>
  );
}

export default App
