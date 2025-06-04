import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuthContext } from './AuthContext';
import apiClient from '../services/api'; 
import toast from 'react-hot-toast';
import { useSignupSigninModal } from '../hooks/useSignupSigninModal';

const FavoritesContext = createContext(null);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favoriteItems, setFavoriteItems] = useState([]); // Stores full ProductDto objects
  const [isLoading, setIsLoading] = useState(false); 
  const { currentUser, isAuthenticated, userRole, isLoading: authIsLoading } = useAuthContext();
  const { openModal, switchToTab } = useSignupSigninModal();

  const fetchFavoritesFromBackend = useCallback(async () => {
    if (!isAuthenticated || !currentUser || userRole !== 'BUYER') {
      setFavoriteItems([]); 
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiClient.get('/users/me/favorites'); // Returns List<ProductDto>
      setFavoriteItems(response.data || []);
      console.log(`FavoritesContext: Favorites fetched for user ${currentUser.id}`, response.data);
    } catch (error) {
      console.error("FavoritesContext: Error fetching favorites from backend", error.response?.data || error.message);
      toast.error("Could not load your favorites.");
      setFavoriteItems([]); 
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser, userRole]);

  useEffect(() => {
    if (authIsLoading) {
      return;
    }
    if (isAuthenticated && currentUser?.id && userRole === 'BUYER') {
      fetchFavoritesFromBackend();
    } else {
      setFavoriteItems([]); 
    }
  }, [isAuthenticated, currentUser, userRole, authIsLoading, fetchFavoritesFromBackend]);

  const isFavorite = useCallback((productId) => {
    return favoriteItems.some(item => String(item.id) === String(productId));
  }, [favoriteItems]);

  const toggleFavorite = useCallback(async (product) => {
    if (!product || product.id === undefined) {
        console.error("FavoritesContext: toggleFavorite called with invalid product.", product);
        toast.error("Cannot update favorites: invalid product data.");
        return;
    }
    const productIdStr = String(product.id);

    if (!isAuthenticated || !currentUser || userRole !== 'BUYER') {
      toast.error("Please sign in as a Buyer to manage your favorites.");
      switchToTab("signin");
      openModal();
      return;
    }

    setIsLoading(true);
    const currentlyIsFavorite = favoriteItems.some(item => String(item.id) === productIdStr);

    try {
      if (currentlyIsFavorite) {
        await apiClient.delete(`/users/me/favorites/${productIdStr}`);
        setFavoriteItems(prevItems => prevItems.filter(item => String(item.id) !== productIdStr));
        toast.error(`${product.name || 'Item'} removed from favorites.`);
      } else {
        await apiClient.post(`/users/me/favorites/${productIdStr}`);
        // Backend returns void for POST, so we add the product to local state
        // or refetch. For simplicity, add to local state if product object is available.
        // A more robust way is to refetch or have backend return the new list/item.
        // For now, we'll add the passed product object.
        setFavoriteItems(prevItems => [...prevItems, product]); 
        toast.success(`${product.name || 'Item'} added to favorites!`);
      }
      // Optionally, refetch all favorites after any change to ensure perfect sync,
      // though optimistic update is faster for UI.
      // await fetchFavoritesFromBackend(); 
    } catch (error) {
      console.error(`FavoritesContext: Error toggling favorite for product ${productIdStr}`, error.response?.data || error.message);
      toast.error("Could not update your favorites. Please try again.");
      // If API call failed, refetch to revert optimistic update or get correct state
      await fetchFavoritesFromBackend(); 
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, currentUser, userRole, favoriteItems, openModal, switchToTab, fetchFavoritesFromBackend]);

  const value = {
    favoriteItems, // Changed from favoriteIds
    isFavorite,
    toggleFavorite,
    favoritesCount: favoriteItems.length, // Count based on items array
    isLoadingFavorites: isLoading,
    refetchFavorites: fetchFavoritesFromBackend // Expose refetch
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};
