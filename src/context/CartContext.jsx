import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuthContext } from './AuthContext';
import apiClient from '../services/api';
import toast from 'react-hot-toast';

const CartContext = createContext(null);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

// Helper to map backend CartResponseDto to frontend cart item structure if needed
// Assuming frontend cart item structure is similar to backend's ProductDto plus quantity and cartItemId
const mapBackendCartItem = (backendItem) => {
  // backendItem is CartResponseDto: { id (cartItemId), quantity, productId, productName, photoUrl, category, price, userId }
  return {
    id: backendItem.productId, // Use productId as the primary identifier for the item in the frontend cart display
    cartItemId: backendItem.id, // This is the actual ID of the cart entry in the DB
    name: backendItem.productName,
    photoUrl: backendItem.photoUrl,
    category: backendItem.category,
    price: backendItem.price,
    quantity: backendItem.quantity,
  };
};


export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false); // For cart-specific loading
  const { currentUser, isAuthenticated, isLoading: authIsLoading } = useAuthContext();

  const GUEST_CART_STORAGE_KEY = 'guest_cart';

  // Function to fetch cart from backend
  const fetchCartFromBackend = useCallback(async (userId) => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const response = await apiClient.get(`/cart/user/${userId}`);
      // response.data is List<CartResponseDto>
      // Each item in response.data has: { id (cartItemId), quantity, productId, productName, photoUrl, category, price, userId }
      const backendCart = response.data.map(mapBackendCartItem);
      setCartItems(backendCart);
      console.log(`CartContext: Cart fetched for user ${userId}`, backendCart);
    } catch (error) {
      console.error("CartContext: Error fetching cart from backend", error.response?.data || error.message);
      toast.error("Could not load your cart from the server.");
      setCartItems([]); // Clear cart on error or set to a previous state if desired
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Effect to load cart:
  // 1. If authenticated, fetch from backend.
  // 2. If guest, load from localStorage.
  // 3. Handle merging guest cart to backend cart upon login.
  useEffect(() => {
    if (authIsLoading) {
      console.log("CartContext: Auth is loading, delaying cart processing.");
      return;
    }

    if (isAuthenticated && currentUser?.id) {
      console.log(`CartContext: User ${currentUser.id} authenticated. Fetching backend cart.`);
      const guestCartString = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      let guestCartItems = [];
      if (guestCartString) {
        try {
          guestCartItems = JSON.parse(guestCartString);
        } catch (e) {
          console.error("CartContext: Error parsing guest cart from localStorage", e);
        }
      }

      if (guestCartItems.length > 0) {
        console.log("CartContext: Guest cart found. Attempting to merge with backend cart for user:", currentUser.id);
        // Merge guest cart after fetching backend cart
        const mergeGuestCart = async () => {
          setIsLoading(true);
          try {
            // First, fetch the current backend cart to avoid overwriting or duplicating
            const backendCartResponse = await apiClient.get(`/cart/user/${currentUser.id}`);
            let currentBackendItems = backendCartResponse.data.map(mapBackendCartItem);
            
            const itemsToAddToBackend = [];
            for (const guestItem of guestCartItems) {
              const existingBackendItem = currentBackendItems.find(ci => ci.id === guestItem.id); // guestItem.id is productId
              if (existingBackendItem) {
                // If item exists, update quantity (this logic might be complex if backend doesn't support direct quantity update on add)
                // For simplicity, we might just add the quantity. Backend should handle merging quantities if product already in cart.
                // Or, frontend could make a specific "update quantity" call.
                // Let's assume backend's POST /api/cart handles quantity update if item exists.
                itemsToAddToBackend.push({
                  userId: currentUser.id,
                  productId: guestItem.id, // guestItem.id is productId
                  quantity: guestItem.quantity,
                });
              } else {
                itemsToAddToBackend.push({
                  userId: currentUser.id,
                  productId: guestItem.id,
                  quantity: guestItem.quantity,
                });
              }
            }

            if (itemsToAddToBackend.length > 0) {
              // Make multiple POST requests or a batch request if backend supports it
              // For now, sequential POSTs
              for (const item of itemsToAddToBackend) {
                await apiClient.post('/cart', item); // Backend needs to handle adding or updating quantity
              }
              toast.success("Items from your guest cart have been added to your account!");
            }
            localStorage.removeItem(GUEST_CART_STORAGE_KEY);
            console.log("CartContext: Guest cart merged and removed from localStorage.");
            await fetchCartFromBackend(currentUser.id); // Fetch the final merged cart
          } catch (error) {
            console.error("CartContext: Error merging guest cart to backend", error.response?.data || error.message);
            toast.error("Could not merge guest cart. Please check your cart.");
            // Still fetch backend cart even if merge fails
            await fetchCartFromBackend(currentUser.id);
          } finally {
            setIsLoading(false);
          }
        };
        mergeGuestCart();
      } else {
        // No guest cart, just fetch backend cart
        fetchCartFromBackend(currentUser.id);
      }
    } else {
      // User is GUEST (not authenticated) or auth is still loading
      console.log("CartContext: User is GUEST or auth loading. Loading guest_cart from localStorage.");
      const guestCartString = localStorage.getItem(GUEST_CART_STORAGE_KEY);
      if (guestCartString) {
        try {
          setCartItems(JSON.parse(guestCartString));
        } catch (error) {
          console.error("CartContext: Error parsing GUEST cart from localStorage:", error);
          setCartItems([]);
        }
      } else {
        setCartItems([]);
      }
      setIsLoading(false); // Ensure loading is set to false for guests too
    }
  }, [isAuthenticated, currentUser, authIsLoading, fetchCartFromBackend]);


  const addToCart = useCallback(async (product, quantity = 1) => {
    if (quantity <= 0) {
        toast.error("Quantity must be positive.");
        return;
    }
    setIsLoading(true);
    const cartItemPayload = {
      // id: product.id, // This is productId
      // name: product.name,
      // price: product.price,
      // photoUrl: product.photoUrl,
      // category: product.category,
      quantity: quantity,
    };

    if (isAuthenticated && currentUser?.id) {
      // Authenticated user: send to backend
      try {
        const backendPayload = {
          userId: currentUser.id,
          productId: product.id, // product.id is the actual product ID
          quantity: quantity,
        };
        const response = await apiClient.post('/cart', backendPayload);
        // Assuming backend returns the updated cart item or the whole cart
        // For simplicity, let's refetch the whole cart to ensure UI consistency
        await fetchCartFromBackend(currentUser.id);
        toast.success(`${product.name} added to cart!`);
      } catch (error) {
        console.error("CartContext: Error adding item to backend cart", error.response?.data || error.message);
        toast.error(`Failed to add ${product.name} to cart.`);
      }
    } else {
      // Guest user: update localStorage
      setCartItems(prevItems => {
        const existingItem = prevItems.find(item => String(item.id) === String(product.id));
        let newItems;
        if (existingItem) {
          newItems = prevItems.map(item =>
            String(item.id) === String(product.id)
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        } else {
          newItems = [...prevItems, { ...product, quantity }]; // Store full product details for guest
        }
        localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(newItems));
        return newItems;
      });
      toast.success(`${product.name} added to guest cart!`);
    }
    setIsLoading(false);
  }, [isAuthenticated, currentUser, fetchCartFromBackend]);

  const removeFromCart = useCallback(async (cartItemId_or_productId, isCartItemId = true) => {
    // For authenticated users, cartItemId_or_productId will be the actual cart_item_id from the database
    // For guests, it will be the product.id
    setIsLoading(true);
    if (isAuthenticated && currentUser?.id) {
        if (!isCartItemId) {
            console.error("removeFromCart for authenticated user requires actual cartItemId, not productId.");
            toast.error("Error removing item: Invalid item identifier.");
            setIsLoading(false);
            return;
        }
        try {
            await apiClient.delete(`/cart/${cartItemId_or_productId}`); // Use cart_item_id
            // Refetch cart to update state
            await fetchCartFromBackend(currentUser.id);
            toast.success("Item removed from cart.");
        } catch (error) {
            console.error("CartContext: Error removing item from backend cart", error.response?.data || error.message);
            toast.error("Failed to remove item from cart.");
        }
    } else {
        // Guest user: productId is used
        setCartItems(prevItems => {
            const newItems = prevItems.filter(item => String(item.id) !== String(cartItemId_or_productId));
            localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(newItems));
            return newItems;
        });
        toast.success("Item removed from guest cart.");
    }
    setIsLoading(false);
  }, [isAuthenticated, currentUser, fetchCartFromBackend]);

  const updateQuantity = useCallback(async (cartItemId_or_productId, newQuantity, isCartItemId = true) => {
    const numericQuantity = Number(newQuantity);
    if (numericQuantity <= 0) {
      // If quantity is 0 or less, treat as removal
      await removeFromCart(cartItemId_or_productId, isCartItemId);
      return;
    }
    setIsLoading(true);
    if (isAuthenticated && currentUser?.id) {
        if (!isCartItemId) {
            console.error("updateQuantity for authenticated user requires actual cartItemId, not productId.");
            toast.error("Error updating quantity: Invalid item identifier.");
            setIsLoading(false);
            return;
        }
        try {
            // Backend should have PUT /api/cart/{cartItemId}/quantity or similar
            // Or PATCH /api/cart/{cartItemId} with { "quantity": newQuantity }
            // Assuming PATCH /cart/{cartItemId} as per our controller
            await apiClient.patch(`/cart/${cartItemId_or_productId}`, { quantity: numericQuantity });
            await fetchCartFromBackend(currentUser.id); // Refetch cart
            toast.success("Cart quantity updated.");
        } catch (error) {
            console.error("CartContext: Error updating quantity in backend cart", error.response?.data || error.message);
            toast.error("Failed to update cart quantity.");
        }
    } else {
        // Guest user: productId is used
        setCartItems(prevItems => {
            const newItems = prevItems.map(item =>
                String(item.id) === String(cartItemId_or_productId) ? { ...item, quantity: numericQuantity } : item
            );
            localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify(newItems));
            return newItems;
        });
        toast.success("Guest cart quantity updated.");
    }
    setIsLoading(false);
  }, [isAuthenticated, currentUser, fetchCartFromBackend, removeFromCart]);

  const clearCart = useCallback(async () => {
    setIsLoading(true);
    if (isAuthenticated && currentUser?.id) {
      try {
        // Backend needs an endpoint like DELETE /cart/user/{userId} or similar
        // For now, let's assume we delete items one by one if no batch delete endpoint
        // This is inefficient; a batch delete endpoint is preferred.
        // As a placeholder, we'll just clear the frontend and expect manual sync or a dedicated backend call.
        // A more robust solution would be: await apiClient.delete(`/cart/user/${currentUser.id}/clear`);
        // For this example, we'll just clear local state and assume backend is cleared elsewhere or items are deleted individually.
        // This requires that all cartItems for authenticated user have `cartItemId`
        for (const item of cartItems) {
            if (item.cartItemId) { // Ensure we have the actual cart item ID
                 await apiClient.delete(`/cart/${item.cartItemId}`);
            } else {
                console.warn("Skipping delete for item without cartItemId during clearCart:", item);
            }
        }
        await fetchCartFromBackend(currentUser.id); // Should be empty now
        toast.success("Cart cleared.");
      } catch (error) {
        console.error("CartContext: Error clearing backend cart", error.response?.data || error.message);
        toast.error("Failed to clear cart on server.");
        // Don't clear local state if server fails, or provide option to retry
      }
    } else {
      // Guest user
      setCartItems([]);
      localStorage.removeItem(GUEST_CART_STORAGE_KEY);
      toast.success("Guest cart cleared.");
    }
    setIsLoading(false);
  }, [isAuthenticated, currentUser, cartItems, fetchCartFromBackend]); // Added cartItems to dependency for loop

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
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
