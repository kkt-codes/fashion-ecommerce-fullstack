import React from "react";
import { Link } from "react-router-dom";
import { 
    ShoppingCartIcon, 
    HeartIcon as HeartOutlineIcon,
    StarIcon // For empty stars in rating display
} from "@heroicons/react/24/outline";
import { 
    HeartIcon as HeartSolidIcon,
    StarIcon as StarSolidIconFull // For filled stars in rating display
} from "@heroicons/react/24/solid"; 
import { useCart } from "../context/CartContext";
import { useFavorites } from "../context/FavoritesContext"; 
import { useAuthContext } from "../context/AuthContext"; 
import { useSignupSigninModal } from "../hooks/useSignupSigninModal"; 
import toast from "react-hot-toast";

// Base URL for your backend API. Adjust if your backend is hosted elsewhere.
// This is generally better managed in a central config file or environment variables.
const API_BASE_URL = 'http://localhost:8080'; // Example: Replace with your actual backend URL

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites(); 
  
  const { isAuthenticated, userRole, isLoading: authIsLoading } = useAuthContext(); 
  const { openModal, switchToTab } = useSignupSigninModal();

  // Fallback for product prop while data might be loading in parent
  if (!product) {
    return (
        <div className="border border-gray-200 rounded-lg shadow-md p-4 animate-pulse bg-gray-100 h-full flex flex-col">
            <div className="w-full h-56 bg-gray-300 rounded mb-3"></div>
            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2 mt-auto"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-6 bg-gray-300 rounded w-1/3 mb-3"></div>
            <div className="h-10 bg-gray-300 rounded-md"></div>
        </div>
    );
  }

  // The 'product' prop is now expected to align with the backend ProductDto.
  // Key fields from ProductDto:
  // product.id (Long)
  // product.name (String)
  // product.description (String)
  // product.price (float)
  // product.category (String)
  // product.photoUrl (String) - Used for the image
  // product.sellerId (String)
  // product.averageRating (float)
  // product.numOfReviews (int) - Used for the number of reviews

  const isCurrentlyFavorite = product ? isFavorite(product.id) : false;

  const handleAddToCart = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    // The addToCart function in CartContext will be responsible for making the API call
    // It will need product.id and potentially user.id from AuthContext.
    addToCart(product, 1); 
    toast.success(`${product.name} added to cart!`);
  };

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated || userRole !== 'Buyer') {
      toast.error("Please sign in as a Buyer to add to favorites.");
      if (!isAuthenticated) { 
        switchToTab("signin");
        openModal();
      }
      return;
    }
    // The toggleFavorite function in FavoritesContext will handle its logic.
    // If it needs to call a backend, that logic will reside in the context.
    toggleFavorite(product); 
  };

  const renderRating = (avgRating = 0, numReviews = 0) => {
    if (numReviews === 0) {
      return <div className="h-5 text-xs text-gray-400 italic">No reviews yet</div>; 
    }
    const stars = [];
    const fullStars = Math.floor(avgRating);
    // Visual for half-star can be tricky; for simplicity, we use full/empty or slightly adjusted full.
    // Backend provides float for averageRating.
    const roundedRating = Math.round(avgRating * 2) / 2; // Rounds to nearest .0 or .5

    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) { // If current star is less than or equal to the rounded rating
        stars.push(<StarSolidIconFull key={`star-solid-${i}-${product.id}`} className="h-4 w-4 text-yellow-400" />);
      } else if (i - 0.5 === roundedRating) { // For .5 ratings, show a half-opacity star (visual cue)
         stars.push(<StarSolidIconFull key={`star-half-${i}-${product.id}`} className="h-4 w-4 text-yellow-400 opacity-70" />);
      }
      else {
        stars.push(<StarIcon key={`star-empty-${i}-${product.id}`} className="h-4 w-4 text-gray-300" />);
      }
    }
    return (
      <div className="flex items-center" title={`${avgRating.toFixed(1)} out of 5 stars`}>
        {stars}
        <span className="ml-1.5 text-xs text-gray-500">({numReviews})</span>
      </div>
    );
  };

  // Construct the image URL.
  // The backend's product.photoUrl is expected to be the full URL to the image
  // (e.g., "http://localhost:8080/api/products/image/product_1_image.png")
  // or a relative path if the frontend and backend are served from the same domain.
  // If product.photoUrl is just a filename, you might need to prepend API_BASE_URL.
  // The current backend setup seems to provide a full URL via ServletUriComponentsBuilder.
  const imageUrl = product.photoUrl ? product.photoUrl : '/assets/placeholder.png';


  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col bg-white h-full">
      <Link to={`/products/${product.id}`} className="block group relative">
        <img
          src={imageUrl} // Use the potentially backend-provided photoUrl
          alt={product.name}
          className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { e.target.onerror = null; e.target.src = '/assets/placeholder.png'; }} // Fallback for broken image URLs
        />
        {!authIsLoading && (
            <button
              onClick={handleToggleFavorite}
              className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full shadow-md transition-colors duration-200 z-10 focus:outline-none focus:ring-2 focus:ring-red-400"
              aria-label={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
              title={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isCurrentlyFavorite && isAuthenticated && userRole === 'Buyer' ? ( 
                <HeartSolidIcon className="h-6 w-6 text-red-500" />
              ) : (
                <HeartOutlineIcon className="h-6 w-6 text-gray-500 hover:text-red-500" />
              )}
            </button>
        )}
      </Link>
      <div className="p-4 flex flex-col flex-grow">
        <h3 className="text-md sm:text-lg font-semibold text-gray-800 truncate mb-1" title={product.name}>
            <Link to={`/products/${product.id}`} className="hover:text-blue-600 transition-colors">
                {product.name}
            </Link>
        </h3>
        <p className="text-sm text-gray-500 mb-2 capitalize">{product.category}</p>
        
        <div className="mb-2 h-5"> 
            {/* Use product.averageRating and product.numOfReviews from backend DTO */}
            {renderRating(product.averageRating, product.numOfReviews)}
        </div>

        <p className="text-lg sm:text-xl font-bold text-blue-600 mb-3">
          ${product.price ? product.price.toFixed(2) : '0.00'}
        </p>
        <div className="mt-auto pt-2"> 
          {!authIsLoading && (
            <button
                onClick={handleAddToCart}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300 font-semibold text-sm shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
            >
                <ShoppingCartIcon className="h-5 w-5" />
                Add to Cart
            </button>
          )}
          {authIsLoading && (
             <div className="w-full flex items-center justify-center gap-2 bg-gray-300 text-white py-2.5 px-4 rounded-md font-semibold text-sm shadow cursor-not-allowed">
                <ShoppingCartIcon className="h-5 w-5" />
                Add to Cart
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
