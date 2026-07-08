import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import { serverUrl } from "../App";
import { format } from "date-fns";

function AnnouncementDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [announcement, setAnnouncement] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnnouncement = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${serverUrl}/api/announcements/${id}`, {
          withCredentials: true,
        });

        if (response.data && response.data.announcement) {
          setAnnouncement(response.data.announcement);
        } else {
          throw new Error("Invalid announcement data received");
        }
      } catch (err) {
        const errorMessage = err.response?.data?.message ||
                           err.message ||
                           "Failed to fetch announcement details.";
        setError(errorMessage);
        toast.error(errorMessage);
        console.error("Error fetching announcement:", err);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchAnnouncement();
    } else {
      setError("No announcement ID provided");
      setLoading(false);
    }
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !announcement) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
        <p className="text-lg text-red-600 mb-4">
          {error || "Announcement not found"}
        </p>
        <button
          onClick={() => navigate(-1)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">{announcement.title}</h1>
            <span className="text-sm text-gray-500">
              {format(new Date(announcement.createdAt), 'MMMM d, yyyy')}
            </span>
          </div>

          {announcement.sender && (
            <div className="flex items-center mb-6">
              <img
                src={announcement.sender.photoUrl || '/default-avatar.png'}
                alt={announcement.sender.name}
                className="h-10 w-10 rounded-full mr-3"
              />
              <div>
                <p className="text-sm font-medium text-gray-900">{announcement.sender.name}</p>
                <p className="text-sm text-gray-500">Instructor</p>
              </div>
            </div>
          )}

          <div className="prose max-w-none">
            <p className="whitespace-pre-line text-gray-700">
              {announcement.description}
            </p>
          </div>

          {announcement.attachmentUrl && (
            <div className="mt-6">
              <a
                href={announcement.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-indigo-600 hover:text-indigo-800"
              >
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                Download Attachment
              </a>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-gray-200">
            <button
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Back to Announcements
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnnouncementDetail;
