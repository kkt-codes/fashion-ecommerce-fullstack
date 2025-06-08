import React, { useEffect, useState, useCallback } from 'react';
import Sidebar from '../../components/Sidebar';
import {
  ClipboardDocumentListIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import { getAllOrders, deleteOrder, updateOrderStatus } from '../../services/api';

const ORDERS_PER_PAGE = 15;

const EditOrderModal = ({ order, onClose, onOrderUpdate }) => {
    const [status, setStatus] = useState(order.status);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const availableStatuses = ["PENDING_PAYMENT", "PAID", "PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED", "PAYMENT_FAILED"];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (status === order.status) {
            toast.error("No changes made to status.");
            return;
        }
        setIsSubmitting(true);
        const toastId = toast.loading("Updating order status...");
        try {
            await updateOrderStatus(order.id, status);
            toast.success("Order status updated!", { id: toastId });
            onOrderUpdate();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update status.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Edit Order #{String(order.id).slice(-8)}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">Order Status</label>
                        <select
                            id="status"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                        >
                            {availableStatuses.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                        </select>
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-gray-400">
                            {isSubmitting ? "Saving..." : "Save Status"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default function AdminOrderManagementPage() {
  const [ordersData, setOrdersData] = useState({ content: [], totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page: currentPage, size: ORDERS_PER_PAGE, sort: 'date,DESC' };
      const { data } = await getAllOrders(params);
      // Check if the API response is a proper pagination object
            if (data && data.content) {
                setOrdersData(data);
            }
            // If the response is a simple array, wrap it in the expected structure
            else if (Array.isArray(data)) {
                setOrdersData({ content: data, totalPages: 1 });
            }
            // Handle any other unexpected format
            else {
                setOrdersData({ content: [], totalPages: 0 });
            }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders.');
      // Ensure state is clean on error
      setOrdersData({ content: [], totalPages: 0 });
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);
  
  const handleEditOrder = (order) => {
    setSelectedOrder(order);
    setIsEditModalOpen(true);
  };

  const handleDeleteOrder = (orderId) => {
    toast((t) => (
      <div className="p-4 bg-white rounded shadow-md">
        <p className="font-semibold">Delete Order #{String(orderId).slice(-8)}?</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const deleteToast = toast.loading("Deleting order...");
              try {
                await deleteOrder(orderId);
                toast.success('Order deleted.', { id: deleteToast });
                fetchOrders();
              } catch (err) {
                toast.error('Failed to delete order.', { id: deleteToast });
              }
            }}
            className="px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
          >Delete</button>
          <button onClick={() => toast.dismiss(t.id)} className="px-4 py-1.5 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  const getStatusColor = (status) => {
    switch ((status || '').toUpperCase()) {
      case 'PAID': case 'COMPLETED': case 'SHIPPED': return 'bg-green-100 text-green-700';
      case 'PROCESSING': return 'bg-blue-100 text-blue-700';
      case 'PENDING_PAYMENT': case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED': case 'PAYMENT_FAILED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {isEditModalOpen && selectedOrder && (
        <EditOrderModal
          order={selectedOrder}
          onClose={() => setIsEditModalOpen(false)}
          onOrderUpdate={() => {
            setIsEditModalOpen(false);
            fetchOrders();
          }}
        />
      )}
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
          <p className="text-sm text-gray-500 mt-1">View and manage all orders on the platform.</p>
        </header>

        {isLoading && ordersData.content.length === 0 ? <p>Loading orders...</p> :
        error ? <p className="text-red-500">{error}</p> :
        (
          <div className="bg-white rounded-lg shadow overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Buyer ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {ordersData.content.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{order.id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={order.userId}>{order.userId.substring(0,8)}...</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.productName} (x{order.quantity})</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>{order.status.replace('_', ' ')}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-800">${order.total.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                        <button onClick={() => handleEditOrder(order)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                        <button onClick={() => handleDeleteOrder(order.id)} className="text-red-600 hover:text-red-900">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {ordersData.totalPages > 1 && (
                <div className="px-6 py-3 flex justify-between items-center">
                    <span className="text-sm text-gray-700">Page {currentPage + 1} of {ordersData.totalPages}</span>
                    <div className="space-x-1">
                        <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="px-3 py-1 border rounded-md disabled:opacity-50"><ChevronLeftIcon className="h-4 w-4"/></button>
                        <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= ordersData.totalPages - 1} className="px-3 py-1 border rounded-md disabled:opacity-50"><ChevronRightIcon className="h-4 w-4"/></button>
                    </div>
                </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}