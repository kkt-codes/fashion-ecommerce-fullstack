import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShoppingCartIcon,
  HeartIcon as HeartOutlineIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import {
  HeartIcon as HeartSolidIcon,
  StarIcon as StarSolidIconFull,
} from '@heroicons/react/24/solid';
import toast from 'react-hot-toast';

import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useSignupSigninModal } from '../hooks/useSignupSigninModal';

/**
 * Renders a single product card with actions to add to cart and toggle favorites.
 */
export default function ProductCard({ product }) {
  const { isAuthenticated, currentUser, isLoading: isAuthLoading } = useAuth();
  const { addToCart, isLoading: isCartLoading } = useCart();
  const { isFavorite, toggleFavorite, isLoading: isFavoritesLoading } = useFavorites();
  const { openModal } = useSignupSigninModal();

  // A loading skeleton shown if the product data isn't ready.
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

  const isCurrentlyFavorite = isFavorite(product.id);

  const handleAddToCart = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error("Please log in to add items to your cart.");
      openModal('signin');
      return;
    }
    
    if (currentUser?.role !== 'BUYER') {
        toast.error("Only buyers can add items to the cart.");
        return;
    }

    if (isCartLoading) return;
    addToCart(product, 1);
  };

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // The toggleFavorite function in the context already handles auth checks and prompts.
    toggleFavorite(product);
  };

  // Renders the star rating display for a product.
  const renderRating = (avgRating = 0, numReviews = 0) => {
    if (numReviews === 0) {
      return <div className="h-5 text-xs text-gray-400 italic">No reviews yet</div>;
    }
    
    const stars = [];
    const roundedRating = Math.round(avgRating);

    for (let i = 1; i <= 5; i++) {
      stars.push(
        i <= roundedRating ? (
          <StarSolidIconFull key={`star-solid-${i}`} className="h-4 w-4 text-yellow-400" />
        ) : (
          <StarIcon key={`star-empty-${i}`} className="h-4 w-4 text-gray-300" />
        )
      );
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
          src={product.photoUrl && product.photoUrl.startsWith('http') ? product.photoUrl : `http://localhost:8080${product.photoUrl || ''}` || '/assets/placeholder.png'}
          alt={product.name}
          className="w-full h-56 object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => { e.target.onerror = null; e.target.src = '/assets/placeholder.png'; }}
        />
        {!isAuthLoading && isAuthenticated && currentUser?.role === 'BUYER' && (
            <button
              onClick={handleToggleFavorite}
              disabled={isFavoritesLoading}
              className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm hover:bg-white rounded-full shadow-md transition-colors duration-200 z-10 focus:outline-none focus:ring-2 focus:ring-red-400 disabled:opacity-50"
              aria-label={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
              title={isCurrentlyFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              {isCurrentlyFavorite ? (
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
            {renderRating(product.averageRating, product.numOfReviews)}
        </div>

        <p className="text-lg sm:text-xl font-bold text-blue-600 mb-3">
          ${product.price !== undefined ? product.price.toFixed(2) : "N/A"}
        </p>

        <div className="mt-auto pt-2"> 
          {isAuthLoading ? (
             <div className="w-full flex items-center justify-center gap-2 bg-gray-300 text-gray-500 py-2.5 px-4 rounded-md font-semibold text-sm shadow cursor-not-allowed">
                <ShoppingCartIcon className="h-5 w-5" />
                Add to Cart
            </div>
          ) : (
            <button
                onClick={handleAddToCart}
                disabled={isCartLoading || currentUser?.role !== 'BUYER'}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 px-4 rounded-md hover:bg-blue-700 transition-colors duration-300 font-semibold text-sm shadow hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 disabled:opacity-70 disabled:bg-gray-400"
                title={currentUser?.role !== 'BUYER' ? 'Only buyers can add to cart' : 'Add to Cart'}
            >
                <ShoppingCartIcon className="h-5 w-5" />
                Add to Cart
            </button>
          )}
        </div>
      </div>
    </div>
  );
}