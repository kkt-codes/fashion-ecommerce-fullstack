import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useAuthContext } from "../../context/AuthContext";
import apiClient from "../../services/api"; // For API calls
import {
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftEllipsisIcon,
  PlusCircleIcon,
  EyeIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function SellerDashboard() {
  const { currentUser, isLoading: isAuthLoading, userRole } = useAuthContext();

  const [productCount, setProductCount] = useState(0);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [totalSalesDisplay, setTotalSalesDisplay] = useState("N/A"); // Mock or N/A for now
  
  const [isLoadingDashboardData, setIsLoadingDashboardData] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  // Recent activity remains static for this example
  const recentActivity = [
    { id: 1, text: `You listed "Vintage Leather Jacket".`, time: "2 hours ago", type: "product", linkTo: "/seller/products" },
    { id: 2, text: `New message from BuyerX regarding "Handmade Scarf".`, time: "5 hours ago", type: "message", linkTo: "/seller/messages" },
    { id: 3, text: `Your product "Classic Blue Jeans" received 10 views today.`, time: "1 day ago", type: "stats", linkTo: "#" },
  ].slice(0, 3);

  useEffect(() => {
    if (isAuthLoading) {
      return; // Wait for authentication to resolve
    }

    if (currentUser && userRole === 'SELLER') {
      const fetchDashboardData = async () => {
        setIsLoadingDashboardData(true);
        setDashboardError(null);
        try {
          // Fetch seller's product stats (count)
          // Backend GET /api/products expects sellerId as a filter, returns Page<ProductDto>
          const productsResponse = await apiClient.get(`/products?sellerId=${currentUser.id}&size=1`); // size=1 just to get totalElements
          setProductCount(productsResponse.data?.totalElements || 0);

          // Fetch unread message count
          try {
            const messagesResponse = await apiClient.get('/chat/user/me/unread-count');
            setUnreadMessageCount(messagesResponse.data?.unreadCount || 0);
          } catch (msgError) {
            console.warn("SellerDashboard: Could not fetch unread message count.", msgError.response?.data || msgError.message);
            setUnreadMessageCount(0); // Default to 0 if endpoint fails
          }
          
          // Total Sales: This remains a placeholder as backend doesn't provide this directly.
          // In a real app, this would be a complex query on fulfilled orders.
          // For now, we can set a mock value or keep N/A
          // setTotalSalesDisplay("$1,234.56"); // Example mock value

        } catch (error) {
          console.error("SellerDashboard: Error fetching dashboard data:", error.response?.data || error.message);
          const errMsg = error.response?.data?.message || "Could not load dashboard data.";
          setDashboardError(errMsg);
          toast.error(errMsg);
          setProductCount(0);
          setUnreadMessageCount(0);
        } finally {
          setIsLoadingDashboardData(false);
        }
      };
      fetchDashboardData();
    } else {
      setIsLoadingDashboardData(false);
      setProductCount(0);
      setUnreadMessageCount(0);
    }
  }, [currentUser, userRole, isAuthLoading]);

  if (isAuthLoading || (isLoadingDashboardData && !currentUser)) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-lg">Loading Seller Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || userRole !== 'SELLER') {
    // This case should ideally be handled by SellerProtectedRoute
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-100">
        <p className="text-red-500">Access Denied. Please sign in as a Seller.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar /> {/* Sidebar now gets its props from AuthContext */}

      <main className="flex-1 p-6 sm:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Welcome back, {currentUser.firstName}!
            </h1>
            <p className="text-sm text-gray-600 mt-1">
              Here's what's happening with your store today.
            </p>
          </div>
          <Link
            to="/seller/products/add" // Updated path for adding product
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Add New Product
          </Link>
        </div>

        {dashboardError && !isLoadingDashboardData && (
            <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg shadow" role="alert">
                <div className="flex items-center">
                    <ExclamationTriangleIcon className="h-6 w-6 mr-2"/>
                    <span className="font-medium">Dashboard Error:</span>
                </div>
                <p className="mt-1">{dashboardError}</p>
            </div>
        )}

        {/* Stats Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/seller/products" className="block bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Products</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{isLoadingDashboardData ? '...' : productCount}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <ArchiveBoxIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
             <p className="text-xs text-blue-600 mt-4 hover:underline">Manage products &rarr;</p>
          </Link>
          <div className="bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"> {/* Not a Link for now */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Total Sales (Est.)</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{isLoadingDashboardData ? '...' : totalSalesDisplay}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <CurrencyDollarIcon className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4">Sales data (mocked)</p>
          </div>
          <Link to="/seller/messages" className="block bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Unread Messages</p>
                <p className="text-3xl font-bold text-gray-800 mt-1">{isLoadingDashboardData ? '...' : unreadMessageCount}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <ChatBubbleLeftEllipsisIcon className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-xs text-purple-600 mt-4 hover:underline">View messages &rarr;</p>
          </Link>
        </div>

        {/* Recent Activity & Quick Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
            <h2 className="text-xl font-semibold text-gray-700 mb-5">Recent Activity (Static Example)</h2>
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
              {/* Links are now generated by Sidebar, this can be a different set of quick actions */}
              {[
                  { label: "View My Products", path: "/seller/products", icon: ArchiveBoxIcon },
                  { label: "Add New Product", path: "/seller/products/add", icon: PlusCircleIcon },
                  { label: "Manage Orders", path: "/seller/orders", icon: ShoppingCartIcon },
                  { label: "Edit Profile", path: "/profile/edit", icon: UserCircleIcon },
              ].map(link => ( 
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
