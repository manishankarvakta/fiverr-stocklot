// 🚀 API OPTIMIZATION SERVICE - Comprehensive Caching & Request Management
// Implements intelligent caching, debouncing, and request optimization to prevent 429 errors

class APIOptimizationService {
  constructor() {
    this.cache = new Map();
    this.requestQueue = new Map();
    this.rateLimitDelays = new Map();
    this.requestTimestamps = new Map();
    this.pendingRequests = new Map();
    
    // Configuration
    this.config = {
      // Cache durations in milliseconds
      cacheDurations: {
        'notifications': 30000,     // 30 seconds
        'listings': 60000,          // 1 minute
        'listing': 300000,          // 5 minutes
        'profile': 600000,          // 10 minutes
        'categories': 1800000,      // 30 minutes
        'default': 60000            // 1 minute default
      },
      
      // Rate limiting thresholds
      rateLimits: {
        'notifications': { requests: 10, window: 60000 },     // 10 per minute
        'listings': { requests: 30, window: 60000 },          // 30 per minute
        'checkout': { requests: 5, window: 300000 },          // 5 per 5 minutes
        'payment': { requests: 3, window: 300000 },           // 3 per 5 minutes
        'default': { requests: 60, window: 60000 }            // 60 per minute default
      },
      
      // Debounce delays in milliseconds
      debounceDelays: {
        'search': 500,              // 500ms for search
        'autocomplete': 300,        // 300ms for autocomplete
        'validation': 200,          // 200ms for form validation
        'default': 100              // 100ms default
      }
    };
  }

  // 🔑 Main API call method with optimization
  async optimizedFetch(url, options = {}) {
    const cacheKey = this.generateCacheKey(url, options);
    const endpoint = this.getEndpointType(url);
    
    try {
      // 1. Check cache first
      const cachedResponse = this.getFromCache(cacheKey, endpoint);
      if (cachedResponse) {
        console.log(`📦 Cache hit for ${endpoint}:`, url);
        return cachedResponse;
      }
      
      // 2. Check rate limiting
      if (this.isRateLimited(endpoint)) {
        console.log(`⏱️ Rate limited for ${endpoint}, queuing request`);
        return await this.queueRequest(url, options, cacheKey);
      }
      
      // 3. Check for duplicate pending requests
      if (this.pendingRequests.has(cacheKey)) {
        console.log(`🔄 Duplicate request detected, waiting for existing:`, url);
        return await this.pendingRequests.get(cacheKey);
      }
      
      // 4. Make the request
      const requestPromise = this.makeRequest(url, options);
      this.pendingRequests.set(cacheKey, requestPromise);
      
      const response = await requestPromise;
      
      // 5. Update rate limiting tracking
      this.updateRateLimit(endpoint);
      
      // 6. Cache the response
      this.setCache(cacheKey, response, endpoint);
      
      // 7. Clean up pending requests
      this.pendingRequests.delete(cacheKey);
      
      return response;
      
    } catch (error) {
      this.pendingRequests.delete(cacheKey);
      
      // Handle 429 errors specifically
      if (error.status === 429 || error.response?.status === 429) {
        console.log(`🚫 429 Error for ${endpoint}, implementing backoff`);
        return await this.handleRateLimit(url, options, cacheKey, endpoint);
      }
      
      throw error;
    }
  }

  // 🗝️ Generate unique cache key
  generateCacheKey(url, options) {
    const method = options.method || 'GET';
    const body = options.body ? JSON.stringify(options.body) : '';
    const params = new URL(url, window.location.origin).searchParams.toString();
    return `${method}:${url}:${params}:${body}`;
  }

  // 🎯 Identify endpoint type from URL
  getEndpointType(url) {
    if (url.includes('/notifications')) return 'notifications';
    if (url.includes('/listings') && url.includes('/')) return 'listing';
    if (url.includes('/listings')) return 'listings';
    if (url.includes('/checkout')) return 'checkout';
    if (url.includes('/payment')) return 'payment';
    if (url.includes('/categories')) return 'categories';
    if (url.includes('/profile')) return 'profile';
    return 'default';
  }

  // 📦 Cache management
  getFromCache(cacheKey, endpoint) {
    const cached = this.cache.get(cacheKey);
    if (!cached) return null;
    
    const duration = this.config.cacheDurations[endpoint] || this.config.cacheDurations.default;
    const isExpired = Date.now() - cached.timestamp > duration;
    
    if (isExpired) {
      this.cache.delete(cacheKey);
      return null;
    }
    
    return cached.data;
  }

