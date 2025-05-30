import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuthContext } from './AuthContext'; // To get currentUser and authentication state
import toast from 'react-hot-toast';

const CartContext = createContext(null);
const API_BASE_URL = 'http://localhost:8080/api'; // Adjust to your backend URL
const GUEST_CART_KEY = 'guest_cart';

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]); // Will store CartResponseDto objects from backend
  const [isLoading, setIsLoading] = useState(false); // For cart-specific loading states
  const { currentUser, isAuthenticated, isLoading: authIsLoading } = useAuthContext();

  // Function to fetch cart for an authenticated user
  const fetchUserCart = useCallback(async (userId) => {
    if (!userId) return [];
    setIsLoading(true);
    try {
      const response = await fetch(`${API_BASE_URL}/cart/user/${userId}`);
      if (!response.ok) {
        throw new Error(`Failed to fetch cart: ${response.statusText}`);
      }
      const data = await response.json(); // Expects List<CartResponseDto>
      setCartItems(data || []);
      return data || [];
    } catch (error) {
      console.error("CartContext: Error fetching user cart:", error);
      toast.error("Could not load your cart from the server.");
      setCartItems([]); // Reset cart on error
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load cart on auth state change (initial load, login, logout)
  useEffect(() => {
    if (authIsLoading) {
      // console.log("CartContext: Auth is loading, waiting to process cart...");
      return; // Wait for AuthContext to stabilize
    }

    const manageCartState = async () => {
      if (isAuthenticated && currentUser?.id) {
        setIsLoading(true);
        // console.log(`CartContext: User ${currentUser.id} authenticated. Loading user cart and merging guest cart.`);
        
        // 1. Load guest cart from localStorage
        const guestCartString = localStorage.getItem(GUEST_CART_KEY);
        let guestItems = [];
        if (guestCartString) {
          try {
            guestItems = JSON.parse(guestCartString);
          } catch (e) { console.error("CartContext: Error parsing guest cart", e); }
        }

        // 2. Fetch current backend cart (to avoid duplicate calls if merge is empty)
        let currentBackendCart = await fetchUserCart(currentUser.id); // sets cartItems and isLoading

        // 3. If guest items exist, merge them into the backend cart
        if (guestItems.length > 0) {
          toast.loading("Merging guest cart...", { id: 'cart-merge-toast' });
          for (const guestItem of guestItems) {
            const existingItem = currentBackendCart.find(item => String(item.productId) === String(guestItem.productId || guestItem.id)); // guestItem might have 'id' as productId
            
            if (existingItem) {
              // Update quantity of existing item
              const newQuantity = existingItem.quantity + guestItem.quantity;
              try {
                await fetch(`${API_BASE_URL}/cart/${existingItem.id}`, { // existingItem.id is cartItemId
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ quantity: newQuantity }),
                });
              } catch (error) {
                console.error("CartContext: Error updating item quantity during merge:", error);
                toast.error(`Could not update quantity for ${guestItem.name || 'item'} during merge.`, { id: `merge-err-${guestItem.id}`});
              }
            } else {
              // Add new item to backend cart
              try {
                await fetch(`${API_BASE_URL}/cart`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    userId: currentUser.id,
                    productId: guestItem.productId || guestItem.id, // guestItem might have 'id' as productId
                    quantity: guestItem.quantity,
                  }),
                });
              } catch (error) {
                console.error("CartContext: Error adding item during merge:", error);
                 toast.error(`Could not add ${guestItem.name || 'item'} to cart during merge.`, { id: `merge-err-add-${guestItem.id}`});
              }
            }
          }
          localStorage.removeItem(GUEST_CART_KEY); // Clear guest cart after merge attempt
          // console.log("CartContext: Guest cart merged and removed from localStorage.");
          toast.dismiss('cart-merge-toast');
          toast.success("Guest cart items merged!");
          await fetchUserCart(currentUser.id); // Re-fetch the final merged cart
        }
        // If no guest items, fetchUserCart already loaded the cart.
        setIsLoading(false);

      } else {
        // User is a guest or no current user
        // console.log("CartContext: User is guest. Loading cart from localStorage.");
        const storedGuestCart = localStorage.getItem(GUEST_CART_KEY);
        if (storedGuestCart) {
          try {
            setCartItems(JSON.parse(storedGuestCart));
          } catch (e) {
            console.error("CartContext: Error parsing guest cart from localStorage", e);
            setCartItems([]);
          }
        } else {
          setCartItems([]);
        }
        setIsLoading(false);
      }
    };

    manageCartState();

  }, [isAuthenticated, currentUser, authIsLoading, fetchUserCart]);


  const addToCart = useCallback(async (product, quantity = 1) => {
    setIsLoading(true);
    if (isAuthenticated && currentUser?.id) {
      // Authenticated user: interact with backend
      const existingItem = cartItems.find(item => String(item.productId) === String(product.id));
      try {
        if (existingItem) {
          // Product exists, update quantity via PATCH
          const newQuantity = existingItem.quantity + quantity;
          const response = await fetch(`${API_BASE_URL}/cart/${existingItem.id}`, { // existingItem.id is cartItemId
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quantity: newQuantity }),
          });
          if (!response.ok) throw new Error("Failed to update item quantity.");
        } else {
          // Product does not exist, add new item via POST
          const response = await fetch(`${API_BASE_URL}/cart`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: currentUser.id,
              productId: product.id,
              quantity: quantity,
            }),
          });
          if (!response.ok) throw new Error("Failed to add item to cart.");
        }
        await fetchUserCart(currentUser.id); // Refresh cart from backend
        toast.success(`${product.name} added to cart!`);
      } catch (error) {
        console.error("CartContext: Error adding/updating item in backend cart:", error);
        toast.error(`Failed to add ${product.name} to cart.`);
      }
    } else {
      // Guest user: manage cart in localStorage
      setCartItems(prevItems => {
        const existingGuestItem = prevItems.find(item => String(item.id) === String(product.id)); // Guest cart uses product.id as item.id
        let updatedItems;
        if (existingGuestItem) {
          updatedItems = prevItems.map(item =>
            String(item.id) === String(product.id)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          updatedItems = [...prevItems, { ...product, productId: product.id, quantity }]; // Ensure guest item has productId
        }
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedItems));
        return updatedItems;
      });
      toast.success(`${product.name} added to cart!`);
    }
    setIsLoading(false);
  }, [isAuthenticated, currentUser, cartItems, fetchUserCart]);

  const removeFromCart = useCallback(async (cartItemIdToRemove, productIdForGuest) => { // cartItemId for auth, productId for guest
    setIsLoading(true);
    if (isAuthenticated && currentUser?.id) {
      try {
        const response = await fetch(`${API_BASE_URL}/cart/${cartItemIdToRemove}`, { method: 'DELETE' });
        if (!response.ok) throw new Error("Failed to remove item from cart.");
        await fetchUserCart(currentUser.id); // Refresh cart
        toast.success("Item removed from cart.");
      } catch (error) {
        console.error("CartContext: Error removing item from backend cart:", error);
        toast.error("Failed to remove item from cart.");
      }
    } else {
      // Guest user
      setCartItems(prevItems => {
        const updatedItems = prevItems.filter(item => String(item.id) !== String(productIdForGuest));
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedItems));
        return updatedItems;
      });
      toast.success("Item removed from cart.");
    }
    setIsLoading(false);
  }, [isAuthenticated, currentUser, fetchUserCart]);

  const updateQuantity = useCallback(async (cartItemIdToUpdate, newQuantity, productIdForGuest) => {
    setIsLoading(true);
    if (newQuantity <= 0) {
      await removeFromCart(cartItemIdToUpdate, productIdForGuest); // Handles both auth and guest
      setIsLoading(false);
      return;
    }

    if (isAuthenticated && currentUser?.id) {
      try {
        const response = await fetch(`${API_BASE_URL}/cart/${cartItemIdToUpdate}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity: newQuantity }),
        });
        if (!response.ok) throw new Error("Failed to update item quantity.");
        await fetchUserCart(currentUser.id); // Refresh cart
        toast.success("Cart updated.");
      } catch (error) {
        console.error("CartContext: Error updating quantity in backend cart:", error);
        toast.error("Failed to update cart quantity.");
      }
    } else {
      // Guest user
      setCartItems(prevItems => {
        const updatedItems = prevItems.map(item =>
          String(item.id) === String(productIdForGuest) ? { ...item, quantity: newQuantity } : item
        );
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(updatedItems));
        return updatedItems;
      });
      toast.success("Cart updated.");
    }
    setIsLoading(false);
  }, [isAuthenticated, currentUser, fetchUserCart, removeFromCart]);

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    if (isAuthenticated && currentUser?.id) {
      try {
        // Iterate and delete each item. A bulk delete endpoint would be more efficient.
        for (const item of cartItems) {
          await fetch(`${API_BASE_URL}/cart/${item.id}`, { method: 'DELETE' });
        }
        await fetchUserCart(currentUser.id); // Refresh to an empty cart
        toast.success("Cart cleared.");
      } catch (error) {
        console.error("CartContext: Error clearing backend cart:", error);
        toast.error("Failed to clear cart on server.");
        // Still clear locally for optimistic UI update if preferred, or rely on next fetch.
      }
    } else {
      // Guest user
      setCartItems([]);
      localStorage.removeItem(GUEST_CART_KEY);
      toast.success("Cart cleared.");
    }
    setIsLoading(false);
  }, [isAuthenticated, currentUser, cartItems, fetchUserCart]);

  const getCartTotal = useCallback(() => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  }, [cartItems]);

  const getItemCount = useCallback(() => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  }, [cartItems]);

  // Expose a function to manually trigger cart refresh if needed elsewhere
  const refreshCart = useCallback(() => {
    if (isAuthenticated && currentUser?.id) {
      fetchUserCart(currentUser.id);
    } else {
      // For guests, cart is loaded from localStorage on auth change / initial load
      const storedGuestCart = localStorage.getItem(GUEST_CART_KEY);
      setCartItems(storedGuestCart ? JSON.parse(storedGuestCart) : []);
    }
  }, [isAuthenticated, currentUser, fetchUserCart]);

  const value = {
    cartItems,
    isLoading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getItemCount,
    refreshCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
