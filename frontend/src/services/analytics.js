// 📊 ANALYTICS SERVICE
// Unified analytics service for Google Analytics and PostHog tracking

class AnalyticsService {
  constructor() {
    this.isGoogleAnalyticsEnabled = typeof gtag !== 'undefined';
    this.isPostHogEnabled = typeof posthog !== 'undefined';
  }

  // Generic event tracking
  trackEvent(eventName, parameters = {}) {
    // Google Analytics 4
    if (this.isGoogleAnalyticsEnabled) {
      gtag('event', eventName, parameters);
    }

    // PostHog
    if (this.isPostHogEnabled) {
      posthog.capture(eventName, parameters);
    }

    // Console log for development
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Analytics Event:', eventName, parameters);
    }
  }

  // User identification
  identifyUser(userId, userProperties = {}) {
    // Google Analytics
    if (this.isGoogleAnalyticsEnabled) {
      gtag('config', 'G-1CB5KGJKK4', {
        user_id: userId,
        custom_map: {
          ...userProperties
        }
      });
    }

    // PostHog
    if (this.isPostHogEnabled) {
      posthog.identify(userId, userProperties);
    }
  }

  // Page view tracking
  trackPageView(pagePath, pageTitle) {
    // Google Analytics
    if (this.isGoogleAnalyticsEnabled) {
      gtag('config', 'G-1CB5KGJKK4', {
        page_path: pagePath,
        page_title: pageTitle,
      });
    }

    // PostHog
    if (this.isPostHogEnabled) {
      posthog.capture('$pageview', {
        $current_url: window.location.href,
        page_path: pagePath,
        page_title: pageTitle
      });
    }
  }

  // ========================================
  // REVIEW SYSTEM SPECIFIC TRACKING
  // ========================================

  // Review creation tracking
  trackReviewCreated(reviewData) {
    this.trackEvent('review_created', {
      event_category: 'Reviews',
      event_label: reviewData.direction,
      review_direction: reviewData.direction,
      review_rating: reviewData.rating,
      has_photos: reviewData.photos && reviewData.photos.length > 0,
      has_tags: reviewData.tags && reviewData.tags.length > 0,
      review_length: reviewData.body ? reviewData.body.length : 0,
      value: reviewData.rating // For conversion tracking
    });
  }

  // Review interaction tracking
  trackReviewInteraction(action, reviewId, additionalData = {}) {
    this.trackEvent('review_interaction', {
      event_category: 'Reviews',
      event_label: action,
      review_action: action,
      review_id: reviewId,
      ...additionalData
    });
  }

  // Review moderation tracking (admin)
  trackReviewModeration(action, reviewId, moderatorUserId) {
    this.trackEvent('review_moderation', {
      event_category: 'Admin',
      event_label: action,
      moderation_action: action,
      review_id: reviewId,
      moderator_id: moderatorUserId
    });
  }

  // Review reply tracking
  trackReviewReply(reviewId, replyLength) {
    this.trackEvent('review_reply_created', {
      event_category: 'Reviews',
      event_label: 'Reply Created',
      review_id: reviewId,
      reply_length: replyLength
    });
  }

  // Rating badge click tracking
  trackRatingBadgeClick(sellerId, rating, location) {
    this.trackEvent('rating_badge_clicked', {
      event_category: 'Reviews',
      event_label: 'Rating Badge Clicked',
      seller_id: sellerId,
      seller_rating: rating,
      click_location: location // 'listing_card', 'seller_profile', etc.
    });
  }

  // Review section view tracking
  trackReviewSectionView(sellerId, viewType) {
    this.trackEvent('review_section_viewed', {
      event_category: 'Reviews',
      event_label: 'Review Section Viewed',
      seller_id: sellerId,
      view_type: viewType, // 'modal', 'full_page', 'preview'
      page_location: window.location.pathname
    });
  }

  // ========================================
  // MARKETPLACE SPECIFIC TRACKING
  // ========================================

  // Livestock search tracking
  trackLivestockSearch(searchQuery, filters, resultsCount) {
    this.trackEvent('livestock_search', {
      event_category: 'Search',
      event_label: searchQuery || 'Empty Query',
      search_term: searchQuery,
      search_filters: JSON.stringify(filters),
      results_count: resultsCount,
      search_location: window.location.pathname
    });
  }

  // Listing view tracking
  trackListingView(listingId, listingType, sellerId) {
    this.trackEvent('listing_viewed', {
      event_category: 'Listings',
      event_label: listingType,
      listing_id: listingId,
      listing_type: listingType,
      seller_id: sellerId,
      page_location: window.location.pathname
    });
  }

  // Buy request tracking
  trackBuyRequestCreated(requestData) {
    this.trackEvent('buy_request_created', {
      event_category: 'Buy Requests',
      event_label: requestData.species || 'Unknown Species',
      species: requestData.species,
      quantity: requestData.quantity,
      has_target_price: !!requestData.target_price,
      request_location: requestData.province,
      value: requestData.target_price || 0
    });
  }

  // Offer tracking
  trackOfferMade(offerData) {
    this.trackEvent('offer_made', {
      event_category: 'Offers',
      event_label: 'Offer Made',
      buy_request_id: offerData.buy_request_id,
      offer_amount: offerData.price_per_unit,
      quantity_offered: offerData.quantity_available,
      value: offerData.price_per_unit * offerData.quantity_available
    });
  }

  // Order completion tracking
  trackOrderCompleted(orderData) {
    this.trackEvent('purchase', {
      event_category: 'Ecommerce',
      event_label: 'Order Completed',
      transaction_id: orderData.order_id,
      value: orderData.total_amount,
      currency: 'ZAR',
      items: orderData.items?.map(item => ({
        item_id: item.listing_id,
        item_name: item.listing_title,
        item_category: item.species || 'Livestock',
        quantity: item.quantity,
        price: item.price
      })) || []
    });
  }

  // User registration tracking
  trackUserRegistration(userType, registrationMethod) {
    this.trackEvent('sign_up', {
      event_category: 'User',
      event_label: userType,
      user_type: userType, // 'buyer', 'seller', 'both'
      registration_method: registrationMethod, // 'email', 'google', etc.
      page_location: window.location.pathname
    });
  }

  // User login tracking
  trackUserLogin(userType) {
    this.trackEvent('login', {
      event_category: 'User',
      event_label: userType,
      user_type: userType,
      login_location: window.location.pathname
    });
  }

  // ========================================
  // CONVERSION FUNNEL TRACKING
  // ========================================

  // Review conversion funnel
  trackReviewFunnelStep(step, additionalData = {}) {
    this.trackEvent('review_funnel', {
      event_category: 'Conversion Funnel',
      event_label: step,
      funnel_step: step,
      funnel_name: 'review_creation',
      ...additionalData
    });
  }

  // Purchase funnel
  trackPurchaseFunnelStep(step, additionalData = {}) {
    this.trackEvent('purchase_funnel', {
      event_category: 'Conversion Funnel',
      event_label: step,
      funnel_step: step,
      funnel_name: 'livestock_purchase',
      ...additionalData
    });
  }

  // ========================================
  // ERROR AND PERFORMANCE TRACKING
  // ========================================

  // Error tracking
  trackError(errorType, errorMessage, errorLocation) {
    this.trackEvent('exception', {
      event_category: 'Error',
      event_label: errorType,
      description: errorMessage,
      fatal: false,
      error_location: errorLocation,
      page_location: window.location.pathname
    });
  }

  // Performance tracking
  trackPerformance(metricName, value, unit = 'ms') {
    this.trackEvent('performance_metric', {
      event_category: 'Performance',
      event_label: metricName,
      metric_name: metricName,
      metric_value: value,
      metric_unit: unit,
      page_location: window.location.pathname
    });
  }

  // ========================================
  // CUSTOM DIMENSIONS AND METRICS
  // ========================================

  // Set custom user properties
  setUserProperties(properties) {
    // Google Analytics
    if (this.isGoogleAnalyticsEnabled) {
      gtag('config', 'G-1CB5KGJKK4', {
        custom_map: properties
      });
    }

    // PostHog
    if (this.isPostHogEnabled) {
      posthog.people.set(properties);
    }
  }

  // Track custom business metrics
  trackBusinessMetric(metricName, value, category = 'Business') {
    this.trackEvent('custom_metric', {
      event_category: category,
      event_label: metricName,
      metric_name: metricName,
      metric_value: value,
      value: value
    });
  }
}

// Create singleton instance
const analytics = new AnalyticsService();

export default analytics;

// Export specific tracking functions for easy imports
export const {
  trackEvent,
  trackPageView,
  identifyUser,
  trackReviewCreated,
  trackReviewInteraction,
  trackReviewReply,
  trackRatingBadgeClick,
  trackLivestockSearch,
  trackListingView,
  trackBuyRequestCreated,
  trackOfferMade,
  trackOrderCompleted,
  trackUserRegistration,
  trackUserLogin,
  trackError,
  trackPerformance
} = analytics;