import axios from 'axios'
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ClipLoader } from 'react-spinners'
import { serverUrl } from '../App'
import { toast } from 'react-toastify'
import { FaArrowLeft, FaLock } from "react-icons/fa";
import { motion } from 'framer-motion';
import { AnimationContext } from '../App';
import { useContext } from 'react';

function ForgotPassword() {
  let navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [conPassword, setConpassword] = useState("");
  const { fadeIn } = useContext(AnimationContext);

  const handleStep1 = async () => {
    setLoading(true);
    try {
      const result = await axios.post(`${serverUrl}/api/auth/sendotp`, { email }, { withCredentials: true });
      setStep(2);
      toast.success(result.data.message);
      setLoading(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Error sending OTP");
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    setLoading(true);
    try {
      const result = await axios.post(`${serverUrl}/api/auth/verifyotp`, { email, otp }, { withCredentials: true });
      toast.success(result.data.message);
      setLoading(false);
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid OTP");
      setLoading(false);
    }
  };

  const handleStep3 = async () => {
    setLoading(true);
    try {
      if (newPassword !== conPassword) {
        return toast.error("Passwords do not match");
      }
      const result = await axios.post(`${serverUrl}/api/auth/resetpassword`, { email, password: newPassword }, { withCredentials: true });
      toast.success(result.data.message);
      setLoading(false);
      navigate("/login");
    } catch (error) {
      toast.error(error.response?.data?.message || "Error resetting password");
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            className="space-y-6"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <FaLock size={24} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-800">
              Forgot Your Password?
            </h2>

            <p className="text-gray-600 text-center">
              Enter your email address to reset your password
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <button
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
              disabled={loading}
              onClick={handleStep1}
            >
              {loading ? <ClipLoader size={20} color="white" /> : "Send OTP"}
            </button>

            <button
              className="w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-800 mt-4"
              onClick={() => navigate("/login")}
            >
              <FaArrowLeft size={14} /> Back to Login
            </button>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            className="space-y-6"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                <div className="text-xl font-bold">OTP</div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-800">
              Enter OTP
            </h2>

            <p className="text-gray-600 text-center">
              We sent a 4-digit code to your email. Please enter it below.
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-center text-xl tracking-widest"
                placeholder="1234"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
              />
            </div>

            <button
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
              disabled={loading}
              onClick={handleStep2}
            >
              {loading ? <ClipLoader size={20} color="white" /> : "Verify OTP"}
            </button>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            className="space-y-6"
            variants={fadeIn}
            initial="hidden"
            animate="visible"
          >
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center text-green-600">
                <FaLock size={24} />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-center text-gray-800">
              Reset Your Password
            </h2>

            <p className="text-gray-600 text-center">
              Enter a new password for your account
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Re-enter new password"
                value={conPassword}
                onChange={(e) => setConpassword(e.target.value)}
              />
            </div>

            <button
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
              onClick={handleStep3}
              disabled={loading}
            >
              {loading ? <ClipLoader size={20} color="white" /> : "Reset Password"}
            </button>
          </motion.div>
        );
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8">
        {renderStep()}
      </div>
    </div>
  );
}

export default ForgotPassword;