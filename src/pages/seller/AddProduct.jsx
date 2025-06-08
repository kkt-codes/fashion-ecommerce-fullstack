import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpTrayIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { createProduct, uploadProductImage, getProductCategories } from "../../services/api";

export default function AddProduct() {
  const { userRole, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    category: "",
    stock: "", 
  });
  const [categories, setCategories] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await getProductCategories();
        if (data && data.length > 0) {
          const sortedCategories = data.sort();
          setCategories(sortedCategories);
          setFormData(prev => ({ ...prev, category: sortedCategories[0] }));
        }
      } catch (error) {
        console.error("Failed to fetch product categories", error);
        toast.error("Could not load product categories.");
      }
    };
    fetchCategories();
  }, []);

  const validateField = useCallback((name, value) => {
    let error = "";
    switch (name) {
      case "name":
        if (!value.trim()) error = "Product name is required.";
        else if (value.trim().length < 3) error = "Name must be at least 3 characters.";
        break;
      case "description":
        if (!value.trim()) error = "Description is required.";
        else if (value.trim().length < 10) error = "Description must be at least 10 characters.";
        break;
      case "price":
        if (String(value).trim() === "") error = "Price is required.";
        else if (isNaN(value) || Number(value) <= 0) error = "Price must be a positive number.";
        break;
      case "category":
        if (!value) error = "Category is required.";
        break;
      case "stock":
        if (String(value).trim() === "") error = "Stock quantity is required.";
        else if (isNaN(value) || Number(value) < 0 || !Number.isInteger(Number(value))) error = "Stock must be a non-negative whole number.";
        break;
      default:
        break;
    }
    return error;
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      const error = validateField(name, value);
      setErrors(prev => ({ ...prev, [name]: error || null }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // Max 5MB
        toast.error("File is too large (max 5MB).");
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error("Invalid file type. Please use JPEG or PNG.");
        return;
      }
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setErrors(prev => ({ ...prev, image: null }));
    }
  };
  
  const removeImagePreview = () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
      setSelectedFile(null);
      setImagePreview("");
      const fileInput = document.getElementById('imageUpload');
      if (fileInput) fileInput.value = null;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    if (!selectedFile) newErrors.image = "Product image is required.";
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
        toast.error("Please correct the errors in the form.");
        return;
    }

    setIsSubmitting(true);
    const toastId = toast.loading("Creating product...");

    try {
      const productPayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock, 10),
      };
      const { data: createdProduct } = await createProduct(productPayload);

      toast.loading("Uploading image...", { id: toastId });
      await uploadProductImage(createdProduct.id, selectedFile);

      toast.success("Product added successfully!", { id: toastId });
      navigate("/seller/products");

    } catch (error) {
      console.error("Error adding product:", error);
      const errMsg = error.response?.data?.message || "Failed to add product. Please try again.";
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading...</p></div>;
  }

  if (userRole !== 'SELLER') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 p-8 flex flex-col justify-center items-center text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
          <p className="text-gray-600">Only Sellers can add new products.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Add New Product</h1>
          <p className="text-sm text-gray-500 mt-1">Fill in the details below to list your product.</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-xl space-y-6 max-w-3xl mx-auto">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} placeholder="e.g., Summer Floral Dress" />
            {errors.name && <p className="text-xs text-red-600 mt-1.5">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} rows="4" className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} placeholder="Detailed description of your product..."></textarea>
            {errors.description && <p className="text-xs text-red-600 mt-1.5">{errors.description}</p>}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
              <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} step="0.01" className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${errors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} placeholder="e.g., 29.99" />
              {errors.price && <p className="text-xs text-red-600 mt-1.5">{errors.price}</p>}
            </div>

            <div className="md:col-span-1">
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity</label>
              <input type="number" name="stock" id="stock" value={formData.stock} onChange={handleChange} step="1" min="0" className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${errors.stock ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} placeholder="e.g., 50" />
              {errors.stock && <p className="text-xs text-red-600 mt-1.5">{errors.stock}</p>}
            </div>

            <div className="md:col-span-1">
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select name="category" id="category" value={formData.category} onChange={handleChange} className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm bg-white ${errors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'}`} disabled={categories.length === 0}>
                {categories.length > 0 ? categories.map(cat => <option key={cat} value={cat}>{cat}</option>) : <option>Loading categories...</option>}
              </select>
              {errors.category && <p className="text-xs text-red-600 mt-1.5">{errors.category}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Image</label>
            <div className={`mt-1 flex flex-col items-center justify-center px-6 pt-8 pb-8 border-2 ${errors.image ? 'border-red-400' : 'border-gray-300'} border-dashed rounded-lg hover:border-blue-400 transition-colors`}>
              {!imagePreview ? (
                <div className="space-y-2 text-center">
                  <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <label htmlFor="imageUpload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-1">
                    <span>Upload a file</span>
                    <input id="imageUpload" name="imageUpload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg" />
                  </label>
                  <p className="text-xs text-gray-500">PNG or JPG up to 5MB</p>
                </div>
              ) : (
                <div className="relative group w-full max-w-xs mx-auto">
                  <img src={imagePreview} alt="Product Preview" className="mx-auto h-48 w-auto object-contain rounded-md shadow-md" />
                  <button type="button" onClick={removeImagePreview} className="absolute -top-3 -right-3 p-1.5 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity" aria-label="Remove image">
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              )}
            </div>
            {errors.image && <p className="text-xs text-red-600 mt-1.5">{errors.image}</p>}
          </div>

          <div className="pt-4">
            <button type="submit" disabled={isSubmitting || isAuthLoading} className="w-full flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 font-semibold disabled:opacity-70 disabled:cursor-not-allowed">
              {isSubmitting ? 'Submitting...' : 'Add Product'}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}