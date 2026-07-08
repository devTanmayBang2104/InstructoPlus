import React, { useState } from 'react'
import logo from '../assets/logo.jpg'
import googleIcon from '../assets/google.jpg'
import axios from 'axios'
import { serverUrl } from '../App'
import { MdOutlineRemoveRedEye, MdRemoveRedEye } from "react-icons/md";
import { signInWithPopup } from 'firebase/auth'
import { auth, provider } from '../../utils/firebase.js'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { ClipLoader } from 'react-spinners'
import { useDispatch } from 'react-redux'
import { setUserData } from '../redux/userSlice'
import { motion } from 'framer-motion';
import { AnimationContext } from '../App';
import { useContext } from 'react';

function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const dispatch = useDispatch()
  const { fadeIn } = useContext(AnimationContext);

  const handleLogin = async () => {
    setLoading(true)
    try {
      const result = await axios.post(serverUrl + "/api/auth/login", { email, password }, { withCredentials: true })
      dispatch(setUserData(result.data))
      navigate("/")
      setLoading(false)
      toast.success("Login Successful")
    } catch (error) {
      setLoading(false)
      toast.error(error.response?.data?.message || "Login Failed")
    }
  }

  const googleLogin = async () => {
    try {
      const response = await signInWithPopup(auth, provider)
      const user = response.user;
      const result = await axios.post(
        serverUrl + "/api/auth/googleAuth",
        {
          name: user.displayName,
          email: user.email,
          photo: user.photoURL
        },
        { withCredentials: true }
      )
      dispatch(setUserData(result.data))
      navigate("/")
      toast.success("Login Successful")
    } catch (error) {
      toast.error(error.response?.data?.message || "Google Login Failed")
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center p-4"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >
      <div className="w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        {/* Left Side - Form */}
        <div className="w-full md:w-1/2 p-8 flex flex-col items-center justify-center">
          <div className="w-full max-w-xs">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome back</h1>
            <p className="text-gray-600 mb-8">Login to your account</p>

            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent pr-10"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="absolute right-3 top-10 text-gray-500"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <MdRemoveRedEye size={20} /> : <MdOutlineRemoveRedEye size={20} />}
                </button>
              </div>

              <div className="flex justify-between items-center">
                <button
                  className="text-indigo-600 hover:text-indigo-800 text-sm"
                  onClick={() => navigate("/forgotpassword")}
                >
                  Forgot password?
                </button>
              </div>

              <button
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
                onClick={handleLogin}
                disabled={loading}
              >
                {loading ? <ClipLoader size={20} color="white" /> : "Login"}
              </button>

              <div className="relative flex items-center justify-center my-6">
                <div className="absolute inset-0 border-t border-gray-300"></div>
                <div className="relative bg-white px-4 text-sm text-gray-500">Or continue with</div>
              </div>

              <button
                type="button"
                className="w-full flex items-center justify-center gap-3 border border-gray-300 rounded-xl py-3 text-gray-700 hover:bg-gray-50 transition"
                onClick={googleLogin}
              >
                <img src={googleIcon} alt="Google" className="w-5 h-5" />
                <span>Sign in with Google</span>
              </button>

              <div className="text-center text-gray-600">
                Don't have an account?{' '}
                <button
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                  onClick={() => navigate("/signup")}
                >
                  Sign up
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden md:block w-1/2 bg-gradient-to-br from-indigo-700 to-purple-700 relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-white">
            <img
              src={logo}
              className="w-32 h-32 rounded-full border-4 border-white mb-6"
              alt="InstructoPlus Logo"
            />
            <h2 className="text-3xl font-bold mb-2">InstructoPlus</h2>
            <p className="text-center text-indigo-200 max-w-xs">
              Grow your skills with our expert-led courses
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export default Login