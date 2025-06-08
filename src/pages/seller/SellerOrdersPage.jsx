import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    ClipboardDocumentListIcon,
    ShoppingCartIcon,
    ExclamationTriangleIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import Sidebar from '../../components/Sidebar';
import { useAuth } from '../../context/AuthContext';
import { getMySellerOrders, updateOrderStatus } from '../../services/api';

const ORDERS_PER_PAGE = 10;

// A modal component for updating the order status
const StatusUpdateModal = ({ order, onClose, onStatusUpdate }) => {
    const [newStatus, setNewStatus] = useState(order.status);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleUpdate = async () => {
        if (newStatus === order.status) {
            toast.error("Please select a new status.");
            return;
        }
        setIsUpdating(true);
        const toastId = toast.loading("Updating order status...");
        try {
            await updateOrderStatus(order.id, newStatus);
            toast.success("Order status updated!", { id: toastId });
            onStatusUpdate(); // This will trigger a refetch in the parent
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update status.", { id: toastId });
        } finally {
            setIsUpdating(false);
        }
    };

    const availableStatuses = ["PROCESSING", "SHIPPED", "COMPLETED", "CANCELLED"];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Manage Order #{String(order.id).slice(-8)}</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                <div className="space-y-4">
                    <p><span className="font-semibold">Product:</span> {order.productName}</p>
                    <p><span className="font-semibold">Current Status:</span> {order.status.replace('_', ' ')}</p>
                    <div>
                        <label htmlFor="status" className="block text-sm font-medium text-gray-700">New Status:</label>
                        <select
                            id="status"
                            value={newStatus}
                            onChange={(e) => setNewStatus(e.target.value)}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm rounded-md"
                        >
                            {availableStatuses.map(status => (
                                <option key={status} value={status}>{status.replace('_', ' ')}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                    <button onClick={handleUpdate} disabled={isUpdating || newStatus === order.status} className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-gray-400">
                        {isUpdating ? "Updating..." : "Update Status"}
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function SellerOrdersPage() {
    const { currentUser, isAuthLoading } = useAuth();
    
    const [ordersData, setOrdersData] = useState({ content: [], totalPages: 0 });
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchOrders = useCallback(async () => {
        if (!currentUser) return;

        setIsLoading(true);
        setError(null);
        try {
            const params = { page: currentPage, size: ORDERS_PER_PAGE, sort: 'date,DESC' };
            const { data } = await getMySellerOrders(params);
            setOrdersData(data);
        } catch (err) {
            setError(err.response?.data?.message || "Could not load orders.");
        } finally {
            setIsLoading(false);
        }
    }, [currentUser, currentPage]);

    useEffect(() => {
        if (!isAuthLoading) {
            fetchOrders();
        }
    }, [isAuthLoading, fetchOrders]);
    
    const getStatusColor = (status) => {
        // ... (status color logic remains the same)
        switch (status?.toUpperCase()) {
            case 'PAID': case 'PROCESSING': return 'bg-blue-100 text-blue-700';
            case 'SHIPPED': case 'COMPLETED': return 'bg-green-100 text-green-700';
            case 'PENDING_PAYMENT': case 'PENDING': return 'bg-yellow-100 text-yellow-700';
            case 'CANCELLED': case 'PAYMENT_FAILED': return 'bg-red-100 text-red-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };
    
    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <main className="flex-1 p-6 sm:p-8">
                <header className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                        <ClipboardDocumentListIcon className="h-8 w-8 mr-3 text-purple-600" />
                        Received Orders
                    </h1>
                </header>

                {/* Render Logic */}
                {isLoading && <p>Loading orders...</p>}
                {error && <p className="text-red-500">{error}</p>}
                {!isLoading && !error && ordersData.content.length === 0 && (
                    <div className="text-center py-12 bg-white rounded-xl shadow-md">
                        <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
                        <h2 className="text-xl font-semibold text-gray-700">No Orders Found</h2>
                        <p className="text-gray-500 mt-1">You do not have any orders for your products yet.</p>
                    </div>
                )}
                {!isLoading && !error && ordersData.content.length > 0 && (
                    <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Sold</th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Qty</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Item Total</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {ordersData.content.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{String(order.id).slice(-8)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(order.date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.productName}</td>
                                        <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">{order.quantity}</td>
                                        <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>{order.status.replace('_', ' ')}</span></td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-800">${order.total.toFixed(2)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button onClick={() => { setSelectedOrder(order); setIsModalOpen(true); }} className="text-purple-600 hover:text-purple-900">Manage</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {/* Pagination */}
                    </div>
                )}
            </main>
            {isModalOpen && selectedOrder && (
                <StatusUpdateModal 
                    order={selectedOrder} 
                    onClose={() => setIsModalOpen(false)}
                    onStatusUpdate={fetchOrders}
                />
            )}
        </div>
    );
}