import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon, PencilSquareIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

import Sidebar from '../../components/Sidebar';
import { getMyReviews, updateReview, deleteReview } from '../../services/api';

// Reusable Star Rating Component
const StarRating = ({ rating, setRating, interactive = false }) => {
    return (
        <div className="flex items-center">
            {[...Array(5)].map((_, index) => {
                const starValue = index + 1;
                return (
                    <button
                        type="button"
                        key={starValue}
                        onClick={() => interactive && setRating(starValue)}
                        className={`transition-colors ${interactive ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                        aria-label={`Rate ${starValue} stars`}
                    >
                        {starValue <= rating ? <StarSolidIcon className="h-6 w-6 text-yellow-400" /> : <StarOutlineIcon className="h-6 w-6 text-gray-300" />}
                    </button>
                );
            })}
        </div>
    );
};

// Modal for Editing a Review
const EditReviewModal = ({ review, onClose, onReviewUpdate }) => {
    const [rating, setRating] = useState(review.rating);
    const [comment, setComment] = useState(review.comment);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!comment.trim() || rating === 0) {
            toast.error("Please provide a rating and a comment.");
            return;
        }
        setIsSubmitting(true);
        const toastId = toast.loading("Updating your review...");
        try {
            await updateReview(review.id, { rating, comment });
            toast.success("Review updated successfully!", { id: toastId });
            onReviewUpdate(); // This calls fetchReviews in the parent
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update review.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Edit Your Review</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Your Rating</label>
                        <StarRating rating={rating} setRating={setRating} interactive={true} />
                    </div>
                    <div>
                        <label htmlFor="comment" className="block text-sm font-medium text-gray-700">Your Comment</label>
                        <textarea id="comment" value={comment} onChange={(e) => setComment(e.target.value)} rows="4" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


export default function BuyerReviewsPage() {
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedReview, setSelectedReview] = useState(null);

    const fetchReviews = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const { data } = await getMyReviews();
            setReviews(data || []);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to load your reviews.");
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchReviews();
    }, [fetchReviews]);
    
    const handleDeleteReview = (reviewId, productName) => {
        toast((t) => (
            <div className="p-4">
                <p className="font-semibold">Delete your review for "{productName}"?</p>
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={async () => {
                            toast.dismiss(t.id);
                            const deleteToast = toast.loading("Deleting review...");
                            try {
                                await deleteReview(reviewId);
                                toast.success("Review deleted.", { id: deleteToast });
                                fetchReviews();
                            } catch (err) {
                                toast.error("Failed to delete review.", { id: deleteToast });
                            }
                        }}
                        className="px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
                    >Delete</button>
                    <button onClick={() => toast.dismiss(t.id)} className="px-4 py-1.5 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
                </div>
            </div>
        ), { duration: 10000 });
    };

    return (
        <div className="flex min-h-screen bg-gray-100">
            {selectedReview && <EditReviewModal review={selectedReview} onClose={() => setSelectedReview(null)} onReviewUpdate={fetchReviews} />}
            <Sidebar />
            <main className="flex-1 p-6 sm:p-8">
                <header className="mb-8"><h1 className="text-3xl font-bold text-gray-800">My Reviews</h1></header>

                {isLoading ? <p className="animate-pulse text-gray-600">Loading your reviews...</p> :
                 error ? <p className="text-red-500">{error}</p> :
                 reviews.length === 0 ? (
                    <div className="text-center bg-white p-8 rounded-lg shadow">
                        <p className="text-gray-600 mb-4">You haven't submitted any reviews yet.</p>
                        <Link to="/products" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Browse Products</Link>
                    </div>
                 ) : (
                    <ul className="space-y-6">
                        {reviews.map(review => (
                            <li key={review.id} className="bg-white p-6 rounded-lg shadow border">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <p className="font-semibold text-gray-800">Review for <Link to={`/products/${review.productId}`} className="text-blue-600 hover:underline">{review.productName || 'Product'}</Link></p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <StarRating rating={review.rating} />
                                            <span className="text-sm text-gray-600">{review.rating.toFixed(1)}</span>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400">{new Date(review.date).toLocaleDateString()}</span>
                                </div>
                                <p className="text-gray-700 whitespace-pre-wrap pb-4 mb-4 border-b">{review.comment}</p>
                                <div className="flex justify-end space-x-3 text-sm">
                                    <button onClick={() => setSelectedReview(review)} className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800"><PencilSquareIcon className="h-5 w-5"/>Edit</button>
                                    <button onClick={() => handleDeleteReview(review.id, review.productName)} className="flex items-center gap-1 text-red-600 hover:text-red-800"><TrashIcon className="h-5 w-5"/>Delete</button>
                                </div>
                            </li>
                        ))}
                    </ul>
                 )
                }
            </main>
        </div>
    );
}