import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useAuthContext } from "../../context/AuthContext";
import ProductCard from "../../components/ProductCard";
// Removed useFetchCached as we'll use direct fetch calls
import {
  ShoppingCartIcon,
  ChatBubbleLeftEllipsisIcon,
  UserCircleIcon,
  HeartIcon,
  ChartBarIcon,
  ListBulletIcon,
  ExclamationTriangleIcon 
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const API_BASE_URL = 'http://localhost:8080/api'; // Ensure this is correct

export default function BuyerDashboard() {
  const { currentUser, isLoading: isAuthLoading, userRole } = useAuthContext();

  const [recentOrders, setRecentOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  const [messageCount, setMessageCount] = useState(0);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState(null);

  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const buyerLinks = [
    { label: "Dashboard", path: "/buyer/dashboard", icon: ChartBarIcon },
    { label: "My Orders", path: "/buyer/orders", icon: ListBulletIcon },
    { label: "Messages", path: "/buyer/messages", icon: ChatBubbleLeftEllipsisIcon },
    { label: "My Profile", path: "/buyer/profile", icon: UserCircleIcon },
    { label: "My Favorites", path: "/buyer/favorites", icon: HeartIcon },
  ];

  const fetchBuyerOrders = useCallback(async (userId) => {
    setOrdersLoading(true);
    setOrdersError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/user/${userId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to load orders" }));
        throw new Error(errorData.message || "Failed to load orders");
      }
      const data = await response.json(); // Expects List<Order> or List<OrderResponseDto>
      // Sort by date descending if not already sorted by backend
      const sortedOrders = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setRecentOrders(sortedOrders.slice(0, 3));
      setTotalOrders(sortedOrders.length);
    } catch (e) {
      console.error("BuyerDashboard: Error fetching orders:", e);
      setOrdersError(e.message);
      setRecentOrders([]);
      setTotalOrders(0);
      toast.error("Could not load your recent orders.");
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  const fetchUnreadMessageCount = useCallback(async (userId) => {
    setMessagesLoading(true);
    setMessagesError(null);
    let totalUnread = 0;
    try {
      // 1. Fetch all conversations
      const convResponse = await fetch(`${API_BASE_URL}/chat/user/${userId}/conversations`);
      if (!convResponse.ok) throw new Error("Failed to load conversations for message count.");
      const conversations = await convResponse.json(); // List<ConversationDto>

      // 2. For each conversation, fetch unread messages
      // This can be slow if there are many conversations.
      // A dedicated backend endpoint for total unread count would be more efficient.
      if (conversations && conversations.length > 0) {
        for (const convo of conversations) {
          const unreadResponse = await fetch(`${API_BASE_URL}/chat/conversation/${convo.id}/unread/${userId}`);
          if (unreadResponse.ok) {
            const unreadMessages = await unreadResponse.json(); // List<MessageDto>
            totalUnread += unreadMessages.length;
          } else {
            console.warn(`Failed to get unread messages for conversation ${convo.id}`);
          }
        }
      }
      setMessageCount(totalUnread);
    } catch (e) {
      console.error("BuyerDashboard: Error fetching message count:", e);
      setMessagesError(e.message);
      setMessageCount(0);
      toast.error("Could not load your message count.");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  const fetchRecommendedProducts = useCallback(async () => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      // Fetch a small number of products for recommendations, e.g., first page, default sort
      const response = await fetch(`${API_BASE_URL}/products?page=0&size=10`); // Fetch 10 products
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to load products" }));
        throw new Error(errorData.message || "Failed to load products for recommendations");
      }
      const productPage = await response.json(); // Expects Page<ProductDto>
      if (productPage && productPage.content && productPage.content.length > 0) {
        const shuffled = [...productPage.content].sort(() => 0.5 - Math.random());
        setRecommendedProducts(shuffled.slice(0, 4)); // Show 4 recommendations
      } else {
        setRecommendedProducts([]);
      }
    } catch (e) {
      console.error("BuyerDashboard: Error fetching products:", e);
      setProductsError(e.message);
      setRecommendedProducts([]);
      toast.error("Could not load product recommendations.");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return; // Wait for auth to load

    if (currentUser && userRole === 'Buyer') {
      fetchBuyerOrders(currentUser.id);
      fetchUnreadMessageCount(currentUser.id);
      fetchRecommendedProducts();
    } else {
      // Clear data if not a buyer or not logged in
      setRecentOrders([]);
      setTotalOrders(0);
      setMessageCount(0);
      setRecommendedProducts([]);
      setOrdersLoading(false);
      setMessagesLoading(false);
      setProductsLoading(false);
    }
  }, [currentUser, userRole, isAuthLoading, fetchBuyerOrders, fetchUnreadMessageCount, fetchRecommendedProducts]);

  if (isAuthLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-gray-500 animate-pulse">Loading Buyer Dashboard...</p>
      </div>
    );
  }

  if (!currentUser || userRole !== 'Buyer') {
    // This case should ideally be handled by BuyerProtectedRoute, but good as a safeguard
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p>Access denied. Please sign in as a Buyer.</p>
      </div>
    );
  }

  // Display username (assuming firstname is available in currentUser from AuthContext)
  const userName = currentUser.firstname || "Buyer";

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar links={buyerLinks} userRole="Buyer" userName={userName} />

      <main className="flex-1 p-6 sm:p-8 space-y-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Hello, {userName}!
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Welcome to your personal dashboard. Manage your orders, messages, and more.
          </p>
        </div>

        {/* Quick Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Orders Card */}
          <Link to="/buyer/orders" className="block bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
             {ordersLoading ? ( <p className="text-sm text-gray-500 animate-pulse">Loading orders...</p> ) : 
             ordersError ? ( <p className="text-sm text-red-500">{ordersError}</p> ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">My Orders</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{totalOrders}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full"> <ShoppingCartIcon className="h-6 w-6 text-blue-600" /> </div>
                </div>
                <p className="text-xs text-blue-600 mt-4 hover:underline">View all orders &rarr;</p>
              </>
             )}
          </Link>

          {/* Messages Card */}
          <Link to="/buyer/messages" className="block bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            {messagesLoading ? ( <p className="text-sm text-gray-500 animate-pulse">Loading messages...</p> ) : 
             messagesError ? ( <p className="text-sm text-red-500">{messagesError}</p> ) : (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Unread Messages</p>
                    <p className="text-3xl font-bold text-gray-800 mt-1">{messageCount}</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full"> <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-purple-600" /> </div>
                </div>
                <p className="text-xs text-purple-600 mt-4 hover:underline">View messages &rarr;</p>
              </>
            )}
          </Link>

          {/* Profile Card */}
          <Link to="/buyer/profile" className="block bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">My Profile</p>
                <p className="text-xl font-semibold text-gray-800 mt-1">Account Settings</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full"> <UserCircleIcon className="h-6 w-6 text-green-600" /> </div>
            </div>
            <p className="text-xs text-green-600 mt-4 hover:underline">Edit profile &rarr;</p>
          </Link>
        </div>
        
        {/* Recent Orders Section */}
        { !ordersLoading && !ordersError && recentOrders.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold text-gray-700">Your Recent Orders</h2>
              <Link to="/buyer/orders" className="text-sm text-blue-600 hover:underline font-medium">View All</Link>
            </div>
            <ul className="space-y-4">
              {recentOrders.map(order => (
                <li key={order.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-gray-50/50">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <div className="flex-grow min-w-0"> 
                      {/* Assuming order.product.name and order.product.id are available */}
                      <p className="text-sm font-semibold text-gray-800 truncate" title={order.product?.name || "Product Name Unavailable"}>
                        {order.product?.name || "Product Name Unavailable"}
                      </p>
                      <p className="text-xs text-gray-500">Order ID: {String(order.id).substring(0,15)}...</p>
                    </div>
                    <div className="text-left sm:text-right flex-shrink-0 mt-1 sm:mt-0">
                      <p className="text-sm font-semibold text-gray-700">${(order.total).toFixed(2)}</p>
                      <p className="text-xs text-gray-500">{new Date(order.date).toLocaleDateString()}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
        {ordersLoading && <p className="text-center text-gray-500 py-4">Loading recent orders...</p>}
        {!ordersLoading && ordersError && <p className="text-center text-red-500 py-4">Could not load recent orders.</p>}


        {/* Recommended For You Section */}
        <div className="pt-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-700">Just For You</h2>
            <Link to="/products" className="text-sm text-blue-600 hover:underline font-medium">Shop More</Link>
          </div>
          {productsLoading && (
            <div className="text-center py-8">
              <svg className="animate-spin h-8 w-8 text-blue-600 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="text-gray-500 mt-2">Loading recommendations...</p>
            </div>
          )}
          {productsError && !productsLoading && (
             <div className="text-center py-8 bg-red-50 p-4 rounded-lg">
               <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-2" />
               <p className="text-red-600 font-semibold">Could not load recommendations.</p>
               <p className="text-red-500 text-sm">{productsError}</p>
                {/* <button onClick={fetchRecommendedProducts} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm">Try Again</button> */}
            </div>
          )}
          {!productsLoading && !productsError && recommendedProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {recommendedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
          {!productsLoading && !productsError && recommendedProducts.length === 0 && (
             <p className="text-center text-gray-500 py-8">No product recommendations available at this time.</p>
          )}
        </div>

        {/* Placeholder for overall empty state */}
        {!isAuthLoading && !ordersLoading && !messagesLoading && !productsLoading &&
         !ordersError && !messagesError && !productsError &&
         recentOrders.length === 0 && messageCount === 0 && recommendedProducts.length === 0 && (
          <div className="bg-white p-10 rounded-xl shadow-lg text-center mt-8">
            <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-300 mb-4"/>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Your Dashboard is Quiet</h3>
            <p className="text-gray-500 mb-6">Start shopping or interact to see activity here.</p>
            <Link to="/products" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold">
              Explore Products
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
