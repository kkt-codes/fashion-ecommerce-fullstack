import axios from 'axios';

// --- Configuration ---
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Interceptors ---
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('appAuthToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request Interceptor Error:', error);
    return Promise.reject(error);
  }
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error('API Error: Unauthorized (401). Token may be expired or invalid.');
      
      // The user is not authorized. Clear their session from local storage.
      localStorage.removeItem('appAuthToken');
      localStorage.removeItem('appAuthUserData');
    }
    return Promise.reject(error);
  }
);


// --- API Service Functions ---

// All other API functions (login, getProducts, checkout, etc.) remain the same.

// -- Auth, User, Profile --
export const login = (credentials) => apiClient.post('/users/login', credentials);
export const register = (userData) => apiClient.post('/users/register', userData);
export const logout = () => apiClient.post('/users/logout');
export const getMyProfile = () => apiClient.get('/users/me');
export const updateMyProfile = (profileData) => apiClient.patch('/users/me', profileData);

// -- Product Service --
export const getProducts = (params) => apiClient.get('/products', { params });
export const getProductById = (id) => apiClient.get(`/products/${id}`);
export const getProductCategories = () => apiClient.get('/products/categories');
export const getProductPriceRange = () => apiClient.get('/products/price-range-meta');

// -- Seller-specific Product Actions --
export const getMySellerProducts = (params) => apiClient.get('/products/seller/me', { params });
export const createProduct = (productData) => apiClient.post('/products', productData);
export const updateProduct = (id, productData) => apiClient.put(`/products/${id}`, productData);
export const deleteProduct = (id) => apiClient.delete(`/products/${id}`);
export const uploadProductImage = (productId, file) => {
  const formData = new FormData();
  formData.append('file', file);
  return apiClient.post(`/products/${productId}/image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// -- Cart Service --
export const getMyCart = () => apiClient.get('/cart/user/me');
export const addToCart = (cartItem) => apiClient.post('/cart', cartItem);
export const updateCartItemQuantity = (cartItemId, quantity) => apiClient.put(`/cart/${cartItemId}/quantity`, { quantity });
export const removeCartItem = (cartItemId) => apiClient.delete(`/cart/${cartItemId}`);
export const clearMyCart = () => apiClient.delete('/cart/user/me/clear');

// -- Favorites Service --
export const getMyFavorites = () => apiClient.get('/users/me/favorites');
export const addFavorite = (productId) => apiClient.post(`/users/me/favorites/${productId}`);
export const removeFavorite = (productId) => apiClient.delete(`/users/me/favorites/${productId}`);

// -- Order & Delivery Service --
export const checkout = (checkoutData) => apiClient.post('/orders/checkout', checkoutData);
export const getMyBuyerOrders = (params) => apiClient.get('/orders/user/me', { params });
export const getMySellerOrders = (params) => apiClient.get('/orders/seller/me', { params });
export const getMySellerSales = () => apiClient.get('/orders/seller/me/stats');
export const updateOrderStatus = (orderId, status) => apiClient.patch(`/orders/${orderId}`, { status });
export const getDeliveryOptions = () => apiClient.get('/deliveries');
export const createDelivery = (deliveryData) => apiClient.post('/deliveries', deliveryData);
export const updateDelivery = (id, deliveryData) => apiClient.put(`/deliveries/${id}`, deliveryData);
export const deleteDelivery = (id) => apiClient.delete(`/deliveries/${id}`);
export const checkPurchaseStatus = (productId) => apiClient.get(`/orders/user/has-purchased/${productId}`);

// -- Review Service --
export const getProductReviews = (productId) => apiClient.get(`/reviews/product/${productId}`);
export const addProductReview = (productId, userId, reviewData) => apiClient.post(`/reviews/product/${productId}/user/${userId}`, reviewData);
export const getMyReviews = () => apiClient.get('/reviews/user/me');
export const updateReview = (reviewId, reviewData) => apiClient.put(`/reviews/${reviewId}`, reviewData);
export const deleteReview = (reviewId) => apiClient.delete(`/reviews/${reviewId}`);

// -- Chat/Message Service --
export const getUnreadMessageCount = () => apiClient.get('/chat/user/me/unread-count');
export const getMyConversations = () => apiClient.get('/chat/user/me/conversations');
export const getMessagesForConversation = (conversationId) => apiClient.get(`/chat/conversation/${conversationId}/messages`);
export const startConversation = (user1Id, user2Id) => apiClient.post(`/chat/start?user1Id=${user1Id}&user2Id=${user2Id}`);
export const sendRestMessage = (messageData) => apiClient.post('/chat/message', messageData);
export const markConversationAsRead = (conversationId) => apiClient.post(`/chat/conversation/${conversationId}/mark-as-read`);

// -- Payment Service --
export const processPayment = (paymentData) => apiClient.post('/payments/process', paymentData);

// -- Contact Service --
export const submitContactForm = (contactData) => apiClient.post('/contact', contactData);

// -- Admin Service --
export const getAdminStats = () => {
    const userCountReq = apiClient.get('/users').catch(() => ({ data: { totalElements: 0 } }));
    const productCountReq = apiClient.get('/products').catch(() => ({ data: { totalElements: 0 } }));
    const orderCountReq = apiClient.get('/orders').catch(() => ({ data: { totalElements: 0 } }));
    const messageCountReq = apiClient.get('/AdminMessages').catch(() => ({ data: [] }));
    return Promise.all([userCountReq, productCountReq, orderCountReq, messageCountReq]);
};
export const getAllUsers = (params) => apiClient.get('/users', { params });
export const deleteUser = (userId) => apiClient.delete(`/users/${userId}`);
export const updateUser = (userId, userData) => apiClient.put(`/users/${userId}`, userData);
export const createUserAsAdmin = (userData) => apiClient.post('/users/admin/create-user', userData);
export const getAllOrders = (params) => apiClient.get('/orders', { params });
export const deleteOrder = (orderId) => apiClient.delete(`/orders/${orderId}`);
export const getContactMessages = (params) => apiClient.get('/AdminMessages', { params });
export const updateContactMessageStatus = (messageId, status) => apiClient.patch(`/AdminMessages/${messageId}/status`, { status });
export const deleteContactMessage = (messageId) => apiClient.delete(`/AdminMessages/${messageId}`);
export const getAdminSettings = () => apiClient.get('/admin/settings');
export const updateAdminSettings = (settingsData) => apiClient.put('/admin/settings', settingsData);


export default apiClient;