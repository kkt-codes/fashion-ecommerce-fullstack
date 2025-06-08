import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

/**
 * A generic protected route component.
 * It checks for authentication and, optionally, a specific user role.
 * * @param {object} props
 * @param {React.ReactNode} props.children - The component to render if authorized.
 * @param {string} [props.role] - The required role (e.g., 'BUYER', 'SELLER', 'ADMIN') to access the route. If not provided, only authentication is checked.
 */
const ProtectedRoute = ({ children, role }) => {
  const { isAuthenticated, userRole, isLoading } = useAuth();
  const location = useLocation();

  // 1. While auth status is loading, show a loading indicator
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg animate-pulse">Verifying access...</p>
      </div>
    );
  }

  // 2. If user is not authenticated, redirect to the home page
  if (!isAuthenticated) {
    // We store the path the user was trying to access in the state.
    // After login, we can redirect them back to this page.
    // The previous implementation redirected to '/login', which doesn't exist.
    // Redirecting to the homepage is the correct behavior for this app structure.
    toast.error("You must be logged in to access this page.");
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // 3. If a specific role is required and the user's role doesn't match, redirect
  if (role && userRole !== role) {
    toast.error(`Access Denied: This page is for ${role.toLowerCase()}s only.`);
    // Redirect to a relevant dashboard or a generic "not authorized" page.
    // Redirecting to the home page is a safe default.
    return <Navigate to="/" replace />;
  }

  // 4. If all checks pass, render the child component
  return children;
};

export default ProtectedRoute;