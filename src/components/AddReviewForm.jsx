import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';
import apiClient from '../services/api'; 
import { useAuthContext } from '../context/AuthContext'; 
import { useSignupSigninModal } from '../hooks/useSignupSigninModal'; // To prompt login

const AddReviewForm = ({ productId, onReviewSubmitted, existingReview }) => {
  const { currentUser, isAuthenticated, userRole } = useAuthContext();
  const { openModal, switchToTab } = useSignupSigninModal();

  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating || 0);
      setComment(existingReview.comment || '');
    } else {
      // Reset for new review form
      setRating(0);
      setComment('');
      setError('');
    }
  }, [existingReview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated || userRole !== 'BUYER') {
      toast.error("Please sign in as a Buyer to submit reviews.");
      switchToTab("signin"); // Switch to signin tab
      openModal();
      return;
    }

    if (rating === 0) {
      setError("Please select a star rating.");
      toast.error("A star rating is required.");
      return;
    }
    if (!comment.trim()) {
      setError("Please enter your review comment.");
      toast.error("A review comment is required.");
      return;
    }
    if (comment.trim().length < 10) {
        setError("Comment must be at least 10 characters long.");
        toast.error("Comment must be at least 10 characters long.");
        return;
    }

    setIsSubmitting(true);
    
    // This payload is for the body of the request.
    // For POST, productId and userId are in the URL.
    // For PUT, reviewId is in the URL.
    // The backend ReviewDto expects rating & comment.
    const payload = { 
      rating: rating,
      comment: comment.trim(),
      // Backend will set productId, userId, and date for new reviews based on URL/context.
      // For updates, backend might not need productId/userId in payload if not changing them.
    };
    // If updating, our backend DTO for update might only need rating and comment.
    // Let's ensure the payload for PUT is just what can be updated.
    const updatePayload = { rating, comment: comment.trim() };


    try {
      if (existingReview && existingReview.id) {
        // Update existing review: PUT /api/reviews/{reviewId}
        // Backend ReviewService.updateReview expects ReviewDto in body (rating, comment).
        await apiClient.put(`/reviews/${existingReview.id}`, updatePayload);
        toast.success("Review updated successfully!");
      } else {
        // Add new review: POST /api/reviews/product/{productId}/user/{userId}
        // Backend ReviewService.addReview expects ReviewDto in body (rating, comment).
        await apiClient.post(`/reviews/product/${productId}/user/${currentUser.id}`, payload);
        toast.success("Review submitted successfully!");
      }
      
      if (onReviewSubmitted) {
        onReviewSubmitted(); // Notify parent to refetch reviews
      }

      if (!existingReview) { // Reset form only for new submissions
        setRating(0);
        setComment('');
      }
    } catch (err) {
      console.error("Error submitting review:", err.response?.data || err.message);
      const errorMessage = err.response?.data?.message || "Failed to submit review. Please try again.";
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const starElements = [];
  for (let i = 1; i <= 5; i++) {
    starElements.push(
      <button
        type="button"
        key={i}
        className={`focus:outline-none transition-colors duration-150 ease-in-out ${
          (hoverRating || rating) >= i ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-300'
        }`}
        onClick={() => setRating(i)}
        onMouseEnter={() => setHoverRating(i)}
        onMouseLeave={() => setHoverRating(0)}
        aria-label={`Rate ${i} out of 5 stars`}
      >
        <StarIcon className="h-7 w-7 sm:h-8 sm:w-8" />
      </button>
    );
  }

  if (!isAuthenticated || userRole !== 'BUYER') {
    return (
        <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mt-8 text-center">
            <p className="text-gray-600">Please <button onClick={() => { switchToTab("signin"); openModal(); }} className="text-blue-600 hover:underline">sign in as a Buyer</button> to write a review.</p>
        </div>
    );
  }


  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200 mt-8">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        {existingReview ? "Update Your Review" : "Write a Review"}
      </h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Your Rating:</label>
          <div className="flex items-center space-x-1">
            {starElements}
          </div>
          {rating > 0 && <p className="text-xs text-gray-500 mt-1">{rating} out of 5 stars selected.</p>}
        </div>

        <div>
          <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1.5">
            Your Review:
          </label>
          <textarea
            id="comment"
            name="comment"
            rows="4"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm"
            placeholder="Share your thoughts about the product..."
          ></textarea>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </>
            ) : (
              existingReview ? "Update Review" : "Submit Review"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddReviewForm;
