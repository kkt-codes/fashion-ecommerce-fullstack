import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon as EmptyHeartIcon, ShoppingBagIcon } from '@heroicons/react/24/outline';

import Sidebar from '../../components/Sidebar';
import ProductCard from '../../components/ProductCard';
import { useAuth } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext';

/**
 * Renders the page displaying the current buyer's favorited products.
 * Data is fetched and managed by the FavoritesContext.
 */
export default function BuyerFavoritesPage() {
  const { isLoading: isAuthLoading } = useAuth();
  const { favoriteItems, isLoading, error, refetchFavorites } = useFavorites();

  // The main loading state for the page depends on auth check and favorites fetching.
  const isPageLoading = isAuthLoading || isLoading;

  const renderContent = () => {
    if (isPageLoading) {
      return (
        <div className="flex justify-center items-center flex-1">
            <div className="flex flex-col items-center">
                <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <p className="text-gray-500 text-lg">Loading Your Favorites...</p>
            </div>
        </div>
      );
    }
    
    if (error) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow-md flex-1">
                <h2 className="text-xl font-semibold text-red-600 mb-2">Could Not Load Favorites</h2>
                <p className="text-gray-500 mb-6">There was an error fetching your favorite items. Please try again.</p>
                <button 
                    onClick={refetchFavorites} 
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (favoriteItems.length > 0) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-8">
          {favoriteItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      );
    }

    return (
      <div className="text-center py-16 bg-white rounded-xl shadow-md flex-1">
        <EmptyHeartIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">Your Favorites List is Empty</h2>
        <p className="text-gray-500 mb-6">
          Click the heart icon on any product to save it here for later.
        </p>
        <Link
          to="/products"
          className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors duration-300"
        >
          <ShoppingBagIcon className="h-5 w-5" />
          Explore Products
        </Link>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 flex flex-col">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
              <EmptyHeartIcon className="h-8 w-8 mr-3 text-red-500" />
              My Favorites
            </h1>
            {!isPageLoading && !error && (
                <p className="text-sm text-gray-500 mt-1">
                    You have {favoriteItems.length} item(s) saved as favorites.
                </p>
            )}
          </div>
          <button 
            onClick={refetchFavorites} 
            className="px-4 py-2 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            disabled={isLoading}
            title="Refresh favorites list"
          >
            {isLoading ? 'Refreshing...' : 'Refresh'}
          </button>
        </header>
        
        {renderContent()}
        
      </main>
    </div>
  );
}