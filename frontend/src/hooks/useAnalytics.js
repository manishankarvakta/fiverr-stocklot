// 📊 ANALYTICS REACT HOOK
// Custom hook for easy analytics integration in React components

import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import analytics from '../services/analytics';

// Main analytics hook
export const useAnalytics = (user = null) => {
  const location = useLocation();

  // Track page views automatically
  useEffect(() => {
    const pageTitle = document.title;
    const pagePath = location.pathname + location.search;
    
    analytics.trackPageView(pagePath, pageTitle);
  }, [location]);

  // Identify user when provided
  useEffect(() => {
    if (user?.id) {
      analytics.identifyUser(user.id, {
        user_type: user.roles?.join(',') || 'unknown',
        verified: user.is_verified || false,
        kyc_level: user.kyc_level || 0,
        registration_date: user.created_at,
        location: user.location || user.province
      });
    }
  }, [user]);

  // Return analytics functions for component use
  return {
    trackEvent: analytics.trackEvent.bind(analytics),
    trackReviewCreated: analytics.trackReviewCreated.bind(analytics),
    trackReviewInteraction: analytics.trackReviewInteraction.bind(analytics),
    trackReviewReply: analytics.trackReviewReply.bind(analytics),
    trackRatingBadgeClick: analytics.trackRatingBadgeClick.bind(analytics),
    trackLivestockSearch: analytics.trackLivestockSearch.bind(analytics),
    trackListingView: analytics.trackListingView.bind(analytics),
    trackBuyRequestCreated: analytics.trackBuyRequestCreated.bind(analytics),
    trackOfferMade: analytics.trackOfferMade.bind(analytics),
    trackOrderCompleted: analytics.trackOrderCompleted.bind(analytics),
    trackError: analytics.trackError.bind(analytics),
    trackPerformance: analytics.trackPerformance.bind(analytics)
  };
};

// Specialized hook for review system tracking
export const useReviewAnalytics = () => {
  const trackReviewModalOpened = useCallback((direction, orderGroupId) => {
    analytics.trackReviewFunnelStep('modal_opened', {
      direction,
      order_group_id: orderGroupId
    });
  }, []);

  const trackReviewFormStarted = useCallback((direction) => {
    analytics.trackReviewFunnelStep('form_started', { direction });
  }, []);

  const trackReviewFormAbandoned = useCallback((direction, formData) => {
    analytics.trackReviewFunnelStep('form_abandoned', {
      direction,
      rating: formData.rating || 0,
      has_body: !!formData.body,
      body_length: formData.body?.length || 0
    });
  }, []);

  const trackReviewInteraction = useCallback((action, reviewId, additionalData = {}) => {
    analytics.trackReviewInteraction(action, reviewId, additionalData);
  }, []);

  const trackReviewSectionView = useCallback((sellerId, viewType) => {
    analytics.trackReviewSectionView(sellerId, viewType);
  }, []);

  return {
    trackReviewModalOpened,
    trackReviewFormStarted,
    trackReviewFormAbandoned,
    trackReviewInteraction,
    trackReviewSectionView
  };
};

// Specialized hook for marketplace tracking
export const useMarketplaceAnalytics = () => {
  const trackSearch = useCallback((query, filters, resultsCount) => {
    analytics.trackLivestockSearch(query, filters, resultsCount);
  }, []);

  const trackListingView = useCallback((listingId, listingType, sellerId) => {
    analytics.trackListingView(listingId, listingType, sellerId);
  }, []);

  const trackListingInteraction = useCallback((action, listingId, additionalData = {}) => {
    analytics.trackEvent('listing_interaction', {
      event_category: 'Listings',
      event_label: action,
      listing_action: action,
      listing_id: listingId,
      ...additionalData
    });
  }, []);

  const trackBuyRequestCreated = useCallback((requestData) => {
    analytics.trackBuyRequestCreated(requestData);
  }, []);

  const trackOfferMade = useCallback((offerData) => {
    analytics.trackOfferMade(offerData);
  }, []);

  return {
    trackSearch,
    trackListingView,
    trackListingInteraction,
    trackBuyRequestCreated,
    trackOfferMade
  };
};

// Specialized hook for conversion funnel tracking
export const useConversionAnalytics = () => {
  const trackPurchaseFunnelStep = useCallback((step, additionalData = {}) => {
    analytics.trackPurchaseFunnelStep(step, additionalData);
  }, []);

  const trackReviewFunnelStep = useCallback((step, additionalData = {}) => {
    analytics.trackReviewFunnelStep(step, additionalData);
  }, []);

  const trackRegistrationFunnelStep = useCallback((step, additionalData = {}) => {
    analytics.trackEvent('registration_funnel', {
      event_category: 'Conversion Funnel',
      event_label: step,
      funnel_step: step,
      funnel_name: 'user_registration',
      ...additionalData
    });
  }, []);

  return {
    trackPurchaseFunnelStep,
    trackReviewFunnelStep,
    trackRegistrationFunnelStep
  };
};

// Error tracking hook
export const useErrorAnalytics = () => {
  const trackError = useCallback((errorType, errorMessage, errorLocation) => {
    analytics.trackError(errorType, errorMessage, errorLocation);
  }, []);

  const trackApiError = useCallback((endpoint, statusCode, errorMessage) => {
    analytics.trackError('api_error', `${endpoint}: ${errorMessage}`, 'API', {
      endpoint,
      status_code: statusCode
    });
  }, []);

  const trackJavaScriptError = useCallback((error, errorInfo) => {
    analytics.trackError('javascript_error', error.message, 'JavaScript', {
      error_stack: error.stack,
      component_stack: errorInfo.componentStack
    });
  }, []);

  return {
    trackError,
    trackApiError,
    trackJavaScriptError
  };
};

// Performance tracking hook
export const usePerformanceAnalytics = () => {
  const trackPageLoad = useCallback((loadTime) => {
    analytics.trackPerformance('page_load_time', loadTime);
  }, []);

  const trackApiResponse = useCallback((endpoint, responseTime) => {
    analytics.trackPerformance('api_response_time', responseTime, 'ms', {
      endpoint
    });
  }, []);

  const trackComponentRender = useCallback((componentName, renderTime) => {
    analytics.trackPerformance('component_render_time', renderTime, 'ms', {
      component: componentName
    });
  }, []);

  // Auto-track Web Vitals if available
  useEffect(() => {
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Track page load performance
      const handleLoad = () => {
        const loadTime = performance.now();
        trackPageLoad(loadTime);
      };

      if (document.readyState === 'complete') {
        handleLoad();
      } else {
        window.addEventListener('load', handleLoad);
        return () => window.removeEventListener('load', handleLoad);
      }
    }
  }, [trackPageLoad]);

  return {
    trackPageLoad,
    trackApiResponse,
    trackComponentRender
  };
};

export default useAnalytics;