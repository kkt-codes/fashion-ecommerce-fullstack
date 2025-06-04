import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuthContext } from '../context/AuthContext';
import { useSignupSigninModal } from '../hooks/useSignupSigninModal';
import { TrashIcon, PlusIcon, MinusIcon, TruckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { addBusinessDays, format } from 'date-fns';
import apiClient from '../services/api'; // For placing order

// --- Delivery Options Configuration ---
// This should ideally be fetched from backend or have IDs that map to backend Delivery IDs
const deliveryOptionsData = [
  {
    id: 'standard', // Frontend ID
    backendId: 1,   // Assuming backend Delivery entity ID for "Standard" is 1
    label: 'Standard Shipping',
    durationText: '5-7 business days',
    fee: 0.00,
    calculateEstimatedDate: () => {
      const today = new Date();
      return `${format(addBusinessDays(today, 5), 'MMM d')} - ${format(addBusinessDays(today, 7), 'MMM d, yy')}`;
    },
  },
  {
    id: 'express',
    backendId: 2, // Assuming backend Delivery entity ID for "Express" is 2
    label: 'Express Shipping',
    durationText: '2-3 business days',
    fee: 7.99,
    calculateEstimatedDate: () => {
      const today = new Date();
      return `${format(addBusinessDays(today, 2), 'MMM d')} - ${format(addBusinessDays(today, 3), 'MMM d, yy')}`;
    },
  },
  // Add more options and ensure backendId matches your database Delivery IDs
];
// --- End Delivery Options ---

export default function CartPage() { // Renamed from Cart to CartPage for clarity
  const {
    cartItems, // These items now include `cartItemId` if from backend
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
    isLoading: isCartLoading, // Loading state from CartContext
  } = useCart();

  const { isAuthenticated, currentUser, userRole, isLoading: authIsLoading } = useAuthContext();
  const { openModal, switchToTab } = useSignupSigninModal();
  const navigate = useNavigate();

  const [selectedDeliveryOptionId, setSelectedDeliveryOptionId] = useState(deliveryOptionsData[0].id);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  const handleQuantityChange = (item, change) => {
    const newQuantity = item.quantity + change;
    // updateQuantity from CartContext now takes cartItemId (if authenticated) or productId (if guest)
    // and the new quantity. It also handles removal if newQuantity <= 0.
    // The CartContext's updateQuantity needs to know if it's operating on a guest cart item (using productId)
    // or an authenticated user's cart item (using cartItemId).
    // Our refactored CartContext handles this by checking isAuthenticated.
    // For authenticated, it expects cartItemId. For guest, productId.
    
    const idToUpdate = isAuthenticated && item.cartItemId ? item.cartItemId : item.id;
    const isCartItemId = isAuthenticated && item.cartItemId != null;

    if (newQuantity > 0) {
      updateQuantity(idToUpdate, newQuantity, isCartItemId);
    } else {
      removeFromCart(idToUpdate, isCartItemId); // removeFromCart also needs to know
      toast.error(`${item.name} removed from cart.`);
    }
  };

  const handleDirectQuantityInput = (item, eventValue) => {
    const newQuantity = parseInt(eventValue, 10);
    const idToUpdate = isAuthenticated && item.cartItemId ? item.cartItemId : item.id;
    const isCartItemId = isAuthenticated && item.cartItemId != null;

    if (!isNaN(newQuantity) && newQuantity >= 1) {
        updateQuantity(idToUpdate, newQuantity, isCartItemId);
    }
    // Blur handler will reset if invalid
  };

  const handleBlurQuantityInput = (item, eventValue) => {
    const idToUpdate = isAuthenticated && item.cartItemId ? item.cartItemId : item.id;
    const isCartItemId = isAuthenticated && item.cartItemId != null;
    if (eventValue === "" || parseInt(eventValue, 10) < 1 || isNaN(parseInt(eventValue,10))) {
        updateQuantity(idToUpdate, 1, isCartItemId); 
        toast.error("Quantity reset to 1.", { duration: 2000 });
    }
  };
  
  const handleRemoveItem = (item) => {
    const idToRemove = isAuthenticated && item.cartItemId ? item.cartItemId : item.id;
    const isCartItemId = isAuthenticated && item.cartItemId != null;
    removeFromCart(idToRemove, isCartItemId);
    // Toast is now handled within CartContext's removeFromCart
  };

  const handleClearCart = () => {
    clearCart(); // clearCart in CartContext handles API call and toasts
  }

  const selectedDeliveryOption = deliveryOptionsData.find(opt => opt.id === selectedDeliveryOptionId) || deliveryOptionsData[0];
  const deliveryFee = selectedDeliveryOption.fee;
  const subtotal = getCartTotal();
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!isAuthenticated || !currentUser || userRole !== 'BUYER') {
      toast.error("Please sign in as a Buyer to place an order.");
      switchToTab("signin");
      openModal();
      return;
    }
    if (cartItems.length === 0) {
        toast.error("Your cart is empty. Add some products before placing an order.");
        return;
    }

    setIsPlacingOrder(true);
    try {
      // Backend /api/orders/checkout expects userId and deliveryId (Long)
      const checkoutPayload = {
        userId: currentUser.id,
        deliveryId: selectedDeliveryOption.backendId, // Use the mapped backendId
      };
      
      const response = await apiClient.post('/orders/checkout', checkoutPayload);
      // Backend returns List<OrderResponseDto>
      
      toast.success(`Order placed successfully! ${response.data.length} order(s) created.`);
      clearCart(); // This will now call the backend to clear the cart for the user
      navigate('/buyer/orders'); // Navigate to order history page
    } catch (error) {
      console.error("Error placing order:", error.response?.data || error.message);
      toast.error(error.response?.data?.message || "Failed to place order. Please try again.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const isLoadingPage = authIsLoading || isCartLoading; // Combined loading state

  if (isLoadingPage && cartItems.length === 0) { // Show full page loader if cart is also initially loading
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center px-4 py-8 bg-gray-50">
        <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-500 text-lg">Loading Your Cart...</p>
      </div>
    );
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center px-4 py-8">
        <img src="/assets/empty-cart.png" alt="Empty cart" className="w-48 sm:w-56 mb-8" />
        <h2 className="text-2xl font-semibold mb-3 text-gray-700">Your Cart is Empty!</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          {isAuthenticated ? "Add some products to get started." : "Sign in to see your saved items or start shopping!"}
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link 
                to="/products" 
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 font-semibold text-md shadow-md hover:shadow-lg"
            >
                Shop Products
            </Link>
            {!isAuthenticated && (
                <button 
                    onClick={() => { switchToTab("signin"); openModal(); }} 
                    className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition font-medium hover:text-gray-800 hover:border-gray-400"
                >
                    Sign In
                </button>
            )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">Your Shopping Cart</h1>
          <p className="text-gray-600 mt-2">Review your items and proceed to checkout.</p>
        </header>

        <div className="flex flex-col lg:flex-row lg:gap-8 xl:gap-12">
          <div className="lg:w-2/3 w-full mb-8 lg:mb-0">
            <div className="bg-white shadow-lg rounded-xl">
              <div className="px-4 py-3 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Cart Items ({getItemCount()})</h2>
                {cartItems.length > 0 && (
                    <button 
                        onClick={handleClearCart} 
                        disabled={isCartLoading || isPlacingOrder}
                        className="px-4 py-1.5 border border-red-500 text-red-600 text-xs font-medium rounded-md hover:bg-red-500 hover:text-white transition-all duration-200 disabled:opacity-50"
                    >
                    Clear Cart
                    </button>
                )}
              </div>
                <ul className="divide-y divide-gray-200">
                  {cartItems.map((item) => ( // item.id is productId for guest, item.productId for auth user if mapped directly from backend DTO
                                            // The mapBackendCartItem in CartContext standardizes this to item.id = productId
                    <li key={item.cartItemId || item.id} className="flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-6 gap-4">
                      <img 
                        src={item.photoUrl || '/assets/placeholder.png'} 
                        alt={item.name} 
                        className="w-28 h-28 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0 border border-gray-200 bg-gray-50" 
                        onError={(e) => { e.target.onerror = null; e.target.src = '/assets/placeholder.png'; }}
                      />
                      <div className="flex-grow text-left">
                        <Link to={`/products/${item.id}`} className="hover:text-blue-600 transition-colors">
                          <h3 className="text-lg font-semibold text-gray-800 leading-tight">{item.name}</h3>
                        </Link>
                        <p className="text-sm text-gray-500 mt-0.5">{item.category}</p>
                        <p className="text-sm text-blue-600 font-medium mt-0.5">
                          Price: ${item.price ? item.price.toFixed(2) : 'N/A'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <button 
                                onClick={() => handleQuantityChange(item, -1)} 
                                disabled={isCartLoading || isPlacingOrder}
                                className="p-1 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-colors disabled:opacity-50" aria-label="Decrease quantity">
                            <MinusIcon className="h-4 w-4" />
                            </button>
                            <input type="number" value={item.quantity}
                                onChange={(e) => handleDirectQuantityInput(item, e.target.value)}
                                onBlur={(e) => handleBlurQuantityInput(item, e.target.value)}
                                disabled={isCartLoading || isPlacingOrder}
                                className="w-12 text-center border-gray-300 rounded-md p-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                                aria-label={`Quantity for ${item.name}`}
                            />
                            <button 
                                onClick={() => handleQuantityChange(item, 1)} 
                                disabled={isCartLoading || isPlacingOrder}
                                className="p-1 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-colors disabled:opacity-50" aria-label="Increase quantity">
                            <PlusIcon className="h-4 w-4" />
                            </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end sm:items-end mt-2 sm:mt-0 sm:ml-auto">
                        <p className="text-md font-semibold text-gray-800 mb-2 sm:mb-4">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <button 
                            onClick={() => handleRemoveItem(item)} 
                            disabled={isCartLoading || isPlacingOrder}
                            className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors text-xs flex items-center gap-1 disabled:opacity-50" aria-label={`Remove ${item.name} from cart`}>
                          <TrashIcon className="h-4 w-4" /> Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
            </div>
          </div>

          {/* Right Column: Delivery Options & Order Summary */}
          <div className="lg:w-1/3 w-full lg:sticky lg:top-28 self-start">
            <div className="bg-white shadow-lg rounded-xl p-5 sm:p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                  <TruckIcon className="h-6 w-6 mr-2 text-blue-600"/>
                  Delivery Options
                </h2>
                <div className="space-y-3">
                  {deliveryOptionsData.map((option) => (
                    <label
                      key={option.id}
                      htmlFor={`delivery-${option.id}`}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-sm
                        ${selectedDeliveryOptionId === option.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                      <input
                        type="radio"
                        id={`delivery-${option.id}`}
                        name="deliveryOption"
                        value={option.id}
                        checked={selectedDeliveryOptionId === option.id}
                        onChange={() => setSelectedDeliveryOptionId(option.id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500 mr-3"
                      />
                      <div className="flex-grow">
                        <span className="font-medium text-sm text-gray-700">{option.label}</span>
                        <p className="text-xs text-gray-500">{option.durationText}</p>
                        <p className="text-xs text-gray-500">Est. Delivery: {option.calculateEstimatedDate()}</p>
                      </div>
                      <span className={`font-semibold text-sm ${selectedDeliveryOptionId === option.id ? 'text-blue-600' : 'text-gray-700'}`}>
                        {option.fee === 0 ? 'FREE' : `$${option.fee.toFixed(2)}`}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3 pt-4 border-t border-gray-200">Order Summary</h2>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Subtotal ({getItemCount()} items):</span>
                    <span className="font-medium text-gray-800">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Delivery Fee:</span>
                    <span className="font-medium text-gray-800">
                      {deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2 mt-1 border-t border-dashed border-gray-300">
                    <span className="text-md font-semibold text-gray-800">Grand Total:</span>
                    <span className="text-xl font-bold text-blue-600">${grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                {(!isAuthenticated || (isAuthenticated && userRole === 'BUYER')) && (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={cartItems.length === 0 || authIsLoading || isCartLoading || isPlacingOrder}
                    className={`w-full px-6 py-3 rounded-lg text-white font-semibold text-md transition-colors duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                      cartItems.length === 0 || authIsLoading || isCartLoading || isPlacingOrder ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isPlacingOrder ? 'Placing Order...' : 'Proceed to Checkout'}
                  </button>
                )}
                {isAuthenticated && userRole === 'SELLER' && cartItems.length > 0 && (
                  <div className="w-full text-center">
                      <p className="text-sm text-orange-600 p-3 bg-orange-50 rounded-md border border-orange-200">
                          Checkout is available for Buyer accounts.
                      </p>
                  </div>
                )}
                {!isAuthenticated && cartItems.length > 0 && (
                  <p className="text-center text-xs text-orange-600 mt-4">
                    You'll be asked to <button onClick={() => { switchToTab("signin"); openModal(); }} className="underline hover:text-orange-700 font-medium">Sign In</button> or <button onClick={() => { switchToTab("signup"); openModal(); }} className="underline hover:text-orange-700 font-medium">Create an Account</button> to complete your order.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
