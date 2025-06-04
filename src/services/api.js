import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Axios Request Interceptor ---
// This interceptor will run before each request is sent.
apiClient.interceptors.request.use(
  (config) => {
    // Get the token from localStorage (or your preferred storage)
    const token = localStorage.getItem('appAuthToken'); // Using the key from your AuthContext.jsx

    if (token) {
      // If a token exists, add it to the Authorization header
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Continue with the request configuration
  },
  (error) => {
    // Handle request error
    return Promise.reject(error);
  }
);

// --- Axios Response Interceptor (Optional but Recommended) ---
// This interceptor can handle global responses, like 401 for expired tokens.
apiClient.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    if (error.response) {
      if (error.response.status === 401) {
        // Handle 401 Unauthorized (e.g., token expired or invalid)
        console.error('API Error: Unauthorized (401). Token might be invalid or expired.');
        // Optionally, you could trigger a logout action here or redirect to login.
        // For example, by dispatching an event or calling a global logout function.
        // localStorage.removeItem('appAuthToken');
        // localStorage.removeItem('appAuthUserData');
        // localStorage.removeItem('appAuthUserRole');
        // window.location.href = '/signin'; // Or use react-router navigation
      }
      // You can add more global error handling here (e.g., for 403, 500)
    }
    return Promise.reject(error);
  }
);

export default apiClient;
