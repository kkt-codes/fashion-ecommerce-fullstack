import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api'; // Import our configured Axios instance

const AuthContext = createContext(null);

// Using consistent keys for localStorage
const AUTH_TOKEN_KEY = 'appAuthToken';
const AUTH_USER_DATA_KEY = 'appAuthUserData';
// We might not need a separate AUTH_USER_ROLE_KEY if role is part of AUTH_USER_DATA_KEY

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Will store { id, firstName, lastName, email, role }
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState(null); // Can derive from currentUser.role
  const [isLoading, setIsLoading] = useState(true); // For initial auth check
  const navigate = useNavigate();

  // Effect for initial authentication check when the app loads
  useEffect(() => {
    const attemptAutoLogin = async () => {
      setIsLoading(true);
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const storedUserDataString = localStorage.getItem(AUTH_USER_DATA_KEY);

      if (token && storedUserDataString) {
        try {
          // At this point, the apiClient's request interceptor will automatically add the token.
          // We make a call to a protected endpoint to validate the token and get fresh user data.
          const response = await apiClient.get('/users/me'); // Backend endpoint to get current user
          
          if (response.data) {
            const userDataFromApi = response.data; // This should be UserDto { id, firstName, lastName, email, role }
            
            // Update localStorage with potentially fresh data from API (optional, but good)
            localStorage.setItem(AUTH_USER_DATA_KEY, JSON.stringify(userDataFromApi));
            // localStorage.setItem(AUTH_TOKEN_KEY, token); // Token is already there, no need to re-set unless refreshed

            setCurrentUser(userDataFromApi);
            setUserRole(userDataFromApi.role);
            setIsAuthenticated(true);
            console.log("AuthContext: Session restored successfully via /users/me", userDataFromApi);
          } else {
            throw new Error("No user data received from /users/me");
          }
        } catch (error) {
          console.error("AuthContext: Auto-login failed (token invalid or API error)", error);
          // Token is invalid or API call failed, clear stale auth data
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(AUTH_USER_DATA_KEY);
          setCurrentUser(null);
          setUserRole(null);
          setIsAuthenticated(false);
        }
      } else if (storedUserDataString) {
        // If only user data is present but no token, it's an inconsistent state. Clear it.
        console.warn("AuthContext: User data found without a token. Clearing stale data.");
        localStorage.removeItem(AUTH_USER_DATA_KEY);
      }
      setIsLoading(false);
    };

    attemptAutoLogin();
  }, []); // Run once on component mount

  const signin = useCallback(async (email, password, roleAttempt) => {
    // roleAttempt is not strictly needed for our backend login, but we can pass it if the DTO expects it.
    // Our UserSignInDto does not require role for login.
    setIsLoading(true);
    try {
      const response = await apiClient.post('/users/login', { email, password });
      // Backend's AuthResponseDto structure: { userDto: { id, firstName, lastName, email, role }, token }
      const { userDto, token } = response.data;

      if (userDto && token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
        localStorage.setItem(AUTH_USER_DATA_KEY, JSON.stringify(userDto));
        // No need for separate AUTH_USER_ROLE_KEY if role is in userDto

        setCurrentUser(userDto);
        setUserRole(userDto.role);
        setIsAuthenticated(true);
        setIsLoading(false);
        console.log("AuthContext: Signin successful", userDto);
        return { success: true, user: userDto };
      } else {
        throw new Error("Invalid response structure from login API");
      }
    } catch (error) {
      console.error("AuthContext: Signin failed", error.response?.data || error.message);
      setIsLoading(false);
      // Extract error message from backend if available
      const errorMessage = error.response?.data?.message || "Invalid email, password, or role.";
      return { success: false, error: errorMessage };
    }
  }, []);

  const signup = useCallback(async (userDataFromForm) => {
    // userDataFromForm should match UserSignUpDto: { firstName, lastName, email, password, role }
    setIsLoading(true);
    try {
      // The role should be 'BUYER' or 'SELLER' as per backend's public registration rules
      const response = await apiClient.post('/users/register', userDataFromForm);
      // Backend returns the created UserDto
      const createdUser = response.data; 

      setIsLoading(false);
      console.log("AuthContext: Signup successful", createdUser);
      // After successful signup, you might want to:
      // 1. Automatically log them in (call signin - but backend register doesn't return a token)
      // 2. Redirect to login page with a success message
      // 3. Or directly set some basic state if appropriate (though full login is better)
      return { success: true, user: createdUser, message: "Registration successful! Please log in." };
    } catch (error) {
      console.error("AuthContext: Signup failed", error.response?.data || error.message);
      setIsLoading(false);
      const errorMessage = error.response?.data?.message || 
                           (error.response?.status === 409 ? "Email already exists." : "Registration failed. Please try again.");
      return { success: false, error: errorMessage };
    }
  }, []);

  const signout = useCallback(async () => {
    setIsLoading(true);
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    try {
        if (token) {
            // Call backend logout endpoint. The apiClient interceptor will add the token.
            await apiClient.post('/users/logout');
            console.log("AuthContext: Called backend logout.");
        }
    } catch (error) {
        console.error("AuthContext: Error calling backend logout, proceeding with client-side cleanup.", error.response?.data || error.message);
        // Still proceed with client-side cleanup even if backend logout fails
    } finally {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_DATA_KEY);
        // localStorage.removeItem(AUTH_USER_ROLE_KEY); // Not needed if role is in user data

        setCurrentUser(null);
        setUserRole(null);
        setIsAuthenticated(false);
        setIsLoading(false);
        console.log("AuthContext: Signout complete.");
        navigate('/'); // Navigate to home or login page
    }
  }, [navigate]);

  const updateCurrentUserData = useCallback(async (updatedDetails) => {
    // updatedDetails should be an object like { firstName, lastName, email (if changeable) }
    // Password changes should typically have a separate, dedicated flow/endpoint.
    // Role changes are restricted by the backend for non-admins and not handled here.
    if (!currentUser || !isAuthenticated) {
      console.error("AuthContext: No current user to update or not authenticated.");
      return { success: false, error: "Not authenticated." };
    }
    setIsLoading(true);
    try {
      // Construct payload with only the fields a user can update for their own profile.
      // This payload will be sent to a PATCH /api/users/me endpoint (to be created on backend).
      const payloadForUpdate = {};
      if (updatedDetails.firstName !== undefined) {
        payloadForUpdate.firstName = updatedDetails.firstName;
      }
      if (updatedDetails.lastName !== undefined) {
        payloadForUpdate.lastName = updatedDetails.lastName;
      }
      if (updatedDetails.email !== undefined) {
        // Add email validation on frontend if desired before sending
        payloadForUpdate.email = updatedDetails.email;
      }
      
      // Ensure we are only sending fields that are actually being updated
      if (Object.keys(payloadForUpdate).length === 0) {
        console.log("AuthContext: No details provided to update.");
        setIsLoading(false);
        return { success: true, user: currentUser, message: "No changes submitted." }; // Or false with an error/message
      }

      // Call the new PATCH endpoint for self-profile updates
      const response = await apiClient.patch('/users/me', payloadForUpdate);
      const updatedUserFromApi = response.data; // Backend should return the updated UserDto

      localStorage.setItem(AUTH_USER_DATA_KEY, JSON.stringify(updatedUserFromApi));
      setCurrentUser(updatedUserFromApi);
      // Role should not change from this operation, but update if API reflects it
      if (updatedUserFromApi.role && updatedUserFromApi.role !== userRole) { 
        setUserRole(updatedUserFromApi.role);
      }
      setIsLoading(false);
      console.log("AuthContext: User data updated successfully via PATCH /users/me.", updatedUserFromApi);
      return { success: true, user: updatedUserFromApi };

    } catch (error) {
      console.error("AuthContext: Failed to update user data via API.", error.response?.data || error.message);
      setIsLoading(false);
      const errorMessage = error.response?.data?.message || "Failed to update profile.";
      return { success: false, error: errorMessage };
    }
  }, [currentUser, isAuthenticated, userRole]); // Removed navigate from dependencies as it's not used in this specific callback

  const value = {
    currentUser,
    isAuthenticated,
    userRole,
    isLoading,
    signin,     
    signup,    
    signout,   
    updateCurrentUserData
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
