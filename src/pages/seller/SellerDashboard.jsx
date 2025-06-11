import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ArchiveBoxIcon,
  CurrencyDollarIcon,
  ChatBubbleLeftEllipsisIcon,
  PlusCircleIcon,
  ExclamationTriangleIcon,
  UserCircleIcon,
  ShoppingCartIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { getMySellerProducts, getUnreadMessageCount, getMySellerSales } from "../../services/api";

const StatCard = ({ title, value, icon: Icon, color, linkTo, linkText, isLoading }) => (
  <Link to={linkTo} className="block bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{isLoading ? '...' : value}</p>
      </div>
      <div className={`p-3 bg-${color}-100 rounded-full`}>
        <Icon className={`h-6 w-6 text-${color}-600`} />
      </div>
    </div>
    <p className={`text-xs text-${color}-600 mt-4 hover:underline`}>{linkText} &rarr;</p>
  </Link>
);

export default function SellerDashboard() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  
  // Initialize totalSales to 0 instead of "N/A"
  const [stats, setStats] = useState({ productCount: 0, unreadMessageCount: 0, totalSales: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Add the new API call to Promise.all
      const [productsRes, messagesRes, salesRes] = await Promise.all([
        getMySellerProducts({ size: 1 }),
        getUnreadMessageCount(),
        getMySellerSales(),
      ]);

      // Update state with the fetched sales data
      setStats({
        productCount: productsRes.data?.totalElements || 0,
        unreadMessageCount: messagesRes.data?.unreadCount || 0,
        totalSales: salesRes.data?.totalSales || 0,
      });

    } catch (err) {
      console.error("SellerDashboard: Error fetching dashboard data:", err);
      const errMsg = err.response?.data?.message || "Could not load dashboard data.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isAuthLoading && currentUser) {
      fetchDashboardData();
    }
  }, [currentUser, isAuthLoading, fetchDashboardData]);

  if (isAuthLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p className="text-lg animate-pulse">Loading Dashboard...</p></div>;
  }
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Welcome back, {currentUser?.firstName}!</h1>
            <p className="text-sm text-gray-600 mt-1">Here's your store's overview.</p>
          </div>
          <Link to="/seller/products/add" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
            <PlusCircleIcon className="h-5 w-5" /> Add New Product
          </Link>
        </div>

        {error && (
          <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg shadow" role="alert">
            <div className="flex items-center"><ExclamationTriangleIcon className="h-6 w-6 mr-2"/><span className="font-medium">Dashboard Error:</span> {error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Total Products" value={stats.productCount} icon={ArchiveBoxIcon} color="blue" linkTo="/seller/products" linkText="Manage products" isLoading={isLoading} />
          {/* Format the sales value as currency */}
          <StatCard 
            title="Total Sales" 
            value={new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(stats.totalSales)} 
            icon={CurrencyDollarIcon} color="green" 
            linkTo="/seller/orders" 
            linkText="View sales data" 
            isLoading={isLoading} />
          <StatCard title="Unread Messages" value={stats.unreadMessageCount} icon={ChatBubbleLeftEllipsisIcon} color="purple" linkTo="/seller/messages" linkText="View messages" isLoading={isLoading} />
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-lg">
           <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Links</h2>
             <ul className="space-y-3">
              {[
                  { label: "View My Products", path: "/seller/products", icon: ArchiveBoxIcon },
                  { label: "Add New Product", path: "/seller/products/add", icon: PlusCircleIcon },
                  { label: "Manage Orders", path: "/seller/orders", icon: ShoppingCartIcon },
                  { label: "Edit Profile", path: "/profile/edit", icon: UserCircleIcon },
              ].map(link => ( 
                <li key={link.path}>
                  <Link to={link.path} className="flex items-center gap-3 p-3 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors group">
                    <link.icon className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    <span className="text-sm font-medium">{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
        </div>

      </main>
    </div>
  );
}