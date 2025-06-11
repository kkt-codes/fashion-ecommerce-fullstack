import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  ArrowUpTrayIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
} from "@heroicons/react/24/outline";
import toast from 'react-hot-toast';

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import { getProductById, updateProduct, uploadProductImage, getProductCategories } from "../../services/api";

export default function EditProduct() {
  const { id: productId } = useParams();
  const { currentUser, userRole, isLoading: isAuthLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: "", description: "", price: "", category: "", stock: "" });
  const [categories, setCategories] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState(null);
  const [isLoadingPage, setIsLoadingPage] = useState(true);

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
  
  useEffect(() => {
    if (!productId || isAuthLoading) return;

    const fetchInitialData = async () => {
      setIsLoadingPage(true);
      try {
        const [productRes, categoriesRes] = await Promise.all([
            getProductById(productId),
            getProductCategories()
        ]);
        
        const productData = productRes.data;

        if (currentUser?.id !== productData.sellerId) {
            toast.error("You do not have permission to edit this product.");
            setPageError("Access Denied: You do not own this product.");
            navigate("/seller/products");
            return;
        }

        setFormData({
            name: productData.name || "",
            description: productData.description || "",
            price: productData.price !== undefined ? String(productData.price) : "",
            category: productData.category || "",
            stock: productData.stock !== undefined ? String(productData.stock) : "",
        });
        const imageUrl = productData.photoUrl || "";
        // Check if the URL is absolute or relative before setting the preview
        if (imageUrl) {
            const fullImageUrl = imageUrl.startsWith('http')
              ? imageUrl
              : `http://localhost:8080${imageUrl}`;
            setImagePreview(fullImageUrl);
        } else {
            setImagePreview("");
        }
        
        if (categoriesRes.data && categoriesRes.data.length > 0) {
            setCategories(categoriesRes.data.sort());
        }

      } catch (error) {
        console.error("Failed to load product data for editing:", error);
        setPageError(error.response?.data?.message || "Failed to load product details.");
        toast.error("Could not load product to edit.");
      } finally {
        setIsLoadingPage(false);
      }
    };

    if (currentUser && userRole === 'SELLER') {
        fetchInitialData();
    }

  }, [productId, currentUser, userRole, isAuthLoading, navigate]);

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
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File is too large (max 5MB).");
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error("Invalid file type. Please use JPEG or PNG.");
        return;
      }
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
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
      document.getElementById('imageUpload').value = null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    if (!imagePreview && !selectedFile) {
        newErrors.image = "A product image is required.";
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
        toast.error("Please correct the errors in the form.");
        return;
    }
    
    setIsSubmitting(true);
    const toastId = toast.loading("Updating product...");

    try {
      const productUpdatePayload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        price: parseFloat(formData.price),
        category: formData.category,
        stock: parseInt(formData.stock, 10),
      };
      await updateProduct(productId, productUpdatePayload);

      if (selectedFile) {
        toast.loading("Uploading new image...", { id: toastId });
        await uploadProductImage(productId, selectedFile);
      }

      toast.success("Product updated successfully!", { id: toastId });
      navigate("/seller/products");

    } catch (error) {
      console.error("Error updating product:", error);
      const errMsg = error.response?.data?.message || "Failed to update product.";
      toast.error(errMsg, { id: toastId });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  if (isAuthLoading || isLoadingPage) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 flex justify-center items-center">
          <p className="text-gray-500 animate-pulse text-lg">Loading product details...</p>
        </main>
      </div>
    );
  }

  if (pageError) {
     return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-8 flex flex-col justify-center items-center text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-red-600">Error Loading Product</h2>
          <p className="text-gray-600 mb-4">{pageError}</p>
          <Link to="/seller/products" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Back to My Products
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar />
      <main className="flex-1 p-6 sm:p-8">
        <header className="mb-8">
            <Link to="/seller/products" className="mb-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800">
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Products
            </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Edit Product</h1>
          <p className="text-sm text-gray-500 mt-1">Update details for: <span className="font-medium text-gray-700">{formData.name}</span></p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-xl space-y-6 max-w-3xl mx-auto">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />
            {errors.name && <p className="text-xs text-red-600 mt-1.5">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" value={formData.description} onChange={handleChange} rows="4" className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${errors.description ? 'border-red-500' : 'border-gray-300'}`}></textarea>
            {errors.description && <p className="text-xs text-red-600 mt-1.5">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
              <input type="number" name="price" value={formData.price} onChange={handleChange} step="0.01" className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${errors.price ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.price && <p className="text-xs text-red-600 mt-1.5">{errors.price}</p>}
            </div>
            
            <div>
              <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1.5">Stock Quantity</label>
              <input type="number" name="stock" value={formData.stock} onChange={handleChange} step="1" min="0" className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${errors.stock ? 'border-red-500' : 'border-gray-300'}`} />
              {errors.stock && <p className="text-xs text-red-600 mt-1.5">{errors.stock}</p>}
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select name="category" value={formData.category} onChange={handleChange} className={`w-full px-4 py-2.5 border rounded-lg shadow-sm bg-white focus:outline-none focus:ring-2 ${errors.category ? 'border-red-500' : 'border-gray-300'}`} disabled={categories.length === 0}>
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              {errors.category && <p className="text-xs text-red-600 mt-1.5">{errors.category}</p>}
            </div>
          </div>
          
           <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Image</label>
            <div className={`mt-1 flex flex-col items-center justify-center px-6 pt-8 pb-8 border-2 ${errors.image ? 'border-red-400' : 'border-gray-300'} border-dashed rounded-lg`}>
              {imagePreview ? (
                <div className="relative group w-full max-w-xs mx-auto">
                  <img src={imagePreview} alt="Product Preview" className="mx-auto h-48 w-auto object-contain rounded-md shadow-md" />
                  <button type="button" onClick={removeImagePreview} className="absolute -top-3 -right-3 p-1.5 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100" aria-label="Remove image">
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              ) : (
                 <div className="space-y-2 text-center">
                  <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <label htmlFor="imageUpload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 px-1">
                    <span>Upload an image</span>
                    <input id="imageUpload" name="imageUpload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg" />
                  </label>
                  <p className="text-xs text-gray-500">PNG or JPG up to 5MB</p>
                </div>
              )}
            </div>
             {imagePreview && !selectedFile && <p className="text-xs text-gray-500 mt-2 text-center">Currently showing existing image. Upload a new file to replace it.</p>}
            {errors.image && <p className="text-xs text-red-600 mt-1.5">{errors.image}</p>}
          </div>

          <div className="pt-4">
            <button type="submit" disabled={isSubmitting || isLoadingPage} className="w-full flex items-center justify-center bg-green-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 font-semibold disabled:opacity-70">
              {isSubmitting ? "Updating..." : "Update Product"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}