// API utility functions for making authenticated requests

// Use environment variable for API base URL
const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';

export const apiCall = async (method, endpoint, data = null) => {
  const token = localStorage.getItem('token');
  
  const config = {
    method: method.toUpperCase(),
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    }
  };

  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    config.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || errorData.message || `HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    
    return response;
  } catch (error) {
    console.error(`API call failed: ${method} ${endpoint}`, error);
    throw error;
  }
};

// Convenience methods
export const get = (endpoint) => apiCall('GET', endpoint);
export const post = (endpoint, data) => apiCall('POST', endpoint, data);
export const put = (endpoint, data) => apiCall('PUT', endpoint, data);
export const patch = (endpoint, data) => apiCall('PATCH', endpoint, data);
export const del = (endpoint) => apiCall('DELETE', endpoint);

// Specific API functions for common operations
export const notifications = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return get(`/notifications${queryString ? `?${queryString}` : ''}`);
  },
  markRead: (notificationId) => post('/notifications/mark-read', { notification_id: notificationId }),
  markAllRead: () => post('/notifications/mark-all-read')
};

export const referrals = {
  getCode: () => get('/referrals/my-code'),
  getStats: () => get('/referrals/stats'),
  getWallet: () => get('/referrals/wallet'),
  trackClick: (params) => get(`/referrals/click?${new URLSearchParams(params).toString()}`)
};

export const blog = {
  getPosts: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return get(`/blog/posts${queryString ? `?${queryString}` : ''}`);
  },
  getPost: (slug) => get(`/blog/posts/${slug}`)
};

export const auth = {
  register: (userData) => post('/auth/register-enhanced', userData),
  login: (credentials) => post('/auth/login-enhanced', credentials),
  regularLogin: (credentials) => post('/auth/login', credentials),
  regularRegister: (userData) => post('/auth/register', userData)
};

export default {
  apiCall,
  get,
  post,
  put,
  patch,
  del,
  notifications,
  referrals,
  blog,
  auth
};