import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useSignupSigninModal } from '../hooks/useSignupSigninModal';
import { TrashIcon, PlusIcon, MinusIcon, TruckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

// For getDeliveryOptions from the API service
import { checkout, getDeliveryOptions } from '../services/api'; 

export default function CartPage() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, getCartTotal, getItemCount, isLoading: isCartLoading } = useCart();
  const { isAuthenticated, currentUser } = useAuth();
  const { openModal } = useSignupSigninModal();
  const navigate = useNavigate();

  // fetch delivery options from the API, so we start with an empty array.
  const [deliveryOptions, setDeliveryOptions] = useState([]);
  const [selectedDeliveryId, setSelectedDeliveryId] = useState(null);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true); // State to handle loading of options
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);

  // This useEffect hook fetches the delivery options from your backend when the page loads.
  useEffect(() => {
    const fetchDeliveryOptions = async () => {
      setIsOptionsLoading(true);
      try {
        const { data } = await getDeliveryOptions();
        setDeliveryOptions(data || []);
        // Default to the first delivery option if available
        if (data && data.length > 0) {
          setSelectedDeliveryId(data[0].id);
        }
      } catch (error) {
        console.error("Failed to fetch delivery options:", error);
        toast.error("Could not load delivery options.");
      } finally {
        setIsOptionsLoading(false);
      }
    };

    fetchDeliveryOptions();
  }, []); // The empty array ensures this runs only once when the component mounts.


  const handleQuantityChange = (cartItemId, currentQuantity, change) => {
    const newQuantity = currentQuantity + change;
    if (newQuantity > 0) {
      updateQuantity(cartItemId, newQuantity);
    } else {
      removeFromCart(cartItemId);
    }
  };

  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      toast.error("Please log in to place an order.");
      openModal('signin');
      return;
    }
    if (cartItems.length === 0) {
        toast.error("Your cart is empty.");
        return;
    }
    if (!selectedDeliveryId) {
        toast.error("Please select a delivery option.");
        return;
    }

    setIsProcessingCheckout(true);
    const toastId = toast.loading("Creating your order...");
    
    try {
      const checkoutPayload = {
        userId: currentUser.id,
        deliveryId: selectedDeliveryId,
      };
      
      const { data: createdOrders } = await checkout(checkoutPayload);
      
      toast.success("Order created successfully! Proceeding to payment.", { id: toastId });
      
      navigate('/payment', { state: { orders: createdOrders } });
      
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error(error.response?.data?.message || "Failed to create order.", { id: toastId });
    } finally {
      setIsProcessingCheckout(false);
    }
  };

  const selectedDeliveryOption = deliveryOptions.find(opt => opt.id === selectedDeliveryId);
  const deliveryFee = selectedDeliveryOption?.deliveryCost || 0;
  const subtotal = getCartTotal();
  const grandTotal = subtotal + deliveryFee;

  if (isCartLoading && cartItems.length === 0) {
    return <div className="flex justify-center items-center min-h-screen"><p>Loading Cart...</p></div>;
  }

  if (cartItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] text-center px-4 py-8">
        <img src="/assets/empty-cart.png" alt="Empty cart" className="w-56 mb-8" />
        <h2 className="text-2xl font-semibold mb-3 text-gray-700">Your Cart is Empty!</h2>
        <Link to="/products" className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-md shadow-md">
            Shop Products
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-800">Shopping Cart</h1>
        </header>

        <div className="flex flex-col lg:flex-row lg:gap-8 xl:gap-12">
          {/* Cart Items */}
          <div className="lg:w-2/3 w-full mb-8 lg:mb-0">
            <div className="bg-white shadow-lg rounded-xl">
              <div className="px-6 py-3 border-b border-gray-200 flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-800">Cart Items ({getItemCount()})</h2>
                <button onClick={() => !isProcessingCheckout && clearCart()} disabled={isCartLoading || isProcessingCheckout} className="px-4 py-1.5 border border-red-500 text-red-600 text-xs font-medium rounded-md hover:bg-red-500 hover:text-white transition-all disabled:opacity-50">
                  Clear Cart
                </button>
              </div>
              <ul className="divide-y divide-gray-200">
                {cartItems.map((item) => (
                  <li key={item.id} className="flex items-center p-6 gap-4">
                    <img src={item.photoUrl || '/assets/placeholder.png'} alt={item.productName} className="w-24 h-24 object-cover rounded-lg border" />
                    <div className="flex-grow">
                      <Link to={`/products/${item.productId}`} className="hover:text-blue-600">
                        <h3 className="text-lg font-semibold text-gray-800">{item.productName}</h3>
                      </Link>
                      <p className="text-sm text-gray-500">{item.category}</p>
                      <div className="flex items-center gap-2 mt-2">
                          <button onClick={() => handleQuantityChange(item.id, item.quantity, -1)} disabled={isCartLoading || isProcessingCheckout} className="p-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50"><MinusIcon className="h-4 w-4" /></button>
                          <span className="w-10 text-center text-sm">{item.quantity}</span>
                          <button onClick={() => handleQuantityChange(item.id, item.quantity, 1)} disabled={isCartLoading || isProcessingCheckout} className="p-1 rounded-md text-gray-500 hover:bg-gray-100 disabled:opacity-50"><PlusIcon className="h-4 w-4" /></button>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-md font-semibold text-gray-800">${(item.price * item.quantity).toFixed(2)}</p>
                      <button onClick={() => removeFromCart(item.id)} disabled={isCartLoading || isProcessingCheckout} className="text-red-500 hover:text-red-700 text-xs mt-2 disabled:opacity-50">
                        <TrashIcon className="h-4 w-4 inline-block mr-1" />Remove
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:w-1/3 w-full lg:sticky lg:top-28 self-start">
            <div className="bg-white shadow-lg rounded-xl p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3 flex items-center"><TruckIcon className="h-6 w-6 mr-2 text-blue-600"/>Delivery Options</h2>
                {/* --- MODIFICATION START --- */}
                {/* Display a loading state while fetching options */}
                {isOptionsLoading ? <p className="text-sm text-gray-500">Loading delivery options...</p> : (
                  <div className="space-y-3">
                    {deliveryOptions.map((option) => (
                      <label key={option.id} htmlFor={`delivery-${option.id}`} className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${selectedDeliveryId === option.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-400' : 'border-gray-200 hover:border-gray-300'}`}>
                        <input type="radio" id={`delivery-${option.id}`} name="deliveryOption" value={option.id} checked={selectedDeliveryId === option.id} onChange={(e) => setSelectedDeliveryId(Number(e.target.value))} className="h-4 w-4 text-blue-600 focus:ring-blue-500 mr-3"/>
                        <div className="flex-grow">
                          <span className="font-medium text-sm text-gray-700">{option.type}</span>
                          {/* You will need to add the 'deliveryTimeEstimate' property to your backend Delivery model/DTO for this to show */}
                          {option.deliveryTimeEstimate && <p className="text-xs text-gray-500">{option.deliveryTimeEstimate}</p>}
                        </div>
                        <span className="font-semibold text-sm text-gray-700">${option.deliveryCost.toFixed(2)}</span>
                      </label>
                    ))}
                  </div>
                )}
                 {/* --- MODIFICATION END --- */}
              </div>
              
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-3 pt-4 border-t">Order Summary</h2>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between"><span className="text-gray-600">Subtotal:</span><span className="font-medium">${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-600">Delivery:</span><span className="font-medium">${deliveryFee.toFixed(2)}</span></div>
                  <div className="flex justify-between items-center pt-2 mt-2 border-t text-md"><span className="font-semibold">Grand Total:</span><span className="text-xl font-bold text-blue-600">${grandTotal.toFixed(2)}</span></div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <button onClick={handlePlaceOrder} disabled={isCartLoading || isProcessingCheckout || isOptionsLoading} className="w-full py-3 rounded-lg text-white font-semibold bg-green-600 hover:bg-green-700 disabled:bg-gray-400 transition-colors">
                  {isProcessingCheckout ? 'Processing...' : 'Proceed to Payment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}