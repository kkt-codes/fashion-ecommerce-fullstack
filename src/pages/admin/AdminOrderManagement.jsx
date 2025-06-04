import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import apiClient from '../../services/api';
import toast from 'react-hot-toast';
import {
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const ORDERS_PER_PAGE = 12;

export default function AdminOrderManagement() {
  const [orders, setOrders] = useState([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [processingOrderId, setProcessingOrderId] = useState(null);

  const fetchOrders = async (page = 0) => {
    setLoading(true);
    setPageError(null);
    try {
      // Backend endpoint expects page, size, sort params
      const response = await apiClient.get(`/admin/orders?page=${page}&size=${ORDERS_PER_PAGE}&sort=date,DESC`);
      setOrders(response.data?.content || []);
      setTotalOrders(response.data?.totalElements || 0);
      setCurrentPage(response.data?.number || 0);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to load orders.';
      setPageError(errorMsg);
      toast.error(errorMsg);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage);
  }, [currentPage]);

  const paginate = (page) => {
    if (page >= 0 && page < Math.ceil(totalOrders / ORDERS_PER_PAGE)) {
      setCurrentPage(page);
    }
  };

  const handleDeleteOrder = (orderId) => {
    toast(
      (t) => (
        <div className="max-w-xs p-4 bg-white rounded shadow-md flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete this order?</p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setProcessingOrderId(orderId);
                try {
                  await apiClient.delete(`/admin/orders/${orderId}`);
                  toast.success('Order deleted.');
                  // After deleting, refetch orders or adjust page if needed 
                  if (orders.length === 1 && currentPage > 0) {
                    setCurrentPage(prev => prev - 1);
                  } else {
                    fetchOrders(currentPage);
                  }
                } catch (error) {
                  console.error('Delete order failed:', error.response?.data || error.message);
                  toast.error('Failed to delete order. Please try again.');
                } finally {
                  setProcessingOrderId(null);
                }
              }}
              className="flex-1 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 py-1.5 bg-gray-200 rounded hover:bg-gray-300 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: 60000, position: 'top-center' }
    );
  };

  const getStatusColor = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'PAID':
      case 'COMPLETED':
      case 'SHIPPED':
        return 'bg-green-100 text-green-700';
      case 'PROCESSING':
        return 'bg-blue-100 text-blue-700';
      case 'PENDING_PAYMENT':
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED':
      case 'PAYMENT_FAILED':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Order Management</h1>

        {pageError && (
          <div className="p-4 mb-6 bg-red-100 text-red-700 rounded shadow text-center">
            {pageError}
          </div>
        )}

        {loading && orders.length === 0 ? (
          <p className="text-center text-gray-600 animate-pulse">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="text-center text-gray-500">No orders found.</p>
        ) : (
          <>
            <table className="min-w-full table-auto border-collapse border border-gray-300 rounded-md overflow-hidden shadow-sm bg-white">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Order ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Buyer</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Product</th>
                  <th className="px-3 py-3 text-center text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Qty</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 border-r border-gray-300" title={String(order.id)}>
                      #{String(order.id).slice(-8)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 border-r border-gray-300">
                      {order.date ? new Date(order.date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800 border-r border-gray-300 truncate max-w-xs">
                      {order.buyerName || order.buyerEmail || 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300 truncate max-w-xs">
                      {order.productName || `Product ID: ${order.productId || 'N/A'}`}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-center text-sm text-gray-700 border-r border-gray-300">
                      {order.quantity || 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs sm:text-sm border-r border-gray-300">
                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                        {order.status ? order.status.replace('_', ' ') : 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-semibold text-gray-800 border-r border-gray-300">
                      ${order.total !== undefined ? order.total.toFixed(2) : 'N/A'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm space-x-2">
                      {/* Edit button could navigate to an order detail or update page if implemented */}
                      <button
                        onClick={() => toast('Edit functionality not implemented.')}
                        className="text-blue-600 hover:text-blue-800"
                        aria-label="Edit order"
                        title="Edit order (not implemented)"
                      >
                        <PencilSquareIcon className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={processingOrderId === order.id}
                        aria-label="Delete order"
                        title="Delete order"
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {processingOrderId === order.id ? (
                          <svg className="animate-spin h-5 w-5 inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                          </svg>
                        ) : (
                          <TrashIcon className="h-5 w-5 inline" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination Controls */}
            {totalOrders > ORDERS_PER_PAGE && (
              <nav className="flex justify-between items-center mt-6 px-2" aria-label="Pagination">
                <button
                  onClick={() => paginate(0)}
                  disabled={currentPage === 0 || loading}
                  className="px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  First
                </button>
                <button
                  onClick={() => paginate(currentPage - 1)}
                  disabled={currentPage === 0 || loading}
                  className="px-4 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <span className="text-sm text-gray-700">
                  Page <span className="font-semibold">{currentPage + 1}</span> of{' '}
                  <span className="font-semibold">{Math.ceil(totalOrders / ORDERS_PER_PAGE)}</span>
                </span>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalOrders / ORDERS_PER_PAGE) - 1 || loading}
                  className="px-4 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => paginate(Math.ceil(totalOrders / ORDERS_PER_PAGE) - 1)}
                  disabled={currentPage >= Math.ceil(totalOrders / ORDERS_PER_PAGE) - 1 || loading}
                  className="px-3 py-1 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Last
                </button>
              </nav>
            )}
          </>
        )}
      </main>
    </div>
  );
}

