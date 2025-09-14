// src/api/adminClient.js - Admin API client with Bearer token authentication
import axios from "axios";

const adminApi = axios.create({
  baseURL: "/api",
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add Bearer token to all admin requests
adminApi.interceptors.request.use(
  (config) => {
    // Get token from localStorage or sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle authentication errors
adminApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      // Clear invalid token and redirect to login
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      
      // Only redirect if not already on login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
      }
    }
    
    return Promise.reject(error);
  }
);

export default adminApi;