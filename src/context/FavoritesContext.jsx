import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';

import { useAuth } from './AuthContext';
import { useSignupSigninModal } from '../hooks/useSignupSigninModal';
import { getMyFavorites, addFavorite, removeFavorite } from '../services/api';

const FavoritesContext = createContext(null);

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  // FIX: Destructure userRole to use in our logic
  const { isAuthenticated, userRole, isLoading: isAuthLoading } = useAuth();
  const { openModal } = useSignupSigninModal();

  // Fetches the user's favorites from the backend.
  const fetchFavorites = useCallback(async () => {
    // FIX: Add a role check. Only fetch favorites if the user is authenticated AND is a BUYER.
    if (!isAuthenticated || userRole !== 'BUYER') {
      setFavoriteItems([]); // Ensure favorites are empty for non-buyers.
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const { data } = await getMyFavorites();
      setFavoriteItems(data || []);
    } catch (err) {
      console.error("FavoritesContext: Failed to fetch favorites", err);
      setError(err);
      toast.error("Could not load your favorites.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userRole]);

  // Effect to load favorites when authentication state changes.
  useEffect(() => {
    // This logic is now safe because fetchFavorites has the role check.
    if (!isAuthLoading) {
        fetchFavorites();
    }
  }, [isAuthLoading, fetchFavorites]);

  // Checks if a given product ID is in the user's favorites.
  const isFavorite = useCallback((productId) => {
    return favoriteItems.some(item => item.id === productId);
  }, [favoriteItems]);

  // Toggles a product's favorite status.
  const toggleFavorite = useCallback(async (product) => {
    if (!product?.id) {
      toast.error("Cannot update favorites: Invalid product data.");
      return;
    }

    // This check correctly gates the feature to only buyers.
    if (!isAuthenticated || userRole !== 'BUYER') {
      toast.error("Please sign in as a Buyer to manage your favorites.");
      openModal('signin');
      return;
    }

    const currentlyIsFavorite = isFavorite(product.id);
    
    // Optimistic UI update for a faster user experience
    if (currentlyIsFavorite) {
      setFavoriteItems(prev => prev.filter(item => item.id !== product.id));
    } else {
      setFavoriteItems(prev => [...prev, product]);
    }

    // Perform the API call
    try {
      if (currentlyIsFavorite) {
        await removeFavorite(product.id);
        toast.error(`${product.name} removed from favorites.`);
      } else {
        await addFavorite(product.id);
        toast.success(`${product.name} added to favorites!`);
      }
    } catch (error) {
      console.error(`FavoritesContext: Failed to toggle favorite for product ${product.id}`, error);
      toast.error("Could not update your favorites. Reverting change.");
      // If the API call fails, revert the optimistic update by refetching the source of truth
      fetchFavorites();
    }
  }, [isAuthenticated, userRole, favoriteItems, openModal, isFavorite, fetchFavorites]);

  const value = {
    favoriteItems,
    isFavorite,
    toggleFavorite,
    favoritesCount: favoriteItems.length,
    isLoading,
    error,
    refetchFavorites: fetchFavorites, // Expose a refetch function
  };

  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>;
};