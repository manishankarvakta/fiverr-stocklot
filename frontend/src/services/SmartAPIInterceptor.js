// 🚀 Smart API Interceptor - Optimizes existing API calls without breaking current architecture
// Hooks into the existing API client to add caching, debouncing, and rate limiting

import APIOptimizationService from './APIOptimizationService';

class SmartAPIInterceptor {
  constructor() {
    this.apiOptimizer = new APIOptimizationService();
    this.originalFetch = null;
    this.interceptorEnabled = false;
    
    // Track API call patterns to identify problematic endpoints
    this.callPatterns = new Map();
    this.excessiveCallThreshold = 5; // More than 5 calls per minute is excessive
    
    // Circuit breaker for infinite loop protection
    this.circuitBreaker = {
      failures: new Map(),
      isOpen: false,
      lastFailureTime: 0,
      failureThreshold: 10,
      resetTimeout: 30000, // 30 seconds
      blockedEndpoints: new Set()
    };
  }

  // 🔧 Initialize interceptor by patching global fetch
  initialize() {
    if (this.interceptorEnabled) return;
    
    console.log('🚀 Initializing Smart API Interceptor');
    
    // Store original fetch with proper binding
    this.originalFetch = window.fetch.bind(window);
    
    // Replace global fetch with optimized version
    window.fetch = this.createOptimizedFetch();
    
    this.interceptorEnabled = true;
    
    // Start monitoring
    this.startMonitoring();
  }

  // 🔧 Create optimized fetch function with circuit breaker protection
  createOptimizedFetch() {
    return async (url, options = {}) => {
      try {
        // Only optimize API calls to our backend
        if (!this.shouldOptimize(url)) {
          return await this.originalFetch(url, options);
        }

        // Circuit breaker protection
        const endpoint = this.normalizeEndpoint(url);
        if (this.circuitBreaker.blockedEndpoints.has(endpoint)) {
          console.warn(`🚫 Circuit breaker: endpoint ${endpoint} is blocked`);
          throw new Error('Circuit breaker: endpoint temporarily blocked');
        }

        // Track the call pattern
        this.trackCall(url);

        // Check if this is an excessive call pattern
        if (this.isExcessiveCall(url)) {
          console.warn(`⚠️ Excessive API calls detected for: ${url}`);
          
          // Add to blocked endpoints if too many failures
          const failures = this.circuitBreaker.failures.get(endpoint) || 0;
          if (failures > this.circuitBreaker.failureThreshold) {
            this.circuitBreaker.blockedEndpoints.add(endpoint);
            setTimeout(() => {
              this.circuitBreaker.blockedEndpoints.delete(endpoint);
              this.circuitBreaker.failures.delete(endpoint);
            }, this.circuitBreaker.resetTimeout);
            throw new Error('Circuit breaker: too many failures');
          }
        }

        // Apply optimization based on endpoint type
        return await this.optimizeRequest(url, options);
        
      } catch (error) {
        // Handle circuit breaker and other errors
        const endpoint = this.normalizeEndpoint(url);
        const failures = this.circuitBreaker.failures.get(endpoint) || 0;
        this.circuitBreaker.failures.set(endpoint, failures + 1);
        
        // Handle 429 errors specifically
        if (error.status === 429) {
          console.log('🚫 429 Error intercepted, applying smart retry');
          return await this.handleRateLimit(url, options);
        }
        throw error;
      }
    };
  }

  // 🎯 Determine if URL should be optimized with platform/config blacklist
  shouldOptimize(url) {
    if (typeof url !== 'string') return false;
    
    // Blacklist problematic endpoints to prevent infinite loops
    const blacklistedPaths = [
      '/api/platform/config',
      '/platform/config',
      'platform/config'
    ];
    
    // Don't optimize blacklisted endpoints
    if (blacklistedPaths.some(path => url.includes(path))) {
      console.log(`🚫 Skipping optimization for blacklisted endpoint: ${url}`);
      return false;
    }
    
    // Check if it's our backend API
    const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
    return url.includes(backendUrl) || url.includes('/api/');
  }

