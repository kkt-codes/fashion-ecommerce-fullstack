import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import {
    HeartIcon as HeartOutlineIcon,
    ShoppingCartIcon,
    StarIcon as StarOutlineIcon,
    ExclamationTriangleIcon,
    ArchiveBoxIcon,
    UserCircleIcon,
    EnvelopeIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from "@heroicons/react/24/solid";
import toast from 'react-hot-toast';

import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext";
import { useSignupSigninModal } from "../hooks/useSignupSigninModal";
import { getProductById, getProductReviews, addProductReview, checkPurchaseStatus } from "../services/api";
import ReviewCard from "../components/ReviewCard";
import AddReviewForm from "../components/AddReviewForm";
import ContactSellerButton from "../components/ContactSellerButton";

export default function ProductDetails() {
  const { id: productId } = useParams();
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hasPurchased, setHasPurchased] = useState(false);

  const { addToCart, isLoading: isCartLoading } = useCart();
  const { isFavorite, toggleFavorite, isLoading: isFavoritesLoading } = useFavorites();
  const { isAuthenticated, currentUser, userRole } = useAuth();
  const { openModal } = useSignupSigninModal();

  const fetchData = useCallback(async () => {
    if (!productId) {
        setIsLoading(false);
        setError("Product ID is missing.");
        return;
    }
    setIsLoading(true);
    setError(null);
    setHasPurchased(false);
    try {
      const [productRes, reviewsRes] = await Promise.all([
        getProductById(productId),
        getProductReviews(productId),
      ]);
      setProduct(productRes.data);
      setReviews(reviewsRes.data || []);

      if (isAuthenticated && userRole === 'BUYER') {
        try {
          const purchaseStatusRes = await checkPurchaseStatus(productId);
          setHasPurchased(purchaseStatusRes.data.hasPurchased);
        } catch (purchaseError) {
          console.error("Could not verify purchase status:", purchaseError);
          setHasPurchased(false);
        }
      }

    } catch (err) {
      console.error("ProductDetails: Error fetching data:", err);
      const errorMsg = err.response?.data?.message || "Failed to load product details.";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  }, [productId, isAuthenticated, userRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.stock < 1) {
        toast.error("This item is out of stock.");
        return;
    }
    if (!isAuthenticated) {
        toast.error("Please log in to add items to your cart.");
        openModal('signin');
        return;
    }
    if (userRole !== 'BUYER') {
        toast.error("Only buyers can add items to the cart.");
        return;
    }
    addToCart(product, quantity);
  };

  const handleReviewSubmit = async (reviewData) => {
    if (!product || !currentUser) {
      toast.error("You must be logged in to submit a review.");
      return Promise.reject();
    }
    const toastId = toast.loading("Submitting your review...");
    try {
      await addProductReview(product.id, currentUser.id, reviewData);
      toast.success("Review submitted successfully!", { id: toastId });
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to submit review.", { id: toastId });
      return Promise.reject(err);
    }
  };

  const renderRating = (avgRating = 0, numReviews = 0) => {
    if (numReviews === 0) return <span className="text-sm text-gray-500">No reviews yet</span>;
    const stars = Array.from({ length: 5 }, (_, i) => (
      i < Math.round(avgRating) ? 
      <StarSolidIcon key={i} className="h-5 w-5 text-yellow-400" /> : 
      <StarOutlineIcon key={i} className="h-5 w-5 text-gray-300" />
    ));
    return (
      <div className="flex items-center">
        {stars}
        <span className="ml-2 text-sm text-gray-600">{avgRating.toFixed(1)} ({numReviews} review{numReviews !== 1 ? 's' : ''})</span>
      </div>
    );
  };

  if (isLoading && !product) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><p className="text-lg animate-pulse">Loading Product...</p></div>;
  }

  if (error) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] text-center px-4">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Product</h1>
        <p className="text-gray-600 mb-6">{error}</p>
        <Link to="/products" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">View All Products</Link>
      </div>
    );
  }

  if (!product) {
    return <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]"><p>Product not found.</p></div>;
  }
  
  const isCurrentlyFavorite = isFavorite(product.id);
  const isOutOfStock = product.stock < 1;

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start mb-12">
          {/* Image Column */}
          <div className="shadow-xl rounded-lg overflow-hidden bg-white relative">
            <img 
              src={product.photoUrl && product.photoUrl.startsWith('http') ? product.photoUrl : `http://localhost:8080${product.photoUrl || ''}`}
              alt={product.name} 
              className="w-full h-auto md:min-h-[450px] max-h-[650px] object-cover" 
            />
            {isAuthenticated && userRole === 'BUYER' && (
              <button onClick={() => toggleFavorite(product)} disabled={isFavoritesLoading} className="absolute top-4 right-4 p-2.5 bg-white/80 backdrop-blur-sm rounded-full shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50">
                {isCurrentlyFavorite ? <HeartSolidIcon className="h-7 w-7 text-red-500" /> : <HeartOutlineIcon className="h-7 w-7 text-gray-600 hover:text-red-500" />}
              </button>
            )}
          </div>
          {/* Details Column */}
          <div className="flex flex-col gap-5">
            <h1 className="text-4xl font-bold text-gray-800">{product.name}</h1>
            <div className="mt-1 mb-2">{renderRating(product.averageRating, product.numOfReviews)}</div>
            <p className="text-3xl text-blue-600 font-bold">${product.price.toFixed(2)}</p>
            
            <div className="flex items-center gap-2">
                <ArchiveBoxIcon className={`h-6 w-6 ${isOutOfStock ? 'text-gray-400' : 'text-green-600'}`} />
                {isOutOfStock ? (
                    <p className="font-semibold text-gray-500">Out of Stock</p>
                ) : (
                    <p className={`font-semibold ${product.stock <= 10 ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>
                        {product.stock <= 10 ? `Only ${product.stock} left!` : 'In Stock'}
                    </p>
                )}
            </div>

            <div className="prose prose-base text-gray-700 max-w-none"><h3 className="text-lg font-semibold mb-1">Description:</h3><p>{product.description}</p></div>
            <p className="text-sm text-gray-500">Category: <span className="font-medium text-gray-700">{product.category}</span></p>
            <div className="flex items-center gap-3 mt-2">
              <label htmlFor="quantity" className="font-semibold text-gray-700">Quantity:</label>
              <input type="number" id="quantity" value={quantity} onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10)))} min="1" className="border border-gray-300 rounded-md w-20 p-2 text-center focus:ring-2 focus:ring-blue-500" />
            </div>
            
            {/* --- Display Seller Info --- */}
            <div className="mt-4 pt-4 border-t border-gray-200 space-y-3">
                <h3 className="text-lg font-semibold text-gray-800">Sold By</h3>
                <div className="flex items-center gap-3">
                    <UserCircleIcon className="h-6 w-6 text-gray-500"/>
                    <span className="text-gray-700">{product.sellerName}</span>
                </div>
                <div className="flex items-center gap-3">
                    <EnvelopeIcon className="h-6 w-6 text-gray-500"/>
                    <span className="text-gray-700">{product.sellerEmail}</span>
                </div>
            </div>

            <div className="mt-4 flex flex-col gap-4">
              {userRole !== 'SELLER' && (
                  <button onClick={handleAddToCart} disabled={isCartLoading || isOutOfStock} className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed">
                    <ShoppingCartIcon className="h-6 w-6" />
                    {isOutOfStock ? 'Out of Stock' : (isCartLoading ? 'Adding...' : 'Add to Cart')}
                  </button>
              )}
              <ContactSellerButton 
                sellerId={product.sellerId}
                productName={product.name}
              />
            </div>
          </div>
        </div>
        {/* Reviews Section */}
        <div className="mt-12 pt-8 border-t border-gray-200 bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h2>
          {reviews.length > 0 ? (
            <div className="space-y-6">{reviews.map(review => <ReviewCard key={review.id} review={review} />)}</div>
          ) : (
            <p className="text-gray-600 py-4">No reviews yet for this product. Be the first to write one!</p>
          )}

          {(() => {
            if (isAuthenticated && userRole === 'BUYER') {
              if (hasPurchased) {
                return (
                  <div className="mt-10 pt-6 border-t border-gray-200">
                    <AddReviewForm onSubmitReview={handleReviewSubmit} />
                  </div>
                );
              }
              return (
                <p className="mt-8 text-sm text-gray-600 py-4">
                  You must purchase this item to write a review.
                </p>
              );
            } else if (userRole !== 'SELLER') {
              return (
                <p className="mt-8 text-sm text-gray-600 py-4">
                  <button onClick={() => openModal('signin')} className="text-blue-600 hover:underline font-medium">Sign in</button> as a buyer to write a review.
                </p>
              );
            }
            return null;
          })()}
        </div>
      </div>
    </div>
  );
}