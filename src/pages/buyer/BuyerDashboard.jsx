import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar"; // Sidebar now gets its own context data
import { useAuthContext } from "../../context/AuthContext";
import ProductCard from "../../components/ProductCard";
import apiClient from "../../services/api"; // For API calls
import {
  ShoppingCartIcon,
  ChatBubbleLeftEllipsisIcon,
  UserCircleIcon,
  HeartIcon,
  ChartBarIcon,
  ListBulletIcon,
  ExclamationTriangleIcon 
} from "@heroicons/react/24/outline";

export default function BuyerDashboard() {
  const { currentUser, isLoading: isAuthLoading, userRole } = useAuthContext();

  const [recentOrders, setRecentOrders] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [messageCount, setMessageCount] = useState(0); // For unread messages
  const [totalOrders, setTotalOrders] = useState(0);
  
  const [isLoadingDashboardData, setIsLoadingDashboardData] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  useEffect(() => {
    if (isAuthLoading) {
      return; // Wait for authentication to resolve
    }

    if (currentUser && userRole === 'BUYER') {
      const fetchData = async () => {
        setIsLoadingDashboardData(true);
        setDashboardError(null);
        try {
          // Fetch recent orders (e.g., top 3 newest)
          const ordersResponse = await apiClient.get(`/orders/user/me?page=0&size=3&sort=date,DESC`);
          setRecentOrders(ordersResponse.data?.content || []);
          setTotalOrders(ordersResponse.data?.totalElements || 0);

          // Fetch recommended products (e.g., top 4 rated or random)
          const productsResponse = await apiClient.get('/products?page=0&size=4&sort=averageRating,DESC');
          setRecommendedProducts(productsResponse.data?.content || []);
          
          // Fetch unread message count (assuming a new backend endpoint)
          try {
            const messagesResponse = await apiClient.get('/chat/user/me/unread-count'); // Example endpoint
            setMessageCount(messagesResponse.data?.unreadCount || 0);
          } catch (msgError) {
            console.warn("BuyerDashboard: Could not fetch unread message count.", msgError.response?.data || msgError.message);
            setMessageCount(0); // Default to 0 if endpoint fails or doesn't exist yet
          }

        } catch (error) {
          console.error("BuyerDashboard: Error fetching dashboard data:", error.response?.data || error.message);
          setDashboardError("Could not load all dashboard data. Some sections might be unavailable.");
          // Set states to empty arrays on error to prevent issues with map
          setRecentOrders([]);
          setRecommendedProducts([]);
          setTotalOrders(0);
          setMessageCount(0);
        } finally {
          setIsLoadingDashboardData(false);
        }
      };
      fetchData();
    } else {
      // Not a buyer or not authenticated after auth check
      setIsLoadingDashboardData(false);
      setRecentOrders([]);
      setRecommendedProducts([]);
      setTotalOrders(0);
      setMessageCount(0);
    }
  }, [currentUser, userRole, isAuthLoading]);

  if (isAuthLoading || (!currentUser && isLoadingDashboardData)) { // Show loading if auth is pending or dashboard data is initial load without user
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-gray-500 animate-pulse text-lg">Loading Buyer Dashboard...</p>
      </div>
    );
  }

  if (!currentUser || userRole !== 'BUYER') {
    // This case should ideally be handled by BuyerProtectedRoute, but as a fallback:
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-red-500">Access Denied. Please sign in as a Buyer.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar no longer needs links, userRole, userName props */}
      <Sidebar /> 

      <main className="flex-1 p-6 sm:p-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Hello, {currentUser.firstName}!
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Welcome to your personal dashboard. Manage your orders, messages, and more.
          </p>
        </div>

        {dashboardError && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                <span className="font-medium">Error:</span> {dashboardError}
            </div>
        )}

        {/* Quick Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/buyer/orders" className="block bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">My Orders</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{totalOrders}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ShoppingCartIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-blue-600 mt-4 hover:underline">View all orders &rarr;</p>
          </Link>

          <Link to="/buyer/messages" className="block bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Unread Messages</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{messageCount}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-purple-600 mt-4 hover:underline">View messages &rarr;</p>
          </Link>

          <Link to="/profile/edit" className="block bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">My Profile</p>
                <p className="text-xl font-semibold text-gray-800 mt-1">Account Settings</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <UserCircleIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-green-600 mt-4 hover:underline">Edit profile &rarr;</p>
          </Link>
        </div>
        
        {/* Recent Orders Section */}
        {!isLoadingDashboardData && recentOrders.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold text-gray-700">Your Recent Orders</h2>
              <Link to="/buyer/orders" className="text-sm text-blue-600 hover:underline font-medium">View All</Link>
            </div>
            <ul className="space-y-4">
              {recentOrders.map(order => ( // Assuming order DTO has these fields
                <li key={order.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-gray-50/50">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex-grow min-w-0"> 
                      <p className="text-sm font-semibold text-gray-800 truncate" title={order.productName || 'Product Name Unavailable'}>
                        {order.productName || `Order for Product ID: ${order.productId}`}
                      </p>
                      <p className="text-xs text-gray-500">Order ID: ...{String(order.id).slice(-8)}</p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0 mt-1 sm:mt-0">
                      <p className="text-sm font-semibold text-gray-700">${order.total ? order.total.toFixed(2) : 'N/A'}</p>
                      <p className="text-xs text-gray-500">{order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
         {!isLoadingDashboardData && recentOrders.length === 0 && totalOrders > 0 && (
            <div className="bg-white p-6 rounded-xl shadow-lg text-center">
                <p className="text-gray-500">No recent orders to display, but you have <Link to="/buyer/orders" className="text-blue-600 hover:underline">{totalOrders} total order(s)</Link>.</p>
            </div>
        )}


        {/* Recommended For You Section */}
        <div className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">Just For You</h2>
            <Link to="/products" className="text-sm text-blue-600 hover:underline font-medium">Shop More</Link>
          </div>
          {isLoadingDashboardData && recommendedProducts.length === 0 && (
            <div className="text-center py-8">
              {/* Spinner for recommended products */}
              <p className="text-gray-500 mt-2">Loading recommendations...</p>
            </div>
          )}
          {!isLoadingDashboardData && dashboardError && recommendedProducts.length === 0 && (
             <div className="text-center py-8 bg-red-50 p-4 rounded-lg">
               <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-2" />
               <p className="text-red-600 font-semibold">Could not load recommendations.</p>
            </div>
          )}
          {!isLoadingDashboardData && !dashboardError && recommendedProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommendedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          {!isLoadingDashboardData && !dashboardError && recommendedProducts.length === 0 && (
             <p className="text-center text-gray-500 py-8">No specific recommendations for you right now.</p>
          )}
        </div>

        {!isLoadingDashboardData && !dashboardError && recommendedProducts.length === 0 && recentOrders.length === 0 && totalOrders === 0 && (
          <div className="bg-white p-10 rounded-xl shadow-lg text-center mt-8">
            <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-300 mb-4"/>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Your Dashboard is Quiet</h3>
            <p className="text-gray-500 mb-6">Start shopping or place an order to see activity here.</p>
            <Link to="/products" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Explore Products
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
