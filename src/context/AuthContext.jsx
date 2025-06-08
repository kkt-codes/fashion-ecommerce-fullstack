import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// Import the specific API functions needed from the service layer
import {
  login as apiLogin,
  register as apiRegister,
  logout as apiLogout,
  getMyProfile as apiGetMyProfile,
  updateMyProfile as apiUpdateMyProfile
} from '../services/api';

const AuthContext = createContext(null);

// Using constants for localStorage keys-  good practice to avoid typos.
const AUTH_TOKEN_KEY = 'appAuthToken';
const AUTH_USER_DATA_KEY = 'appAuthUserData';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // To handle initial session check
  const navigate = useNavigate();

  // This effect runs on app start to check for an existing session.
  useEffect(() => {
    const attemptAutoLogin = async () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUserData = localStorage.getItem(AUTH_USER_DATA_KEY);

      if (token && storedUserData) {
        try {
          // Validate the stored token by fetching the user's profile.
          // The API interceptor will handle token attachment and 401 errors automatically.
          const { data: userDataFromApi } = await apiGetMyProfile();

          // If the call succeeds, the token is valid.
          setCurrentUser(userDataFromApi);
          setIsAuthenticated(true);
          console.log("AuthContext: Session restored successfully.", userDataFromApi);

        } catch (error) {
          // The interceptor in api.js will handle cleanup for 401 errors.
          console.error("AuthContext: Auto-login failed. The token may be invalid.", error);
          // We can ensure state is clean here as a fallback.
          setCurrentUser(null);
          setIsAuthenticated(false);
        }
      }
      setIsLoading(false);
    };

    attemptAutoLogin();
  }, []); // The empty dependency array ensures this runs only once on mount.

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    try {
      // Use the login function from our API service
      const { data } = await apiLogin(credentials);
      const { userDto, token } = data;

      if (userDto && token) {
        // Store session info
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(AUTH_USER_DATA_KEY, JSON.stringify(userDto));

        // Update application state
        setCurrentUser(userDto);
        setIsAuthenticated(true);
        console.log("AuthContext: Login successful.", userDto);
        return { success: true, user: userDto };
      } else {
        throw new Error("Invalid response from login API");
      }
    } catch (error) {
      console.error("AuthContext: Login failed.", error.response?.data || error.message);
      const errorMessage = error.response?.data?.message || "Invalid credentials.";
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (userData) => {
    setIsLoading(true);
    try {
        // Use the register function from our API service
        const { data: createdUser } = await apiRegister(userData);
        console.log("AuthContext: Registration successful.", createdUser);
        // Return a success message to prompt the user to log in.
        return { success: true, message: "Registration successful! Please log in." };
    } catch (error) {
        console.error("AuthContext: Registration failed.", error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || "Registration failed.";
        return { success: false, error: errorMessage };
    } finally {
        setIsLoading(false);
    }
  }, []);


  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Call the backend logout endpoint to invalidate the token.
      await apiLogout();
    } catch (error) {
      // Even if the backend call fails, we proceed with client-side cleanup.
      console.error("AuthContext: Backend logout failed, proceeding with client cleanup.", error);
    } finally {
      // Clear all authentication data from storage
      localStorage.removeItem(AUTH_TOKEN_KEY);
      localStorage.removeItem(AUTH_USER_DATA_KEY);

      // Reset application state
      setCurrentUser(null);
      setIsAuthenticated(false);
      setIsLoading(false);
      
      // Navigate to home to reset the app state completely.
      navigate('/');
      console.log("AuthContext: Logout complete.");
    }
  }, [navigate]);

  const updateUserProfile = useCallback(async (profileData) => {
      if (!isAuthenticated) return { success: false, error: "User is not authenticated." };
      setIsLoading(true);
      try {
        // Use the update profile function from our API service
        const { data: updatedUser } = await apiUpdateMyProfile(profileData);
        
        // Update local storage and state with the fresh user data
        localStorage.setItem(AUTH_USER_DATA_KEY, JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        
        console.log("AuthContext: User profile updated.", updatedUser);
        return { success: true, user: updatedUser };
      } catch (error) {
        console.error("AuthContext: Profile update failed.", error.response?.data || error.message);
        const errorMessage = error.response?.data?.message || "Failed to update profile.";
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
  }, [isAuthenticated]);

  const contextValue = {
    currentUser,
    isAuthenticated,
    userRole: currentUser?.role || null, // Derived state from currentUser
    isLoading,
    login,
    register,
    logout,
    updateUserProfile,
  };

  // The provider makes the context value available to all child components.
  // We don't render children until the initial loading/session check is complete.
  return (
    <AuthContext.Provider value={contextValue}>
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

// Export the custom hook for convenience
export const useAuthContext = useAuth;