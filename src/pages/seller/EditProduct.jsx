import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useAuthContext } from "../../context/AuthContext";
import apiClient from "../../services/api"; // For API calls
import { useFetchCached, invalidateCacheEntry } from "../../hooks/useFetchCached";
import toast from 'react-hot-toast';
import { 
    ArrowUpTrayIcon, 
    XCircleIcon,
    ExclamationTriangleIcon,
    ArrowLeftIcon 
} from "@heroicons/react/24/outline";

const PRODUCTS_PER_PAGE_FOR_CACHE_INVALIDATION = 12; // Align with SellerProducts.jsx

export default function EditProduct() {
  const { id: productId } = useParams();
  const { currentUser, isLoading: isAuthLoading, userRole } = useAuthContext();
  const navigate = useNavigate();

  const initialFormState = {
    name: "",
    description: "",
    price: "",
    category: "Dress", // Default category
  };

  const [formData, setFormData] = useState(initialFormState);
  const [selectedFile, setSelectedFile] = useState(null);    // Stores the new File object if selected
  const [imagePreview, setImagePreview] = useState("");      // Stores Data URL for new image preview or existing photoUrl
  const [existingPhotoUrl, setExistingPhotoUrl] = useState(""); // Stores the original photoUrl
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState(null);

  // Fetch the product to edit
  const { 
    data: productToEdit, 
    loading: isLoadingProduct, 
    error: productFetchError,
    forceRefetch: refetchProduct
  } = useFetchCached(`product-${productId}`, `/products/${productId}`, {
    // cacheDuration: 5 * 60 * 1000 // Cache for 5 mins, or rely on invalidation
  });

  useEffect(() => {
    if (isAuthLoading) return; // Wait for auth to load

    if (!currentUser || userRole !== 'SELLER') {
      toast.error("Access Denied. Only Sellers can edit products.");
      navigate("/login"); // Or to seller dashboard if already logged in as non-seller
      return;
    }

    if (productToEdit) {
      // Ownership check
      if (productToEdit.sellerId !== currentUser.id) {
        toast.error("Access Denied. You do not own this product.");
        setPageError("You do not have permission to edit this product.");
        navigate("/seller/products");
        return;
      }
      setFormData({
        name: productToEdit.name || "",
        description: productToEdit.description || "",
        price: productToEdit.price !== undefined ? String(productToEdit.price) : "",
        category: productToEdit.category || "Dress",
      });
      setImagePreview(productToEdit.photoUrl || ""); // Display existing image
      setExistingPhotoUrl(productToEdit.photoUrl || "");
      setPageError(null);
    } else if (productFetchError) {
        setPageError(productFetchError.message || "Failed to load product details.");
        toast.error(productFetchError.message || "Could not load product to edit.");
    }
  }, [productId, currentUser, userRole, isAuthLoading, navigate, productToEdit, productFetchError]);


  const validateField = useCallback((name, value) => {
    let error = "";
    // Same validation logic as AddProduct
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
      if (file.size > 2 * 1024 * 1024) { // Max 2MB
        setErrors(prev => ({ ...prev, image: "File is too large (max 2MB)." }));
        setSelectedFile(null);
        setImagePreview(existingPhotoUrl); // Revert to existing if new one is invalid
        e.target.value = null; 
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setErrors(prev => ({ ...prev, image: "Invalid file type (JPEG, PNG, WEBP)." }));
        setSelectedFile(null);
        setImagePreview(existingPhotoUrl);
        e.target.value = null; 
        return;
      }
      setSelectedFile(file); // Store the new File object
      const reader = new FileReader();
      reader.onloadend = () => { setImagePreview(reader.result); };
      reader.onerror = () => {
        toast.error("Could not read image file.");
        setErrors(prev => ({ ...prev, image: "Could not read image file." }));
        setSelectedFile(null); setImagePreview(existingPhotoUrl); e.target.value = null;
      }
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, image: null }));
    } else { // If file selection is cancelled
      setSelectedFile(null);
      setImagePreview(existingPhotoUrl); // Revert to existing image preview
    }
  };

  const removeImagePreview = () => {
    setSelectedFile(null);
    setImagePreview(""); // Clear preview, effectively "removing" image for this update
                         // Backend will need to handle null photoUrl if that means delete image
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) fileInput.value = null; 
    setErrors(prev => ({ ...prev, image: null }));
    // Note: This only removes the *new* selected file or clears the preview.
    // To delete an *existing* image on the server, you'd need a separate mechanism or flag.
    // For now, if imagePreview is empty and no selectedFile, backend might keep old image or clear it.
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(initialFormState).forEach(key => { // Validate against initialFormState keys
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    // Image is not strictly mandatory for an update if one already exists.
    // If imagePreview is empty AND no selectedFile, it means user removed existing image.
    // Backend needs to handle this (e.g., set photoUrl to null).
    // For now, if imagePreview is empty, it's fine if an image was never required for update.
    // If you want to enforce that an image must *always* be present:
    // if (!imagePreview && !selectedFile) newErrors.image = "Product image is required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || userRole !== 'SELLER') {
      toast.error("Authentication error. Please sign in as a Seller.");
      return;
    }
    if (!productToEdit || productToEdit.sellerId !== currentUser.id) {
      toast.error("Cannot update product: Not owner or product not loaded.");
      return;
    }
    if (!validateForm()) {
      toast.error("Please correct the errors in the form.");
      return;
    }

    setIsSubmitting(true);

    // Backend ProductDto for update expects: name, description, price, category.
    // photoUrl is handled by a separate endpoint.
    const productUpdatePayload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      category: formData.category,
      // Do not send photoUrl here; it's managed by the image upload endpoint.
      // The backend PUT /api/products/{id} should not expect photoUrl in its DTO.
    };

    try {
      // Step 1: Update product text details
      const productResponse = await apiClient.put(`/products/${productId}`, productUpdatePayload);
      const updatedProduct = productResponse.data; // This is updated ProductDto

      // Step 2: If a new file was selected, upload it
      if (selectedFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', selectedFile);
        await apiClient.post(`/products/${productId}/image`, imageFormData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } 
      // If imagePreview is empty and selectedFile is null, it means the user wants to remove the image.
      // This requires a specific backend call, e.g., DELETE /api/products/{id}/image or PUT with photoUrl: null
      // For now, we assume if no new image is uploaded, the old one is kept unless explicitly removed.
      // If imagePreview is "" and existingPhotoUrl was not "", it implies removal.
      // This needs a backend mechanism. For simplicity, we're not implementing "delete image" here.

      toast.success("Product updated successfully!");
      
      // Invalidate relevant caches
      invalidateCacheEntry(`product-${productId}`); // Specific product
      invalidateCacheEntry(`products-/products?sellerId=${currentUser.id}&page=${currentPage}&size=${PRODUCTS_PER_PAGE_FOR_CACHE_INVALIDATION}&sort=id,DESC`); // Seller's product list (current page)
      // Invalidate general product list cache if ProductList.jsx uses a predictable key or prefix
      invalidateCacheEntry("products"); // Broad invalidation for public product lists
      // More robust: invalidateCacheEntryPrefix('products-');

      navigate("/seller/products");

    } catch (error) {
      console.error("Error updating product:", error.response?.data || error.message);
      const errMsg = error.response?.data?.message || "Failed to update product. Please try again.";
      toast.error(errMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isAuthLoading || isLoadingProduct) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 flex justify-center items-center">
          <p className="text-gray-500 animate-pulse">Loading product details...</p>
        </main>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar />
        <main className="flex-1 p-6 sm:p-8 flex flex-col justify-center items-center text-center">
          <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mb-4" />
          <h2 className="text-xl font-semibold text-red-600">Error</h2>
          <p className="text-gray-600">{pageError}</p>
          <button onClick={() => navigate("/seller/products")} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Back to My Products
          </button>
        </main>
      </div>
    );
  }
  
  if (!currentUser || userRole !== 'SELLER' || !productToEdit) {
     return ( // Should be caught by useEffect redirect or pageError
      <div className="flex min-h-screen bg-gray-50">
         <Sidebar />
        <main className="flex-1 p-6 sm:p-8 flex justify-center items-center">
          <p className="text-gray-600">Product not found or access denied.</p>
        </main>
      </div>
    );
  }


  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar /> {/* Sidebar gets user info from AuthContext */}

      <main className="flex-1 p-6 sm:p-8">
        <header className="mb-8">
            <button 
                onClick={() => navigate(-1)} 
                className="mb-4 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
                <ArrowLeftIcon className="h-4 w-4" />
                Back to Products
            </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Edit Product</h1>
          <p className="text-sm text-gray-500 mt-1">
            Update details for: <span className="font-medium text-gray-700">{formData.name || "Product"}</span>
          </p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-xl space-y-6 max-w-3xl mx-auto">
          {/* Form fields are similar to AddProduct, pre-filled with formData */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
            <input
              type="text" name="name" id="name" value={formData.name}
              onChange={handleChange} onBlur={handleBlur}
              className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
            />
            {errors.name && <p className="text-xs text-red-600 mt-1.5">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              name="description" id="description" value={formData.description}
              onChange={handleChange} onBlur={handleBlur} rows="4"
              className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
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
                <option value="Dress">Dress</option>
                <option value="Jacket">Jacket</option>
                <option value="Kids">Kids</option>
                <option value="Shirt">Shirt</option>
                <option value="T-shirt">T-shirt</option>
                <option value="Trouser">Trouser</option>
                <option value="Accessory">Accessory</option> 
                <option value="Footwear">Footwear</option>
              </select>
              {errors.category && <p className="text-xs text-red-600 mt-1.5">{errors.category}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Product Image</label>
            <div className={`mt-1 flex flex-col items-center justify-center px-6 pt-8 pb-8 border-2 ${errors.image ? 'border-red-400' : 'border-gray-300'} border-dashed rounded-lg hover:border-blue-400 transition-colors`}>
              {!imagePreview ? ( // Show upload prompt if no imagePreview (meaning user removed it or it never existed)
                <div className="space-y-2 text-center">
                  <ArrowUpTrayIcon className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600 justify-center">
                    <label htmlFor="imageUpload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500 px-1">
                      <span>Upload a new image</span>
                      <input id="imageUpload" name="imageUpload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg, image/webp"/>
                    </label>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, WEBP up to 2MB. If no new image is uploaded, the existing one will be kept.</p>
                </div>
              ) : (
                <div className="relative group w-full max-w-xs mx-auto">
                  <img src={imagePreview} alt="Product Preview" className="mx-auto h-48 w-auto object-contain rounded-md shadow-md" />
                  <button type="button" onClick={removeImagePreview} className="absolute -top-3 -right-3 p-1.5 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300 hover:bg-red-700" aria-label="Remove image preview">
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              )}
            </div>
            {errors.image && <p className="text-xs text-red-600 mt-1.5">{errors.image}</p>}
             {imagePreview && !selectedFile && (formData.name) &&
                 <p className="text-xs text-gray-500 mt-1 text-center">
                    Currently showing existing image. Upload a new file to change it, or click 'X' to remove (backend support for removal needed).
                 </p>
            }
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting || isAuthLoading || isLoadingProduct}
              className="w-full flex items-center justify-center bg-green-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-300 font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Updating..." : "Update Product"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
