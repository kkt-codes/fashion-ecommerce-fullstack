import React, { useState, useEffect } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
// Import useAuthContext to get the current user's ID if needed, although typically backend derives it from token
// import { useAuthContext } from '../context/AuthContext'; // Assuming AuthContext provides currentUser.id

const AddReviewForm = ({ productId, onSubmitReview, existingReview }) => {
  // const { currentUser } = useAuthContext(); // Get current user if frontend needs to pass userId (backend should prefer deriving from token)

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
      // Reset form for adding a new review
      setRating(0);
      setComment('');
    }
  }, [existingReview]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

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

    // Prepare the review data object.
    // The backend ReviewDto expects: { rating, comment, productId }
    // userId and userName are typically derived by the backend from the authenticated user's JWT.
    // The 'date' is also typically set by the backend.
    const reviewData = {
      // productId is already a prop
      rating,
      comment: comment.trim(),
      // If editing an existing review, include its ID.
      // The backend PUT endpoint /api/reviews/{reviewId} will use this.
      ...(existingReview && { reviewId: existingReview.id })
      // No need to pass userId explicitly if backend derives it from the auth token.
      // Example if needed: userId: currentUser?.id
    };

    try {
      // The onSubmitReview prop (passed from a parent component like ProductDetails.jsx)
      // will handle the actual API call (POST to /api/reviews for new, PUT to /api/reviews/{id} for update).
      // It should include the JWT token in the Authorization header.
      await onSubmitReview(reviewData);
      
      // Toast for success will likely be handled in the parent component (e.g., ProductDetails.jsx)
      // after a successful API response.
      // Reset form only if it's not an edit, or if parent signals to reset after successful edit.
      if (!existingReview) {
        setRating(0);
        setComment('');
      }
    } catch (err) {
      // This catch block will handle errors thrown by the onSubmitReview function
      // (e.g., network errors, or errors from the API call if not caught by parent).
      console.error("Error submitting review from AddReviewForm:", err);
      const errorMessage = err.response?.data?.message || err.message || "Failed to submit review. Please try again.";
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
