import React, { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useAuthContext } from "../../context/AuthContext";
import toast from 'react-hot-toast';
import { ArrowUpTrayIcon, XCircleIcon, ChartBarIcon, ArchiveBoxIcon, PlusCircleIcon, ChatBubbleLeftEllipsisIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";

const API_BASE_URL = 'http://localhost:8080/api';

export default function EditProduct() {
  const { id: productId } = useParams(); // Get productId from URL
  const { currentUser, isLoading: isAuthLoading, userRole } = useAuthContext();
  const navigate = useNavigate();

  const initialFormState = {
    name: "",
    description: "",
    price: "",
    category: "Dress", // Default, will be overridden by fetched data
  };

  const [formData, setFormData] = useState(initialFormState);
  const [selectedFile, setSelectedFile] = useState(null); // For new image file
  const [imagePreview, setImagePreview] = useState("");   // Data URL for preview (new or existing)
  const [originalPhotoUrl, setOriginalPhotoUrl] = useState(""); // To store the initial photo URL from backend
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productFetchError, setProductFetchError] = useState(null);

  const sellerLinks = [
    { label: "Dashboard", path: "/seller/dashboard", icon: ChartBarIcon },
    { label: "My Products", path: "/seller/products", icon: ArchiveBoxIcon },
    { label: "Add Product", path: "/seller/add-product", icon: PlusCircleIcon },
    { label: "Messages", path: "/seller/messages", icon: ChatBubbleLeftEllipsisIcon }
  ];

  // Fetch product data when component mounts or productId changes
  const fetchProductDetails = useCallback(async () => {
    if (!productId || !currentUser?.id) {
        setIsLoadingProduct(false);
        return;
    }
    setIsLoadingProduct(true);
    setProductFetchError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/products/${productId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Product not found or error fetching details." }));
        throw new Error(errorData.message);
      }
      const productToEdit = await response.json(); // ProductDto

      // Authorization check: Ensure current user is the seller of this product
      if (String(productToEdit.sellerId) !== String(currentUser.id)) {
        toast.error("Access Denied: You are not the owner of this product.");
        navigate("/seller/products");
        throw new Error("User is not the owner of the product.");
      }

      setFormData({
        name: productToEdit.name,
        description: productToEdit.description,
        price: String(productToEdit.price), // Convert to string for input field
        category: productToEdit.category,
      });
      setImagePreview(productToEdit.photoUrl || ""); // Set preview to existing image URL
      setOriginalPhotoUrl(productToEdit.photoUrl || "");
    } catch (error) {
      console.error("Error fetching product details:", error);
      setProductFetchError(error.message);
      toast.error(error.message || "Failed to load product data.");
      // navigate("/seller/products"); // Optionally navigate back if product not found
    } finally {
      setIsLoadingProduct(false);
    }
  }, [productId, currentUser, navigate]);

  useEffect(() => {
    if (isAuthLoading) return; // Wait for auth context to load

    if (!currentUser || userRole !== 'Seller') {
      toast.error("Access Denied. Please sign in as a Seller.");
      navigate("/login"); // Or to a general access denied page
      setIsLoadingProduct(false);
      return;
    }
    fetchProductDetails();
  }, [productId, currentUser, userRole, isAuthLoading, navigate, fetchProductDetails]);


  const validateField = useCallback((name, value) => {
    // Same validation logic as AddProduct
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
        if (!value) error = "Price is required.";
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
      if (file.size > 1 * 1024 * 1024) { // Max 1MB
        setErrors(prev => ({ ...prev, image: "File is too large (max 1MB)." }));
        setSelectedFile(null); e.target.value = null; return;
      }
      if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
        setErrors(prev => ({ ...prev, image: "Invalid file type." }));
        setSelectedFile(null); e.target.value = null; return;
      }
      setSelectedFile(file); // Store the File object
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result); // Update preview with new image Data URL
      reader.onerror = () => {
        toast.error("Could not read new image file.");
        setErrors(prev => ({ ...prev, image: "Could not read image file." }));
      }
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, image: null }));
    }
  };

  const removeImagePreview = () => {
    setSelectedFile(null);
    // When removing, revert preview to original image if available, else clear
    setImagePreview(originalPhotoUrl || ""); 
    const fileInput = document.getElementById('imageUpload');
    if (fileInput) fileInput.value = null;
    setErrors(prev => ({ ...prev, image: null }));
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(initialFormState).forEach(key => { // Validate against initialFormState keys
      const error = validateField(key, formData[key]);
      if (error) newErrors[key] = error;
    });
    // Image is not strictly required for an update if one already exists.
    // If imagePreview is empty AND no new file selected, AND no original image, then it's an error.
    if (!imagePreview && !selectedFile && !originalPhotoUrl) {
        newErrors.image = "Product image is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser || userRole !== 'Seller') {
      toast.error("Authentication error."); return;
    }
    if (!validateForm()) {
      toast.error("Please correct the errors in the form."); return;
    }

    setIsSubmitting(true);
    const loadingToastId = toast.loading("Updating product...");

    // ProductDto for update (text fields)
    // Backend's ProductService.updateProduct expects a ProductDto
    // It should only update fields that are present and different if needed.
    const productUpdatePayload = {
      id: Number(productId), // Ensure productId is a number if backend expects Long
      name: formData.name.trim(),
      description: formData.description.trim(),
      price: parseFloat(formData.price),
      category: formData.category,
      sellerId: currentUser.id, // Important for backend authorization if checked
      // photoUrl is handled separately or can be included if not changing image
      photoUrl: selectedFile ? null : originalPhotoUrl, // If new file, backend will set new URL. If no new file, keep original.
      // averageRating and numOfReviews are managed by backend
    };

    try {
      // Step 1: Update product text data
      const productResponse = await fetch(`${API_BASE_URL}/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productUpdatePayload),
      });

      if (!productResponse.ok) {
        const errorData = await productResponse.json().catch(() => ({ message: "Failed to update product details." }));
        throw new Error(errorData.message || `Product update failed: ${productResponse.statusText}`);
      }
      // const updatedProduct = await productResponse.json(); // ProductDto

      // Step 2: If a new image was selected, upload it
      if (selectedFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', selectedFile);

        const imageResponse = await fetch(`${API_BASE_URL}/products/${productId}/image`, {
          method: 'POST',
          body: imageFormData,
        });

        if (!imageResponse.ok) {
          const imgErrorData = await imageResponse.json().catch(() => ({ message: "Failed to update product image." }));
          // Text data was updated, but new image upload failed.
          console.warn("Product text updated, but new image upload failed.", imgErrorData);
          toast.error(`Product details updated, but new image upload failed: ${imgErrorData.message || imageResponse.statusText}`, { duration: 5000 });
          // Continue to navigate as text details were updated.
        }
      }
      
      toast.success("Product updated successfully!", { id: loadingToastId });
      navigate("/seller/products");

    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(error.message || "Failed to update product.", { id: loadingToastId });
    } finally {
      setIsSubmitting(false);
    }
  };

  const userName = currentUser?.firstname || "Seller";

  if (isAuthLoading || isLoadingProduct) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar links={sellerLinks} userRole="Seller" userName={userName} />
        <main className="flex-1 p-6 sm:p-8 flex justify-center items-center">
          <p className="text-gray-500 animate-pulse">Loading product details...</p>
        </main>
      </div>
    );
  }

  if (productFetchError) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar links={sellerLinks} userRole="Seller" userName={userName} />
        <main className="flex-1 p-6 sm:p-8 flex flex-col justify-center items-center text-center">
            <ExclamationTriangleIcon className="h-12 w-12 text-red-400 mx-auto mb-3" />
            <h2 className="text-xl font-semibold text-red-600 mb-2">Error Loading Product</h2>
            <p className="text-red-500">{productFetchError}</p>
            <button 
                onClick={fetchProductDetails} 
                className="mt-6 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
                Try Again
            </button>
             <Link to="/seller/products" className="mt-4 text-sm text-blue-600 hover:underline">Back to My Products</Link>
        </main>
      </div>
    );
  }
  
  if (!currentUser || userRole !== 'Seller') {
    // This should ideally be caught by ProtectedRoute, but as a safeguard:
    return (
      <div className="flex min-h-screen bg-gray-50">
        <main className="flex-1 p-6 sm:p-8 flex justify-center items-center">
          <p className="text-gray-600">Access Denied. Please sign in as a Seller.</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 font-sans">
      <Sidebar links={sellerLinks} userRole="Seller" userName={userName} />
      <main className="flex-1 p-6 sm:p-8">
        <header className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Edit Product</h1>
          <p className="text-sm text-gray-500 mt-1">Update details for: <span className="font-medium">{formData.name || "Product"}</span></p>
        </header>

        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-xl shadow-xl space-y-6 max-w-3xl mx-auto">
          {/* Form fields are similar to AddProduct, pre-filled with formData */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Product Name</label>
            <input type="text" name="name" id="name" value={formData.name} onChange={handleChange} onBlur={handleBlur}
              className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`} />
            {errors.name && <p className="text-xs text-red-600 mt-1.5">{errors.name}</p>}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea name="description" id="description" value={formData.description} onChange={handleChange} onBlur={handleBlur} rows="4"
              className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`}
            ></textarea>
            {errors.description && <p className="text-xs text-red-600 mt-1.5">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1.5">Price ($)</label>
              <input type="number" name="price" id="price" value={formData.price} onChange={handleChange} onBlur={handleBlur} step="0.01"
                className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm ${errors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`} />
              {errors.price && <p className="text-xs text-red-600 mt-1.5">{errors.price}</p>}
            </div>
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
              <select name="category" id="category" value={formData.category} onChange={handleChange} onBlur={handleBlur}
                className={`w-full px-4 py-2.5 border rounded-lg shadow-sm focus:outline-none focus:ring-2 sm:text-sm bg-white ${errors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'}`} >
                <option value="Dress">Dress</option> <option value="Jacket">Jacket</option> <option value="Kids">Kids</option>
                <option value="Shirt">Shirt</option> <option value="T-shirt">T-shirt</option> <option value="Trouser">Trouser</option>
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
                    <span>Upload a new image</span>
                    <input id="imageUpload" name="imageUpload" type="file" className="sr-only" onChange={handleImageChange} accept="image/png, image/jpeg, image/gif, image/webp" />
                  </label>
                  <p className="text-xs text-gray-500">PNG, JPG, GIF, WEBP up to 1MB</p>
                </div>
              ) : (
                <div className="relative group w-full max-w-xs mx-auto">
                   <img 
                    src={imagePreview} // Shows new Data URL or existing photoUrl
                    alt="Product Preview" 
                    className="mx-auto h-48 w-auto object-contain rounded-md shadow-md" 
                    onError={(e) => { 
                        // If current imagePreview (could be originalPhotoUrl) fails, show placeholder.
                        // This is more for if originalPhotoUrl was bad.
                        e.target.onerror = null; 
                        setImagePreview('/assets/placeholder.png');
                    }}
                  />
                  <button type="button" onClick={removeImagePreview}
                    className="absolute -top-3 -right-3 p-1.5 bg-red-600 text-white rounded-full shadow-lg opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-300 hover:bg-red-700"
                    aria-label="Remove or change image">
                    <XCircleIcon className="h-6 w-6" />
                  </button>
                </div>
              )}
            </div>
            {errors.image && <p className="text-xs text-red-600 mt-1.5">{errors.image}</p>}
            {imagePreview && !selectedFile && originalPhotoUrl && imagePreview === originalPhotoUrl && (
                 <p className="text-xs text-gray-500 mt-1 text-center">
                    Currently showing existing image. Upload a new file to change it.
                 </p>
            )}
          </div>

          <div className="pt-4">
            <button type="submit" disabled={isSubmitting || isAuthLoading}
              className="w-full flex items-center justify-center bg-green-600 text-white py-3 px-4 rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-300 font-semibold disabled:opacity-70 disabled:cursor-not-allowed">
              {isSubmitting ? ( <><svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"> <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle> <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path> </svg>Updating...</> ) : ( "Update Product" )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
