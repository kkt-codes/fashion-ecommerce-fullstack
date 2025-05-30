import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast'; // Assuming toast is used for notifications

// Define the base URL for your backend API
const API_BASE_URL = 'http://localhost:8080/api'; // Adjust if your backend runs on a different port/path

const AuthContext = createContext(null);

// Constants for localStorage keys
const AUTH_TOKEN_KEY = 'appAuthToken';
const AUTH_USER_DATA_KEY = 'appAuthUserData'; // Stores the user object

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // Derived from currentUser.role
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  // Helper function to parse JWT and extract payload (basic version)
  // In a production app, use a library like jwt-decode for robust parsing
  const parseJwt = (token) => {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
      return null;
    }
  };

  // Effect to initialize auth state from localStorage on component mount
  useEffect(() => {
    const initializeAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUserDataString = localStorage.getItem(AUTH_USER_DATA_KEY);

      if (token && storedUserDataString) {
        try {
          const storedUserData = JSON.parse(storedUserDataString);
          // Optionally: Validate token with a backend call here for enhanced security
          // For now, we trust the stored token and user data if they exist.
          // Example: const validationResponse = await fetch(`${API_BASE_URL}/users/profile`, { headers: { 'Authorization': `Bearer ${token}` } });
          // if (validationResponse.ok) { ... } else { signout(); }

          setCurrentUser(storedUserData);
          setUserRole(storedUserData.role); // Ensure role is part of storedUserData
          setIsAuthenticated(true);
        } catch (error) {
          console.error("AuthContext: Error parsing stored user data or validating token", error);
          // Clear corrupted/invalid stored auth data
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_DATA_KEY);
          setCurrentUser(null);
          setUserRole(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);


  // Signin function
  const signin = useCallback(async (email, password) => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Body should match UserSignInDto: { email, password }
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        // data.message should come from GlobalExceptionHandler in Spring Boot
        throw new Error(data.message || `Sign-in failed with status: ${response.status}`);
      }

      // Assuming backend returns JWT in a field named 'token' or 'jwt' in the response body,
      // and user details in a field named 'user' (which is a UserDto)
      // Or, the token might be in a header like 'Authorization'. Adjust as per your backend.
      // For this example, let's assume: { token: "...", user: {id, firstName, lastName, email, role} }
      const token = data.token; // Or response.headers.get('Authorization')?.split(' ')[1];
      const userData = data.user; // This should be the UserDto

      if (!token || !userData) {
        throw new Error("Sign-in response missing token or user data.");
      }
      
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_DATA_KEY, JSON.stringify(userData));
      
      setCurrentUser(userData);
      setUserRole(userData.role);
      setIsAuthenticated(true);
      setIsLoading(false);
      navigate(userData.role === 'Seller' ? '/seller/dashboard' : '/buyer/dashboard'); // Navigate to role-specific dashboard
      return { success: true, user: userData };
    } catch (error) {
      console.error("AuthContext Signin Error:", error);
      setIsLoading(false);
      return { success: false, error: error.message || "An unexpected error occurred during sign-in." };
    }
  }, [navigate]);

  // Signup function
  const signup = useCallback(async (signupData) => { // signupData matches UserSignUpDto
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(signupData), // { firstName, lastName, email, password, role }
      });

      const data = await response.json(); // Expects UserDto on success or error message

      if (!response.ok) {
        throw new Error(data.message || `Sign-up failed with status: ${response.status}`);
      }

      // Assuming successful signup also logs the user in and returns a token and user data,
      // similar to the signin response. If not, adjust accordingly (e.g., redirect to signin).
      // Let's assume: { token: "...", user: {id, firstName, lastName, email, role} }
      const token = data.token;
      const userData = data.user; // This should be the UserDto

      if (!token || !userData) {
         // If backend doesn't auto-login, you might just show a success message and ask user to sign in.
        console.warn("AuthContext Signup: No token/user data in response. User may need to sign in manually.");
        setIsLoading(false);
        // Potentially navigate to signin or show a specific message
        // For now, let's assume it does log in. If not, this part needs adjustment.
        // throw new Error("Signup response missing token or user data for auto-login.");
        // If no auto-login, just return success and let the modal handle next steps.
        return { success: true, message: "Signup successful! Please sign in."};
      }
      
      localStorage.setItem(AUTH_TOKEN_KEY, token);
      localStorage.setItem(AUTH_USER_DATA_KEY, JSON.stringify(userData));

      setCurrentUser(userData);
      setUserRole(userData.role);
      setIsAuthenticated(true);
      setIsLoading(false);
      navigate(userData.role === 'Seller' ? '/seller/dashboard' : '/buyer/dashboard'); // Navigate
      return { success: true, user: userData };

    } catch (error) {
      console.error("AuthContext Signup Error:", error);
      setIsLoading(false);
      return { success: false, error: error.message || "An unexpected error occurred during sign-up." };
    }
  }, [navigate]);

  // Signout function
  const signout = useCallback(async () => {
    setIsLoading(true);
    // Optional: Call a backend logout endpoint if you have one to invalidate the token server-side
    // await fetch(`${API_BASE_URL}/users/signout`, { method: 'POST', headers: { 'Authorization': `Bearer ${localStorage.getItem(AUTH_TOKEN_KEY)}` } });
    
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_DATA_KEY);
    
    setCurrentUser(null);
    setUserRole(null);
    setIsAuthenticated(false);
    setIsLoading(false);
    navigate('/');
    toast.success("Signed out successfully.");
  }, [navigate]);

  // Function to update user profile data
  const updateCurrentUserData = useCallback(async (updatedDetails) => {
    if (!currentUser || !isAuthenticated) {
      toast.error("Not authenticated. Cannot update profile.");
      return { success: false, error: "User not authenticated." };
    }
    setIsLoading(true);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    try {
      // Backend endpoint for updating profile: PUT /api/users/profile
      // It should take the fields to update from UserDto
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(updatedDetails), // Send only the fields to be updated
      });

      const data = await response.json(); // Expects updated UserDto

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile.");
      }

      // Update localStorage and context state with the new user data from backend
      localStorage.setItem(AUTH_USER_DATA_KEY, JSON.stringify(data)); // data is the updated UserDto
      setCurrentUser(data);
      if (data.role !== userRole) { // If role was updated
          setUserRole(data.role);
      }
      setIsLoading(false);
      toast.success("Profile updated successfully!");
      return { success: true, user: data };

    } catch (error) {
      console.error("AuthContext Update Profile Error:", error);
      setIsLoading(false);
      toast.error(error.message || "Failed to update profile.");
      return { success: false, error: error.message };
    }
  }, [currentUser, isAuthenticated, userRole]);

  // Function to fetch current user's profile (e.g., for token validation or refreshing data)
  const fetchUserProfile = useCallback(async () => {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!token) {
      // No token, so ensure user is signed out state-wise
      if (isAuthenticated) signout(); // Call signout to clear any residual state
      return null;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/users/profile`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) { // Unauthorized or Forbidden
          console.warn("AuthContext: Token validation failed or expired. Signing out.");
          signout(); // Token is invalid, sign out user
        }
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const userData = await response.json(); // UserDto
      localStorage.setItem(AUTH_USER_DATA_KEY, JSON.stringify(userData));
      setCurrentUser(userData);
      setUserRole(userData.role);
      setIsAuthenticated(true);
      setIsLoading(false);
      return userData;
    } catch (error) {
      console.error("AuthContext Fetch Profile Error:", error);
      // If fetching profile fails (e.g. network error, but token might still be there),
      // don't necessarily sign out immediately unless it's an auth error.
      // The initial useEffect handles clearing if token is invalid.
      setIsLoading(false);
      return null;
    }
  }, [signout, isAuthenticated]); // Added isAuthenticated to dependencies

   // Re-validate user session on window focus or when network reconnects (optional but good for UX)
   useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        fetchUserProfile();
      }
    };
    const handleOnline = () => {
      if (navigator.onLine && isAuthenticated) {
        fetchUserProfile();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
    };
  }, [fetchUserProfile, isAuthenticated]);


  const value = {
    currentUser,
    isAuthenticated,
    userRole,
    isLoading,
    signin,
    signup,
    signout,
    updateCurrentUserData,
    fetchUserProfile, // Expose if needed by other parts of the app
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
