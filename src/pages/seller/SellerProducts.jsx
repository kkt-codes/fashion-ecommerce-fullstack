import React, { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  PlusCircleIcon,
  PencilSquareIcon,
  TrashIcon,
  ArchiveBoxIcon,
  ExclamationTriangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { getMySellerProducts, deleteProduct } from "../../services/api";

const PRODUCTS_PER_PAGE = 12;

export default function SellerProducts() {
  const { currentUser, isLoading: isAuthLoading } = useAuth();
  
  const [productsData, setProductsData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  const fetchSellerProducts = useCallback(async (page) => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);
    try {
      const params = {
        page,
        size: PRODUCTS_PER_PAGE,
        sort: "id,DESC"
      };
      const { data } = await getMySellerProducts(params);
      setProductsData(data);
    } catch (err) {
      console.error("Error fetching seller products:", err);
      const errMsg = err.response?.data?.message || "Could not load your products.";
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (!isAuthLoading) {
      fetchSellerProducts(currentPage);
    }
  }, [isAuthLoading, currentPage, fetchSellerProducts]);

  const handleDeleteProduct = (productId, productName) => {
    if (!currentUser) return;

    toast((t) => (
      <div className="flex flex-col items-center p-3">
        <p className="text-sm font-semibold text-gray-800 mb-2">Delete "{productName}"?</p>
        <p className="text-xs text-gray-600 mb-4">This action cannot be undone.</p>
        <div className="flex gap-3 w-full">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const deleteToastId = toast.loading("Deleting product...");
              try {
                await deleteProduct(productId);
                toast.success(`Product "${productName}" deleted.`, { id: deleteToastId });
                // Refresh the list. If it was the last item on a page, go to the previous page.
                const newPage = productsData.content.length === 1 && currentPage > 0 ? currentPage - 1 : currentPage;
                if (newPage !== currentPage) {
                    setCurrentPage(newPage);
                } else {
                    fetchSellerProducts(currentPage);
                }
              } catch (err) {
                toast.error(err.response?.data?.message || `Failed to delete product.`, { id: deleteToastId });
              }
            }}
            className="flex-1 px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            className="flex-1 px-4 py-2 text-xs font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </div>
    ), { duration: 10000 });
  };

  const renderContent = () => {
    if (isLoading && productsData.content.length === 0) {
      return (
        <div className="flex justify-center items-center py-20">
          <div className="flex flex-col items-center">
            <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-gray-500 text-lg">Loading Your Products...</p>
          </div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className="p-4 my-6 text-center text-red-700 bg-red-100 rounded-lg shadow">
          <ExclamationTriangleIcon className="h-10 w-10 text-red-400 mx-auto mb-2" />
          <span className="font-medium">Error:</span> {error}
          <button onClick={() => fetchSellerProducts(currentPage)} className="ml-4 px-3 py-1 text-sm bg-red-200 text-red-800 rounded hover:bg-red-300">Try Again</button>
        </div>
      );
    }

    if (productsData.content.length === 0) {
      return (
        <div className="text-center col-span-full py-12 bg-white rounded-lg shadow-md">
          <ArchiveBoxIcon className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-700">No Products Listed Yet</h3>
          <p className="text-gray-500 mt-1 mb-6">Click "Add New Product" to list your first item!</p>
          <Link to="/seller/products/add" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow hover:bg-blue-700">
            <PlusCircleIcon className="h-5 w-5" /> Add Your First Product
          </Link>
        </div>
      );
    }
    
    return (
      <>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {productsData.content.map((product) => (
            <div key={product.id} className="bg-white rounded-xl shadow-lg overflow-hidden flex flex-col hover:shadow-2xl transition-shadow">
              <Link to={`/products/${product.id}`} className="block group">
                <img 
                  src={product.photoUrl && product.photoUrl.startsWith('http') ? product.photoUrl : `http://localhost:8080${product.photoUrl || ''}`}
                  alt={product.name} 
                  className="w-full h-48 object-cover group-hover:opacity-90" 
                />
              </Link>
              <div className="p-5 flex flex-col flex-grow">
                <h2 className="text-lg font-semibold text-gray-800 truncate mb-1" title={product.name}>{product.name}</h2>
                <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">{product.category}</p>
                <p className="text-2xl font-bold text-blue-600 mb-3">${product.price?.toFixed(2)}</p>
                <div className="mt-auto border-t border-gray-100 pt-4 flex justify-between items-center gap-2">
                  <Link to={`/seller/products/edit/${product.id}`} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 bg-green-50 rounded-md hover:bg-green-100">
                    <PencilSquareIcon className="h-4 w-4" /> Edit
                  </Link>
                  <button onClick={() => handleDeleteProduct(product.id, product.name)} className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 bg-red-50 rounded-md hover:bg-red-100">
                    <TrashIcon className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {productsData.totalPages > 1 && (
          <nav className="flex flex-col sm:flex-row justify-between items-center gap-2 px-4 py-3 mt-8 bg-white rounded-lg shadow" aria-label="Pagination">
            <p className="text-xs text-gray-700">Page {currentPage + 1} of {productsData.totalPages}</p>
            <div className="flex items-center space-x-1">
              <button onClick={() => setCurrentPage(0)} disabled={currentPage === 0 || isLoading} className="px-3 py-1 text-xs font-medium border rounded-md disabled:opacity-50">First</button>
              <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0 || isLoading} className="p-1.5 text-xs font-medium border rounded-md disabled:opacity-50"><ChevronLeftIcon className="h-4 w-4"/></button>
              <span className="px-3 py-1 text-xs font-medium">{currentPage + 1}</span>
              <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= productsData.totalPages - 1 || isLoading} className="p-1.5 text-xs font-medium border rounded-md disabled:opacity-50"><ChevronRightIcon className="h-4 w-4"/></button>
              <button onClick={() => setCurrentPage(productsData.totalPages - 1)} disabled={currentPage >= productsData.totalPages - 1 || isLoading} className="px-3 py-1 text-xs font-medium border rounded-md disabled:opacity-50">Last</button>
            </div>
          </nav>
        )}
      </>
    );
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">My Products</h1>
            <p className="text-sm text-gray-500 mt-1">Manage your product listings ({productsData.totalElements} items).</p>
          </div>
          <Link to="/seller/products/add" className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
            <PlusCircleIcon className="h-5 w-5" /> Add New Product
          </Link>
        </div>
        {renderContent()}
      </main>
    </div>
  );
}