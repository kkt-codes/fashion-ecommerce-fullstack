import React from 'react';
import { Routes, Route, Outlet } from "react-router-dom"; // Added Outlet for nested routes if needed

// --- Page Imports ---
// Public Pages
import Home from "../pages/Home";
import ProductList from "../pages/ProductList";
import ProductDetails from "../pages/ProductDetails";
import CartPage from "../pages/Cart";
import AboutPage from "../pages/About";
import ContactPage from "../pages/Contact";
import NotFoundPage from "../pages/NotFound";

// Authenticated User Pages (Generic)
import UserProfileEditPage from "../pages/profile/UserProfileEditPage";

// Buyer Pages
import BuyerDashboard from "../pages/buyer/BuyerDashboard";
import BuyerOrdersPage from "../pages/buyer/BuyerOrders";
import BuyerMessagesPage from "../pages/buyer/BuyerMessages";
import BuyerFavoritesPage from "../pages/buyer/BuyerFavorites";
import BuyerReviewsPage from "../pages/buyer/BuyerReviewsPage";

// Seller Pages
import SellerDashboard from "../pages/seller/SellerDashboard";
import SellerProductsPage from "../pages/seller/SellerProducts"; // Manages own products
import SellerAddProductPage from "../pages/seller/AddProduct";    // Specific page to add product
import SellerEditProductPage from "../pages/seller/EditProduct";  // Specific page to edit product
import SellerOrdersPage from "../pages/seller/SellerOrdersPage";   // Orders containing seller's products
import SellerMessagesPage from "../pages/seller/SellerMessages";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUserManagementPage from "../pages/admin/AdminUserManagement";
import AdminProductManagementPage from "../pages/admin/AdminProductManagement"; // View/manage all products
import AdminOrderManagementPage from "../pages/admin/AdminOrderManagement";   // View/manage all orders
import AdminContactMessagesPage from "../pages/admin/AdminContactMessages";
import AdminSettingsPage from "../pages/admin/AdminSettings";
// Example: import AdminSystemLogsPage from "../pages/admin/AdminSystemLogsPage";


// --- Protected Route Component Imports ---
import SellerProtectedRoute from "../components/SellerProtectedRoute"; // Assuming this is for Sellers
import BuyerProtectedRoute from "../components/BuyerProtectedRoute";
import AdminProtectedRoute from "../components/AdminProtectedRoute";
import AuthenticatedRoute from "../components/AuthenticatedRoute";

// --- Layout Components (Optional but common for dashboards) ---
// Example: You might have a DashboardLayout that includes the Sidebar
// import DashboardLayout from "../layouts/DashboardLayout"; 

export default function AppRoutes() {
  return (
    <Routes>
      {/* ===== Public Routes ===== */}
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* ===== Authenticated User Routes (Generic) ===== */}
      <Route path="/profile/edit" element={
        <AuthenticatedRoute>
          <UserProfileEditPage />
        </AuthenticatedRoute>
      } />

      {/* ===== Buyer Protected Routes ===== */}
      {/* Example of using a layout for buyer section:
      <Route path="/buyer" element={<AuthenticatedRoute><DashboardLayout /></AuthenticatedRoute>}>
        <Route path="dashboard" element={<BuyerProtectedRoute><BuyerDashboard /></BuyerProtectedRoute>} />
        <Route path="orders" element={<BuyerProtectedRoute><BuyerOrdersPage /></BuyerProtectedRoute>} />
        ...
      </Route>
      If not using a nested layout, define them individually:
      */}
      <Route path="/buyer/dashboard" element={<BuyerProtectedRoute><BuyerDashboard /></BuyerProtectedRoute>} />
      <Route path="/buyer/orders" element={<BuyerProtectedRoute><BuyerOrdersPage /></BuyerProtectedRoute>} />
      <Route path="/buyer/messages" element={<BuyerProtectedRoute><BuyerMessagesPage /></BuyerProtectedRoute>} />
      <Route path="/buyer/favorites" element={<BuyerProtectedRoute><BuyerFavoritesPage /></BuyerProtectedRoute>} />
      <Route path="/buyer/reviews" element={<BuyerProtectedRoute><BuyerReviewsPage /></BuyerProtectedRoute>} />


      {/* ===== Seller Protected Routes ===== */}
      <Route path="/seller/dashboard" element={<SellerProtectedRoute><SellerDashboard /></SellerProtectedRoute>} />
      <Route path="/seller/products" element={<SellerProtectedRoute><SellerProductsPage /></SellerProtectedRoute>} />
      <Route path="/seller/products/add" element={<SellerProtectedRoute><SellerAddProductPage /></SellerProtectedRoute>} /> {/* More specific path for adding */}
      <Route path="/seller/products/edit/:id" element={<SellerProtectedRoute><SellerEditProductPage /></SellerProtectedRoute>} /> {/* More specific path for editing */}
      <Route path="/seller/orders" element={<SellerProtectedRoute><SellerOrdersPage /></SellerProtectedRoute>} />
      <Route path="/seller/messages" element={<SellerProtectedRoute><SellerMessagesPage /></SellerProtectedRoute>} />
      

      {/* ===== Admin Protected Routes ===== */}
      <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
      <Route path="/admin/users" element={<AdminProtectedRoute><AdminUserManagementPage /></AdminProtectedRoute>} />
      <Route path="/admin/products" element={<AdminProtectedRoute><AdminProductManagementPage /></AdminProtectedRoute>} />
      <Route path="/admin/orders" element={<AdminProtectedRoute><AdminOrderManagementPage /></AdminProtectedRoute>} />
      <Route path="/admin/contact-messages" element={<AdminProtectedRoute><AdminContactMessagesPage /></AdminProtectedRoute>} />
      <Route path="/admin/settings" element={<AdminProtectedRoute><AdminSettingsPage /></AdminProtectedRoute>} />
      {/* <Route path="/admin/logs" element={<AdminProtectedRoute><AdminSystemLogsPage /></AdminProtectedRoute>} /> */}
      
      {/* ===== Catch All Route (404) ===== */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
