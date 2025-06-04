import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import apiClient from '../../services/api';
import { useAuthContext } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { PencilSquareIcon, TrashIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { Link } from 'react-router-dom';

export default function BuyerReviewsPage() {
  const { currentUser, isAuthenticated, userRole, isLoading: isAuthLoading } = useAuthContext();
  
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [deletingReviewId, setDeletingReviewId] = useState(null);

  useEffect(() => {
    if (!isAuthenticated || userRole !== 'BUYER') {
      setReviews([]);
      setLoadingReviews(false);
      setFetchError(null);
      return;
    }

    const fetchReviews = async () => {
      setLoadingReviews(true);
      setFetchError(null);
      try {
        const response = await apiClient.get('/reviews/user/me');
        setReviews(response.data || []);
      } catch (error) {
        console.error("Error loading buyer reviews:", error.response?.data || error.message);
        setFetchError(error.response?.data?.message || "Failed to load your reviews.");
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviews();
  }, [isAuthenticated, userRole]);

  const handleDeleteReview = (reviewId) => {
    toast(
      (t) => (
        <div className="flex flex-col gap-3 p-4 bg-white rounded shadow-md max-w-xs">
          <p className="text-sm font-semibold text-gray-800">Delete this review?</p>
          <div className="flex space-x-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setDeletingReviewId(reviewId);
                try {
                  await apiClient.delete(`/reviews/${reviewId}`);
                  setReviews((prev) => prev.filter(r => r.id !== reviewId));
                  toast.success("Review deleted.");
                } catch (err) {
                  console.error("Failed to delete review:", err.response?.data || err.message);
                  toast.error("Failed to delete the review. Please try again.");
                } finally {
                  setDeletingReviewId(null);
                }
              }}
              className="flex-1 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 py-1.5 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 60000, position: 'top-center' }
    );
  };

  const renderStars = (rating) => {
    const stars = [];
    const roundedRating = Math.round(rating * 2) / 2;
    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<StarSolidIcon key={i} className="h-5 w-5 text-yellow-400" />);
      } else if (i - 0.5 === roundedRating) {
        stars.push(
          <div key={'half-' + i} className="relative h-5 w-5">
            <StarOutlineIcon className="absolute h-5 w-5 text-yellow-400" />
            <StarSolidIcon className="absolute h-5 w-5 text-yellow-400" style={{ clipPath: 'inset(0 50% 0 0)' }} />
          </div>
        );
      } else {
        stars.push(<StarOutlineIcon key={'empty-' + i} className="h-5 w-5 text-gray-300" />);
      }
    }
    return stars;
  };

  if (isAuthLoading || loadingReviews) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 flex justify-center items-center">
          <p className="text-gray-500 animate-pulse text-lg">Loading your reviews...</p>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'BUYER') {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 flex flex-col justify-center items-center text-center">
          <ExclamationTriangleIcon className="h-16 w-16 text-gray-300 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
          <p className="text-gray-600">Please sign in as a Buyer to view your reviews.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">My Reviews</h1>

        {fetchError && (
          <div className="p-4 mb-6 bg-red-100 text-red-700 rounded shadow text-center">{fetchError}</div>
        )}

        {reviews.length === 0 ? (
          <div className="text-center bg-white p-8 rounded shadow-md">
            <p className="text-gray-600 mb-4">You haven't submitted any reviews yet.</p>
            <Link
              to="/products"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
            >
              Browse Products
            </Link>
          </div>
        ) : (
          <ul className="space-y-6">
            {reviews.map(review => (
              <li key={review.id} className="bg-white p-6 rounded-lg shadow border border-gray-200">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <div>{renderStars(review.rating)}</div>
                    <span className="text-sm text-gray-600 ml-2">{review.rating.toFixed(1)} / 5</span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {review.date ? new Date(review.date).toLocaleDateString() : 'Date unavailable'}
                  </span>
                </div>

                <p className="text-gray-700 whitespace-pre-wrap mb-4">{review.comment || 'No comment provided.'}</p>

                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-600">
                    Product ID: <span className="font-medium">{review.productId || 'N/A'}</span>
                    {/* You can add a Link to the product page if you have product names */}
                  </p>
                  {review.userId === currentUser.id && (
                    <div className="flex space-x-3 text-sm">
                      <Link
                        to={`/buyer/reviews/edit/${review.id}`}
                        className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                        aria-label="Edit review"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDeleteReview(review.id)}
                        disabled={deletingReviewId === review.id}
                        className="text-red-600 hover:text-red-800 flex items-center gap-1 disabled:opacity-50"
                        aria-label="Delete review"
                      >
                        <TrashIcon className="h-5 w-5" />
                        {deletingReviewId === review.id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
