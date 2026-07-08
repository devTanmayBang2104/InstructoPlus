import React, { useState } from "react";
import { FaStar } from "react-icons/fa6";
import { FaRegStar, FaQuoteLeft } from "react-icons/fa";

const ReviewCard = ({ id,text, name, image, rating, role, title }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 overflow-hidden h-full flex flex-col group">
      <div className="p-6 flex-1 flex flex-col">
        {/* Header with quote icon */}
        <div className="mb-4">
          <FaQuoteLeft className="text-indigo-100 text-3xl mb-3 group-hover:text-indigo-200 transition-colors" />

          {title && (
            <span className="inline-block text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mb-3">
              {title}
            </span>
          )}
        </div>

        {/* Review Text */}
        <div className="mb-4 flex-1">
          <p
            className={`text-gray-700 text-sm leading-relaxed ${
              isExpanded ? '' : 'line-clamp-3'
            }`}
          >
            {text || "No review text available"}
          </p>
          {text && text.length > 150 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-xs text-indigo-600 hover:text-indigo-800 mt-1 font-medium"
            >
              {isExpanded ? 'Show less' : 'Read more'}
            </button>
          )}
        </div>

        {/* Rating */}
        <div className="flex items-center mb-4">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <span key={star} className="text-yellow-400">
                {star <= (rating || 0) ? (
                  <FaStar className="w-4 h-4" />
                ) : (
                  <FaRegStar className="w-4 h-4 text-gray-300" />
                )}
              </span>
            ))}
          </div>
          <span className="text-sm font-medium text-gray-600 ml-2">
            {typeof rating === 'number' ? rating.toFixed(1) : '0.0'}
          </span>
        </div>
      </div>

      {/* Reviewer Info */}
      <div className="bg-gray-50 px-6 py-4 border-t border-gray-100">
        <div className="flex items-center">
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center text-indigo-600 font-semibold text-sm">
              {image ? (
                <img

                  src={image}
                  alt={name}
                  className="w-full h-full rounded-full object-cover"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '';
                  }}
                />
              ) : (
                name?.charAt(0) || 'U'
              )}
            </div>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-semibold text-gray-800">
              {name || "Anonymous"}
            </h4>
            <p className="text-xs text-gray-500">
              {role || "Student"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;