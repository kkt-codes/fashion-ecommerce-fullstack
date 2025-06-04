import React from 'react';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline'; // For empty parts of stars

const ReviewCard = ({ review, currentUserId, onEditReview, onDeleteReview, isAdmin }) => {
  if (!review) {
    return null; 
  }

  // Backend ReviewDto now includes:
  // id (reviewId), productId, userId, userName, rating, comment, date (ISO string)
  const { id: reviewId, userId: reviewAuthorId, userName, rating, comment, date } = review;

  const renderStars = (count) => {
    const stars = [];
    const numericRating = parseFloat(count); // Ensure rating is a number
    const roundedRating = Math.round(numericRating * 2) / 2; // Rounds to nearest .0 or .5

    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<StarSolidIcon key={`star-solid-${i}-${reviewId}`} className="h-5 w-5 text-yellow-400" />);
      } else if (i - 0.5 === roundedRating) { // For visualizing a half-star effect
         stars.push(
            <div key={`star-half-${i}-${reviewId}`} className="relative h-5 w-5">
                <StarOutlineIcon className="absolute h-5 w-5 text-yellow-400" />
                <StarSolidIcon className="absolute h-5 w-5 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }}/>
            </div>
         );
      } else {
        stars.push(<StarOutlineIcon key={`star-outline-${i}-${reviewId}`} className="h-5 w-5 text-gray-300" />);
      }
    }
    return stars;
  };

  const formattedDate = date ? new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) : 'Date not available';

  const canModify = isAdmin || (currentUserId && currentUserId === reviewAuthorId);

  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center">
            <div className="flex mr-2">
            {renderStars(rating)}
            </div>
            <p className="text-sm font-semibold text-gray-800">{parseFloat(rating).toFixed(1)} out of 5</p>
        </div>
        {canModify && (
            <div className="flex space-x-2">
                <button 
                    onClick={() => onEditReview && onEditReview(review)}
                    className="text-xs text-blue-600 hover:text-blue-800"
                    aria-label="Edit review"
                >
                    Edit
                </button>
                <button 
                    onClick={() => onDeleteReview && onDeleteReview(reviewId)}
                    className="text-xs text-red-600 hover:text-red-800"
                    aria-label="Delete review"
                >
                    Delete
                </button>
            </div>
        )}
      </div>
      <p className="text-sm text-gray-700 mb-3 leading-relaxed whitespace-pre-wrap">
        {comment || "No comment provided."}
      </p>
      <div className="flex justify-between items-center">
        <p className="text-xs font-medium text-gray-600">
          By: <span className="font-bold">{userName || "Anonymous"}</span>
        </p>
        <p className="text-xs text-gray-500">{formattedDate}</p>
      </div>
    </div>
  );
};

export default ReviewCard;
