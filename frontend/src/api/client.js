// src/api/client.js - Centralized API client with proper error handling
import axios from "axios";

// Get backend URL with fallback
const getBackendUrl = () => {
  return process.env.REACT_APP_BACKEND_URL || 
         'https://stockdiff-app.preview.emergentagent.com';
};

const api = axios.create({
  baseURL: `${getBackendUrl()}/api`,
  withCredentials: true, // send HttpOnly cookies automatically
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

let refreshing = null;

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Automatic token refresh on 401 responses
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config || {};
    
    if (error.response?.status === 401 && !original.__retried) {
      original.__retried = true;
      
      // Only try to refresh if we have a token
      const token = localStorage.getItem('token');
      if (token && !refreshing) {
        refreshing = api.post("/auth/refresh")
          .then(() => {})  
          .catch(() => {
            // If refresh fails, clear token but don't redirect
            // Let AuthProvider handle the state transition
            localStorage.removeItem('token');
          })
          .finally(() => {
            refreshing = null;
          });
        
        await refreshing;
        return api(original); // Retry original request
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper function for making API calls with consistent error handling
export const apiCall = async (endpoint, options = {}) => {
  try {
    const response = await api(endpoint, options);
    return response.data;
  } catch (error) {
    console.error(`API call failed for ${endpoint}:`, error);
    
    // Handle specific error cases
    if (error.response?.status === 401) {
      // Authentication error - handled by interceptor
      throw new Error('Authentication failed');
    } else if (error.response?.status === 403) {
      throw new Error('Access denied');
    } else if (error.response?.status === 404) {
      throw new Error('Resource not found');
    } else if (error.response?.status >= 500) {
      throw new Error('Server error - please try again later');
    } else if (error.code === 'ECONNABORTED') {
      throw new Error('Request timeout - please check your connection');
    } else {
      throw new Error(error.response?.data?.detail || error.message || 'Network error');
    }
  }
};

// Specific API methods for common operations
export const authAPI = {
  login: (credentials) => apiCall('/auth/login', {
    method: 'POST',
    data: credentials,
  }),
  register: (userData) => apiCall('/auth/register', {
    method: 'POST',
    data: userData,
  }),
  logout: () => apiCall('/auth/logout', {
    method: 'POST',
  }),
  getProfile: () => apiCall('/auth/me'),
  refresh: () => apiCall('/auth/refresh', {
    method: 'POST',
  }),
};

export const listingsAPI = {
  getAll: (params) => apiCall('/listings', { params }),
  getById: (id) => apiCall(`/listings/${id}`),
  create: (data) => apiCall('/listings', {
    method: 'POST',
    data,
  }),
  update: (id, data) => apiCall(`/listings/${id}`, {
    method: 'PUT',
    data,
  }),
  delete: (id) => apiCall(`/listings/${id}`, {
    method: 'DELETE',
  }),
};

export const cartAPI = {
  get: () => apiCall('/cart'),
  add: (item) => apiCall('/cart/add', {
    method: 'POST',
    data: item,
  }),
  update: (data) => apiCall('/cart/update', {
    method: 'PUT',
    data,
  }),
  remove: (itemId) => apiCall(`/cart/item/${itemId}`, {
    method: 'DELETE',
  }),
};

export const orderAPI = {
  getAll: () => apiCall('/orders/user'),
  getById: (id) => apiCall(`/orders/${id}`),
  updateStatus: (id, status) => apiCall(`/orders/${id}/status`, {
    method: 'PUT',
    data: { status },
  }),
};

export const checkoutAPI = {
  guestQuote: (data) => apiCall('/checkout/guest/quote', {
    method: 'POST',
    data,
  }),
  guestCreate: (data) => apiCall('/checkout/guest/create', {
    method: 'POST',
    data,
  }),
  create: (data) => apiCall('/checkout/create', {
    method: 'POST',
    data,
  }),
};

export default api;