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

export default function ProductCard({ product }) {
  const { addToCart, isLoading: isCartLoading } = useCart(); // Get cart loading state
  const { isFavorite, toggleFavorite, isLoadingFavorites } = useFavorites(); 
  const { isAuthenticated, userRole, isLoading: authIsLoading } = useAuthContext(); 
  const { openModal, switchToTab } = useSignupSigninModal();

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

  // Backend ProductDto fields: id, name, description, price, category, photoUrl, sellerId, averageRating, numOfReviews
  const isCurrentlyFavorite = product ? isFavorite(product.id) : false;

  const handleAddToCart = (e) => {
    e.preventDefault(); 
    e.stopPropagation(); 
    if (isCartLoading) return; // Prevent multiple clicks while cart is processing
    addToCart(product, 1); // addToCart in CartContext now handles API calls and toasts
  };

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isLoadingFavorites || authIsLoading) return; // Prevent multiple clicks

    // The toggleFavorite function from FavoritesContext already handles
    // checking for isAuthenticated and userRole === 'BUYER' and prompting login.
    toggleFavorite(product); 
  };

  const renderRating = (avgRating = 0, numReviews = 0) => {
    if (numReviews === 0) {
      return <div className="h-5 text-xs text-gray-400 italic">No reviews yet</div>; 
    }
    const stars = [];
    // Use Math.round for a common visual representation of average ratings
    const roundedRating = Math.round(avgRating * 2) / 2; // Rounds to nearest .0 or .5

    for (let i = 1; i <= 5; i++) {
      if (i <= roundedRating) {
        stars.push(<StarSolidIconFull key={`star-solid-${i}-${product.id}`} className="h-4 w-4 text-yellow-400" />);
      } else if (i - 0.5 === roundedRating) { // For half stars if you have a half-star icon
        // For simplicity, if you don't have a distinct half-star icon,
        // this block can be merged or adjusted. Current logic uses full/empty.
        // Using StarSolidIconFull with opacity or a dedicated half-star icon would be an improvement.
        // For now, let's stick to full or outline based on roundedRating.
         stars.push(<StarSolidIconFull key={`star-half-visual-${i}-${product.id}`} className="h-4 w-4 text-yellow-400 opacity-70" />); // Example for half-star visual
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

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col bg-white h-full">
      <Link to={`/products/${product.id}`} className="block group relative">
        <img
          src={product.photoUrl || '/assets/placeholder.png'} // Use photoUrl from backend
          alt={product.name}
          className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { e.target.onerror = null; e.target.src = '/assets/placeholder.png'; }} // Fallback for broken image links
        />
        {!authIsLoading && ( // Show favorite button only when auth state is resolved
            <button
              onClick={handleToggleFavorite}
              disabled={isLoadingFavorites} // Disable while processing favorite action
              className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full shadow-md transition-colors duration-200 z-10 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
              aria-label={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
              title={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isCurrentlyFavorite ? ( // isFavorite already checks isAuthenticated and role via context logic if needed
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
                {product.name || "Product Name Unavailable"}
            </Link>
        </h3>
        <p className="text-sm text-gray-500 mb-2 capitalize">{product.category || "Uncategorized"}</p>
        
        <div className="mb-2 h-5"> 
            {renderRating(product.averageRating, product.numberOfReviews)}
        </div>

        <p className="text-lg sm:text-xl font-bold text-blue-600 mb-3">
          ${product.price !== undefined ? product.price.toFixed(2) : "N/A"}
        </p>
        <div className="mt-auto pt-2"> 
          {!authIsLoading && (
            <button
                onClick={handleAddToCart}
                disabled={isCartLoading} // Disable while cart operation is in progress
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300 font-semibold text-sm shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-70"
            >
                <ShoppingCartIcon className="h-5 w-5" />
                Add to Cart
            </button>
          )}
          {authIsLoading && ( // Show a disabled-like state while auth is still loading
             <div className="w-full flex items-center justify-center gap-2 bg-gray-300 text-gray-500 py-2.5 px-4 rounded-md font-semibold text-sm shadow cursor-not-allowed">
                <ShoppingCartIcon className="h-5 w-5" />
                Add to Cart
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
