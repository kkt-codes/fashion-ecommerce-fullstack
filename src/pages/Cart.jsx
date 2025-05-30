import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuthContext } from '../context/AuthContext';
import { useSignupSigninModal } from '../hooks/useSignupSigninModal';
import { TrashIcon, PlusIcon, MinusIcon, TruckIcon, ShoppingBagIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { addBusinessDays, format } from 'date-fns'; 

const API_BASE_URL = 'http://localhost:8080/api';

// --- Delivery Options Configuration ---
// IMPORTANT: The 'backendId' needs to map to the actual Long ID of the Delivery entity in your database.
const deliveryOptionsData = [
  {
    id: 'standard', // Frontend identifier
    backendId: 1,   // Corresponding Long ID in the backend Delivery table
    label: 'Standard Shipping',
    durationText: '5-7 business days',
    fee: 0.00,
    calculateEstimatedDate: () => {
      const today = new Date();
      const estMin = addBusinessDays(today, 5);
      const estMax = addBusinessDays(today, 7);
      return `${format(estMin, 'MMM d')} - ${format(estMax, 'MMM d, yy')}`;
    },
  },
  {
    id: 'express',
    backendId: 2, 
    label: 'Express Shipping',
    durationText: '2-3 business days',
    fee: 7.99,
    calculateEstimatedDate: () => {
      const today = new Date();
      const estMin = addBusinessDays(today, 2);
      const estMax = addBusinessDays(today, 3);
      return `${format(estMin, 'MMM d')} - ${format(estMax, 'MMM d, yy')}`;
    },
  },
  {
    id: 'nextday',
    backendId: 3,
    label: 'Next Day Air',
    durationText: '1 business day',
    fee: 15.99,
    calculateEstimatedDate: () => {
      const today = new Date();
      return format(addBusinessDays(today,1), 'MMM d, yy');
    },
  },
];
// --- End Delivery Options ---

export default function Cart() {
  const {
    cartItems,      // These are now CartResponseDto from backend via CartContext
    removeFromCart, // Takes cartItemId (CartResponseDto.id)
    updateQuantity, // Takes cartItemId (CartResponseDto.id)
    clearCart,      // Interacts with backend via CartContext
    getCartTotal,
    getItemCount,
    isLoading: isCartLoading, // Loading state from CartContext
    refreshCart, // Function to manually refresh cart from backend
  } = useCart();

  const { isAuthenticated, currentUser, userRole, isLoading: authIsLoading } = useAuthContext();
  const { openModal, switchToTab } = useSignupSigninModal();
  const navigate = useNavigate();

  const [selectedDeliveryOptionId, setSelectedDeliveryOptionId] = useState(deliveryOptionsData[0].id);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);

  // Refresh cart when component mounts and user is authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser?.id) {
      refreshCart();
    }
  }, [isAuthenticated, currentUser, refreshCart]);


  const handleQuantityChange = (cartItemId, productId, itemName, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) {
      updateQuantity(cartItemId, newQuantity, productId); // productId for guest cart fallback in context
    } else {
      // updateQuantity in context handles removal if quantity <= 0, or call removeFromCart explicitly
      removeFromCart(cartItemId, productId); // productId for guest cart fallback
      toast.error(`${itemName} removed from cart.`);
    }
  };

  const handleDirectQuantityInput = (cartItemId, productId, eventValue) => {
    const newQuantity = parseInt(eventValue, 10);
    if (!isNaN(newQuantity) && newQuantity >= 1) {
        updateQuantity(cartItemId, newQuantity, productId);
    }
  };

  const handleBlurQuantityInput = (cartItemId, productId, eventValue) => {
    if (eventValue === "" || parseInt(eventValue, 10) < 1 || isNaN(parseInt(eventValue,10))) {
        updateQuantity(cartItemId, 1, productId); 
        toast.error("Quantity reset to 1.", { duration: 2000 });
    }
  };
  
  const handleRemoveItem = (cartItemId, productId, itemName) => {
    removeFromCart(cartItemId, productId); // Pass both for context to handle auth/guest
    // Toast is now handled within CartContext for backend operations
  };

  const handleClearCart = () => {
    clearCart(); // clearCart in context handles backend interaction
    // Toast is handled within CartContext
  }

  const selectedDeliveryOption = deliveryOptionsData.find(opt => opt.id === selectedDeliveryOptionId) || deliveryOptionsData[0];
  const deliveryFee = selectedDeliveryOption.fee;
  const subtotal = getCartTotal(); // From CartContext, based on backend-synced items
  const grandTotal = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!isAuthenticated || !currentUser || userRole !== 'Buyer') {
      toast.error("Please sign in as a Buyer to place an order.");
      if (!isAuthenticated) {
        switchToTab("signin");
        openModal();
      }
      return;
    }
    if (cartItems.length === 0) {
        toast.error("Your cart is empty. Add some products before placing an order.");
        return;
    }

    setIsPlacingOrder(true);
    const loadingToastId = toast.loading("Placing your order...");

    const checkoutPayload = {
      userId: currentUser.id,
      deliveryId: selectedDeliveryOption.backendId, // Use the mapped backend ID
    };

    try {
      const response = await fetch(`${API_BASE_URL}/orders/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Session cookie handles authentication
        },
        body: JSON.stringify(checkoutPayload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: "Failed to place order." }));
        throw new Error(errorData.message || `Order placement failed: ${response.statusText}`);
      }
      
      // Backend returns List<Order> which are the newly created orders
      // const newOrdersData = await response.json(); 
      
      toast.success("Order placed successfully!", { id: loadingToastId });
      await clearCart(); // Clear backend cart via context
      navigate('/buyer/orders'); // Navigate to buyer's orders page

    } catch (error) {
      console.error("Cart: Error placing order:", error);
      toast.error(error.message || "Failed to place order. Please try again.", { id: loadingToastId });
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const emptyCartMinHeight = "min-h-[calc(100vh-16rem)] sm:min-h-[calc(100vh-12rem)]";

  if (authIsLoading || (isAuthenticated && isCartLoading && cartItems.length === 0)) { // Show loading if auth or cart is loading initially
    return (
      <div className={`flex flex-col items-center justify-center ${emptyCartMinHeight} text-center px-4 py-8 bg-gray-50`}>
        <svg className="animate-spin h-10 w-10 text-blue-600 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-gray-500 text-lg">Loading Cart...</p>
      </div>
    );
  }

  if (!isCartLoading && cartItems.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center ${emptyCartMinHeight} text-center px-4 py-8`}>
        <ShoppingBagIcon className="w-24 h-24 text-gray-300 mb-8" />
        <h2 className="text-2xl font-semibold mb-3 text-gray-700">Your Cart is Empty!</h2>
        {isAuthenticated && userRole === 'Buyer' ? (
            <p className="text-gray-600 mb-6 max-w-md">Looks like you haven't added anything yet. Explore our products and find something you love!</p>
        ) : !isAuthenticated ? (
            <p className="text-gray-600 mb-6 max-w-md">Sign in to see your saved items, or start shopping to fill it up!</p>
        ) : ( 
            <p className="text-gray-600 mb-6 max-w-md">Your cart is currently empty. Happy Browsing!</p>
        )}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
            <Link 
                to="/products" 
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 font-semibold text-md shadow-md hover:shadow-lg"
            >
                Start Shopping
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
          <p className="text-gray-600 mt-2">Review your items, select delivery, and proceed to checkout.</p>
        </header>

        <div className="flex flex-col lg:flex-row lg:gap-8 xl:gap-12">
          <div className="lg:w-2/3 w-full mb-8 lg:mb-0">
            <div className="bg-white shadow-lg rounded-xl">
              <div className="px-4 py-3 sm:px-6 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Cart Items ({getItemCount()})</h2>
                {cartItems.length > 0 && (
                    <button 
                        onClick={handleClearCart} 
                        disabled={isPlacingOrder || isCartLoading}
                        className="px-4 py-1.5 border border-red-500 text-red-600 text-xs font-medium rounded-md hover:bg-red-500 hover:text-white transition-all duration-200 disabled:opacity-50"
                    >
                    Clear Cart
                    </button>
                )}
              </div>
              {isCartLoading && cartItems.length === 0 ? (
                <p className="p-6 text-center text-gray-500">Refreshing cart items...</p>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {cartItems.map((item) => ( // item is CartResponseDto
                    <li key={item.id} className="flex flex-col sm:flex-row items-start sm:items-center p-4 sm:p-6 gap-4">
                      <img 
                        src={item.photoUrl || '/assets/placeholder.png'} // From CartResponseDto
                        alt={item.productName} 
                        className="w-28 h-28 sm:w-24 sm:h-24 object-cover rounded-lg flex-shrink-0 border border-gray-200 bg-gray-50" 
                        onError={(e) => { e.target.onerror = null; e.target.src = '/assets/placeholder.png'; }}
                      />
                      <div className="flex-grow text-left">
                        <Link to={`/products/${item.productId}`} className="hover:text-blue-600 transition-colors">
                          <h3 className="text-lg font-semibold text-gray-800 leading-tight">{item.productName}</h3>
                        </Link>
                        <p className="text-sm text-gray-500 mt-0.5">{item.category}</p>
                        <p className="text-sm text-blue-600 font-medium mt-0.5">
                          Price: ${item.price ? item.price.toFixed(2) : '0.00'}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => handleQuantityChange(item.id, item.productId, item.productName, item.quantity, -1)} className="p-1 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-colors" aria-label="Decrease quantity">
                            <MinusIcon className="h-4 w-4" />
                            </button>
                            <input type="number" value={item.quantity}
                            onChange={(e) => handleDirectQuantityInput(item.id, item.productId, e.target.value)}
                            onBlur={(e) => handleBlurQuantityInput(item.id, item.productId, e.target.value)}
                            className="w-12 text-center border-gray-300 rounded-md p-1 text-sm focus:ring-1 focus:ring-blue-500 focus:border-transparent"
                            aria-label={`Quantity for ${item.productName}`}
                            />
                            <button onClick={() => handleQuantityChange(item.id, item.productId, item.productName, item.quantity, 1)} className="p-1 rounded-md text-gray-500 hover:text-blue-600 hover:bg-gray-100 transition-colors" aria-label="Increase quantity">
                            <PlusIcon className="h-4 w-4" />
                            </button>
                        </div>
                      </div>
                      <div className="flex flex-col items-end sm:items-end mt-2 sm:mt-0 sm:ml-auto">
                        <p className="text-md font-semibold text-gray-800 mb-2 sm:mb-4">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                        <button onClick={() => handleRemoveItem(item.id, item.productId, item.productName)} className="p-1.5 rounded-md text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors text-xs flex items-center gap-1" aria-label={`Remove ${item.productName} from cart`}>
                          <TrashIcon className="h-4 w-4" /> Remove
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

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
                        type="radio" id={`delivery-${option.id}`} name="deliveryOption" value={option.id}
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
                {(!isAuthenticated || (isAuthenticated && userRole === 'Buyer')) && (
                  <button
                    onClick={handlePlaceOrder}
                    disabled={cartItems.length === 0 || authIsLoading || isPlacingOrder || isCartLoading}
                    className={`w-full px-6 py-3 rounded-lg text-white font-semibold text-md transition-colors duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 ${
                      cartItems.length === 0 || authIsLoading || isPlacingOrder || isCartLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    {isPlacingOrder ? "Placing Order..." : "Proceed to Checkout"}
                  </button>
                )}
                {isAuthenticated && userRole === 'Seller' && cartItems.length > 0 && (
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