  // 📊 Track API call patterns with improved emergency stop
  trackCall(url) {
    const endpoint = this.normalizeEndpoint(url);
    const now = Date.now();
    
    if (!this.callPatterns.has(endpoint)) {
      this.callPatterns.set(endpoint, []);
    }
    
    const calls = this.callPatterns.get(endpoint);
    calls.push(now);
    
    // Keep only last minute of calls first (fix order)
    const oneMinuteAgo = now - 60000;
    const recentCalls = calls.filter(timestamp => timestamp > oneMinuteAgo);
    this.callPatterns.set(endpoint, recentCalls);
    
    // Emergency stop: if any endpoint exceeds 500 calls per minute, disable interceptor
    // (Increased threshold from 100 to 500 for better handling of legitimate high-frequency calls)
    if (recentCalls.length > 500) {
      console.error(`🚨 EMERGENCY STOP: ${endpoint} has ${recentCalls.length} calls in last minute - disabling SmartAPIInterceptor`);
      this.disable();
      return;
    }
    
    // Warning for high call volumes
    if (recentCalls.length > 200) {
      console.warn(`⚠️ HIGH API VOLUME: ${endpoint} has ${recentCalls.length} calls in last minute`);
    }
  }

  // 🎯 Normalize endpoint for tracking with infinite loop protection
  normalizeEndpoint(url) {
    try {
      // Prevent infinite recursion by checking for already normalized URLs
      if (typeof url !== 'string' || url.includes('/:id') || url.includes('/normalized/')) {
        return url || 'unknown';
      }
      
      // Create URL object safely
      let urlObj;
      try {
        urlObj = new URL(url, window.location.origin);
      } catch {
        return url; // Return original if URL parsing fails
      }
      
      let pathname = urlObj.pathname;
      
      // Prevent recursive calls on platform config endpoint
      if (pathname.includes('/platform/config')) {
        return '/api/platform/config';
      }
      
      // Remove specific IDs to group similar endpoints (with circuit breaker)
      pathname = pathname.replace(/\/[0-9a-f-]{36}/gi, '/:id'); // UUIDs
      pathname = pathname.replace(/\/\d+$/g, '/:id'); // Numeric IDs at end
      
      // Limit length to prevent issues
      if (pathname.length > 100) {
        pathname = pathname.substring(0, 100);
      }
      
      return pathname;
    } catch (error) {
      console.warn('URL normalization error:', error);
      return url || 'error';
    }
  }

  // ⚠️ Check if call pattern is excessive
  isExcessiveCall(url) {
    const endpoint = this.normalizeEndpoint(url);
    const calls = this.callPatterns.get(endpoint) || [];
    return calls.length > this.excessiveCallThreshold;
  }

  // 🚀 Apply appropriate optimization strategy
  async optimizeRequest(url, options) {
    const endpoint = this.normalizeEndpoint(url);
    
    // Strategy 1: Cache GET requests
    if (this.shouldCache(url, options)) {
      return await this.apiOptimizer.optimizedFetch(url, options);
    }
    
    // Strategy 2: Debounce rapid calls
    if (this.shouldDebounce(endpoint)) {
      return await this.debounceRequest(url, options);
    }
    
    // Strategy 3: Queue rate-limited calls
    if (this.isRateLimited(endpoint)) {
      return await this.queueRequest(url, options);
    }
    
    // Strategy 4: Default optimized call
    return await this.apiOptimizer.optimizedFetch(url, options);
  }

  // 📦 Determine if request should be cached
  shouldCache(url, options) {
    const method = options.method || 'GET';
    
    // Only cache GET requests
    if (method !== 'GET') return false;
    
    // Cache these endpoints
    const cacheableEndpoints = [
      '/api/listings',
      '/api/notifications',
      '/api/categories',
      '/api/species',
      '/api/profile'
    ];
    
    return cacheableEndpoints.some(endpoint => url.includes(endpoint));
  }

  // ⏱️ Determine if request should be debounced
  shouldDebounce(endpoint) {
    const debounceEndpoints = [
      '/api/search',
      '/api/autocomplete',
      '/api/validate'
    ];
    
    return debounceEndpoints.some(pattern => endpoint.includes(pattern));
  }

  // 🚦 Check if endpoint is rate limited
  isRateLimited(endpoint) {
    const rateLimitedEndpoints = [
      '/api/checkout',
      '/api/payment',
      '/api/orders'
    ];
    
    return rateLimitedEndpoints.some(pattern => endpoint.includes(pattern));
  }

