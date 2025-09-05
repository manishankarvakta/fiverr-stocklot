// 📊 ANALYTICS EVENTS CONFIGURATION
// Centralized configuration for all analytics events and custom dimensions

export const ANALYTICS_EVENTS = {
  // Review System Events
  REVIEW: {
    CREATED: 'review_created',
    UPDATED: 'review_updated', 
    DELETED: 'review_deleted',
    REPLY_CREATED: 'review_reply_created',
    REPORTED: 'review_reported',
    MODERATED: 'review_moderation',
    RATING_CLICKED: 'rating_badge_clicked',
    SECTION_VIEWED: 'review_section_viewed',
    MODAL_OPENED: 'review_modal_opened',
    FORM_ABANDONED: 'review_form_abandoned'
  },

  // Marketplace Events
  MARKETPLACE: {
    SEARCH_PERFORMED: 'livestock_search',
    LISTING_VIEWED: 'listing_viewed',
    LISTING_FAVORITED: 'listing_favorited',
    LISTING_SHARED: 'listing_shared',
    SELLER_PROFILE_VIEWED: 'seller_profile_viewed',
    CATEGORY_BROWSED: 'category_browsed'
  },

  // Buy Request Events
  BUY_REQUEST: {
    CREATED: 'buy_request_created',
    VIEWED: 'buy_request_viewed',
    OFFER_RECEIVED: 'offer_received',
    OFFER_MADE: 'offer_made',
    OFFER_ACCEPTED: 'offer_accepted',
    OFFER_DECLINED: 'offer_declined'
  },

  // User Events
  USER: {
    REGISTERED: 'sign_up',
    LOGIN: 'login',
    LOGOUT: 'logout',
    PROFILE_UPDATED: 'profile_updated',
    KYC_COMPLETED: 'kyc_completed',
    SUBSCRIPTION_CHANGED: 'subscription_changed'
  },

  // Transaction Events
  TRANSACTION: {
    INITIATED: 'begin_checkout',
    COMPLETED: 'purchase',
    FAILED: 'transaction_failed',
    ESCROW_CREATED: 'escrow_created',
    ESCROW_RELEASED: 'escrow_released',
    DISPUTE_CREATED: 'dispute_created'
  },

  // Engagement Events
  ENGAGEMENT: {
    PAGE_VIEW: 'page_view',
    SESSION_START: 'session_start',
    TIME_ON_PAGE: 'time_on_page',
    SCROLL_DEPTH: 'scroll_depth',
    CTA_CLICKED: 'cta_clicked',
    NEWSLETTER_SIGNUP: 'newsletter_signup'
  },

  // Error Events
  ERROR: {
    JAVASCRIPT_ERROR: 'javascript_error',
    API_ERROR: 'api_error',
    FORM_ERROR: 'form_error',
    PAYMENT_ERROR: 'payment_error',
    UPLOAD_ERROR: 'upload_error'
  }
};

// Custom Dimensions and Metrics
export const CUSTOM_DIMENSIONS = {
  USER_TYPE: 'user_type', // buyer, seller, both
  USER_TIER: 'user_tier', // basic, premium, enterprise
  KYC_LEVEL: 'kyc_level', // 0, 1, 2, 3
  REGISTRATION_METHOD: 'registration_method', // email, google, facebook
  DEVICE_TYPE: 'device_type', // mobile, tablet, desktop
  TRAFFIC_SOURCE: 'traffic_source', // organic, paid, social, direct
  LIVESTOCK_CATEGORY: 'livestock_category', // cattle, sheep, goats, etc.
  PRICE_RANGE: 'price_range', // 0-1000, 1000-5000, etc.
  LOCATION_PROVINCE: 'location_province',
  REVIEW_SENTIMENT: 'review_sentiment', // positive, neutral, negative
  ORDER_VALUE_TIER: 'order_value_tier' // small, medium, large
};

// Enhanced Ecommerce Configuration
export const ECOMMERCE_CONFIG = {
  CURRENCY: 'ZAR',
  ITEM_CATEGORIES: {
    CATTLE: 'Cattle',
    SHEEP: 'Sheep', 
    GOATS: 'Goats',
    PIGS: 'Pigs',
    POULTRY: 'Poultry',
    OTHER: 'Other Livestock'
  }
};

