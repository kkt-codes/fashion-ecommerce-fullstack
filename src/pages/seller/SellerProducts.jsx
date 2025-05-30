import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useAuthContext } from "../../context/AuthContext";
// Removed useFetchCached and invalidateCacheEntry
import toast from 'react-hot-toast';
import { 
    PlusCircleIcon, 
    PencilSquareIcon, 
    TrashIcon, 
    ArchiveBoxIcon, 
    ChartBarIcon, 
    ChatBubbleLeftEllipsisIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

const API_BASE_URL = 'http://localhost:8080/api';

export default function SellerProducts() {
  const { currentUser, isAuthenticated, userRole, isLoading: isAuthLoading } = useAuthContext();
  const navigate = useNavigate();
  
  const [sellerProducts, setSellerProducts] = useState([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [productsError, setProductsError] = useState(null);

  const sellerLinks = [
    { label: "Dashboard", path: "/seller/dashboard", icon: ChartBarIcon },
    { label: "My Products", path: "/seller/products", icon: ArchiveBoxIcon },
    { label: "Add Product", path: "/seller/add-product", icon: PlusCircleIcon },
    { label: "Messages", path: "/seller/messages", icon: ChatBubbleLeftEllipsisIcon }
  ];

  const fetchSellerProducts = useCallback(async (sellerId) => {
    setIsLoadingProducts(true);
    setProductsError(null);
    try {
      // Assuming backend ProductController is updated to handle ?sellerId=...
      // or a dedicated endpoint like /api/products/seller/{sellerId}
      const response = await fetch(`${API_BASE_URL}/products?sellerId=${sellerId}&page=0&size=100`); // Fetch up to 100 products for the seller
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to load your products." }));
        throw new Error(errorData.message);
      }
      const productPage = await response.json(); // Expects Page<ProductDto>
      setSellerProducts(productPage.content || []);
    } catch (error) {
      console.error("SellerProducts: Error fetching products:", error);
      setProductsError(error.message);
      setSellerProducts([]);
      toast.error(error.message || "Could not load your products.");
    } finally {
      setIsLoadingProducts(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
      setIsLoadingProducts(true);
      return;
    }

    if (isAuthenticated && currentUser?.id && userRole === 'Seller') {
      fetchSellerProducts(currentUser.id);
    } else {
      setSellerProducts([]);
      setIsLoadingProducts(false);
      if (!isAuthLoading && !isAuthenticated) {
        // toast.error("Please sign in as a Seller to manage products.");
        // navigate("/login"); // Or let ProtectedRoute handle it
      }
    }
  }, [currentUser, isAuthenticated, userRole, isAuthLoading, fetchSellerProducts, navigate]);

  const handleDeleteProduct = async (productIdToDelete, productName) => {
    if (!currentUser || userRole !== 'Seller') {
        toast.error("Authentication error. Please sign in as a Seller.");
        return;
    }

    // Confirmation toast
    toast(
      (t) => (
        <div className="flex flex-col items-center p-3 bg-white rounded-lg shadow-md">
          <p className="text-sm font-semibold text-gray-800 mb-2">
            Delete "{productName}"?
          </p>
          <p className="text-xs text-gray-600 mb-4 text-center">
            This action will permanently delete the product from the server.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={async () => {
                toast.dismiss(t.id); // Dismiss confirmation toast first
                const loadingToastId = toast.loading("Deleting product...");
                try {
                  const response = await fetch(`${API_BASE_URL}/products/${productIdToDelete}`, {
                    method: 'DELETE',
                    // Headers for authorization (e.g., session cookie) will be sent automatically
                  });

                  if (!response.ok) {
                    // Try to parse error from backend
                    const errorData = await response.json().catch(() => null);
                    throw new Error(errorData?.message || `Failed to delete product. Status: ${response.status}`);
                  }
                  
                  // Product successfully deleted from backend
                  setSellerProducts(prevProducts => prevProducts.filter(p => String(p.id) !== String(productIdToDelete)));
                  toast.success(`"${productName}" deleted successfully.`, { id: loadingToastId });

                } catch (error) {
                  console.error("Error deleting product:", error);
                  toast.error(error.message || "Failed to delete product.", { id: loadingToastId });
                }
              }}
              className="flex-1 px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            >
              Confirm Delete
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-1"
            >
              Cancel
            </button>
          </div>
        </div>
      ),
      { duration: Infinity } // Keep confirmation toast until user interacts
    );
  };
  
  const userName = currentUser?.firstname || "Seller";

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar links={sellerLinks} userRole="Seller" userName={userName} />
        <main className="flex-1 p-6 sm:p-8 flex justify-center items-center">
          <p className="text-gray-500 animate-pulse text-lg">Loading Your Products...</p>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'Seller') {
     return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar links={sellerLinks} userRole="Seller" userName={userName} />
        <main className="flex-1 p-6 sm:p-8 flex flex-col justify-center items-center text-center">
            <ArchiveBoxIcon className="h-16 w-16 text-gray-300 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Access Denied</h2>
            <p className="text-gray-600">Please sign in as a Seller to manage your products.</p>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar links={sellerLinks} userRole="Seller" userName={userName} />

      <main className="flex-1 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Products</h1>
            <p className="text-sm text-gray-500 mt-1">
              Manage your product listings ({isLoadingProducts ? '...' : sellerProducts.length} items).
            </p>
          </div>
          <Link 
            to="/seller/add-product" 
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Add New Product
          </Link>
        </div>

        {isLoadingProducts && (
          <div className="text-center py-12">
            <svg className="animate-spin h-10 w-10 text-blue-600 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-lg">Loading your products...</p>
          </div>
        )}

        {!isLoadingProducts && productsError && (
          <div className="text-center py-12 bg-red-50 p-6 rounded-xl shadow">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Products</h2>
            <p className="text-red-500">{productsError}</p>
            <button 
                onClick={() => fetchSellerProducts(currentUser.id)} 
                className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
                Try Again
            </button>
          </div>
        )}

        {!isLoadingProducts && !productsError && sellerProducts.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {sellerProducts.map((product) => ( // product is ProductDto
              <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl transition-shadow duration-300">
                <Link to={`/products/${product.id}`} className="block group"> 
                  <img 
                    src={product.photoUrl || '/assets/placeholder.png'} // Use photoUrl from ProductDto
                    alt={product.name} 
                    className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity" 
                    onError={(e) => { e.target.onerror = null; e.target.src = '/assets/placeholder.png'; }}
                  />
                </Link>
                <div className="p-5 flex flex-col flex-grow">
                  <h2 className="text-lg font-semibold text-gray-800 truncate mb-1" title={product.name}>{product.name}</h2>
                  <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">{product.category}</p>
                  <p className="text-2xl font-bold text-blue-600 mb-3">${product.price.toFixed(2)}</p>
                  <div className="mt-auto border-t border-gray-100 pt-4 flex justify-between items-center gap-2">
                    <Link
                      to={`/seller/edit-product/${product.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 transition-colors"
                    >
                      <PencilSquareIcon className="h-4 w-4" />
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDeleteProduct(product.id, product.name)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoadingProducts && !productsError && sellerProducts.length === 0 && (
          <div className="text-center col-span-full py-12 bg-white rounded-lg shadow-md">
            <ArchiveBoxIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700">No Products Listed Yet</h3>
            <p className="text-gray-500 mt-1 mb-6">Click "Add New Product" to list your first item and start selling!</p>
            <Link 
                to="/seller/add-product" 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
            >
                <PlusCircleIcon className="h-5 w-5" />
                Add Your First Product
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
