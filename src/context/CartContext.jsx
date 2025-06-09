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

  const fetchUserCart = useCallback(async () => {
    if (!isAuthenticated || userRole !== 'BUYER') {
        setCartItems([]); // Ensure non-buyers have an empty cart
        return;
    }
    
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

  useEffect(() => {
    const syncCart = async () => {
      if (isAuthLoading) return;

      if (isAuthenticated && currentUser) {
        if (userRole === 'BUYER') {
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
          localStorage.removeItem(GUEST_CART_STORAGE_KEY);
          setCartItems([]);
        }
        
      } else {
        const guestCart = JSON.parse(localStorage.getItem(GUEST_CART_STORAGE_KEY) || '[]');
        setCartItems(guestCart);
      }
    };

    syncCart();
  }, [isAuthenticated, currentUser, userRole, isAuthLoading, fetchUserCart]);

  const addToCart = useCallback(async (product, quantity) => {
    if (isAuthenticated && userRole !== 'BUYER') {
        toast.error("Only buyers can add items to a cart.");
        return;
    }

    setIsLoading(true);
    if (isAuthenticated && currentUser) {
      try {
        await apiAddToCart({ userId: currentUser.id, productId: product.id, quantity });
        await fetchUserCart(); // Refresh cart from server
        toast.success(`${product.name} added to cart!`);
      } catch (error) {
        console.error("CartContext: Failed to add item", error);
        toast.error(error.response?.data?.message || "Could not add item to cart.");
      }
    } else {
      // Guest user: update localStorage
      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => item.productId === product.id);
        let newItems;
        if (existingItem) {
          newItems = prevItems.map(item =>
            item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item
          );
        } else {
          const newItem = {
              productId: product.id,
              productName: product.name,
              price: product.price,
              photoUrl: product.photoUrl,
              category: product.category,
              quantity: quantity
          };
          newItems = [...prevItems, newItem];
        }
        localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(newItems));
        return newItems;
      });
      toast.success(`${product.name} added to guest cart!`);
    }
    setIsLoading(false);
  }, [isAuthenticated, currentUser, userRole, fetchUserCart]);

  const removeFromCart = useCallback(async (cartItemId) => {
    setIsLoading(true);
    if (isAuthenticated) {
      try {
        await apiRemoveCartItem(cartItemId);
        await fetchUserCart(); // REFETCH instead of optimistic update
        toast.success("Item removed from cart.");
      } catch (error) {
        console.error("CartContext: Failed to remove item", error);
        toast.error("Could not remove item from cart.");
      }
    } else {
      setCartItems(prev => {
        const newItems = prev.filter(item => item.productId !== cartItemId);
        localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(newItems));
        return newItems;
      });
      toast.success("Item removed from cart.");
    }
    setIsLoading(false);
  }, [isAuthenticated, fetchUserCart]);

  const updateQuantity = useCallback(async (cartItemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setIsLoading(true);
    if (isAuthenticated) {
      try {
        await apiUpdateQuantity(cartItemId, quantity);
        await fetchUserCart(); // REFETCH instead of optimistic update
        toast.success("Quantity updated.");
      } catch (error) {
        console.error("CartContext: Failed to update quantity", error);
        toast.error("Could not update quantity.");
      }
    } else {
      setCartItems(prev => {
         const newItems = prev.map(item => (item.productId === cartItemId ? { ...item, quantity } : item));
         localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(newItems));
         return newItems;
      });
    }
    setIsLoading(false);
  }, [isAuthenticated, fetchUserCart, removeFromCart]);

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    if (isAuthenticated) {
      try {
        await apiClearMyCart();
        setCartItems([]); // Can safely set to empty after successful API call
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
    fetchUserCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};