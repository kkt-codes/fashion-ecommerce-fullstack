import React from 'react';
import { StarIcon as StarSolid } from '@heroicons/react/24/solid';
import { StarIcon as StarOutline } from '@heroicons/react/24/outline';

// This component displays a single product review.
// It expects a 'review' prop that aligns with the backend's ReviewDto.
// Backend ReviewDto fields: id, productId, userId, rating, comment, date.

export default function ReviewCard({ review }) {
  if (!review) {
    // Simple placeholder for when review data is not available
    return (
      <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200 animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/4 mb-3"></div>
        <div className="h-3 bg-gray-300 rounded w-full mb-2"></div>
        <div className="h-3 bg-gray-300 rounded w-5/6 mb-3"></div>
        <div className="flex justify-between items-center">
          <div className="h-3 bg-gray-300 rounded w-1/3"></div>
          <div className="h-3 bg-gray-300 rounded w-1/4"></div>
        </div>
      </div>
    );
  }

  // Destructure expected fields from the review prop (based on ReviewDto)
  const { userId, rating, comment, date: reviewDateString } = review; 
  // The 'userName' prop is no longer directly expected from the review object itself.
  // If a userName is passed separately (e.g., fetched by parent), it could be accepted as another prop.
  // For now, we'll display userId or a generic "User".

  const displayUserName = review.userName || `User ID: ${userId.substring(0, 8)}...`; // Example: Show part of userId or a passed userName

  const renderStars = (count) => {
    const stars = [];
    const fullStars = Math.floor(count);
    // For simplicity, rounding to nearest half or full star for display
    const roundedRating = Math.round(count * 2) / 2; 

    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<StarSolid key={`star-solid-${i}-${review.id}`} className="h-5 w-5 text-yellow-400" />);
      } else if (i - 0.5 === roundedRating) { // Visual cue for half star
        stars.push(
          <div key={`star-half-${i}-${review.id}`} className="relative">
            <StarOutline className="h-5 w-5 text-yellow-400" />
            <div className="absolute top-0 left-0 overflow-hidden w-1/2">
              <StarSolid className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
        );
      }
      else {
        stars.push(<StarOutline key={`star-outline-${i}-${review.id}`} className="h-5 w-5 text-yellow-300" />); // Slightly different color for empty
      }
    }
    return stars;
  };

  let formattedDate = 'Date not available';
  if (reviewDateString) {
    try {
      // Attempt to parse the date string. Backend sends "yyyy-MM-dd HH:mm:ss"
      // JavaScript's Date constructor can often handle this format, but might be locale-dependent.
      // For more robust parsing, a library like date-fns would be better.
      const dateObj = new Date(reviewDateString.replace(' ', 'T')); // Replace space with T for better ISO compatibility
      if (!isNaN(dateObj.getTime())) {
        formattedDate = dateObj.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      }
    } catch (error) {
      console.error("Error formatting review date:", error);
      // formattedDate remains 'Date not available'
    }
  }
  

  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
      <div className="flex items-center mb-2">
        <div className="flex mr-2">
          {renderStars(rating)}
        </div>
        {typeof rating === 'number' && (
            <p className="text-sm font-semibold text-gray-800">{rating.toFixed(1)} out of 5</p>
        )}
      </div>
      <p className="text-sm text-gray-700 mb-3 leading-relaxed break-words">
        {comment || "No comment provided."}
      </p>
      <div className="flex justify-between items-center text-xs">
        <p className="font-medium text-gray-600">
          By: <span className="font-bold text-gray-700">{displayUserName}</span>
        </p>
        <p className="text-gray-500">{formattedDate}</p>
      </div>
    </div>
  );
};
