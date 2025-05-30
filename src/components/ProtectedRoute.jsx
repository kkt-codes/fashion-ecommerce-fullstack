import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
// AuthContext is responsible for providing authentication state (isAuthenticated, userRole, isLoading)
// which it derives from interactions with the backend API.
import { useAuthContext } from '../context/AuthContext';
import { useSignupSigninModal } from '../hooks/useSignupSigninModal';
import toast from 'react-hot-toast';

// This component protects routes that should only be accessible to authenticated 'Seller' users.
// It relies on AuthContext to provide the current user's authentication status and role.
// If this ProtectedRoute is intended for a different role or a more general authenticated state,
// the role check (userRole !== 'Seller') should be adjusted accordingly.

export default function ProtectedRoute({ children }) {
  // isLoading: True while AuthContext is verifying authentication (e.g., checking session with backend).
  // isAuthenticated: True if the user is successfully logged in (verified by backend).
  // userRole: The role of the user (e.g., "Buyer", "Seller"), provided by the backend upon login.
  const { isAuthenticated, isLoading, userRole } = useAuthContext(); 
  const { openModal, switchToTab, isOpen: isModalOpen } = useSignupSigninModal();

  useEffect(() => {
    // This effect handles prompting for sign-in if the user is not authenticated
    // and not already in the process of signing in via the modal.
    if (!isLoading && !isAuthenticated && !isModalOpen) {
      toast.error("Please sign in as a Seller to access this page.");
      switchToTab('signin'); 
      openModal();          
    }
  }, [isLoading, isAuthenticated, isModalOpen, openModal, switchToTab]);

  if (isLoading) {
    // While AuthContext is determining the authentication state (e.g., on initial app load,
    // it might be checking a token with the backend), show a loading indicator.
    // This prevents premature redirection before authentication status is confirmed.
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 animate-pulse">Authenticating Seller...</p>
      </div>
    );
  }
  
  // After the loading phase:
  // If the user is not authenticated OR if their role is not 'Seller',
  // they are not allowed to access the children of this route.
  if (!isAuthenticated || userRole !== 'Seller') {
    // If not authenticated, the useEffect above should have already triggered the sign-in modal.
    // If authenticated but with the wrong role (e.g., a 'Buyer' trying to access a 'Seller' page),
    // an additional toast message is shown before redirecting.
    if (isAuthenticated && userRole !== 'Seller') {
        toast.error("Access Denied. This page is for Sellers only.");
    }
    // Redirect to the homepage (or a designated 'unauthorized' page).
    // 'replace' ensures the unauthorized route doesn't get added to browser history.
    return <Navigate to="/" replace />; 
  }

  // If loading is complete, the user is authenticated, AND their role is 'Seller',
  // render the protected child components.
  return children; 
}
