import React, { useEffect, useState } from "react";
import Sidebar from "../../components/Sidebar";
import apiClient from "../../services/api";
import toast from "react-hot-toast";
import {
  UserGroupIcon,
  ArchiveBoxIcon,
  ClipboardDocumentListIcon,
  EnvelopeIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline";

export default function AdminDashboard() {
  const [userCount, setUserCount] = useState(null);
  const [productCount, setProductCount] = useState(null);
  const [orderCount, setOrderCount] = useState(null);
  const [contactMessageCount, setContactMessageCount] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState(null);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      setIsLoading(true);
      setDashboardError(null);
      try {
        // Assuming backend endpoints exist to fetch counts
        const [
          usersResp,
          productsResp,
          ordersResp,
          contactMessagesResp,
        ] = await Promise.all([
          apiClient.get("/admin/users/count"),
          apiClient.get("/admin/products/count"),
          apiClient.get("/admin/orders/count"),
          apiClient.get("/admin/contact-messages/count"),
        ]);

        setUserCount(usersResp.data.count);
        setProductCount(productsResp.data.count);
        setOrderCount(ordersResp.data.count);
        setContactMessageCount(contactMessagesResp.data.count);
      } catch (error) {
        console.error("AdminDashboard: Error loading stats", error.response?.data || error.message);
        setDashboardError(error.response?.data?.message || "Failed to load dashboard data.");
        toast.error("Failed to load admin dashboard.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8">
        <h1 className="text-3xl font-bold mb-8 text-gray-800">Admin Dashboard</h1>

        {dashboardError && (
          <div className="p-4 mb-6 text-red-700 bg-red-100 rounded shadow">
            Error: {dashboardError}
          </div>
        )}

        {isLoading ? (
          <div className="text-center text-gray-600 animate-pulse">
            Loading dashboard data...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex items-center space-x-4">
              <UserGroupIcon className="h-10 w-10 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Total Users</p>
                <p className="text-2xl font-semibold text-gray-800">{userCount ?? 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex items-center space-x-4">
              <ArchiveBoxIcon className="h-10 w-10 text-green-600" />
              <div>
                <p className="text-sm text-gray-500">Total Products</p>
                <p className="text-2xl font-semibold text-gray-800">{productCount ?? 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex items-center space-x-4">
              <ClipboardDocumentListIcon className="h-10 w-10 text-purple-600" />
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-semibold text-gray-800">{orderCount ?? 0}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex items-center space-x-4">
              <EnvelopeIcon className="h-10 w-10 text-red-600" />
              <div>
                <p className="text-sm text-gray-500">Contact Messages</p>
                <p className="text-2xl font-semibold text-gray-800">{contactMessageCount ?? 0}</p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

