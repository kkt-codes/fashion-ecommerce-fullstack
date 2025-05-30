import React, { useEffect, useState, useCallback } from "react";
import { Link, useParams } from "react-router-dom";
import ContactSellerButton from "../components/ContactSellerButton";
import ReviewCard from "../components/ReviewCard"; 
import AddReviewForm from "../components/AddReviewForm"; 
import { useAuthContext } from "../context/AuthContext";
import { useCart } from "../context/CartContext"; 
import { useFavorites } from "../context/FavoritesContext";
import { useSignupSigninModal } from "../hooks/useSignupSigninModal";
// Removed useFetchCached and invalidateCacheEntry
import toast from 'react-hot-toast'; 
import { 
    HeartIcon as HeartOutlineIcon, 
    ShoppingCartIcon, 
    StarIcon as StarOutlineIcon, // Renamed for clarity
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import { HeartIcon as HeartSolidIcon, StarIcon as StarSolidIcon } from "@heroicons/react/24/solid"; // Renamed for clarity

const API_BASE_URL = 'http://localhost:8080/api';

export default function ProductDetails() {
  const { id: productId } = useParams(); 
  
  const [product, setProduct] = useState(null);
  const [currentProductReviews, setCurrentProductReviews] = useState([]); 
  const [quantity, setQuantity] = useState(1);
  
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productError, setProductError] = useState(null);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  
  const { addToCart } = useCart();
  // Assuming FavoritesContext is now backend-integrated
  const { isFavorite, toggleFavorite, isLoadingFavorites } = useFavorites(); 
  
  const { isAuthenticated, currentUser, userRole, isLoading: authIsLoading } = useAuthContext(); 
  const { openModal, switchToTab } = useSignupSigninModal();

  // Fetch product details
  const fetchProductData = useCallback(async () => {
    setIsLoadingProduct(true);
    setProductError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: "Product not found or error fetching details." }));
        throw new Error(errData.message || `Error: ${response.statusText}`);
      }
      const fetchedProduct = await response.json(); // ProductDto
      setProduct(fetchedProduct);
      setQuantity(1); // Reset quantity when product changes
    } catch (err) {
      console.error("ProductDetails: Error fetching product:", err);
      setProductError(err.message);
      setProduct(null);
      toast.error(err.message || "Could not load product details.");
    } finally {
      setIsLoadingProduct(false);
    }
  }, [productId]);

  // Fetch product reviews
  const fetchProductReviews = useCallback(async () => {
    if (!productId) return;
    setIsLoadingReviews(true);
    setReviewsError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/reviews/product/${productId}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: "Failed to load reviews." }));
        throw new Error(errData.message);
      }
      const reviewsData = await response.json(); // Expects List<ReviewDto>
      setCurrentProductReviews(reviewsData || []);
    } catch (err) {
      console.error("ProductDetails: Error fetching reviews:", err);
      setReviewsError(err.message);
      setCurrentProductReviews([]);
      // Don't toast for review fetch error initially, page can still function
    } finally {
      setIsLoadingReviews(false);
    }
  }, [productId]);

  useEffect(() => {
    if (productId) {
      fetchProductData();
      fetchProductReviews();
    }
  }, [productId, fetchProductData, fetchProductReviews]);

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (newQuantity >= 1) setQuantity(newQuantity);
  };

  const handleAddToCart = () => {
    if (product) {
      addToCart(product, quantity); // addToCart from CartContext now handles backend
      // Toast message is handled within CartContext or here if preferred
    }
  };

  const handleToggleFavorite = () => {
    if (!product) return;
    // Auth check is handled by toggleFavorite in FavoritesContext if backend integrated
    // If FavoritesContext is still localStorage based, keep auth check here.
    // Assuming FavoritesContext is backend-integrated:
    toggleFavorite(product); 
  };

  const handleReviewSubmit = async (reviewData) => { // reviewData: { rating, comment }
    if (!product || !currentUser?.id || userRole !== 'Buyer') {
      toast.error("You must be signed in as a Buyer to submit a review.");
      if (!isAuthenticated) {
        switchToTab("signin");
        openModal();
      }
      return Promise.reject(new Error("User not authenticated as Buyer or product not loaded."));
    }

    const loadingToastId = toast.loading("Submitting your review...");
    try {
      // Backend ReviewDto for request: { productId, userId, rating, comment, date }
      // Date is set by backend. productId and userId are path/query params.
      const reviewPayload = {
        rating: reviewData.rating,
        comment: reviewData.comment,
        // productId and userId are part of the URL
      };

      const response = await fetch(`${API_BASE_URL}/reviews/product/${product.id}/user/${currentUser.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewPayload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ message: "Failed to submit review." }));
        throw new Error(errData.message);
      }
      
      // const newReview = await response.json(); // Backend returns created ReviewDto
      toast.success("Review submitted successfully! Thank you.", { id: loadingToastId });
      fetchProductReviews(); // Refresh reviews list
      fetchProductData(); // Refresh product data to get updated averageRating and numOfReviews
      return Promise.resolve(); 
    } catch (error) {
      console.error("Error submitting review:", error);
      toast.error(error.message || "Could not submit review. Please try again.", { id: loadingToastId });
      return Promise.reject(error); 
    }
  };

  const renderAverageRatingStars = (avgRating = 0, numReviews = 0) => {
    if (numReviews === 0) {
      return <span className="text-sm text-gray-500">No reviews yet</span>;
    }
    const stars = [];
    const fullStars = Math.floor(avgRating);
    // Simplified half-star rendering, backend provides float for averageRating
    const roundedRating = Math.round(avgRating * 2) / 2;


    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<StarSolidIcon key={`star-solid-${i}-${product?.id}`} className="h-5 w-5 text-yellow-400" />);
      } else if (i - 0.5 === roundedRating && avgRating % 1 !== 0) { 
        // Basic visual for half-star, could use a dedicated half-star icon
         stars.push(
          <div key={`star-half-${i}-${product?.id}`} className="relative inline-block">
            <StarOutlineIcon className="h-5 w-5 text-yellow-400" />
            <div className="absolute top-0 left-0 h-full w-1/2 overflow-hidden">
              <StarSolidIcon className="h-5 w-5 text-yellow-400" />
            </div>
          </div>
        );
      }
      else {
        stars.push(<StarOutlineIcon key={`star-empty-${i}-${product?.id}`} className="h-5 w-5 text-gray-300" />); 
      }
    }
    return (
      <div className="flex items-center">
        {stars}
        <span className="ml-2 text-sm text-gray-600">
          {avgRating.toFixed(1)} ({numReviews} review{numReviews !== 1 ? 's' : ''})
        </span>
      </div>
    );
  };

  if (authIsLoading || isLoadingProduct) {
    return (
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p className="text-gray-500 text-lg animate-pulse">Loading product details...</p>
      </div>
    );
  }

  if (productError) {
    return (
      <div className="flex flex-col justify-center items-center min-h-[calc(100vh-10rem)] text-center px-4">
        <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
        <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading Product</h1>
        <p className="text-gray-600 mb-6">{productError}</p>
        <Link to="/products" className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            View All Products
        </Link>
      </div>
    );
  }
  
  if (!product) { 
    return ( // This state might be hit briefly or if productError didn't set but product is null
      <div className="flex justify-center items-center min-h-[calc(100vh-10rem)]">
        <p className="text-gray-500">Product details are currently unavailable.</p>
      </div>
    );
  }

  // isFavorite check now uses isLoadingFavorites from context
  const isCurrentlyFavorite = !isLoadingFavorites && product ? isFavorite(product.id) : false;

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-start mb-12">
          <div className="shadow-xl rounded-lg overflow-hidden bg-white relative">
              <img
                src={product.photoUrl || '/assets/placeholder.png'} 
                alt={product.name}
                className="w-full h-auto md:min-h-[450px] max-h-[650px] object-cover"
                onError={(e) => { e.target.onerror = null; e.target.src = '/assets/placeholder.png'; }}
              />
              {(!authIsLoading && userRole !== 'Seller') && (
                <button
                    onClick={handleToggleFavorite}
                    disabled={isLoadingFavorites}
                    className="absolute top-4 right-4 p-2.5 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full shadow-lg transition-all duration-200 z-10 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50"
                    aria-label={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
                >
                    {isCurrentlyFavorite ? (
                      <HeartSolidIcon className="h-7 w-7 text-red-500" />
                    ) : (
                      <HeartOutlineIcon className="h-7 w-7 text-gray-600 hover:text-red-500" />
                    )}
                </button>
              )}
          </div>

          <div className="flex flex-col gap-5"> 
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-800">{product.name}</h1>
            <div className="mt-1 mb-2">
              {/* Use product.averageRating and product.numOfReviews from ProductDto */}
              {renderAverageRatingStars(product.averageRating, product.numOfReviews)}
            </div>
            <p className="text-3xl text-blue-600 font-bold">${product.price.toFixed(2)}</p>
            
            <div className="prose prose-sm sm:prose-base text-gray-700 leading-relaxed max-w-none">
              <h3 className="text-lg font-semibold text-gray-800 mb-1">Description:</h3>
              <p>{product.description}</p>
            </div>
            
            <p className="text-sm text-gray-500">
              Category: <span className="font-medium text-gray-700">{product.category}</span>
            </p>

            <div className="flex items-center gap-3 mt-2">
              <label htmlFor="quantity" className="font-semibold text-gray-700">Quantity:</label>
              <input
                type="number" id="quantity" name="quantity" value={quantity}
                onChange={handleQuantityChange} min="1"
                className="border border-gray-300 rounded-md w-20 p-2 text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="mt-4 space-y-3">
              {(!authIsLoading && userRole !== 'Seller') && (
                <button
                    onClick={handleAddToCart}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300 text-lg font-semibold shadow-md hover:shadow-lg"
                >
                    <ShoppingCartIcon className="h-6 w-6" />
                    Add to Cart
                </button>
              )}
              {/* product.sellerId is from ProductDto */}
              {product.sellerId && (!authIsLoading && userRole === 'Buyer') && ( 
                  <ContactSellerButton 
                      sellerId={product.sellerId} 
                      sellerName={`Seller (ID: ${product.sellerId.substring(0,8)}...)`} // Placeholder name
                      productName={product.name} 
                      productId={product.id}
                  />
              )}
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Customer Reviews</h2>
          {isLoadingReviews && <p className="text-gray-500">Loading reviews...</p>}
          {!isLoadingReviews && reviewsError && <p className="text-red-500">Could not load reviews: {reviewsError}</p>}
          {!isLoadingReviews && !reviewsError && currentProductReviews.length > 0 ? (
            <div className="space-y-6">
              {currentProductReviews.map(review => ( // review is ReviewDto
                <ReviewCard key={review.id} review={review} />
              ))}
            </div>
          ) : (
            !isLoadingReviews && !reviewsError && <p className="text-gray-600 py-4">No reviews yet for this product. Be the first to write one!</p>
          )}

          {!authIsLoading && isAuthenticated && userRole === 'Buyer' && currentUser && (
            <div className="mt-10 pt-6 border-t border-gray-200">
              <AddReviewForm 
                productId={product.id} 
                onSubmitReview={handleReviewSubmit} 
              />
            </div>
          )}
          {!authIsLoading && !isAuthenticated && (
            <p className="mt-8 text-sm text-gray-600 py-4">
              <button onClick={() => { switchToTab('signin'); openModal(); }} className="text-blue-600 hover:underline font-medium">Sign in</button> to write a review.
            </p>
          )}
           {!authIsLoading && isAuthenticated && userRole === 'Seller' && (
            <p className="mt-8 text-sm text-gray-600 py-4 bg-yellow-50 p-3 rounded-md border border-yellow-200">
              Review submission is available for Buyer accounts.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
