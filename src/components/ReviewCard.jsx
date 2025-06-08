import React from 'react';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

/**
 * A reusable component to display a star rating.
 * @param {object} props
 * @param {number} props.rating - The rating value out of 5.
 */
const StarRatingDisplay = ({ rating }) => {
  const fullStars = Math.round(rating); // Round to the nearest whole star for simplicity
  return (
    <div className="flex items-center">
      {[...Array(5)].map((_, i) => (
        <StarSolidIcon
          key={i}
          className={`h-5 w-5 ${i < fullStars ? 'text-yellow-400' : 'text-gray-300'}`}
        />
      ))}
    </div>
  );
};

/**
 * A component to display a single customer review.
 * @param {object} props
 * @param {object} props.review - The review object, containing details like userName, rating, comment, etc.
 * @param {function} [props.onEdit] - Optional function to call when the edit button is clicked.
 * @param {function} [props.onDelete] - Optional function to call when the delete button is clicked.
 */
const ReviewCard = ({ review, onEdit, onDelete }) => {
  const { currentUser, userRole } = useAuth();

  if (!review) {
    return null;
  }

  const { id: reviewId, userId: reviewAuthorId, userName, rating, comment, date } = review;

  // Determine if the current user has permission to modify this review
  const canModify = userRole === 'ADMIN' || (currentUser && currentUser.id === reviewAuthorId);

  const formattedDate = date 
    ? new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) 
    : 'Date unavailable';

  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-100">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-800">
            {userName || "Anonymous"}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <StarRatingDisplay rating={rating} />
            <span className="text-xs text-gray-500">({rating.toFixed(1)})</span>
          </div>
        </div>
        <p className="text-xs text-gray-500 flex-shrink-0 ml-4">{formattedDate}</p>
      </div>

      <p className="text-gray-700 leading-relaxed whitespace-pre-wrap border-t border-gray-100 pt-3">
        {comment || "No comment provided."}
      </p>

      {canModify && (
        <div className="flex justify-end items-center gap-4 mt-4 pt-3 border-t border-gray-100">
          <button 
            onClick={() => onEdit && onEdit(review)}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 transition-colors"
            aria-label="Edit review"
          >
            <PencilSquareIcon className="h-4 w-4" /> Edit
          </button>
          <button 
            onClick={() => onDelete && onDelete(reviewId)}
            className="flex items-center gap-1.5 text-sm text-red-600 hover:text-red-800 transition-colors"
            aria-label="Delete review"
          >
            <TrashIcon className="h-4 w-4" /> Delete
          </button>
        </div>
      )}
    </div>
  );
};

export default ReviewCard;