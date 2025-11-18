// Smart API Interceptor for optimization and caching
// This service provides API call optimization, caching, and rate limiting

class SmartAPIInterceptor {
  static initialized = false;
  static cache = new Map();
  static pendingRequests = new Map();

  static initialize() {
    if (this.initialized) {
      return;
    }

    this.initialized = true;
    console.log('✅ SmartAPIInterceptor initialized');
    
    // Optional: Add axios interceptors here if needed
    // This is a placeholder for future optimization features
  }

  static getCacheKey(url, params) {
    const paramString = params ? JSON.stringify(params) : '';
    return `${url}${paramString}`;
  }

  static getCached(url, params) {
    const key = this.getCacheKey(url, params);
    return this.cache.get(key);
  }

  static setCache(url, params, data, ttl = 60000) {
    const key = this.getCacheKey(url, params);
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Auto-cleanup expired cache entries
    setTimeout(() => {
      this.cache.delete(key);
    }, ttl);
  }

  static clearCache() {
    this.cache.clear();
  }
}

export default SmartAPIInterceptor;

