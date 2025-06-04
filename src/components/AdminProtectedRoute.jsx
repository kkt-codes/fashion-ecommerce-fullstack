import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useSignupSigninModal } from '../hooks/useSignupSigninModal'; // To prompt login if not authenticated
import toast from 'react-hot-toast';

export default function AdminProtectedRoute({ children }) {
  const { isAuthenticated, isLoading: authIsLoading, userRole } = useAuthContext();
  const { openModal, switchToTab, isOpen: isModalOpen } = useSignupSigninModal();

  useEffect(() => {
    // If auth is not loading, user is not authenticated, and modal isn't already open, prompt sign-in.
    if (!authIsLoading && !isAuthenticated && !isModalOpen) {
      toast.error("Please sign in to access this page.");
      switchToTab('signin');
      openModal();
    }
  }, [authIsLoading, isAuthenticated, isModalOpen, openModal, switchToTab]);

  if (authIsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 animate-pulse">Authenticating Admin Access...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // The useEffect above should handle opening the modal.
    // Redirecting to home if not authenticated and modal logic is somehow bypassed or for direct access attempts.
    return <Navigate to="/" replace />;
  }

  if (userRole !== 'ADMIN') {
    toast.error("Access Denied. This page is for Administrators only.");
    return <Navigate to="/" replace />; // Or to a specific "Access Denied" page
  }

  return children; // User is authenticated and has the ADMIN role
}