  // ⏱️ Debounce rapid requests
  async debounceRequest(url, options) {
    const key = `${url}:${JSON.stringify(options)}`;
    
    return await this.apiOptimizer.debounce(
      () => this.originalFetch(url, options),
      500,
      key
    );
  }

  // 🚦 Queue rate-limited requests
  async queueRequest(url, options) {
    // Use optimizer's queue system
    return await this.apiOptimizer.optimizedFetch(url, options);
  }

  // 🔄 Handle 429 rate limit errors
  async handleRateLimit(url, options) {
    const retryAfter = 2000; // 2 seconds base delay
    const maxRetries = 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const delay = retryAfter * Math.pow(2, attempt - 1); // Exponential backoff
      
      console.log(`⏳ Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
      
      try {
        return await this.originalFetch(url, options);
      } catch (error) {
        if (error.status !== 429 || attempt === maxRetries) {
          throw error;
        }
      }
    }
  }

  // 📊 Start monitoring and reporting
  startMonitoring() {
    // Report excessive calls every 30 seconds
    setInterval(() => {
      this.reportExcessiveCalls();
    }, 30000);
    
    // Clean up old tracking data every minute
    setInterval(() => {
      this.cleanupTracking();
    }, 60000);
  }

  // 📋 Report excessive API calls
  reportExcessiveCalls() {
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    
    for (const [endpoint, calls] of this.callPatterns.entries()) {
      const recentCalls = calls.filter(timestamp => timestamp > oneMinuteAgo);
      
      if (recentCalls.length > this.excessiveCallThreshold) {
        console.warn(`🚨 EXCESSIVE API CALLS: ${endpoint} - ${recentCalls.length} calls in last minute`);
        
        // Could send analytics here
        this.sendAnalytics('excessive_api_calls', {
          endpoint,
          callCount: recentCalls.length,
          timeWindow: '1minute'
        });
      }
    }
  }

  // 🧹 Clean up old tracking data
  cleanupTracking() {
    const now = Date.now();
    const fiveMinutesAgo = now - 300000;
    
    for (const [endpoint, calls] of this.callPatterns.entries()) {
      const recentCalls = calls.filter(timestamp => timestamp > fiveMinutesAgo);
      if (recentCalls.length === 0) {
        this.callPatterns.delete(endpoint);
      } else {
        this.callPatterns.set(endpoint, recentCalls);
      }
    }
  }

  // 📊 Send analytics (placeholder)
  sendAnalytics(event, data) {
    // Could integrate with analytics service
    console.log(`📊 Analytics: ${event}`, data);
  }

  // 📈 Get optimization statistics
  getStats() {
    const activeEndpoints = this.callPatterns.size;
    const totalCalls = Array.from(this.callPatterns.values())
      .reduce((total, calls) => total + calls.length, 0);
    
    return {
      interceptorEnabled: this.interceptorEnabled,
      activeEndpoints,
      totalCallsLastMinute: totalCalls,
      cacheStats: this.apiOptimizer.getCacheStats(),
      excessiveEndpoints: this.getExcessiveEndpoints()
    };
  }

  // ⚠️ Get endpoints with excessive calls
  getExcessiveEndpoints() {
    const excessive = [];
    
    for (const [endpoint, calls] of this.callPatterns.entries()) {
      if (calls.length > this.excessiveCallThreshold) {
        excessive.push({
          endpoint,
          callsPerMinute: calls.length
        });
      }
    }
    
    return excessive;
  }

  // 🔧 Manual controls
  disable() {
    if (!this.interceptorEnabled) return;
    
    console.log('🛑 Disabling Smart API Interceptor');
    // Restore original fetch with proper binding
    window.fetch = this.originalFetch || window.fetch.bind(window);
    this.interceptorEnabled = false;
  }

  enable() {
    if (this.interceptorEnabled) return;
    this.initialize();
  }

  clearCache() {
    this.apiOptimizer.clearAll();
    this.callPatterns.clear();
  }
}

// Create global instance
const smartAPIInterceptor = new SmartAPIInterceptor();

// Auto-initialize in production
if (process.env.NODE_ENV === 'production' || process.env.REACT_APP_OPTIMIZE_API === 'true') {
  smartAPIInterceptor.initialize();
}

// Make available globally for debugging
window.apiInterceptor = smartAPIInterceptor;

export default smartAPIInterceptor;