// Review System Specific Metrics
export const REVIEW_METRICS = {
  CONVERSION_FUNNEL: [
    'order_completed',
    'review_prompt_shown',
    'review_modal_opened',
    'review_form_started',
    'review_submitted',
    'review_approved'
  ],
  
  QUALITY_INDICATORS: {
    AVERAGE_REVIEW_LENGTH: 'avg_review_length',
    REVIEW_WITH_PHOTOS_RATE: 'review_photo_rate',
    REVIEW_REPLY_RATE: 'review_reply_rate',
    MODERATION_APPROVAL_RATE: 'moderation_approval_rate'
  },

  ENGAGEMENT_METRICS: {
    REVIEWS_PER_SELLER: 'reviews_per_seller',
    SELLER_REPLY_RATE: 'seller_reply_rate',
    REVIEW_HELPFULNESS_SCORE: 'review_helpfulness',
    TIME_TO_FIRST_REVIEW: 'time_to_first_review'
  }
};

// Goal Configuration for Google Analytics
export const ANALYTICS_GOALS = {
  // Micro Conversions
  REVIEW_SUBMITTED: {
    id: 'review_completion',
    value: 5, // Credits value for completing a review
    currency: 'ZAR'
  },
  
  LISTING_INQUIRY: {
    id: 'listing_inquiry',
    value: 10,
    currency: 'ZAR'
  },

  PROFILE_COMPLETED: {
    id: 'profile_completion',
    value: 15,
    currency: 'ZAR'
  },

  // Macro Conversions
  ORDER_COMPLETED: {
    id: 'purchase_completion',
    value: 'dynamic', // Based on order value
    currency: 'ZAR'
  },

  USER_REGISTRATION: {
    id: 'user_registration',
    value: 25,
    currency: 'ZAR'
  },

  PREMIUM_SUBSCRIPTION: {
    id: 'premium_subscription',
    value: 100,
    currency: 'ZAR'
  }
};

// Audience Segments for Advanced Analytics
export const AUDIENCE_SEGMENTS = {
  HIGH_VALUE_BUYERS: {
    criteria: {
      total_purchases_value: { operator: '>', value: 50000 },
      purchase_frequency: { operator: '>=', value: 3 }
    }
  },

  ACTIVE_REVIEWERS: {
    criteria: {
      reviews_submitted: { operator: '>=', value: 5 },
      avg_review_rating: { operator: '>=', value: 4 }
    }
  },

  TOP_SELLERS: {
    criteria: {
      seller_rating: { operator: '>=', value: 4.5 },
      total_sales: { operator: '>=', value: 10 }
    }
  },

  AT_RISK_USERS: {
    criteria: {
      days_since_last_visit: { operator: '>', value: 30 },
      total_orders: { operator: '>=', value: 1 }
    }
  }
};

// Attribution Models
export const ATTRIBUTION_CONFIG = {
  // Multi-touch attribution for complex livestock purchase journeys
  CONVERSION_PATH_LENGTH: 90, // days
  TOUCHPOINT_WEIGHTINGS: {
    FIRST_TOUCH: 0.4,  // Discovery phase
    MIDDLE_TOUCH: 0.2, // Consideration phase  
    LAST_TOUCH: 0.4    // Decision phase
  }
};

// Real-time Dashboard Metrics
export const DASHBOARD_METRICS = {
  REVIEW_SYSTEM: [
    'reviews_submitted_today',
    'avg_rating_today',
    'reviews_pending_moderation',
    'review_conversion_rate'
  ],

  MARKETPLACE: [
    'active_listings',
    'new_registrations_today',
    'completed_transactions_today',
    'total_gmv_today'
  ],

  QUALITY: [
    'user_satisfaction_score',
    'dispute_rate',
    'seller_response_time',
    'platform_trust_score'
  ]
};

export default {
  ANALYTICS_EVENTS,
  CUSTOM_DIMENSIONS,
  ECOMMERCE_CONFIG,
  REVIEW_METRICS,
  ANALYTICS_GOALS,
  AUDIENCE_SEGMENTS,
  ATTRIBUTION_CONFIG,
  DASHBOARD_METRICS
};