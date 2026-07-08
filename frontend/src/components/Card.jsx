import React from 'react';
import { FaStar } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

function CourseCard({ id, title, thumbnail, price, category, level, reviews }) {
  const navigate = useNavigate();

  // Calculate average rating
  const avgRating = reviews?.length > 0
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : 'New';

  return (
    <div
      onClick={() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        navigate(`/viewcourse/${id}`);
      }}
      className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300 border border-gray-100 hover:border-indigo-100 cursor-pointer h-full flex flex-col"
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://via.placeholder.com/400x225?text=No+Image';
          }}
        />
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {level || 'All Levels'}
        </div>
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {title}
        </h3>

        <div className="flex items-center text-sm text-gray-600 mb-3">
          <span className="font-medium text-indigo-600">{category}</span>
          <span className="mx-2">•</span>
          <div className="flex items-center">
            <FaStar className="text-yellow-400 mr-1" />
            <span className="font-medium">{avgRating}</span>
            {reviews?.length > 0 && (
              <span className="text-gray-500 ml-1">({reviews.length})</span>
            )}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between">
          <span className="text-lg font-bold text-gray-900">
            ₹{price === 0 ? 'Free' : price}
            {price > 0 && (
              <span className="ml-2 text-sm text-gray-400 line-through">
                ₹{Math.round(price * 1.5)}
              </span>
            )}
          </span>
          <button
            className="px-3 py-1.5 text-sm font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/viewcourse/${id}`);
            }}
          >
            View
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourseCard;
