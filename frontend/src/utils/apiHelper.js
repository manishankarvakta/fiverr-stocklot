// Temporary API helper for endpoints not yet in Redux
// TODO: Migrate all endpoints to Redux RTK Query
// This is a temporary solution until all endpoints are added to store/api/

const getBackendUrl = () => {
  return process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
};

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

export const apiCall = async (method, endpoint, data = null, params = null) => {
  const baseUrl = `${getBackendUrl()}/api`;
  let url = `${baseUrl}${endpoint}`;
  
  // Add query parameters
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, value);
      }
    });
    const queryString = searchParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }
  }
  
  const config = {
    method: method.toUpperCase(),
    headers: getAuthHeaders(),
    credentials: 'include',
  };
  
  if (data && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
    // Handle FormData
    if (data instanceof FormData) {
      delete config.headers['Content-Type']; // Let browser set it
      config.body = data;
    } else {
      config.body = JSON.stringify(data);
    }
  }
  
  try {
    const response = await fetch(url, config);
    
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
export const api = {
  get: (endpoint, config = {}) => apiCall('GET', endpoint, null, config.params),
  post: (endpoint, data, config = {}) => apiCall('POST', endpoint, data, config.params),
  put: (endpoint, data, config = {}) => apiCall('PUT', endpoint, data, config.params),
  patch: (endpoint, data, config = {}) => apiCall('PATCH', endpoint, data, config.params),
  delete: (endpoint, config = {}) => apiCall('DELETE', endpoint, null, config.params),
};

export default api;

