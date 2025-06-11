import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  PencilSquareIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  ArchiveBoxIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

import Sidebar from '../../components/Sidebar';
import { getProducts, deleteProduct, updateProduct, getProductCategories, getProductById  } from '../../services/api';

const PRODUCTS_PER_PAGE = 12;

// Modal for an Admin to edit any product's details
const EditProductModal = ({ productId, onClose, onProductUpdate }) => {
    const [formData, setFormData] = useState({ name: '', description: '', price: '', category: '' });
    const [categories, setCategories] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchProductAndCategories = async () => {
            setIsLoading(true);
            try {
                const [productRes, categoriesRes] = await Promise.all([
                    getProductById(productId),
                    getProductCategories()
                ]);
                const productData = productRes.data;
                setFormData({
                    name: productData.name || '',
                    description: productData.description || '',
                    price: productData.price || '',
                    category: productData.category || '',
                });
                setCategories(categoriesRes.data || []);
            } catch (error) {
                toast.error("Failed to load product details.");
                onClose();
            } finally {
                setIsLoading(false);
            }
        };
        fetchProductAndCategories();
    }, [productId, onClose]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        const toastId = toast.loading("Updating product...");
        try {
            await updateProduct(productId, formData);
            toast.success("Product updated successfully!", { id: toastId });
            onProductUpdate();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update product.", { id: toastId });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50">
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg m-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Edit Product</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><XMarkIcon className="h-6 w-6" /></button>
                </div>
                {isLoading ? <p>Loading details...</p> : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Description</label>
                            <textarea name="description" value={formData.description} onChange={handleChange} rows="3" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Price</label>
                            <input type="number" name="price" value={formData.price} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"/>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Category</label>
                            <select name="category" value={formData.category} onChange={handleChange} className="mt-1 block w-full border-gray-300 rounded-md shadow-sm">
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">Cancel</button>
                            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400">
                                {isSubmitting ? "Saving..." : "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
};


export default function AdminProductManagementPage() {
  const [productsData, setProductsData] = useState({ content: [], totalPages: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = { page: currentPage, size: PRODUCTS_PER_PAGE, sort: "id,DESC" };
      const { data } = await getProducts(params); // Using the generic getProducts endpoint
      setProductsData(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);
  
  const handleEditProduct = (productId) => {
    setSelectedProductId(productId);
    setIsEditModalOpen(true);
  };

  const handleDeleteProduct = (productId, productName) => {
    toast((t) => (
      <div className="p-4 bg-white rounded shadow-md">
        <p className="font-semibold">Delete product "{productName}"?</p>
        <div className="flex gap-2 mt-3">
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              const deleteToast = toast.loading("Deleting product...");
              try {
                await deleteProduct(productId);
                toast.success(`Product "${productName}" deleted.`, { id: deleteToast });
                fetchProducts();
              } catch (err) {
                toast.error('Failed to delete product.', { id: deleteToast });
              }
            }}
            className="px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700"
          >Delete</button>
          <button onClick={() => toast.dismiss(t.id)} className="px-4 py-1.5 bg-gray-200 rounded hover:bg-gray-300">Cancel</button>
        </div>
      </div>
    ), { duration: 10000 });
  };
  
  return (
    <div className="flex min-h-screen bg-gray-100">
        {isEditModalOpen && selectedProductId && (
            <EditProductModal 
                productId={selectedProductId}
                onClose={() => setIsEditModalOpen(false)}
                onProductUpdate={() => {
                    setIsEditModalOpen(false);
                    fetchProducts();
                }}
            />
        )}
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8">
        <header className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Product Management</h1>
            <p className="text-sm text-gray-500 mt-1">View, edit, or delete any product on the platform.</p>
        </header>

        {isLoading && productsData.content.length === 0 ? <p>Loading products...</p> :
        error ? <p className="text-red-500">{error}</p> :
        (
            <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Seller ID</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {productsData.content.map((product) => (
                            <tr key={product.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="flex-shrink-0 h-10 w-10">
                                            <img 
                                                className="h-10 w-10 rounded-md object-cover" 
                                                src={product.photoUrl && product.photoUrl.startsWith('http') ? product.photoUrl : `http://localhost:8080${product.photoUrl || ''}`}
                                                alt={product.name} 
                                            />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                                            <div className="text-sm text-gray-500">ID: {product.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" title={product.sellerId}>{product.sellerId.substring(0, 8)}...</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">${product.price.toFixed(2)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => handleEditProduct(product.id)} className="text-indigo-600 hover:text-indigo-900">Edit</button>
                                    <button onClick={() => handleDeleteProduct(product.id, product.name)} className="text-red-600 hover:text-red-900">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                 {productsData.totalPages > 1 && (
                    <div className="px-6 py-3 flex justify-between items-center">
                        <span className="text-sm text-gray-700">Page {currentPage + 1} of {productsData.totalPages}</span>
                        <div className="space-x-1">
                            <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 0} className="px-3 py-1 border rounded-md disabled:opacity-50"><ChevronLeftIcon className="h-4 w-4"/></button>
                            <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage >= productsData.totalPages - 1} className="px-3 py-1 border rounded-md disabled:opacity-50"><ChevronRightIcon className="h-4 w-4"/></button>
                        </div>
                    </div>
                )}
            </div>
        )}
      </main>
    </div>
  );
}