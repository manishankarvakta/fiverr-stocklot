// // src/api/adminClient.js - Admin API client with Bearer token authentication
// import axios from "axios";

// // Get backend URL from environment or use fallback
// const getBackendUrl = () => {
//   // Try different ways to get the backend URL
//   if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BACKEND_URL) {
//     return process.env.REACT_APP_BACKEND_URL;
//   }
//   if (typeof window !== 'undefined' && window.location) {
//     return window.location.origin;
//   }
//   // Fallback URL
//   return 'https://stockdiff-app.preview.emergentagent.com';
// };

// const adminApi = axios.create({
//   baseURL: `${getBackendUrl()}/api`,
//   headers: {
//     'Content-Type': 'application/json',
//   }
// });

// // Add Bearer token to all admin requests
// adminApi.interceptors.request.use(
//   (config) => {
//     // Get token from localStorage or sessionStorage
//     const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
    
//     return config;
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // Handle authentication errors
// adminApi.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response?.status === 401 || error.response?.status === 403) {
//       // Clear invalid token and redirect to login
//       localStorage.removeItem('token');
//       sessionStorage.removeItem('token');
      
//       // Only redirect if not already on login page
//       if (!window.location.pathname.includes('/login')) {
//         window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
//       }
//     }
    
//     return Promise.reject(error);
//   }
// );

// export default adminApi;





import axios from "axios";

const getBackendUrl = () => {
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  if (typeof window !== 'undefined' && window.location) {
    return window.location.origin;
  }
  return 'https://stockdiff-app.preview.emergentagent.com';
};

const adminApi = axios.create({
  baseURL: `${getBackendUrl()}/api`,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ----------------------
// LOGIN / TOKEN LOGIC COMMENTED
// ----------------------

// // Add Bearer token to all admin requests
// adminApi.interceptors.request.use(
//   (config) => {
//     const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//     if (token) {
//       config.headers.Authorization = `Bearer ${token}`;
//     }
//     return config;
//   },
//   (error) => Promise.reject(error)
// );

// // Handle authentication errors
// adminApi.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     if (error.response?.status === 401 || error.response?.status === 403) {
//       localStorage.removeItem('token');
//       sessionStorage.removeItem('token');
//       if (!window.location.pathname.includes('/login')) {
//         window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
//       }
//     }
//     return Promise.reject(error);
//   }
// );

// Optional: clear previously saved tokens
try {
  if (typeof window !== "undefined") {
    // localStorage.removeItem('token');
    // sessionStorage.removeItem('token');
  }
} catch (e) {
  // console.warn("Could not clear tokens:", e);
}

export default adminApi;
