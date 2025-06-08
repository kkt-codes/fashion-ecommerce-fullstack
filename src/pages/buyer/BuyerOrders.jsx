import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ListBulletIcon,
  ShoppingCartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { getMyBuyerOrders } from '../../services/api';

const ORDERS_PER_PAGE = 10;

export default function BuyerOrdersPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  const [ordersData, setOrdersData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  const fetchOrders = useCallback(async () => {
    if (!isAuthenticated) return;

    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page: currentPage,
        size: ORDERS_PER_PAGE,
        sort: 'date,DESC'
      };
      const { data } = await getMyBuyerOrders(params);
      setOrdersData(data);
    } catch (err) {
      console.error("Error fetching buyer orders:", err);
      setError(err.response?.data?.message || "Could not load your orders.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentPage]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchOrders();
    }
  }, [isAuthLoading, fetchOrders]);

  const handlePaginate = (pageNumber) => {
    if (pageNumber >= 0 && pageNumber < ordersData.totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
      case 'SHIPPED':
        return 'bg-green-100 text-green-800';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-800';
      case 'PENDING_PAYMENT':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'CANCELLED':
      case 'PAYMENT_FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const renderContent = () => {
    if (isLoading && ordersData.content.length === 0) {
      return (
        <div className="flex justify-center items-center flex-1">
          <p className="text-gray-500 text-lg animate-pulse">Loading Your Orders...</p>
        </div>
      );
    }

    if (error) {
        return (
            <div className="text-center py-12 bg-white rounded-xl shadow-md flex-1">
                <h2 className="text-xl font-semibold text-red-600 mb-2">Could Not Load Orders</h2>
                <p className="text-gray-500 mb-6">{error}</p>
                <button 
                    onClick={fetchOrders} 
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    if (ordersData.content.length > 0) {
      return (
        <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th scope="col" className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {ordersData.content.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500" title={String(order.id)}>
                    #{String(order.id).slice(-8)}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                    {order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                    <Link to={`/products/${order.productId}`} className="hover:text-blue-600">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-[200px] sm:max-w-xs" title={order.productName}>
                        {order.productName || "Product Name Unavailable"}
                      </div>
                    </Link>
                  </td>
                  <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">{order.quantity}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                    <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                      {order.status ? order.status.replace('_', ' ') : 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-800">
                    ${order.total ? order.total.toFixed(2) : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {ordersData.totalPages > 1 && (
            <nav className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200" aria-label="Pagination">
              <p className="text-xs text-gray-700">Page <span className="font-medium">{currentPage + 1}</span> of <span className="font-medium">{ordersData.totalPages}</span></p>
              <div className="flex items-center space-x-1">
                <button onClick={() => handlePaginate(0)} disabled={currentPage === 0 || isLoading} className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">First</button>
                <button onClick={() => handlePaginate(currentPage - 1)} disabled={currentPage === 0 || isLoading} className="p-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"><ChevronLeftIcon className="h-4 w-4"/></button>
                <button onClick={() => handlePaginate(currentPage + 1)} disabled={currentPage >= ordersData.totalPages - 1 || isLoading} className="p-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"><ChevronRightIcon className="h-4 w-4"/></button>
                <button onClick={() => handlePaginate(ordersData.totalPages - 1)} disabled={currentPage >= ordersData.totalPages - 1 || isLoading} className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50">Last</button>
              </div>
            </nav>
          )}
        </div>
      );
    }

    return (
      <div className="text-center py-12 bg-white rounded-xl shadow-md flex-1">
        <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700 mb-2">You Haven't Placed Any Orders Yet</h2>
        <p className="text-gray-500 mb-6">Start shopping to see your order history here.</p>
        <Link to="/products" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors duration-300">
          <ShoppingCartIcon className="h-5 w-5" /> Browse Products
        </Link>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 flex flex-col">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
            <ListBulletIcon className="h-8 w-8 mr-3 text-blue-600" />
            My Orders
          </h1>
          {!isLoading && !error && (
            <p className="text-sm text-gray-500 mt-1">
              You have a total of {ordersData.totalElements} order(s).
            </p>
          )}
        </header>
        
        {renderContent()}
        
      </main>
    </div>
  );
}