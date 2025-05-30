import React from 'react'; // React is needed
import { useAuthContext } from "../context/AuthContext"; 
import { useNavigate } from "react-router-dom";
import { useSignupSigninModal } from "../hooks/useSignupSigninModal.jsx";
import toast from 'react-hot-toast';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

// This component is responsible for initiating contact with a seller.
// It navigates the user to the main messaging interface, passing necessary
// context (sellerId, product details) via route state.
// The actual API calls for chat (e.g., starting a conversation) will be
// handled by the component responsible for the "/buyer/messages" route.

export default function ContactSellerButton({ sellerId, sellerName, productName, productId }) {
  // sellerId: Expected to be product.sellerId from the backend ProductDto.
  // sellerName: Name of the seller (can be fetched or passed down).
  // productName: Expected to be product.name from the backend ProductDto.
  // productId: Expected to be product.id from the backend ProductDto.

  const { isAuthenticated, currentUser, userRole } = useAuthContext(); 
  const navigate = useNavigate();
  const { openModal, switchToTab } = useSignupSigninModal(); // Retained for prompting sign-in

  const handleContact = () => {
    // Check 1: User must be authenticated.
    if (!isAuthenticated) {
      toast.error("Please sign in to contact sellers!");
      switchToTab("signin"); // Set modal to the sign-in tab
      openModal();          // Open the sign-in modal
      return;
    }

    // Check 2: User must be a 'Buyer'.
    if (userRole !== 'Buyer') {
      toast.error("Only Buyers can contact sellers.");
      return;
    }

    // Check 3: Current user data (especially ID) must be available from AuthContext.
    // currentUser.id will be used as the buyer's ID (user1Id) when starting a conversation.
    if (!currentUser || !currentUser.id) {
      toast.error("Your user data could not be loaded. Please try signing in again.");
      return;
    }

    // Log for debugging - can be removed in production.
    console.log(`ContactSellerButton: Navigating to messages. Buyer ID: ${currentUser.id}, Seller ID: ${sellerId}, Product: ${productName} (ID: ${productId})`);
    
    // Navigate to the buyer's main messages/chat page.
    // Pass seller and product context in the route's state.
    // The component at "/buyer/messages" will use this state to:
    // 1. Call the backend API (e.g., POST /api/chat/start) to get/create a conversationId
    //    using currentUser.id (buyer) and sellerId (seller).
    // 2. Open the specific conversation thread.
    // 3. Optionally pre-fill the message input with product context.
    navigate("/buyer/messages", { 
      state: { 
        openWithSellerId: sellerId,    // The ID of the seller to chat with
        sellerName: sellerName,        // Seller's name for display purposes
        currentBuyerId: currentUser.id, // Pass the current buyer's ID explicitly
        productContext: {              // Optional: context about the product
            id: productId,
            name: productName,
        }
      } 
    });
  };

  return (
    <button
      onClick={handleContact}
      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
      aria-label={`Contact seller ${sellerName || ''} about ${productName || ''}`}
    >
      <ChatBubbleLeftRightIcon className="h-5 w-5" />
      Contact Seller
    </button>
  );
}
