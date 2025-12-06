
// src/services/api.js - Comprehensive API service layer
// import { apiCall, authAPI, listingsAPI, cartAPI, orderAPI, checkoutAPI } from '../api/client';

// DEPRECATED: This file is kept for backward compatibility only
// All new code should use Redux RTK Query hooks from store/api/
// 
// Migration guide:
// - AuthService.login() -> useLoginMutation() from store/api/user.api
// - ListingService.getListings() -> useGetListingsQuery() from store/api/listings.api
// - CartService.addToCart() -> useAddToCartMutation() from store/api/cart.api
// - OrderService.createOrder() -> useCreateOrderMutation() from store/api/orders.api
//
// See FRONTEND_DOCUMENTATION.md for complete migration guide

// Re-export Redux hooks for backward compatibility (if needed)
// Note: Direct imports from store/api/ are preferred

export const handleAPIError = (error, showAlert = true) => {
  console.error('API Error:', error);
  
  if (showAlert) {
    const message = error?.response?.data?.message || 
                   error?.message || 
                   'An error occurred. Please try again.';
    alert(message);
  }
  
  // Handle specific error codes
  if (error?.response?.status === 401) {
    // Unauthorized - redirect to login
    localStorage.removeItem('token');
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }
};

// Legacy service exports - these should not be used in new code
// They are kept only for backward compatibility during migration
export const AuthService = {
  // Use useLoginMutation, useRegisterMutation from store/api/user.api instead
};

export const ListingService = {
  // Use useGetListingsQuery, useCreateListingMutation from store/api/listings.api instead
};

export const CartService = {
  // Use useGetCartQuery, useAddToCartMutation from store/api/cart.api instead
};

export const OrderService = {
  // Use useGetUserOrdersQuery, useCreateOrderMutation from store/api/orders.api instead
};

export const CheckoutService = {
  // Use useCreateCheckoutMutation, useCompleteCheckoutMutation from store/api/cart.api instead
};

export const NotificationService = {
  async getNotifications(limit = 20) {
    const token = localStorage.getItem('token');
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    
    const response = await fetch(`${backendUrl}/api/notifications?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.status}`);
    }
    
    const data = await response.json();
    return {
      notifications: data.notifications || data || [],
      unread_count: data.unread_count || (data || []).filter(n => !n.read_at).length
    };
  },
  
  async markAsRead(notificationIds) {
    const token = localStorage.getItem('token');
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    
    // Backend expects array directly in body (FastAPI List[str] parameter)
    const body = Array.isArray(notificationIds) ? notificationIds : [notificationIds];
    
    const response = await fetch(`${backendUrl}/api/notifications/mark-read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      throw new Error(`Failed to mark notifications as read: ${response.status}`);
    }
    
    return await response.json();
  },
  
  async markAllAsRead() {
    const token = localStorage.getItem('token');
    const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    
    const response = await fetch(`${backendUrl}/api/notifications/mark-all-read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to mark all notifications as read: ${response.status}`);
    }
    
    return await response.json();
  }
};
