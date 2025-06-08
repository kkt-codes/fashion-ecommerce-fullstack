import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from './AuthContext';
import {
  getMyCart,
  addToCart as apiAddToCart,
  removeCartItem as apiRemoveCartItem,
  updateCartItemQuantity as apiUpdateQuantity,
  clearMyCart as apiClearMyCart,
} from '../services/api';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

const GUEST_CART_STORAGE_KEY = 'guest_cart';

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const { isAuthenticated, currentUser, userRole, isLoading: isAuthLoading } = useAuth();

  // Fetches the user's cart from the backend and updates the state.
  const fetchUserCart = useCallback(async () => {
    if (!isAuthenticated || userRole !== 'BUYER') return;
    
    setIsLoading(true);
    try {
      const { data } = await getMyCart();
      setCartItems(data || []);
    } catch (error) {
      console.error("CartContext: Failed to fetch user cart", error);
      toast.error("Could not load your cart from the server.");
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, userRole]);

  // Main effect to synchronize cart state based on authentication status.
  useEffect(() => {
    const syncCart = async () => {
      // Wait for authentication to be resolved
      if (isAuthLoading) return;

      if (isAuthenticated && currentUser) {
        // User is logged in, check their role
        if (userRole === 'BUYER') {
          // If the user is a BUYER, proceed with cart merging and fetching.
          const guestCart = JSON.parse(localStorage.getItem(GUEST_CART_STORAGE_KEY) || '[]');
          
          if (guestCart.length > 0) {
            setIsLoading(true);
            toast.loading("Merging guest cart with your account...", { id: 'merge-cart' });
            try {
              const mergePromises = guestCart.map(item =>
                apiAddToCart({ userId: currentUser.id, productId: item.productId, quantity: item.quantity })
              );
              await Promise.all(mergePromises);
              localStorage.removeItem(GUEST_CART_STORAGE_KEY);
              toast.success("Guest cart merged!", { id: 'merge-cart' });
            } catch (error) {
              console.error("CartContext: Failed to merge guest cart", error);
              toast.error("Could not merge guest cart.", { id: 'merge-cart' });
            }
          }
          await fetchUserCart();
        } else {
          // If user is a SELLER or ADMIN, they don't have a cart.
          // Clear any guest cart from local storage and ensure their app state has an empty cart.
          localStorage.removeItem(GUEST_CART_STORAGE_KEY);
          setCartItems([]);
        }
        
      } else {
        // User is a guest, load cart from localStorage
        const guestCart = JSON.parse(localStorage.getItem(GUEST_CART_STORAGE_KEY) || '[]');
        setCartItems(guestCart);
      }
    };

    syncCart();
  }, [isAuthenticated, currentUser, userRole, isAuthLoading, fetchUserCart]);

    const addToCart = useCallback(async (productId, quantity) => {
    if (isAuthenticated && userRole !== 'BUYER') {
        toast.error("Only buyers can add items to a cart.");
        return;
    }

    setIsLoading(true);
    if (isAuthenticated && currentUser) {
      // Authenticated user: call API
      try {
        await apiAddToCart({ userId: currentUser.id, productId, quantity });
        await fetchUserCart(); // Refresh cart from backend to ensure consistency
        toast.success("Item added to cart!");
      } catch (error) {
        console.error("CartContext: Failed to add item", error);
        toast.error(error.response?.data?.message || "Could not add item to cart.");
      }
    } else {
      // Guest user: update localStorage
      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.productId === productId);
        let newItems;
        if (existingItem) {
          newItems = prevItems.map(item =>
            item.productId === productId ? { ...item, quantity: item.quantity + quantity } : item
          );
        } else {
          // This part of the logic implies that the `product` object is passed to `addToCart`
          // for guests. This is a note for future implementation if needed.
          toast.error("Guest cart requires full product details to add.");
          newItems = prevItems;
        }
        localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(newItems));
        return newItems;
      });
      toast.success("Item added to guest cart!");
    }
    setIsLoading(false);
  }, [isAuthenticated, currentUser, userRole, fetchUserCart]);

  const removeFromCart = useCallback(async (cartItemId) => {
    setIsLoading(true);
    if (isAuthenticated) {
      // This is safe because only a buyer's cart will have items with DB IDs
      try {
        await apiRemoveCartItem(cartItemId);
        setCartItems(prev => prev.filter(item => item.id !== cartItemId));
        toast.success("Item removed from cart.");
      } catch (error) {
        console.error("CartContext: Failed to remove item", error);
        toast.error("Could not remove item from cart.");
      }
    } else {
      // For guest, cartItemId is actually productId
      setCartItems(prev => {
        const newItems = prev.filter(item => item.productId !== cartItemId);
        localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(newItems));
        return newItems;
      });
    }
    setIsLoading(false);
  }, [isAuthenticated]);

  const updateQuantity = useCallback(async (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setIsLoading(true);
    if (isAuthenticated) {
      try {
        await apiUpdateQuantity(cartItemId, quantity);
        setCartItems(prev => prev.map(item => item.id === cartItemId ? { ...item, quantity } : item));
        toast.success("Quantity updated.");
      } catch (error) {
        console.error("CartContext: Failed to update quantity", error);
        toast.error("Could not update quantity.");
      }
    } else {
       // For guest, cartItemId is actually productId
      setCartItems(prev => {
         const newItems = prev.map(item => item.productId === cartItemId ? { ...item, quantity } : item);
         localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(newItems));
         return newItems;
      });
    }
    setIsLoading(false);
  }, [isAuthenticated, removeFromCart]);

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    if (isAuthenticated) {
      try {
        // Safe to call, as backend should handle non-buyer requests gracefully,
        // but our logic ensures this is only meaningfully called by a buyer.
        await apiClearMyCart();
        setCartItems([]);
        toast.success("Cart has been cleared.");
      } catch (error) {
        console.error("CartContext: Failed to clear cart", error);
        toast.error("Could not clear your cart.");
      }
    } else {
      setCartItems([]);
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      toast.success("Guest cart cleared.");
    }
    setIsLoading(false);
  }, [isAuthenticated]);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  const getItemCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);
  
  const value = {
    cartItems,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
    fetchUserCart, // Exposing this for potential manual refresh
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};