  setCache(cacheKey, data, endpoint) {
    // Don't cache error responses
    if (data.error || (data.status && data.status >= 400)) return;
    
    this.cache.set(cacheKey, {
      data: data,
      timestamp: Date.now(),
      endpoint: endpoint
    });
    
    // Cleanup old cache entries periodically
    if (this.cache.size > 100) {
      this.cleanupCache();
    }
  }

  cleanupCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      const duration = this.config.cacheDurations[value.endpoint] || this.config.cacheDurations.default;
      if (now - value.timestamp > duration) {
        this.cache.delete(key);
      }
    }
  }

  // ⏱️ Rate limiting management
  isRateLimited(endpoint) {
    const limit = this.config.rateLimits[endpoint] || this.config.rateLimits.default;
    const timestamps = this.requestTimestamps.get(endpoint) || [];
    const now = Date.now();
    
    // Remove old timestamps
    const recentTimestamps = timestamps.filter(timestamp => now - timestamp < limit.window);
    this.requestTimestamps.set(endpoint, recentTimestamps);
    
    return recentTimestamps.length >= limit.requests;
  }

  updateRateLimit(endpoint) {
    const timestamps = this.requestTimestamps.get(endpoint) || [];
    timestamps.push(Date.now());
    this.requestTimestamps.set(endpoint, timestamps);
  }

  // 🚦 Queue management for rate-limited requests
  async queueRequest(url, options, cacheKey) {
    const endpoint = this.getEndpointType(url);
    const limit = this.config.rateLimits[endpoint] || this.config.rateLimits.default;
    
    // Calculate delay until next available slot
    const timestamps = this.requestTimestamps.get(endpoint) || [];
    const oldestRelevant = timestamps[0];
    const delay = oldestRelevant ? (oldestRelevant + limit.window) - Date.now() : 0;
    
    if (delay > 0) {
      console.log(`⏳ Queuing request for ${delay}ms:`, url);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    return await this.optimizedFetch(url, options);
  }

  // 🔄 Handle 429 errors with exponential backoff
  async handleRateLimit(url, options, cacheKey, endpoint) {
    const backoffKey = `${endpoint}:backoff`;
    const currentDelay = this.rateLimitDelays.get(backoffKey) || 1000;
    const maxDelay = 30000; // Max 30 seconds
    
    const delay = Math.min(currentDelay * 2, maxDelay);
    this.rateLimitDelays.set(backoffKey, delay);
    
    console.log(`🔄 Backing off for ${delay}ms due to 429 error`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    // Reset backoff on successful request
    setTimeout(() => {
      this.rateLimitDelays.delete(backoffKey);
    }, delay * 2);
    
    return await this.optimizedFetch(url, options);
  }

  // 🌐 Make actual HTTP request
  async makeRequest(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };
    
    const response = await fetch(url, { ...defaultOptions, ...options });
    
    if (!response.ok) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
    
    return await response.json();
  }

  // 🎛️ Debounce function for frequent operations
  debounce(func, delay, key = 'default') {
    const debounceDelay = this.config.debounceDelays[key] || delay || this.config.debounceDelays.default;
    
    if (this.debounceTimers && this.debounceTimers[key]) {
      clearTimeout(this.debounceTimers[key]);
    }
    
    if (!this.debounceTimers) this.debounceTimers = {};
    
    return new Promise((resolve) => {
      this.debounceTimers[key] = setTimeout(async () => {
        const result = await func();
        resolve(result);
      }, debounceDelay);
    });
  }

  // 📊 Get cache statistics
  getCacheStats() {
    return {
      cacheSize: this.cache.size,
      pendingRequests: this.pendingRequests.size,
      rateLimitedEndpoints: Array.from(this.rateLimitDelays.keys()),
      cacheHitRate: this.calculateCacheHitRate()
    };
  }

  calculateCacheHitRate() {
    // This would require more sophisticated tracking in a real implementation
    return 'Not implemented - requires request tracking';
  }

  // 🧹 Clear all caches and reset state
  clearAll() {
    this.cache.clear();
    this.requestQueue.clear();
    this.rateLimitDelays.clear();
    this.requestTimestamps.clear();
    this.pendingRequests.clear();
    if (this.debounceTimers) {
      Object.values(this.debounceTimers).forEach(timer => clearTimeout(timer));
      this.debounceTimers = {};
    }
  }
}

// Create global instance
window.apiOptimizer = new APIOptimizationService();

export default APIOptimizationService;