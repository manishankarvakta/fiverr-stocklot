// Frontend Rate Limiting and Request Safeguards
// Prevents rapid requests and implements proper debouncing for checkout flows

import React, { useState, useCallback, useRef } from 'react';

// Rate limiting state manager
class RequestLimiter {
  constructor() {
    this.requests = new Map();
    this.debounceTimers = new Map();
  }

  // Check if request is allowed based on rate limits
  isAllowed(key, maxRequests = 5, windowMs = 60000) {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    
    // Remove old requests outside the window
    const validRequests = requests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return false;
    }
    
    // Add current request
    validRequests.push(now);
    this.requests.set(key, validRequests);
    
    return true;
  }

  // Get remaining requests for a key
  getRemaining(key, maxRequests = 5, windowMs = 60000) {
    const now = Date.now();
    const requests = this.requests.get(key) || [];
    const validRequests = requests.filter(time => now - time < windowMs);
    return Math.max(0, maxRequests - validRequests.length);
  }

  // Get reset time for rate limit
  getResetTime(key, windowMs = 60000) {
    const requests = this.requests.get(key) || [];
    if (requests.length === 0) return null;
    
    const oldestRequest = Math.min(...requests);
    return oldestRequest + windowMs;
  }

  // Debounce function calls
  debounce(key, func, delay = 1000) {
    return (...args) => {
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      const timer = setTimeout(() => {
        func.apply(this, args);
        this.debounceTimers.delete(key);
      }, delay);
      
      this.debounceTimers.set(key, timer);
    };
  }

  // Clear all rate limiting data for a key
  clear(key) {
    this.requests.delete(key);
    const timer = this.debounceTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.debounceTimers.delete(key);
    }
  }
}

// Global request limiter instance
const requestLimiter = new RequestLimiter();

// Rate limiting configurations for different actions
const RATE_LIMITS = {
  checkout: { maxRequests: 3, windowMs: 300000 }, // 3 per 5 minutes
  notifications: { maxRequests: 20, windowMs: 60000 }, // 20 per minute
  cart: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
  search: { maxRequests: 30, windowMs: 60000 }, // 30 per minute
  default: { maxRequests: 15, windowMs: 60000 } // 15 per minute
};

