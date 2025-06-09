import React from 'react';
import { Routes, Route } from "react-router-dom";

// --- Helper & Page Imports ---
import ProtectedRoute from '../components/ProtectedRoute';

// Public Pages
import Home from "../pages/Home";
import ProductList from "../pages/ProductList";
import ProductDetails from "../pages/ProductDetails";
import CartPage from "../pages/Cart";
import AboutPage from "../pages/About";
import ContactPage from "../pages/Contact";
import NotFoundPage from "../pages/NotFound";

// Payment Page
import PaymentPage from "../pages/PaymentPage";

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
import SellerProductsPage from "../pages/seller/SellerProducts";
import SellerAddProductPage from "../pages/seller/AddProduct";
import SellerEditProductPage from "../pages/seller/EditProduct";
import SellerOrdersPage from "../pages/seller/SellerOrdersPage";
import SellerMessagesPage from "../pages/seller/SellerMessages";

// Admin Pages
import AdminDashboard from "../pages/admin/AdminDashboard";
import AdminUserManagementPage from "../pages/admin/AdminUserManagement";
import AdminProductManagementPage from "../pages/admin/AdminProductManagement";
import AdminOrderManagementPage from "../pages/admin/AdminOrderManagement";
import AdminContactMessagesPage from "../pages/admin/AdminContactMessages";
import AdminSettingsPage from "../pages/admin/AdminSettings";
import AdminDeliveryManagementPage from "../pages/admin/AdminDeliveryManagement";

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

      {/* ===== Authenticated User Routes (any role) ===== */}
      <Route 
        path="/profile/edit" 
        element={<ProtectedRoute><UserProfileEditPage /></ProtectedRoute>} 
      />

      {/* ===== Buyer Protected Routes ===== */}
      <Route path="/buyer/dashboard" element={<ProtectedRoute role="BUYER"><BuyerDashboard /></ProtectedRoute>} />
      <Route path="/buyer/orders" element={<ProtectedRoute role="BUYER"><BuyerOrdersPage /></ProtectedRoute>} />
      <Route path="/buyer/messages" element={<ProtectedRoute role="BUYER"><BuyerMessagesPage /></ProtectedRoute>} />
      <Route path="/buyer/favorites" element={<ProtectedRoute role="BUYER"><BuyerFavoritesPage /></ProtectedRoute>} />
      <Route path="/buyer/reviews" element={<ProtectedRoute role="BUYER"><BuyerReviewsPage /></ProtectedRoute>} />
      <Route path="/payment" element={<ProtectedRoute role="BUYER"><PaymentPage /></ProtectedRoute>} />


      {/* ===== Seller Protected Routes ===== */}
      <Route path="/seller/dashboard" element={<ProtectedRoute role="SELLER"><SellerDashboard /></ProtectedRoute>} />
      <Route path="/seller/products" element={<ProtectedRoute role="SELLER"><SellerProductsPage /></ProtectedRoute>} />
      <Route path="/seller/products/add" element={<ProtectedRoute role="SELLER"><SellerAddProductPage /></ProtectedRoute>} />
      <Route path="/seller/products/edit/:id" element={<ProtectedRoute role="SELLER"><SellerEditProductPage /></ProtectedRoute>} />
      <Route path="/seller/orders" element={<ProtectedRoute role="SELLER"><SellerOrdersPage /></ProtectedRoute>} />
      <Route path="/seller/messages" element={<ProtectedRoute role="SELLER"><SellerMessagesPage /></ProtectedRoute>} />
      
      {/* ===== Admin Protected Routes ===== */}
      <Route path="/admin/dashboard" element={<ProtectedRoute role="ADMIN"><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role="ADMIN"><AdminUserManagementPage /></ProtectedRoute>} />
      <Route path="/admin/products" element={<ProtectedRoute role="ADMIN"><AdminProductManagementPage /></ProtectedRoute>} />
      <Route path="/admin/orders" element={<ProtectedRoute role="ADMIN"><AdminOrderManagementPage /></ProtectedRoute>} />
      <Route path="/admin/contact-messages" element={<ProtectedRoute role="ADMIN"><AdminContactMessagesPage /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute role="ADMIN"><AdminSettingsPage /></ProtectedRoute>} />
      <Route path="/admin/deliveries" element={<ProtectedRoute role="ADMIN"><AdminDeliveryManagementPage /></ProtectedRoute>} />
      
      {/* ===== Catch All Route (404 Not Found) ===== */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}