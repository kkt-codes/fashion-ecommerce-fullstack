import React, { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
import { LockClosedIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { processPayment } from '../services/api';

// A helper component for the mock card details form
const MockPaymentForm = ({ totalAmount, onPaymentProcess, isProcessing }) => {
  const [cardDetails, setCardDetails] = useState({
    mockCardNumber: '',
    mockExpiryDate: '',
    mockCvv: '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Basic validation
    if (!cardDetails.mockCardNumber || !cardDetails.mockExpiryDate || !cardDetails.mockCvv) {
      toast.error("Please fill in all card details.");
      return;
    }
    onPaymentProcess(cardDetails);
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Card Number</label>
        <input type="text" name="mockCardNumber" value={cardDetails.mockCardNumber} onChange={handleChange} placeholder="XXXX XXXX XXXX 0000 for Success" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
         <p className="text-xs text-gray-500 mt-1">Hint: End with 0000 for success, 1111 for insufficient funds, 2222 for decline.</p>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Expiry Date</label>
          <input type="text" name="mockExpiryDate" value={cardDetails.mockExpiryDate} onChange={handleChange} placeholder="MM/YY" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">CVV</label>
          <input type="text" name="mockCvv" value={cardDetails.mockCvv} onChange={handleChange} placeholder="123" className="mt-1 block w-full border-gray-300 rounded-md shadow-sm" required />
        </div>
      </div>
      <div className="pt-4">
        <button type="submit" disabled={isProcessing} className="w-full flex justify-center items-center px-6 py-3 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70">
          <LockClosedIcon className="h-5 w-5 mr-2" />
          {isProcessing ? 'Processing...' : `Pay $${totalAmount.toFixed(2)}`}
        </button>
      </div>
    </form>
  );
};


export default function PaymentPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const { clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);

  // The orders created by the checkout endpoint
  const orders = useMemo(() => state?.orders || [], [state]);
  
  // Calculate the total amount for all orders.
  // Assumes each order object has a 'total' property.
  const totalAmountToPay = useMemo(() => orders.reduce((acc, order) => acc + order.total, 0), [orders]);

  // Redirect if there are no orders to process
  if (orders.length === 0) {
    navigate('/cart');
    return null; 
  }

  const handlePayment = async (cardDetails) => {
    setIsProcessing(true);
    const paymentToast = toast.loading("Processing payment...");

    try {
      // Process payment for each order individually
      const paymentPromises = orders.map(order => {
        const paymentRequest = {
          orderId: order.id,
          amount: order.total,
          ...cardDetails,
        };
        return processPayment(paymentRequest);
      });
      
      const results = await Promise.allSettled(paymentPromises);
      
      const successfulPayments = results.filter(r => r.status === 'fulfilled' && r.value.data.status === 'SUCCESS');
      const failedPayments = results.filter(r => r.status === 'rejected' || r.value.data.status !== 'SUCCESS');

      if (failedPayments.length > 0) {
        const firstFailure = failedPayments[0];
        const errorMessage = firstFailure.status === 'rejected'
            ? "An unexpected error occurred."
            : firstFailure.value.data.message || "A payment failed.";
        toast.error(`Payment failed: ${errorMessage}`, { id: paymentToast });
      } else {
        toast.success(`All ${successfulPayments.length} payments successful!`, { id: paymentToast });
        clearCart(); // Clear the cart context
        navigate('/buyer/orders');
      }

    } catch (error) {
        console.error("Payment processing failed", error);
        toast.error(error.response?.data?.message || "Could not process payment.", { id: paymentToast });
    } finally {
        setIsProcessing(false);
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center justify-center gap-3">
            <CreditCardIcon className="h-8 w-8 text-blue-600" />
            Secure Payment
          </h1>
          <p className="mt-2 text-sm text-gray-500">Complete your purchase</p>
        </header>

        <div className="bg-white rounded-xl shadow-lg">
            {/* Order Summary Section */}
            <div className="p-6 border-b">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Order Summary</h2>
                <div className="space-y-3">
                    {orders.map(order => (
                        <div key={order.id} className="flex justify-between text-sm">
                            <span className="text-gray-600 truncate pr-4">{order.productName} (x{order.quantity})</span>
                            <span className="font-medium text-gray-800">${order.total.toFixed(2)}</span>
                        </div>
                    ))}
                    <div className="flex justify-between text-base font-semibold text-gray-900 border-t pt-3 mt-3">
                        <span>Total Amount</span>
                        <span>${totalAmountToPay.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {/* Payment Form Section */}
            <div className="p-6">
                <MockPaymentForm totalAmount={totalAmountToPay} onPaymentProcess={handlePayment} isProcessing={isProcessing} />
            </div>
        </div>
      </div>
    </div>
  );
}