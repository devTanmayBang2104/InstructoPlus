import axios from 'axios'
import React, { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { serverUrl } from '../App'
import { setUserData } from '../redux/userSlice'
import { toast } from 'react-toastify'
import { ClipLoader } from 'react-spinners'
import { useNavigate } from 'react-router-dom'
import { FaArrowLeft, FaCamera } from "react-icons/fa";
import { motion } from 'framer-motion';
import { AnimationContext } from '../App';
import { useContext } from 'react';
import Nav from '../components/Nav'
import useGetCurrentUser from '../customHooks/getCurrentUser'

function EditProfile() {
  useGetCurrentUser();
  const { userData } = useSelector((state) => state.user);
  const [name, setName] = useState(userData?.user.name || "");
  const [description, setDescription] = useState(userData?.user.description || "");
  const [photoUrl, setPhotoUrl] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(userData?.user.photoUrl || "");
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const fileInputRef = React.useRef(null);
  const { fadeIn } = useContext(AnimationContext);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoUrl(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const updateProfile = async () => {
    setLoading(true);
    const formData = new FormData();
    formData.append("name", name);
    formData.append("description", description);
    if (photoUrl) {
      formData.append("photoUrl", photoUrl);
    }

    try {
      const result = await axios.post(
        serverUrl + "/api/user/updateprofile",
        formData,
        { withCredentials: true }
      );
      dispatch(setUserData(result.data));
      navigate("/profile");
      setLoading(false);
      toast.success("Profile Updated Successfully");
    } catch (error) {
      toast.error("Error updating profile");
      setLoading(false);
    }
  }

  return (
    <> 
    <motion.div
      className="min-h-screen flex items-center justify-center bg-gray-100 p-4"
      variants={fadeIn}
      initial="hidden"
      animate="visible"
    >

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 relative">
        <button
          className="absolute top-6 left-6 text-gray-500 hover:text-gray-700"
          onClick={() => navigate("/profile")}
        >
          <FaArrowLeft size={20} />
        </button>

        <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">Edit Profile</h2>

        <div className="flex flex-col items-center mb-6">
          <div className="relative">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-4xl font-bold border-4 border-white shadow-lg">
                {userData?.user.name.charAt(0)}
              </div>
            )}
            <button
              className="absolute bottom-2 right-2 bg-indigo-600 text-white p-2 rounded-full shadow-md hover:bg-indigo-700 transition"
              onClick={() => fileInputRef.current.click()}
            >
              <FaCamera size={16} />
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </div>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Enter your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              readOnly
              className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-600"
              value={userData?.user.email}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              rows={3}
              placeholder="Tell us about yourself"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <button
            className="w-full bg-indigo-100 text-indigo-700 py-3 rounded-xl font-medium hover:bg-indigo-200 transition"
            onClick={() => navigate("/forgotpassword")}
          >
            Reset Password
          </button>

          <button
            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-indigo-700 hover:to-purple-700 transition shadow-md"
            disabled={loading}
            onClick={updateProfile}
          >
            {loading ? <ClipLoader size={20} color='white' /> : "Save Changes"}
          </button>
        </form>
      </div>
    </motion.div>
    </>
  )
}

export default EditProfile