import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useAuthContext } from '../../context/AuthContext';
import { 
  ListBulletIcon, 
  ShoppingCartIcon, 
  UserCircleIcon, 
  ChartBarIcon, 
  ChatBubbleLeftEllipsisIcon, 
  ShoppingBagIcon, // Used for empty state "Browse Products" button
  HeartIcon, // For sidebar
  ExclamationTriangleIcon // For error display
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const API_BASE_URL = 'http://localhost:8080/api'; // Ensure this is correct

export default function BuyerOrders() {
  const { currentUser, isAuthenticated, userRole, isLoading: isAuthLoading } = useAuthContext();
  
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);

  const buyerLinks = [
    { label: "Dashboard", path: "/buyer/dashboard", icon: ChartBarIcon },
    { label: "My Orders", path: "/buyer/orders", icon: ListBulletIcon },
    { label: "Messages", path: "/buyer/messages", icon: ChatBubbleLeftEllipsisIcon },
    { label: "My Profile", path: "/buyer/profile", icon: UserCircleIcon },
    { label: "My Favorites", path: "/buyer/favorites", icon: HeartIcon },
  ];

  const fetchOrders = useCallback(async (userId) => {
    setIsLoadingOrders(true);
    setOrdersError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/orders/user/${userId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to load your orders." }));
        throw new Error(errorData.message || "Failed to load your orders.");
      }
      const data = await response.json(); // Expects List<Order> or List<OrderResponseDto>
      // Backend's OrderController.getOrdersByUserId returns List<Order>
      // The Order model has: id, user, product, date, quantity, total, delivery
      // OrderResponseDto has: id, userId, productId, productName, productPrice, quantity, total, date, deliveryId, deliveryMethod
      // Assuming backend returns List<OrderResponseDto> for convenience, or we adapt.
      // For now, assuming the structure matches what's needed for display (like productName, total).
      // If it's List<Order>, then order.product.name, order.product.price would be used.
      // Let's assume the DTO is used or the service populates necessary product details.
      const sortedOrders = data.sort((a, b) => new Date(b.date) - new Date(a.date));
      setOrders(sortedOrders);
    } catch (error) {
      console.error("BuyerOrders: Error fetching orders:", error);
      setOrdersError(error.message);
      setOrders([]);
      toast.error(error.message || "Could not load your orders.");
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoadingOrders(true); // Keep loading if auth is still processing
      return;
    }

    if (isAuthenticated && currentUser?.id && userRole === 'Buyer') {
      fetchOrders(currentUser.id);
    } else {
      setOrders([]);
      setIsLoadingOrders(false); // Not a buyer or not authenticated
      if (!isAuthLoading && !isAuthenticated) {
        // toast.info("Please sign in to view your orders."); // Optional: if not handled by ProtectedRoute
      }
    }
  }, [currentUser, isAuthenticated, userRole, isAuthLoading, fetchOrders]);

  const userName = currentUser?.firstname || "Buyer";

  if (isAuthLoading) { // Primary loading state for authentication
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar links={buyerLinks} userRole="Buyer" userName={userName} />
        <main className="flex-1 p-6 sm:p-8 flex justify-center items-center">
          <p className="text-gray-500 animate-pulse text-lg">Loading Orders Page...</p>
        </main>
      </div>
    );
  }
  
  if (!isAuthenticated || userRole !== 'Buyer') {
     return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar links={buyerLinks} userRole="Buyer" userName={userName} />
        <main className="flex-1 p-6 sm:p-8 flex flex-col justify-center items-center text-center">
            <ListBulletIcon className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
            <p className="text-gray-600">Please sign in as a Buyer to view your orders.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar links={buyerLinks} userRole="Buyer" userName={userName} />
      <main className="flex-1 p-6 sm:p-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
            <ListBulletIcon className="h-8 w-8 mr-3 text-blue-600" />
            My Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review your past purchases and order details.
          </p>
        </header>

        {isLoadingOrders && (
          <div className="text-center py-12">
            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-lg">Loading your orders...</p>
          </div>
        )}

        {!isLoadingOrders && ordersError && (
          <div className="text-center py-12 bg-red-50 p-6 rounded-xl shadow">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Orders</h2>
            <p className="text-red-500">{ordersError}</p>
            <button 
                onClick={() => fetchOrders(currentUser.id)} 
                className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
                Try Again
            </button>
          </div>
        )}

        {!isLoadingOrders && !ordersError && orders.length > 0 && (
          <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th scope="col" className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Delivery</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
                  // Your backend's OrderController returns List<Order>.
                  // The Order model has a Product object and a Delivery object.
                  // OrderResponseDto has productName, productPrice, deliveryMethod.
                  // Assuming the backend OrderController /user/{userId} returns List<OrderResponseDto>
                  // or that the OrderService.getOrdersByUserId is modified to return DTOs.
                  // If it returns raw Order entities, you'd access product info via order.product.name, etc.
                  // For now, using fields available in OrderResponseDto.
                  <tr key={order.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500" title={String(order.id)}>
                      #{String(order.id).slice(-8)} {/* Show last 8 chars of ID */}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {new Date(order.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={order.productName || order.product?.name}>
                        {order.productName || order.product?.name || "N/A"}
                      </div>
                      {/* <div className="text-xs text-gray-500">{order.product?.category || "N/A"}</div> */}
                    </td>
                    <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {order.quantity}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-800">
                      ${order.total ? order.total.toFixed(2) : '0.00'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm text-gray-500">
                      {order.deliveryMethod || order.delivery?.type || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!isLoadingOrders && !ordersError && orders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-md">
            <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">You Haven't Placed Any Orders Yet</h2>
            <p className="text-gray-500 mb-6">
              Start shopping to see your order history here.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors duration-300"
            >
              <ShoppingBagIcon className="h-5 w-5" />
              Browse Products
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
