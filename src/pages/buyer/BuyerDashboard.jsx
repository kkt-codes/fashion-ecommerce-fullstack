import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCartIcon,
  ChatBubbleLeftEllipsisIcon,
  HeartIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

import Sidebar from "../../components/Sidebar";
import ProductCard from "../../components/ProductCard";
import { useAuth } from "../../context/AuthContext";
import { getMyBuyerOrders, getUnreadMessageCount, getProducts, getMyFavorites } from "../../services/api";

// Reusable Stat Card Component
const StatCard = ({ linkTo, icon: Icon, title, value, isLoading, color }) => (
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
    <p className={`text-xs text-${color}-600 mt-4 hover:underline`}>View {title.toLowerCase()} &rarr;</p>
  </Link>
);

export default function BuyerDashboard() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();

  const [stats, setStats] = useState({ orders: 0, messages: 0, favorites: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDashboardData = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoading(true);
    setError(null);
    try {
      // Promise.all ensures all data is fetched concurrently for better performance.
      const [ordersRes, messagesRes, favoritesRes, recommendedRes] = await Promise.all([
        getMyBuyerOrders({ page: 0, size: 3, sort: 'date,DESC' }),
        getUnreadMessageCount(),
        getMyFavorites(),
        getProducts({ page: 0, size: 4, sortBy: 'averageRating', sortDir: 'DESC' })
      ]);

      setStats({
        orders: ordersRes.data?.totalElements || 0,
        messages: messagesRes.data?.unreadCount || 0,
        favorites: favoritesRes.data?.length || 0,
      });
      setRecentOrders(ordersRes.data?.content || []);
      setRecommendedProducts(recommendedRes.data?.content || []);

    } catch (err) {
      console.error("BuyerDashboard: Error fetching data:", err);
      const errorMessage = "Could not load all dashboard data. Some information may be missing.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isAuthLoading && currentUser) {
      fetchDashboardData();
    }
  }, [currentUser, isAuthLoading, fetchDashboardData]);

  if (isAuthLoading || (isLoading && !currentUser)) {
    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <main className="flex-1 p-8 flex justify-center items-center">
                <p className="text-lg animate-pulse">Loading Dashboard...</p>
            </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 space-y-8">
        <header>
          <h1 className="text-3xl font-bold text-gray-800">Hello, {currentUser?.firstName}!</h1>
          <p className="text-sm text-gray-600 mt-1">Welcome to your dashboard.</p>
        </header>

        {error && (
            <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5"/> {error}
            </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard linkTo="/buyer/orders" icon={ShoppingCartIcon} title="My Orders" value={stats.orders} isLoading={isLoading} color="blue" />
          <StatCard linkTo="/buyer/favorites" icon={HeartIcon} title="My Favorites" value={stats.favorites} isLoading={isLoading} color="red" />
          <StatCard linkTo="/buyer/messages" icon={ChatBubbleLeftEllipsisIcon} title="Unread Messages" value={stats.messages} isLoading={isLoading} color="purple" />
        </div>
        
        {recentOrders.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-lg">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-semibold text-gray-700">Recent Orders</h2>
              <Link to="/buyer/orders" className="text-sm text-blue-600 hover:underline font-medium">View All</Link>
            </div>
            <ul className="space-y-4">
              {recentOrders.map(order => (
                <li key={order.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center">
                    <p className="text-sm font-semibold text-gray-800 truncate" title={order.productName}>{order.productName}</p>
                    <p className="text-sm font-semibold text-gray-700">${order.total?.toFixed(2)}</p>
                  </div>
                  <p className="text-xs text-gray-500">Order #{String(order.id).slice(-8)} &bull; {new Date(order.date).toLocaleDateString()}</p>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div>
          <h2 className="text-2xl font-semibold text-gray-700 mb-6">Just For You</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? [...Array(4)].map((_, i) => <ProductCard key={i} product={null} />) :
             recommendedProducts.map(product => <ProductCard key={product.id} product={product} />)}
          </div>
        </div>
      </main>
    </div>
  );
}