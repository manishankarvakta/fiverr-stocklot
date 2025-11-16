import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Get backend URL with fallback
const getBackendUrl = () => {
  return process.env.REACT_APP_BACKEND_URL || 
         'https://farmstock-hub-1.preview.emergentagent.com';
};

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: `${getBackendUrl()}/api`,
  credentials: 'include', // Include cookies for session-based auth
  prepareHeaders: (headers, { getState }) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    // If we have a token, add it to headers
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

// Base query with automatic token refresh on 401
const baseQueryWithReauth = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);
  
  // If we get a 401 and have a token, try to refresh
  if (result?.error?.status === 401) {
    const token = localStorage.getItem('token');
    
    if (token) {
      // Try to refresh the token
      const refreshResult = await baseQuery(
        { url: '/auth/refresh', method: 'POST' },
        api,
        extraOptions
      );
      
      if (refreshResult.data) {
        // Retry the original query with new token
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh failed, clear token
        localStorage.removeItem('token');
      }
    }
  }
  
  return result;
};

// Create base API
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: [
    'User',
    'Listing',
    'Cart',
    'Order',
    'BuyRequest',
    'Message',
    'Conversation',
    'Notification',
    'Admin',
    'KYC',
    'Wishlist',
    'PriceAlert',
  ],
  endpoints: () => ({}),
});

