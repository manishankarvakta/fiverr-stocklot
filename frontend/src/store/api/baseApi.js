
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
// Get backend URL with fallback
const getBackendUrl = () => {
  // Expect REACT_APP_BACKEND_URL to be something like 'https://api.example.com'
  // We append '/api' in the baseQuery below. Use fallback without '/api'.
  console.log("Backend URL:", process.env.REACT_APP_BACKEND_URL);
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

};

// Base query with authentication
const baseQuery = fetchBaseQuery({
  baseUrl: `${getBackendUrl()}/api`,
  credentials: 'include', // Include cookies for session-based auth
  prepareHeaders: (headers, { getState }) => {
    // Get token from localStorage
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    
    // If we have a token, add it to headers
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    // Do not set Content-Type globally so multipart/FormData requests can
    // be sent without forcing 'application/json'. Individual endpoints
    // may set headers when needed.
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
        // If refresh returned a new token, persist it so prepareHeaders
        // will include it for the retried request.
        const newToken =
          refreshResult.data.token ||
          refreshResult.data.accessToken ||
          refreshResult.data.access_token;

        if (newToken) {
          localStorage.setItem('token', newToken);
        }
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
    'Taxonomy',
    'Review',
    'Referral',
    'Blog',
    'Email',
  ],
  endpoints: () => ({}),
});