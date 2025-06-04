import React, { useEffect, useState } from 'react';
import Sidebar from '../../components/Sidebar';
import apiClient from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArchiveBoxIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  TrashIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';

const PRODUCTS_PER_PAGE = 12;

export default function AdminProductManagement() {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [processingProductId, setProcessingProductId] = useState(null);

  const fetchProducts = async (page = 0) => {
    setLoading(true);
    setPageError(null);
    try {
      const response = await apiClient.get(`/admin/products?page=${page}&size=${PRODUCTS_PER_PAGE}&sort=id,DESC`);
      setProducts(response.data?.content || []);
      setTotalProducts(response.data?.totalElements || 0);
      setCurrentPage(response.data?.number || 0);
    } catch (error) {
      const errorMsg = error.response?.data?.message || 'Failed to load products.';
      setPageError(errorMsg);
      toast.error(errorMsg);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  const paginate = (page) => {
    if (page >= 0 && page < Math.ceil(totalProducts / PRODUCTS_PER_PAGE)) {
      setCurrentPage(page);
    }
  };

  const handleDeleteProduct = (productId, productName) => {
    toast(
      (t) => (
        <div className="max-w-xs p-4 bg-white rounded shadow-md flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-800">Delete product "{productName}"?</p>
          <p className="text-xs text-gray-600">This action cannot be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                toast.dismiss(t.id);
                setProcessingProductId(productId);
                try {
                  await apiClient.delete(`/admin/products/${productId}`);
                  toast.success(`Product "${productName}" deleted.`);
                  if (products.length === 1 && currentPage > 0) {
                    setCurrentPage(prev => prev - 1);
                  } else {
                    fetchProducts(currentPage);
                  }
                } catch (error) {
                  console.error('Delete product failed:', error.response?.data || error.message);
                  toast.error(`Failed to delete "${productName}". Please try again.`);
                } finally {
                  setProcessingProductId(null);
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

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8 max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Product Management</h1>

        {pageError && (
          <div className="p-4 mb-6 bg-red-100 text-red-700 rounded shadow text-center">
            {pageError}
          </div>
        )}

        {loading && products.length === 0 ? (
          <p className="text-center text-gray-600 animate-pulse">Loading products...</p>
        ) : products.length === 0 ? (
          <p className="text-center text-gray-500">No products found.</p>
        ) : (
          <>
            <table className="min-w-full table-auto border-collapse border border-gray-300 rounded-md overflow-hidden shadow-sm bg-white">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Photo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Category</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Price</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase border-r border-gray-300">Seller</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700 border-r border-gray-300" title={String(product.id)}>
                      #{String(product.id).slice(-8)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap border-r border-gray-300">
                      <img
                        src={product.photoUrl || '/assets/placeholder.png'}
                        alt={product.name}
                        className="h-10 w-10 object-cover rounded"
                        onError={(e) => { e.target.onerror = null; e.target.src = '/assets/placeholder.png'; }}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r border-gray-300 truncate max-w-xs" title={product.name}>
                      {product.name || "Unnamed Product"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border-r border-gray-300 truncate max-w-xs" title={product.category}>
                      {product.category || "Uncategorized"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-blue-600 border-r border-gray-300">
                      ${product.price !== undefined ? product.price.toFixed(2) : "N/A"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 border-r border-gray-300 truncate max-w-xs" title={product.sellerName || "Unknown Seller"}>
                      {product.sellerName || "Unknown Seller"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm space-x-2">
                      <button
                        onClick={() => toast('Edit functionality not implemented.')}
                        className="text-green-600 hover:text-green-800"
                        aria-label="Edit product"
                        title="Edit product (not implemented)"
                      >
                        <PencilSquareIcon className="h-5 w-5 inline" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product.id, product.name)}
                        disabled={processingProductId === product.id}
                        aria-label="Delete product"
                        title="Delete product"
                        className="text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        {processingProductId === product.id ? (
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

            {totalProducts > PRODUCTS_PER_PAGE && (
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
                  <span className="font-semibold">{Math.ceil(totalProducts / PRODUCTS_PER_PAGE)}</span>
                </span>
                <button
                  onClick={() => paginate(currentPage + 1)}
                  disabled={currentPage >= Math.ceil(totalProducts / PRODUCTS_PER_PAGE) - 1 || loading}
                  className="px-4 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => paginate(Math.ceil(totalProducts / PRODUCTS_PER_PAGE) - 1)}
                  disabled={currentPage >= Math.ceil(totalProducts / PRODUCTS_PER_PAGE) - 1 || loading}
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

