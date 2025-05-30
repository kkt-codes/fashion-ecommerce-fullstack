import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import ProductCard from '../../components/ProductCard';
import { useAuthContext } from '../../context/AuthContext';
import { useFavorites } from '../../context/FavoritesContext'; // Will use backend-integrated version
// Removed useFetchCached
import { 
  HeartIcon as SolidHeartIcon, // For header
  HeartIcon as EmptyHeartIcon, // For empty state
  ShoppingBagIcon,
  ChartBarIcon, 
  ListBulletIcon, 
  ChatBubbleLeftEllipsisIcon, 
  UserCircleIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline"; 
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:8080/api';

export default function BuyerFavoritesPage() {
  const { currentUser, isAuthenticated, userRole, isLoading: isAuthLoading } = useAuthContext();
  // favoriteProductIds comes from FavoritesContext, which fetches from backend
  const { favoriteProductIds, isLoadingFavorites, refreshFavorites } = useFavorites();

  const [allProducts, setAllProducts] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const buyerLinks = [
    { label: "Dashboard", path: "/buyer/dashboard", icon: ChartBarIcon },
    { label: "My Orders", path: "/buyer/orders", icon: ListBulletIcon },
    { label: "Messages", path: "/buyer/messages", icon: ChatBubbleLeftEllipsisIcon },
    { label: "My Profile", path: "/buyer/profile", icon: UserCircleIcon },
    { label: "My Favorites", path: "/buyer/favorites", icon: SolidHeartIcon }, 
  ];
  
  // Fetch all products (or a relevant subset) to find details of favorited items
  const fetchAllProductsForFavorites = useCallback(async () => {
    setIsLoadingProducts(true);
    setProductsError(null);
    try {
      // Fetching all products might be inefficient for large catalogs.
      // Consider pagination or a dedicated endpoint if performance becomes an issue.
      // For now, let's fetch a limited number, e.g., 100, assuming favorites will be within this set.
      // Or, if favoriteProductIds is available, one could fetch products by those IDs if backend supports it.
      // Current backend ProductController doesn't support GET /api/products?ids=1,2,3
      const response = await fetch(`${API_BASE_URL}/products?page=0&size=200`); // Fetch up to 200 products
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to load product data." }));
        throw new Error(errorData.message);
      }
      const productPage = await response.json(); // Page<ProductDto>
      setAllProducts(productPage.content || []);
    } catch (error) {
      console.error("BuyerFavoritesPage: Error fetching all products:", error);
      setProductsError(error.message);
      toast.error("Could not load product data to display favorites.");
      setAllProducts([]);
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated && userRole === 'Buyer') {
      // Refresh favorites from backend (in case they changed in another tab/device)
      if (refreshFavorites) refreshFavorites(); 
      fetchAllProductsForFavorites();
    } else {
      setAllProducts([]);
      setIsLoadingProducts(false);
    }
  }, [isAuthenticated, userRole, fetchAllProductsForFavorites, refreshFavorites]);

  // Effect to filter products once allProducts and favoriteProductIds are available
  useEffect(() => {
    if (isAuthLoading || isLoadingFavorites || isLoadingProducts) {
      return; // Wait for all data sources
    }

    if (isAuthenticated && userRole === 'Buyer' && allProducts.length > 0 && favoriteProductIds.size > 0) {
      const likedProducts = allProducts.filter(product => favoriteProductIds.has(String(product.id)));
      setFavoriteProducts(likedProducts);
    } else {
      setFavoriteProducts([]); // Clear if not a buyer, no products, or no favorites
    }
  }, [allProducts, favoriteProductIds, isAuthenticated, userRole, isAuthLoading, isLoadingFavorites, isLoadingProducts]);

  const userName = currentUser?.firstname || "Buyer";

  // Overall loading state for the page
  if (isAuthLoading || isLoadingFavorites || isLoadingProducts) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar links={buyerLinks} userRole="Buyer" userName={userName} />
        <main className="flex-1 p-6 sm:p-8 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-red-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-lg">Loading Your Favorites...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'Buyer') {
    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar links={buyerLinks} userRole="Buyer" userName={userName} />
            <main className="flex-1 p-6 sm:p-8 flex flex-col justify-center items-center text-center">
                <EmptyHeartIcon className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
                <p className="text-gray-600">Please sign in as a Buyer to view your favorites.</p>
            </main>
        </div>
    );
  }
  
  if (productsError && !isLoadingProducts) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar links={buyerLinks} userRole="Buyer" userName={userName} />
        <main className="flex-1 p-6 sm:p-8 text-center">
          <div className="py-12 bg-red-50 p-6 rounded-xl shadow">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Product Data</h2>
            <p className="text-red-500">{productsError}</p>
            <button 
                onClick={fetchAllProductsForFavorites} 
                className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
                Try Again
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar links={buyerLinks} userRole="Buyer" userName={userName} />
      <main className="flex-1 p-6 sm:p-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
            <SolidHeartIcon className="h-8 w-8 mr-3 text-red-500" />
            My Favorite Products
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Here are the items you've saved. Click on any product to view details or add to cart.
          </p>
        </header>

        {favoriteProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 xl:gap-8">
            {favoriteProducts.map((product) => (
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
