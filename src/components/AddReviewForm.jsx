import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import { useSignupSigninModal } from '../hooks/useSignupSigninModal';
// The parent component will pass the onSubmit function, which uses the API service.

// A reusable, interactive star rating component
const StarRatingInput = ({ rating, setRating }) => {
    const [hoverRating, setHoverRating] = useState(0);
    
    return (
        <div className="flex items-center space-x-1">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <button
                        type="button"
                        key={starValue}
                        className={`transition-colors duration-150 ease-in-out 
                          ${(hoverRating || rating) >= starValue ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'}`}
                        onClick={() => setRating(starValue)}
                        onMouseEnter={() => setHoverRating(starValue)}
                        onMouseLeave={() => setHoverRating(0)}
                        aria-label={`Rate ${starValue} stars`}
                    >
                        <StarIcon className="h-8 w-8" />
                    </button>
                );
            })}
        </div>
    );
};


/**
 * A form for submitting or updating a product review.
 * @param {object} props
 * @param {function} props.onSubmitReview - The async function to call when the form is submitted. It receives an object with { rating, comment }.
 * @param {object} [props.existingReview] - If provided, the form will be in "edit" mode.
 */
export default function AddReviewForm({ onSubmitReview, existingReview }) {
  const { isAuthenticated, userRole } = useAuth();
  const { openModal } = useSignupSigninModal();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form if an existing review is passed for editing
  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 0);
      setComment(existingReview.comment || '');
    }
  }, [existingReview]);
  
  const validate = () => {
    if (rating === 0) {
      toast.error("Please select a star rating.");
      return false;
    }
    if (!comment.trim() || comment.trim().length < 10) {
      toast.error("Your review must be at least 10 characters long.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isAuthenticated || userRole !== 'BUYER') {
      toast.error("Please sign in as a Buyer to submit a review.");
      openModal('signin');
      return;
    }
    
    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      // The parent component's onSubmitReview function handles the API call
      await onSubmitReview({ rating, comment: comment.trim() });
      
      // Reset form only if it's a new review submission
      if (!existingReview) {
        setRating(0);
        setComment('');
      }
    } catch (err) {
      // The parent component's submit handler is expected to show the toast
      // on failure, but we can have a fallback here if needed.
      console.error("AddReviewForm: Submission failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated || userRole !== 'BUYER') {
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg border mt-8 text-center">
            <p className="text-gray-600">Please <button onClick={() => openModal('signin')} className="text-blue-600 hover:underline">sign in as a Buyer</button> to write a review.</p>
        </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border mt-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        {existingReview ? "Update Your Review" : "Write a Review"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
          <StarRatingInput rating={rating} setRating={setRating} />
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">Your Review</label>
          <textarea
            id="comment"
            rows="4"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Share your thoughts about the product..."
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex justify-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70"
          >
            {isSubmitting ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}
          </button>
        </div>
      </form>
    </div>
  );
};