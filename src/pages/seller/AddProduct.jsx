import React, { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useAuthContext } from "../../context/AuthContext";
import apiClient from "../../services/api";
import { invalidateCacheEntry } from "../../hooks/useFetchCached";
import toast from 'react-hot-toast';
import { 
    ArrowUpTrayIcon, 
    XCircleIcon,
    ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

export default function AddProduct() {
  const { currentUser, isLoading: isAuthLoading, userRole } = useAuthContext();
  const navigate = useNavigate();

  const initialFormData = {
    name: "",
    description: "",
    price: "",
    category: "Dress", // Default category
  };

  const [formData, setFormData] = useState(initialFormData);
  const [selectedFile, setSelectedFile] = useState(null); // Stores the File object
  const [imagePreview, setImagePreview] = useState("");   // Stores Data URL for preview
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
        if (value === null || value === undefined || String(value).trim() === "") error = "Price is required.";
        else if (isNaN(value) || Number(value) <= 0) error = "Price must be a positive number.";
        break;
      case "category":
        if (!value) error = "Category is required.";
        break;
      default:
        break;
    }
    return error;
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error || null }));
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    const error = validateField(name, value);
    setErrors(prev => ({ ...prev, [name]: error || null }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // Max 2MB for example
        setErrors(prev => ({ ...prev, image: "File is too large (max 2MB)." }));
        setSelectedFile(null);
        setImagePreview("");
        e.target.value = null; 
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrors(prev => ({ ...prev, image: "Invalid file type (JPEG, PNG, WEBP)." }));
        setSelectedFile(null);
        setImagePreview("");
        e.target.value = null; 
        return;
      }

      setSelectedFile(file); // Store the File object
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result); 
      };
      reader.onerror = () => {
        toast.error("Could not read image file.");
        setErrors(prev => ({ ...prev, image: "Could not read image file." }));
        setSelectedFile(null);
        setImagePreview("");
        e.target.value = null;
      }
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, image: null }));
    } else {
      setSelectedFile(null);
      setImagePreview("");
    }
  };

  const removeImagePreview = () => {
    setSelectedFile(null);
    setImagePreview(""); 
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) fileInput.value = null; 
    setErrors(prev => ({ ...prev, image: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(formData).forEach(key => {
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    if (!selectedFile) { // Image is mandatory for new product
      newErrors.image = "Product image is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || userRole !== 'SELLER') {
      toast.error("You must be signed in as a Seller to add products.");
      return;
    }
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setIsSubmitting(true);

    // Backend ProductDto for creation expects: name, description, price, category
    // sellerId will be set by backend based on authenticated user.
    const productDetailsPayload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      category: formData.category,
      // photoUrl will be set after image upload
    };

    try {
      // Step 1: Create product with text details
      const productResponse = await apiClient.post('/products', productDetailsPayload);
      const createdProduct = productResponse.data; // This is ProductDto with id, sellerId, etc.

      if (createdProduct && createdProduct.id && selectedFile) {
        // Step 2: Upload image for the created product
        const imageFormData = new FormData();
        imageFormData.append('file', selectedFile);

        // The image upload endpoint might return the updated ProductDto with photoUrl
        await apiClient.post(`/products/${createdProduct.id}/image`, imageFormData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }
      
      toast.success("Product added successfully!");
      // Invalidate caches that list products so they refetch
      invalidateCacheEntry("products"); // A generic key, might need to be more specific if ProductList uses dynamic keys
      // If SellerProducts page uses a specific key for its own products, invalidate that too.
      // For example, if SellerProducts uses `products-seller-${currentUser.id}`
      if (currentUser?.id) {
        invalidateCacheEntry(`products-/products?sellerId=${currentUser.id}&page=0&size=${PRODUCTS_PER_PAGE}&sort=id,DESC`); // Example key for first page
      }
      // Also invalidate general product list caches if they exist and are different
      // This depends on how `useFetchCached` keys are structured in `ProductList.jsx`
      // For simplicity, a broad invalidation might be okay, or a more targeted one.
      // Example: invalidateCacheEntryPrefix('products-'); if you implement such a function.


      setFormData(initialFormData);
      removeImagePreview();
      setErrors({});
      navigate("/seller/products"); // Navigate to seller's product list

    } catch (error) {
      console.error("Error adding product:", error.response?.data || error.message);
      const errMsg = error.response?.data?.message || "Failed to add product. Please try again.";
      toast.error(errMsg);
      // If product creation failed but image upload was next, consider how to handle.
      // For now, a general error.
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 p-6 sm:p-8 flex justify-center items-center">
          <p className="text-gray-500 animate-pulse">Loading form...</p>
        </main>
      </div>
    );
  }

  if (!currentUser || userRole !== 'SELLER') {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 p-6 sm:p-8 flex flex-col justify-center items-center text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Access Denied</h2>
          <p className="text-gray-600">Only Sellers can add products.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar /> {/* Sidebar gets user info from AuthContext */}

      <main className="flex-1 p-6 sm:p-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Add New Product</h1>
          <p className="text-sm text-gray-500 mt-1">Fill in the details below to list your product.</p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-xl space-y-6 max-w-3xl mx-auto">
          {/* Form fields (name, description, price, category) remain largely the same as your uploaded version */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
            <input
              type="text" name="name" id="name" value={formData.name}
              onChange={handleChange} onBlur={handleBlur}
              className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
              placeholder="e.g., Summer Floral Dress"
            />
            {errors.name && <p className="text-xs text-red-600 mt-1.5">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              name="description" id="description" value={formData.description}
              onChange={handleChange} onBlur={handleBlur} rows="4"
              className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
              placeholder="Detailed description of your product..."
            ></textarea>
            {errors.description && <p className="text-xs text-red-600 mt-1.5">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
              <input
                type="number" name="price" id="price" value={formData.price}
                onChange={handleChange} onBlur={handleBlur} step="0.01"
                className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${errors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
                placeholder="e.g., 29.99"
              />
              {errors.price && <p className="text-xs text-red-600 mt-1.5">{errors.price}</p>}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select
                name="category" id="category" value={formData.category}
                onChange={handleChange} onBlur={handleBlur}
                className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm bg-white ${errors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
              >
                {/* These categories should ideally come from a dynamic source or match backend enum/table */}
                <option value="Dress">Dress</option>
                <option value="Jacket">Jacket</option>
                <option value="Kids">Kids</option>
                <option value="Shirt">Shirt</option>
                <option value="T-shirt">T-shirt</option>
                <option value="Trouser">Trouser</option>
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
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label
                      htmlFor="imageUpload"
                      className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-1"
                    >
                      <span>Upload a file</span>
                      <input
                        id="imageUpload"
                        name="imageUpload"
                        type="file"
                        className="sr-only"
                        onChange={handleImageChange}
                        accept="image/png, image/jpeg, image/webp" // Removed GIF as it's less common for product images
                      />
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 2MB</p>
                </div>
              ) : (
                <div className="relative group w-full max-w-xs mx-auto">
                  <img src={imagePreview} alt="Product Preview" className="mx-auto h-48 w-auto object-contain rounded-md shadow-md" />
                  <button
                    type="button"
                    onClick={removeImagePreview}
                    className="absolute -top-3 -right-3 p-1.5 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300 hover:bg-red-700"
                    aria-label="Remove image"
                  >
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              )}
            </div>
            {errors.image && <p className="text-xs text-red-600 mt-1.5">{errors.image}</p>}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || isAuthLoading}
              className="w-full flex items-center justify-center bg-blue-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-300 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                "Add Product"
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
