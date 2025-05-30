import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar"; 
import { useAuthContext } from "../../context/AuthContext";
// Removed useFetchCached
import {
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftEllipsisIcon,
  PlusCircleIcon,
  ChartBarIcon, 
  EyeIcon, // For recent activity
  ExclamationTriangleIcon 
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

const API_BASE_URL = 'http://localhost:8080/api';

export default function SellerDashboard() {
  const { currentUser, isLoading: isAuthLoading, userRole } = useAuthContext(); 
  
  const [sellerProducts, setSellerProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState(null);
  
  const [messageCount, setMessageCount] = useState(0);
  const [messagesLoading, setMessagesLoading] = useState(true);
  const [messagesError, setMessagesError] = useState(null);

  // Total Sales will be a placeholder or very basic estimation from product prices
  const [estimatedTotalValue, setEstimatedTotalValue] = useState(0); 

  const sellerLinks = [
    { label: "Dashboard", path: "/seller/dashboard", icon: ChartBarIcon },
    { label: "My Products", path: "/seller/products", icon: ArchiveBoxIcon },
    { label: "Add Product", path: "/seller/add-product", icon: PlusCircleIcon },
    { label: "Messages", path: "/seller/messages", icon: ChatBubbleLeftEllipsisIcon }
  ];

  const fetchSellerProducts = useCallback(async (sellerId) => {
    setProductsLoading(true);
    setProductsError(null);
    try {
      // Assuming backend ProductController is updated to handle ?sellerId=...
      // Or a new endpoint like /api/products/seller/{sellerId}
      const response = await fetch(`${API_BASE_URL}/products?sellerId=${sellerId}&page=0&size=1000`); // Fetch all seller products
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to load your products" }));
        throw new Error(errorData.message);
      }
      const productPage = await response.json(); // Expects Page<ProductDto>
      const products = productPage.content || [];
      setSellerProducts(products);
      // Basic estimation of total value of listed products
      const totalValue = products.reduce((acc, p) => acc + p.price, 0);
      setEstimatedTotalValue(totalValue);

    } catch (e) {
      console.error("SellerDashboard: Error fetching seller products:", e);
      setProductsError(e.message);
      setSellerProducts([]);
      setEstimatedTotalValue(0);
      toast.error("Could not load your product data.");
    } finally {
      setProductsLoading(false);
    }
  }, []);

  const fetchUnreadMessageCount = useCallback(async (userId) => {
    setMessagesLoading(true);
    setMessagesError(null);
    let totalUnread = 0;
    try {
      const convResponse = await fetch(`${API_BASE_URL}/chat/user/${userId}/conversations`);
      if (!convResponse.ok) throw new Error("Failed to load conversations for message count.");
      const conversations = await convResponse.json();

      if (conversations && conversations.length > 0) {
        for (const convo of conversations) {
          const unreadResponse = await fetch(`${API_BASE_URL}/chat/conversation/${convo.id}/unread/${userId}`);
          if (unreadResponse.ok) {
            const unreadMessages = await unreadResponse.json();
            totalUnread += unreadMessages.length;
          }
        }
      }
      setMessageCount(totalUnread);
    } catch (e) {
      console.error("SellerDashboard: Error fetching message count:", e);
      setMessagesError(e.message);
      setMessageCount(0);
      toast.error("Could not load your message count.");
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) return;

    if (currentUser && userRole === 'Seller') {
      fetchSellerProducts(currentUser.id);
      fetchUnreadMessageCount(currentUser.id);
    } else {
      setSellerProducts([]);
      setEstimatedTotalValue(0);
      setMessageCount(0);
      setProductsLoading(false);
      setMessagesLoading(false);
    }
  }, [currentUser, userRole, isAuthLoading, fetchSellerProducts, fetchUnreadMessageCount]);

  // Recent activity remains mock data for now.
  // Real implementation would require backend event logging and an API.
  const recentActivity = [
    { id: 1, text: `You listed a new product.`, time: "2 hours ago", type: "product", linkTo: "/seller/products" },
    { id: 2, text: `New message from a buyer.`, time: "5 hours ago", type: "message", linkTo: "/seller/messages" },
  ].slice(0, 3); 

  const userName = currentUser?.firstname || "Seller";

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar links={sellerLinks} userRole="Seller" userName={userName} />
        <main className="flex-1 p-6 sm:p-8 flex justify-center items-center">
           <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-lg">Loading Seller Dashboard...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!currentUser || userRole !== 'Seller') {
    return (
      <div className="flex min-h-screen bg-gray-100">
         <Sidebar links={sellerLinks} userRole="Seller" userName={userName} />
        <main className="flex-1 p-6 sm:p-8 flex flex-col justify-center items-center text-center">
            <ArchiveBoxIcon className="h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
            <p className="text-gray-600">Please sign in as a Seller to view the dashboard.</p>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar links={sellerLinks} userRole="Seller" userName={userName} />

      <main className="flex-1 p-6 sm:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Welcome back, {userName}!
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Here's what's happening with your store today.
            </p>
          </div>
          <Link
            to="/seller/add-product"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Add New Product
          </Link>
        </div>

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Products Card */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            {productsLoading ? (<p className="text-sm text-gray-500 animate-pulse">Loading products...</p>) :
             productsError ? (<p className="text-sm text-red-500">Error products</p>) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Products</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{sellerProducts.length}</p>
                </div>
                <div className="p-3 bg-blue-100 rounded-full"> <ArchiveBoxIcon className="h-6 w-6 text-blue-600" /> </div>
              </div>
            )}
          </div>
          
          {/* Estimated Value Card */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            {productsLoading ? (<p className="text-sm text-gray-500 animate-pulse">Calculating value...</p>) :
             productsError ? (<p className="text-sm text-red-500">Error value</p>) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Est. Listed Value</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">${estimatedTotalValue.toFixed(2)}</p>
                </div>
                <div className="p-3 bg-green-100 rounded-full"> <CurrencyDollarIcon className="h-6 w-6 text-green-600" /> </div>
              </div>
            )}
             <p className="text-xs text-gray-400 mt-2 italic">Note: This is the total value of your listed products, not actual sales.</p>
          </div>

          {/* Messages Card */}
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            {messagesLoading ? (<p className="text-sm text-gray-500 animate-pulse">Loading messages...</p>) :
             messagesError ? (<p className="text-sm text-red-500">Error messages</p>) : (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Unread Messages</p>
                  <p className="text-3xl font-bold text-gray-800 mt-1">{messageCount}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-full"> <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-purple-600" /> </div>
              </div>
            )}
          </div>
        </div>

        {/* Error Display Area */}
        { (productsError && !productsLoading) && 
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                <span className="font-medium">Product Data Error:</span> {productsError}
                 <button onClick={() => fetchSellerProducts(currentUser.id)} className="ml-2 px-2 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300 text-xs">Retry</button>
            </div>
        }
        { (messagesError && !messagesLoading) && 
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                <span className="font-medium">Message Data Error:</span> {messagesError}
                <button onClick={() => fetchUnreadMessageCount(currentUser.id)} className="ml-2 px-2 py-1 bg-red-200 text-red-800 rounded hover:bg-red-300 text-xs">Retry</button>
            </div>
        }


        {/* Recent Activity & Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-5">Recent Activity (Mock Data)</h2>
            {recentActivity.length > 0 ? (
              <ul className="space-y-4">
                {recentActivity.map((activity) => (
                  <li key={activity.id} className="flex items-start space-x-4 pb-4 border-b border-gray-100 last:border-b-0 last:pb-0">
                    <div className={`flex-shrink-0 p-2.5 rounded-full ${
                        activity.type === 'product' ? 'bg-blue-100 text-blue-600' : 
                        activity.type === 'message' ? 'bg-purple-100 text-purple-600' : 
                        'bg-green-100 text-green-600'
                    }`}>
                      {activity.type === 'product' && <ArchiveBoxIcon className="h-5 w-5" />}
                      {activity.type === 'message' && <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />}
                      {activity.type === 'stats' && <EyeIcon className="h-5 w-5" />}
                    </div>
                    <div className="flex-grow">
                      <p className="text-sm text-gray-700 leading-snug">{activity.text}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                    </div>
                    {activity.linkTo && activity.linkTo !== "#" && (
                        <Link to={activity.linkTo} className="text-xs text-blue-600 hover:underline self-center ml-auto">View</Link>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 py-4 text-center">No recent activity to display.</p>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-5">Quick Links</h2>
            <ul className="space-y-3">
              {sellerLinks.filter(link => link.path !== "/seller/dashboard").map(link => ( 
                <li key={link.path}>
                  <Link to={link.path} className="flex items-center gap-3 p-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors group">
                    {link.icon && <link.icon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />}
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
