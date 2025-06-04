import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useSignupSigninModal } from '../hooks/useSignupSigninModal';
import toast from 'react-hot-toast';

export default function AuthenticatedRoute({ children }) {
  const { isAuthenticated, isLoading: authIsLoading } = useAuthContext();
  const { openModal, switchToTab, isOpen: isModalOpen } = useSignupSigninModal();

  useEffect(() => {
    if (!authIsLoading && !isAuthenticated && !isModalOpen) {
      toast.error("Please sign in to access this page.");
      switchToTab('signin');
      openModal();
    }
  }, [authIsLoading, isAuthenticated, isModalOpen, openModal, switchToTab]);

  if (authIsLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-gray-500 animate-pulse">Authenticating...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    // The useEffect handles modal. Redirect ensures non-authenticated users don't see content.
    return <Navigate to="/" replace />;
  }

  return children; // User is authenticated
}
