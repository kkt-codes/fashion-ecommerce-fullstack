import React, { useEffect, useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useAuthContext } from "../../context/AuthContext";
import apiClient from "../../services/api";
import toast from 'react-hot-toast';
import { 
    PlusCircleIcon, 
    PencilSquareIcon, 
    TrashIcon, 
    ArchiveBoxIcon,
    ExclamationTriangleIcon,
    ChevronLeftIcon,
    ChevronRightIcon
} from "@heroicons/react/24/outline";

const PRODUCTS_PER_PAGE = 12; // Or your preferred page size

export default function SellerProducts() {
  const { currentUser, isAuthenticated, userRole, isLoading: isAuthLoading } = useAuthContext();
  const navigate = useNavigate();
  
  const [sellerProducts, setSellerProducts] = useState([]);
  const [isLoadingPage, setIsLoadingPage] = useState(true);
  const [pageError, setPageError] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(0); // 0-indexed for backend
  const [totalPages, setTotalPages] = useState(0);
  const [totalProducts, setTotalProducts] = useState(0);

  const fetchSellerProducts = useCallback(async (page = 0) => {
    if (!currentUser || userRole !== 'SELLER') {
      setIsLoadingPage(false);
      setSellerProducts([]);
      return;
    }
    setIsLoadingPage(true);
    setPageError(null);
    try {
      // Fetch products for the current seller with pagination
      const response = await apiClient.get(
        `/products?sellerId=${currentUser.id}&page=${page}&size=${PRODUCTS_PER_PAGE}&sort=id,DESC`
      );
      setSellerProducts(response.data?.content || []);
      setTotalPages(response.data?.totalPages || 0);
      setTotalProducts(response.data?.totalElements || 0);
      setCurrentPage(response.data?.number || 0);
    } catch (error) {
      console.error("Error fetching seller products:", error.response?.data || error.message);
      const errMsg = error.response?.data?.message || "Could not load your products.";
      toast.error(errMsg);
      setPageError(errMsg);
      setSellerProducts([]);
    } finally {
      setIsLoadingPage(false);
    }
  }, [currentUser, userRole]);

  useEffect(() => {
    if (!isAuthLoading) { // Ensure auth state is resolved
        fetchSellerProducts(currentPage);
    }
  }, [isAuthLoading, currentUser, fetchSellerProducts, currentPage]);


  const handleDeleteProduct = async (productId, productName) => {
    if (!currentUser || userRole !== 'SELLER') {
        toast.error("Only authenticated sellers can delete products.");
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
            This action cannot be undone.
          </p>
          <div className="flex gap-3 w-full">
            <button
              onClick={async () => {
                toast.dismiss(t.id); // Dismiss confirmation toast first
                try {
                  await apiClient.delete(`/products/${productId}`);
                  toast.success(`Product "${productName}" deleted successfully.`);
                  // Refetch products for the current page or go to previous if current page becomes empty
                  if (sellerProducts.length === 1 && currentPage > 0) {
                    setCurrentPage(prev => prev - 1); // fetchSellerProducts will be called by useEffect
                  } else {
                    fetchSellerProducts(currentPage);
                  }
                } catch (error) {
                  console.error("Error deleting product:", error.response?.data || error.message);
                  toast.error(error.response?.data?.message || `Failed to delete "${productName}".`);
                }
              }}
              className="flex-1 px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
            >
              Delete
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
      { duration: 60000, position: "top-center" } // Keep confirmation open longer
    );
  };
  
  const paginate = (pageNumber) => {
    if (pageNumber >= 0 && pageNumber < totalPages) {
      setCurrentPage(pageNumber);
      // fetchSellerProducts will be called by the useEffect dependency on currentPage
    }
  };


  if (isAuthLoading || (isLoadingPage && sellerProducts.length === 0 && currentPage === 0)) {
    return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 flex justify-center items-center">
           <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-lg">Loading Your Products...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated || userRole !== 'SELLER') {
     return (
      <div className="flex min-h-screen bg-gray-100">
        <Sidebar />
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
      <Sidebar /> {/* Sidebar gets user info from AuthContext */}

      <main className="flex-1 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">My Products</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your product listings ({totalProducts} items).</p>
          </div>
          <Link 
            to="/seller/products/add" // Updated path
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
          >
            <PlusCircleIcon className="h-5 w-5" />
            Add New Product
          </Link>
        </div>

        {pageError && !isLoadingPage && (
            <div className="p-4 mb-6 text-center text-red-700 bg-red-100 rounded-lg shadow" role="alert">
                <ExclamationTriangleIcon className="h-10 w-10 text-red-400 mx-auto mb-2" />
                <span className="font-medium">Error:</span> {pageError}
                <button onClick={() => fetchSellerProducts(currentPage)} className="ml-4 px-3 py-1 text-sm bg-red-200 text-red-800 rounded hover:bg-red-300">Try Again</button>
            </div>
        )}
        
        {isLoadingPage && sellerProducts.length > 0 && ( // Show subtle loading when paginating
            <div className="text-center py-4 text-gray-500">Loading products...</div>
        )}

        {!isLoadingPage && sellerProducts.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {sellerProducts.map((product) => ( // product is ProductDto from backend
                <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl transition-shadow duration-300">
                  <Link to={`/products/${product.id}`} className="block group"> 
                    <img 
                      src={product.photoUrl || '/assets/placeholder.png'} // Use photoUrl
                      alt={product.name} 
                      className="w-full h-48 object-cover group-hover:opacity-90 transition-opacity" 
                      onError={(e) => { e.target.onerror = null; e.target.src = '/assets/placeholder.png'; }}
                    />
                  </Link>
                  <div className="p-5 flex flex-col flex-grow">
                    <h2 className="text-lg font-semibold text-gray-800 truncate mb-1" title={product.name}>{product.name}</h2>
                    <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">{product.category}</p>
                    <p className="text-2xl font-bold text-blue-600 mb-3">${product.price ? product.price.toFixed(2) : 'N/A'}</p>
                    <div className="mt-auto border-t border-gray-100 pt-4 flex justify-between items-center gap-2">
                      <Link
                        to={`/seller/products/edit/${product.id}`} // Updated path
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
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <nav className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 mt-8 bg-white rounded-lg shadow" aria-label="Pagination">
                <p className="text-xs text-gray-700">
                  Page <span className="font-medium">{currentPage + 1}</span> of <span className="font-medium">{totalPages}</span> ({totalProducts} products)
                </p>
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => paginate(0)}
                    disabled={currentPage === 0 || isLoadingPage}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    First
                  </button>
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 0 || isLoadingPage}
                    className="p-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    <ChevronLeftIcon className="h-4 w-4"/>
                  </button>
                  <span className="px-3 py-1 text-xs font-medium text-gray-700">
                    {currentPage + 1}
                  </span>
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage >= totalPages - 1 || isLoadingPage}
                    className="p-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                     <ChevronRightIcon className="h-4 w-4"/>
                  </button>
                  <button
                    onClick={() => paginate(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1 || isLoadingPage}
                    className="px-3 py-1 text-xs font-medium text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                  >
                    Last
                  </button>
                </div>
              </nav>
            )}
          </>
        ) : (
          !isLoadingPage && !pageError && (
            <div className="text-center col-span-full py-12 bg-white rounded-lg shadow-md">
              <ArchiveBoxIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700">No Products Listed Yet</h3>
              <p className="text-gray-500 mt-1 mb-6">Click "Add New Product" to list your first item and start selling!</p>
              <Link 
                  to="/seller/products/add" // Updated path
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 transition-colors"
              >
                  <PlusCircleIcon className="h-5 w-5" />
                  Add Your First Product
              </Link>
            </div>
          )
        )}
      </main>
    </div>
  );
}