// Custom hook for rate-limited requests
export const useRateLimitedRequest = (key, config = RATE_LIMITS.default) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastRequest, setLastRequest] = useState(null);

  const makeRequest = useCallback(async (requestFn, ...args) => {
    const requestKey = `${key}_${Date.now()}`;
    
    // Check rate limit
    if (!requestLimiter.isAllowed(key, config.maxRequests, config.windowMs)) {
      const resetTime = requestLimiter.getResetTime(key, config.windowMs);
      const waitTime = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60;
      
      setError({
        type: 'rate_limit',
        message: `Too many requests. Please wait ${waitTime} seconds.`,
        retryAfter: waitTime
      });
      return null;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const result = await requestFn(...args);
      setLastRequest(Date.now());
      return result;
    } catch (err) {
      if (err.response?.status === 429) {
        const retryAfter = err.response.headers['retry-after'] || 60;
        setError({
          type: 'rate_limit',
          message: `Rate limit exceeded. Please wait ${retryAfter} seconds.`,
          retryAfter: parseInt(retryAfter)
        });
      } else {
        setError({
          type: 'request_error',
          message: err.message || 'Request failed',
          original: err
        });
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [key, config]);

  const getRemainingRequests = useCallback(() => {
    return requestLimiter.getRemaining(key, config.maxRequests, config.windowMs);
  }, [key, config]);

  const clearLimits = useCallback(() => {
    requestLimiter.clear(key);
    setError(null);
  }, [key]);

  return {
    makeRequest,
    isLoading,
    error,
    lastRequest,
    remainingRequests: getRemainingRequests(),
    clearLimits
  };
};

// Custom hook for debounced requests
export const useDebouncedRequest = (key, delay = 1000) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const requestRef = useRef(null);

  const debouncedRequest = useCallback(async (requestFn, ...args) => {
    setIsLoading(true);
    setError(null);

    return new Promise((resolve, reject) => {
      const debouncedFn = requestLimiter.debounce(key, async () => {
        try {
          const result = await requestFn(...args);
          setIsLoading(false);
          resolve(result);
        } catch (err) {
          setIsLoading(false);
          setError(err.message || 'Request failed');
          reject(err);
        }
      }, delay);

      requestRef.current = debouncedFn;
      debouncedFn();
    });
  }, [key, delay]);

  const cancelRequest = useCallback(() => {
    if (requestRef.current) {
      requestLimiter.clear(key);
      setIsLoading(false);
      setError(null);
    }
  }, [key]);

  return {
    debouncedRequest,
    isLoading,
    error,
    cancelRequest
  };
};

// Anti-spam checkout button component
export const RateLimitedButton = ({ 
  children, 
  onClick, 
  rateLimitKey,
  maxRequests = 3,
  windowMs = 300000,
  disabled = false,
  className = '',
  ...props 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastClick, setLastClick] = useState(0);
  const [clickCount, setClickCount] = useState(0);

  const handleClick = useCallback(async (e) => {
    e.preventDefault();
    
    const now = Date.now();
    const timeSinceLastClick = now - lastClick;
    
    // Prevent rapid clicking (minimum 1 second between clicks)
    if (timeSinceLastClick < 1000) {
      return;
    }
    
    // Check rate limit
    if (!requestLimiter.isAllowed(rateLimitKey, maxRequests, windowMs)) {
      const resetTime = requestLimiter.getResetTime(rateLimitKey, windowMs);
      const waitTime = resetTime ? Math.ceil((resetTime - Date.now()) / 1000) : 60;
      
      alert(`Please wait ${waitTime} seconds before trying again.`);
      return;
    }

    setIsProcessing(true);
    setLastClick(now);
    setClickCount(prev => prev + 1);

    try {
      await onClick(e);
    } catch (error) {
      console.error('Button click error:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [onClick, rateLimitKey, maxRequests, windowMs, lastClick]);

  const remaining = requestLimiter.getRemaining(rateLimitKey, maxRequests, windowMs);
  const isDisabled = disabled || isProcessing || remaining === 0;

  return (
    <button
      {...props}
      className={`${className} ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={isDisabled}
      onClick={handleClick}
    >
      {isProcessing ? (
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Processing...
        </div>
      ) : (
        children
      )}
    </button>
  );
};

// Notification polling with rate limiting
export const useRateLimitedPolling = (pollFn, interval = 30000, key = 'polling') => {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const intervalRef = useRef(null);
  const rateLimitConfig = RATE_LIMITS.notifications;

  const startPolling = useCallback(() => {
    const poll = async () => {
      // Check if we can make a request
      if (!requestLimiter.isAllowed(key, rateLimitConfig.maxRequests, rateLimitConfig.windowMs)) {
        console.warn('Polling rate limited, skipping request');
        return;
      }

      try {
        const result = await pollFn();
        setData(result);
        setError(null);
      } catch (err) {
        console.error('Polling error:', err);
        if (err.response?.status === 429) {
          // Back off polling frequency if rate limited
          clearInterval(intervalRef.current);
          intervalRef.current = setInterval(poll, interval * 2); // Double the interval
        }
        setError(err);
      }
    };

    // Initial poll
    poll();
    
    // Set up interval
    intervalRef.current = setInterval(poll, interval);
  }, [pollFn, interval, key, rateLimitConfig]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const resetRateLimit = useCallback(() => {
    requestLimiter.clear(key);
    setError(null);
  }, [key]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    data,
    error,
    startPolling,
    stopPolling,
    resetRateLimit,
    remaining: requestLimiter.getRemaining(key, rateLimitConfig.maxRequests, rateLimitConfig.windowMs)
  };
};

// Request queue for managing multiple requests
export const useRequestQueue = (maxConcurrent = 3) => {
  const [queue, setQueue] = useState([]);
  const [active, setActive] = useState([]);
  const [completed, setCompleted] = useState([]);

  const addRequest = useCallback((requestFn, key) => {
    const request = {
      id: `${key}_${Date.now()}_${Math.random()}`,
      fn: requestFn,
      key: key,
      status: 'queued',
      createdAt: Date.now()
    };

    setQueue(prev => [...prev, request]);
    return request.id;
  }, []);

  const processQueue = useCallback(async () => {
    if (active.length >= maxConcurrent || queue.length === 0) {
      return;
    }

    const nextRequest = queue[0];
    setQueue(prev => prev.slice(1));
    setActive(prev => [...prev, nextRequest]);

    try {
      const result = await nextRequest.fn();
      setCompleted(prev => [...prev, { ...nextRequest, status: 'completed', result }]);
    } catch (error) {
      setCompleted(prev => [...prev, { ...nextRequest, status: 'failed', error }]);
    } finally {
      setActive(prev => prev.filter(req => req.id !== nextRequest.id));
    }
  }, [queue, active, maxConcurrent]);

  // Auto-process queue
  React.useEffect(() => {
    processQueue();
  }, [queue, active, processQueue]);

  const clearCompleted = useCallback(() => {
    setCompleted([]);
  }, []);

  return {
    queueLength: queue.length,
    activeLength: active.length,
    completedLength: completed.length,
    addRequest,
    clearCompleted,
    completed
  };
};

// Error boundary for rate limiting errors
export const RateLimitErrorHandler = ({ error, onRetry, onClear }) => {
  if (!error || error.type !== 'rate_limit') {
    return null;
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 my-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">
            Rate Limit Exceeded
          </h3>
          <div className="mt-2 text-sm text-yellow-700">
            <p>{error.message}</p>
          </div>
          <div className="mt-4">
            <div className="-mx-2 -my-1.5 flex">
              {onRetry && (
                <button
                  type="button"
                  className="bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                  onClick={onRetry}
                >
                  Retry in {error.retryAfter} seconds
                </button>
              )}
              {onClear && (
                <button
                  type="button"
                  className="ml-3 bg-yellow-50 px-2 py-1.5 rounded-md text-sm font-medium text-yellow-800 hover:bg-yellow-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-yellow-50 focus:ring-yellow-600"
                  onClick={onClear}
                >
                  Clear Limits
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default {
  useRateLimitedRequest,
  useDebouncedRequest,
  RateLimitedButton,
  useRateLimitedPolling,
  useRequestQueue,
  RateLimitErrorHandler,
  requestLimiter,
  RATE_LIMITS
};