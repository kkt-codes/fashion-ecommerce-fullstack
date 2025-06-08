import React, { useState } from 'react';
import { useNavigate } from "react-router-dom";
import toast from 'react-hot-toast';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';

import { useAuth } from "../context/AuthContext";
import { useSignupSigninModal } from "../hooks/useSignupSigninModal";
import { startConversation } from '../services/api';

/**
 * A button that allows a buyer to initiate a chat with a product's seller.
 * It handles authentication checks and creates the conversation before navigating.
 */
export default function ContactSellerButton({ sellerId, productName }) {
  const { isAuthenticated, currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const { openModal } = useSignupSigninModal();
  const [isLoading, setIsLoading] = useState(false);

  const handleContact = async () => {
    // 1. Check if the user is a logged-in buyer
    if (!isAuthenticated) {
      toast.error("Please sign in to contact sellers.");
      openModal('signin');
      return;
    }
    if (userRole !== 'BUYER') {
      toast.error("Only buyers can contact sellers.");
      return;
    }
    // A buyer cannot contact themselves
    if (currentUser?.id === sellerId) {
        toast.error("You cannot contact yourself.");
        return;
    }

    setIsLoading(true);
    const toastId = toast.loading("Starting conversation...");

    try {
      // 2. Call the API to get or create the conversation
      const { data: conversation } = await startConversation(currentUser.id, sellerId);

      toast.success("Redirecting to your messages...", { id: toastId });

      // 3. Navigate to the messages page, passing the specific conversation ID
      //    and an initial message context.
      navigate("/buyer/messages", {
        state: {
          openWithConversationId: conversation.id,
          initialMessage: `Regarding your product: ${productName}\n\n`,
        }
      });

    } catch (error) {
      console.error("ContactSellerButton: Failed to start conversation", error);
      toast.error(error.response?.data?.message || "Could not start chat.", { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render the button if the user is the seller of this product
  if (currentUser?.id === sellerId) {
    return null;
  }

  return (
    <button
      onClick={handleContact}
      disabled={isLoading}
      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300 font-semibold flex items-center justify-center gap-2 shadow-md disabled:opacity-70"
      aria-label={`Contact seller about ${productName}`}
    >
      <ChatBubbleLeftRightIcon className="h-5 w-5" />
      {isLoading ? 'Opening Chat...' : 'Contact Seller'}
    </button>
  );
}