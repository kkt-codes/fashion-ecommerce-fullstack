import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  UserGroupIcon,
  ArchiveBoxIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { getAdminStats } from "../../services/api";

const StatCard = ({ title, value, icon: Icon, color, linkTo, isLoading }) => (
  <Link to={linkTo} className="block bg-white p-6 rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-gray-800 mt-1">{isLoading ? '...' : value}</p>
      </div>
      <div className={`p-3 bg-${color}-100 rounded-full`}>
        <Icon className={`h-8 w-8 text-${color}-600`} />
      </div>
    </div>
  </Link>
);


export default function AdminDashboard() {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({ userCount: 0, productCount: 0, orderCount: 0, messageCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [usersResp, productsResp, ordersResp, messagesResp] = await getAdminStats();
      
      // Correctly extract the count from each API response
      const userCount = Array.isArray(usersResp.data) ? usersResp.data.length : 0;
      const productCount = productsResp.data?.totalElements || 0;
      const orderCount = Array.isArray(ordersResp.data) ? ordersResp.data.length : 0;
      const messageCount = Array.isArray(messagesResp.data) ? messagesResp.data.length : 0;

      setStats({
        userCount,
        productCount,
        orderCount,
        messageCount,
      });

    } catch (err) {
      console.error("AdminDashboard: Error loading stats", err);
      setError("Failed to load dashboard data. Please ensure you are logged in as an Admin.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8">
        <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800">Admin Dashboard</h1>
            <p className="text-sm text-gray-500 mt-1">
              Welcome, {currentUser?.firstName || 'Admin'}. Here is the overview of the platform.
            </p>
        </header>

        {error && (
          <div className="p-4 mb-6 text-red-800 bg-red-100 rounded-lg shadow flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 mr-3"/>
            <div>
                <span className="font-medium">Error:</span> {error}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard title="Total Users" value={stats.userCount} icon={UserGroupIcon} color="blue" linkTo="/admin/users" isLoading={isLoading} />
            <StatCard title="Total Products" value={stats.productCount} icon={ArchiveBoxIcon} color="green" linkTo="/admin/products" isLoading={isLoading} />
            <StatCard title="Total Orders" value={stats.orderCount} icon={ClipboardDocumentListIcon} color="purple" linkTo="/admin/orders" isLoading={isLoading} />
            <StatCard title="Contact Messages" value={stats.messageCount} icon={EnvelopeIcon} color="red" linkTo="/admin/contact-messages" isLoading={isLoading} />
        </div>
        
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-2 gap-4">
                    <Link to="/admin/users" className="p-4 text-center bg-gray-50 hover:bg-gray-100 rounded-lg">Manage Users</Link>
                    <Link to="/admin/products" className="p-4 text-center bg-gray-50 hover:bg-gray-100 rounded-lg">Manage Products</Link>
                    <Link to="/admin/orders" className="p-4 text-center bg-gray-50 hover:bg-gray-100 rounded-lg">Manage Orders</Link>
                    <Link to="/admin/settings" className="p-4 text-center bg-gray-50 hover:bg-gray-100 rounded-lg">System Settings</Link>
                </div>
            </div>
             <div className="bg-white p-6 rounded-xl shadow-lg">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">System Status</h2>
                <p className="text-sm text-gray-600">All systems are currently operational.</p>
             </div>
        </div>

      </main>
    </div>
  );
}