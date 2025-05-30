import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuthContext } from './AuthContext';
import toast from 'react-hot-toast';
import { useSignupSigninModal } from '../hooks/useSignupSigninModal';

const FavoritesContext = createContext(null);
const API_BASE_URL = 'http://localhost:8080/api'; // Adjust to your backend URL

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favoriteProductIds, setFavoriteProductIds] = useState(new Set()); // Stores only product IDs
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser, isAuthenticated, userRole, isLoading: authIsLoading } = useAuthContext();
  const { openModal, switchToTab } = useSignupSigninModal();

  // Fetch favorites from backend for authenticated Buyers
  const fetchUserFavorites = useCallback(async () => {
    if (!isAuthenticated || !currentUser?.id || userRole !== 'Buyer') {
      setFavoriteProductIds(new Set()); // Clear if not an authenticated buyer
      return;
    }
    setIsLoading(true);
    try {
      // GET /api/favorites (service will use authenticated user's ID)
      const response = await fetch(`${API_BASE_URL}/favorites`); 
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
            // Handle auth errors, maybe sign out user if token/session is invalid
            console.warn("FavoritesContext: Unauthorized to fetch favorites.");
        }
        throw new Error("Failed to fetch favorites");
      }
      const data = await response.json(); // Expects List<FavoriteDto>
      // Assuming FavoriteDto has a 'productId' field
      setFavoriteProductIds(new Set(data.map(fav => String(fav.productId))));
    } catch (error) {
      console.error("FavoritesContext: Error fetching favorites from backend:", error);
      toast.error("Could not load your favorites.");
      setFavoriteProductIds(new Set()); // Reset on error
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser, userRole]);

  // Load favorites when auth state changes
  useEffect(() => {
    if (authIsLoading) return; // Wait for auth to stabilize

    if (isAuthenticated && userRole === 'Buyer') {
      fetchUserFavorites();
    } else {
      setFavoriteProductIds(new Set()); // Clear favorites if not a logged-in buyer
    }
  }, [isAuthenticated, userRole, authIsLoading, fetchUserFavorites]);


  const isFavorite = useCallback((productId) => {
    return favoriteProductIds.has(String(productId));
  }, [favoriteProductIds]);

  const toggleFavorite = useCallback(async (product) => {
    if (!isAuthenticated || !currentUser?.id || userRole !== 'Buyer') {
      toast.error("Please sign in as a Buyer to manage your favorites.");
      if (!isAuthenticated) { // Only open modal if not authenticated at all
        switchToTab("signin");
        openModal();
      }
      return;
    }

    setIsLoading(true);
    const productIdStr = String(product.id);
    const currentlyIsFavorite = favoriteProductIds.has(productIdStr);

    try {
      if (currentlyIsFavorite) {
        // API Call: DELETE /api/favorites/product/{productIdStr}
        const response = await fetch(`${API_BASE_URL}/favorites/product/${productIdStr}`, { 
          method: 'DELETE',
          // Session cookie handles authentication
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Failed to remove favorite" }));
          throw new Error(errorData.message || "Failed to remove favorite from server.");
        }
        setFavoriteProductIds(prevIds => {
          const newIds = new Set(prevIds);
          newIds.delete(productIdStr);
          return newIds;
        });
        toast.error(`${product.name} removed from favorites.`);
      } else {
        // API Call: POST /api/favorites/product/{productIdStr}
        const response = await fetch(`${API_BASE_URL}/favorites/product/${productIdStr}`, { 
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          // No body needed if productId is in path, or send { productId: productIdStr } if backend expects it
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: "Failed to add favorite" }));
          throw new Error(errorData.message || "Failed to add favorite to server.");
        }
        // const newFavoriteDto = await response.json(); // Backend returns FavoriteDto
        setFavoriteProductIds(prevIds => {
          const newIds = new Set(prevIds);
          newIds.add(productIdStr); // Or newFavoriteDto.productId
          return newIds;
        });
        toast.success(`${product.name} added to favorites!`);
      }
    } catch (error) {
      console.error("FavoritesContext: Error toggling favorite:", error);
      toast.error(error.message || "Could not update favorites.");
      // Optionally, re-fetch favorites to ensure consistency if an error occurred
      // await fetchUserFavorites(); 
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser, userRole, favoriteProductIds, openModal, switchToTab, fetchUserFavorites]);
  

  const value = {
    favoriteProductIds, // Changed from favoriteIds to be more specific
    isFavorite,
    toggleFavorite,
    favoritesCount: favoriteProductIds.size,
    isLoadingFavorites: isLoading,
    refreshFavorites: fetchUserFavorites, // Expose a refresh function
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};
