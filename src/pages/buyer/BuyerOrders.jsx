import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../../components/Sidebar';
import { useAuthContext } from '../../context/AuthContext';
import apiClient from '../../services/api';
import { 
    ListBulletIcon, 
    ShoppingCartIcon as EmptyCartIcon, // Using ShoppingCartIcon for empty state
    ExclamationTriangleIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const ORDERS_PER_PAGE = 10; // Number of orders per page

export default function BuyerOrdersPage() {
  const { currentUser, isAuthenticated, userRole, isLoading: isAuthLoading } = useAuthContext();
  
  const [orders, setOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [ordersError, setOrdersError] = useState(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed for backend
  const [totalPages, setTotalPages] = useState(0);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    if (isAuthLoading) {
      // Wait for authentication to resolve before attempting to fetch orders
      setIsLoadingOrders(true);
      return;
    }

    if (isAuthenticated && currentUser && userRole === 'BUYER') {
      const fetchOrders = async () => {
        setIsLoadingOrders(true);
        setOrdersError(null);
        try {
          // Backend endpoint: GET /api/orders/user/me?page={currentPage}&size={ORDERS_PER_PAGE}&sort=date,DESC
          const response = await apiClient.get(
            `/orders/user/me?page=${currentPage}&size=${ORDERS_PER_PAGE}&sort=date,DESC`
          );
          // Backend returns Page<OrderResponseDto>
          // OrderResponseDto: { id, userId, productId, productName, productPrice, date, quantity, total, deliveryId, deliveryMethod, status }
          setOrders(response.data?.content || []);
          setTotalPages(response.data?.totalPages || 0);
          setTotalOrders(response.data?.totalElements || 0);
        } catch (error) {
          console.error("Error fetching buyer orders:", error.response?.data || error.message);
          const errMsg = error.response?.data?.message || "Could not load your orders.";
          toast.error(errMsg);
          setOrdersError(errMsg);
          setOrders([]); // Clear orders on error
        } finally {
          setIsLoadingOrders(false);
        }
      };
      fetchOrders();
    } else {
      // Not a buyer or not authenticated after auth check
      setOrders([]);
      setTotalPages(0);
      setTotalOrders(0);
      setIsLoadingOrders(false);
      if (!isAuthLoading && !isAuthenticated) {
        // This scenario should ideally be caught by BuyerProtectedRoute,
        // but as a fallback, we can show a message or rely on the redirect.
        // toast.error("Please sign in to view your orders.");
      }
    }
  }, [currentUser, isAuthenticated, userRole, isAuthLoading, currentPage]);

  const paginate = (pageNumber) => {
    if (pageNumber >= 0 && pageNumber < totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
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


  // Combined loading state for the page for initial load
  if (isAuthLoading || (isLoadingOrders && currentPage === 0 && orders.length === 0)) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 flex justify-center items-center">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-lg">Loading Your Orders...</p>
          </div>
        </main>
      </div>
    );
  }

  // This case should be handled by BuyerProtectedRoute, but as a defensive measure:
  if (!isAuthenticated || userRole !== 'BUYER') {
     return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar /> 
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
      <Sidebar /> {/* Sidebar now gets user info from AuthContext */}
      <main className="flex-1 p-6 sm:p-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
            <ListBulletIcon className="h-8 w-8 mr-3 text-blue-600" />
            My Orders
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Review your past purchases and order details. Total Orders: {totalOrders}
          </p>
        </header>

        {isLoadingOrders && orders.length > 0 && ( // Show subtle loading when paginating
            <div className="text-center py-4 text-gray-500">Loading more orders...</div>
        )}

        {ordersError && (
            <div className="p-4 mb-6 text-center text-red-700 bg-red-100 rounded-lg" role="alert">
                <ExclamationTriangleIcon className="h-10 w-10 text-red-400 mx-auto mb-2" />
                <span className="font-medium">Error:</span> {ordersError}
            </div>
        )}

        {!isLoadingOrders && orders.length > 0 ? (
          <div className="bg-white shadow-xl rounded-lg overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th scope="col" className="px-3 sm:px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Qty
                  </th>
                   <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-4 sm:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => (
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
                        {/* <div className="text-xs text-gray-500">{order.category}</div> Product DTO might not have category directly */}
                      </Link>
                    </td>
                    <td className="px-3 sm:px-4 py-4 whitespace-nowrap text-center text-sm text-gray-500">
                      {order.quantity}
                    </td>
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
             {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 bg-gray-50 border-t border-gray-200" aria-label="Pagination">
                <p className="text-xs text-gray-700">
                  Page <span className="font-medium">{currentPage + 1}</span> of <span className="font-medium">{totalPages}</span> ({totalOrders} orders)
                </p>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => paginate(0)}
                    disabled={currentPage === 0 || isLoadingOrders}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 0 || isLoadingOrders}
                    className="p-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="h-4 w-4"/>
                  </button>
                  {/* Simple page indicator, can be expanded to show more page numbers */}
                  <span className="px-3 py-1 text-xs font-medium text-gray-700">
                    {currentPage + 1}
                  </span>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1 || isLoadingOrders}
                    className="p-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                     <ChevronRightIcon className="h-4 w-4"/>
                  </button>
                  <button
                    onClick={() => paginate(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1 || isLoadingOrders}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Last
                  </button>
                </div>
              </nav>
            )}
          </div>
        ) : (
          !isLoadingOrders && !ordersError && ( // Show only if not loading and no error
            <div className="text-center py-12 bg-white rounded-xl shadow-md">
              <EmptyCartIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">You Haven't Placed Any Orders Yet</h2>
              <p className="text-gray-500 mb-6">
                Start shopping to see your order history here.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700 transition-colors duration-300"
              >
                <ShoppingCartIcon className="h-5 w-5" />
                Browse Products
              </Link>
            </div>
          )
        )}
      </main>
    </div>
  );
}
