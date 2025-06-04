import React from 'react'; // Removed useEffect, useState as data comes from context
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import ProductCard from '../../components/ProductCard';
import { useAuthContext } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';
import { 
    HeartIcon as EmptyHeartIcon, 
    ShoppingBagIcon,
    ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';

export default function BuyerFavoritesPage() {
  const { currentUser, isAuthenticated, userRole, isLoading: isAuthLoading } = useAuthContext();
  // favoriteItems is now an array of ProductDto objects, isLoadingFavorites is from context
  const { favoriteItems, isLoadingFavorites, refetchFavorites } = useFavorites();

  // Combined loading state for the page
  // Show loading if auth is resolving OR favorites are actively being fetched
  const isLoadingPage = isAuthLoading || isLoadingFavorites;

  if (isLoadingPage) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-lg">Loading Your Favorites...</p>
          </div>
        </main>
      </div>
    );
  }

  // This check should ideally be handled by BuyerProtectedRoute
  if (!isAuthenticated || userRole !== 'BUYER') {
    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <main className="flex-1 p-6 sm:p-8 flex flex-col justify-center items-center text-center">
                <EmptyHeartIcon className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
                <p className="text-gray-600">Please sign in as a Buyer to view your favorites.</p>
            </main>
        </div>
    );
  }
  
  // No specific productsError state here, assuming useFavorites handles API errors with toasts
  // and returns an empty favoriteItems array on error.

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar /> {/* Sidebar gets user info from AuthContext */}
      <main className="flex-1 p-6 sm:p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
                <EmptyHeartIcon className="h-8 w-8 mr-3 text-red-500" /> {/* Using EmptyHeartIcon as main icon */}
                My Favorite Products
            </h1>
            <p className="text-sm text-gray-500 mt-1">
                You have {favoriteItems.length} item(s) saved as favorites.
            </p>
          </div>
          <button 
            onClick={refetchFavorites} 
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoadingFavorites}
            title="Refresh favorites list"
          >
            {isLoadingFavorites ? 'Refreshing...' : 'Refresh'}
          </button>
        </header>

        {favoriteItems.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-8">
            {favoriteItems.map((product) => (
              // ProductCard expects product.photoUrl
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <EmptyHeartIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Your Favorites List is Empty</h2>
            <p className="text-gray-500 mb-6">
              Looks like you haven't added any products to your favorites yet.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors duration-300"
            >
              <ShoppingBagIcon className="h-5 w-5" />
              Explore Products
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
