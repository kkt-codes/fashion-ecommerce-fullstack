// React-router routes
import { Routes, Route } from "react-router-dom";

// Import Public Pages
import Home from "../pages/Home";
import ProductList from "../pages/ProductList";
import ProductDetails from "../pages/ProductDetails";
import Cart from "../pages/Cart";
import About from "../pages/About";
import Contact from "../pages/Contact";
import NotFound from "../pages/NotFound";

// Import Seller Pages
import SellerDashboard from "../pages/seller/SellerDashboard";
import SellerProducts from "../pages/seller/SellerProducts";
import SellerMessages from "../pages/seller/SellerMessages";
import AddProduct from "../pages/seller/AddProduct";
import EditProduct from "../pages/seller/EditProduct";

// Import Buyer Pages
import BuyerDashboard from "../pages/buyer/BuyerDashboard";
import BuyerOrders from "../pages/buyer/BuyerOrders";
import BuyerMessages from "../pages/buyer/BuyerMessages";
import BuyerProfile from "../pages/buyer/BuyerProfile";
import BuyerFavoritesPage from "../pages/buyer/BuyerFavorites.jsx"; 

// Protected Route Components
import ProtectedRoute from "../components/ProtectedRoute";      // For Sellers
import BuyerProtectedRoute from "../components/BuyerProtectedRoute";  // For Buyers

/* 
  AppRoutes Component
  - All route paths are defined here
  - Protected routes are wrapped properly
*/
export default function AppRoutes() {
  return (
    <Routes>

      {/* ===== Public Routes ===== */}
      <Route path="/" element={<Home />} />
      <Route path="/products" element={<ProductList />} />
      <Route path="/products/:id" element={<ProductDetails />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />

      {/* ===== Seller Protected Routes ===== */}
      <Route path="/seller/dashboard" element={
        <ProtectedRoute>
          <SellerDashboard />
        </ProtectedRoute>
      } />
      <Route path="/seller/products" element={
        <ProtectedRoute>
          <SellerProducts />
        </ProtectedRoute>
      } />
      <Route path="/seller/messages" element={
        <ProtectedRoute>
          <SellerMessages />
        </ProtectedRoute>
      } />
      <Route path="/seller/add-product" element={
        <ProtectedRoute>
          <AddProduct />
        </ProtectedRoute>
      } />
      <Route path="/seller/edit-product/:id" element={
        <ProtectedRoute>
          <EditProduct />
        </ProtectedRoute>
      } />

      {/* ===== Buyer Protected Routes ===== */}
      <Route path="/buyer/dashboard" element={
        <BuyerProtectedRoute>
          <BuyerDashboard />
        </BuyerProtectedRoute>
      } />
      <Route path="/buyer/orders" element={
        <BuyerProtectedRoute>
          <BuyerOrders />
        </BuyerProtectedRoute>
      } />
      <Route path="/buyer/messages" element={
        <BuyerProtectedRoute>
          <BuyerMessages />
        </BuyerProtectedRoute>
      } />
      <Route path="/buyer/profile" element={
        <BuyerProtectedRoute>
          <BuyerProfile />
        </BuyerProtectedRoute>
      } />
      <Route path="/buyer/favorites" element={
        <BuyerProtectedRoute>
          <BuyerFavoritesPage />
        </BuyerProtectedRoute>
      } />

      {/* ===== Catch All Route (404) ===== */}
      <Route path="*" element={<NotFound />} />

    </Routes>
  );
}
