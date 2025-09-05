# 📊 Analytics Setup Guide - StockLot Livestock Marketplace

## Overview

This guide covers the comprehensive analytics implementation for StockLot, with special focus on tracking the new **Reviews & Ratings System** and overall marketplace performance.

## 🔧 Configuration

### Google Analytics 4 (GA4) Setup

Your GA4 tracking code has been integrated into the application:

**Tracking ID**: `G-1CB5KGJKK4`

The tracking code is automatically loaded in `/app/frontend/public/index.html` and will track:
- Page views across all routes
- User interactions with review components
- Marketplace search and browsing behavior
- Transaction completions and conversions

## 📈 Key Metrics Being Tracked

### Review System Analytics

1. **Review Creation Funnel**
   - Order completion → Review prompt shown → Modal opened → Form completed → Review submitted
   - Conversion rate at each step
   - Drop-off analysis by user type

2. **Review Quality Metrics**
   - Average review length
   - Percentage of reviews with photos
   - Review sentiment analysis
   - Moderation approval rates

3. **Seller Engagement**
   - Reply rates to customer reviews
   - Time to respond to reviews
   - Rating improvement over time

### Marketplace Performance

1. **User Journey Tracking**
   - Search → Browse → View listing → Contact seller → Complete purchase
   - Conversion rates by livestock category
   - User behavior flow analysis

2. **Transaction Analytics**
   - Enhanced ecommerce tracking with item-level data
   - GMV (Gross Merchandise Value) tracking
   - Average order value by user segment

3. **Trust & Safety Metrics**
   - Dispute rates
   - User verification completion rates
   - Platform trust score evolution

## 🎯 Custom Events Implementation

### Review System Events

```javascript
// Track review creation
analytics.trackReviewCreated({
  direction: 'BUYER_ON_SELLER',
  rating: 5,
  has_photos: true,
  has_tags: true,
  body_length: 250
});

// Track rating badge clicks
analytics.trackRatingBadgeClick(sellerId, rating, 'listing_card');

// Track review replies
analytics.trackReviewReply(reviewId, replyLength);
```

### Marketplace Events

```javascript
// Track livestock searches
analytics.trackLivestockSearch(query, filters, resultsCount);

// Track listing views
analytics.trackListingView(listingId, 'cattle', sellerId);

// Track completed orders
analytics.trackOrderCompleted({
  order_id: 'order_123',
  total_amount: 25000,
  items: [/* order items */]
});
```

## 📊 Google Analytics Dashboard Setup

### Recommended Custom Reports

1. **Review System Performance**
   - Primary Dimension: `Event Name`
   - Filter: `Event Name` contains `review`
   - Metrics: Event Count, Conversion Rate, Revenue

2. **Livestock Category Performance**
   - Primary Dimension: `Livestock Category`
   - Secondary Dimension: `User Type`
   - Metrics: Users, Sessions, Conversions, Revenue

3. **Geographic Performance**
   - Primary Dimension: `Region` (South African provinces)
   - Metrics: Users, Revenue, Conversion Rate
   - Segments: Buyers vs Sellers

### Enhanced Ecommerce Setup

Enable Enhanced Ecommerce in GA4 and configure:

1. **Item Categories**: Cattle, Sheep, Goats, Pigs, Poultry, Other
2. **Custom Dimensions**:
   - User Type (Buyer/Seller/Both)
   - KYC Level (0-3)
   - Registration Method
   - Livestock Specialty

3. **Conversion Goals**:
   - Review Submission (Micro-conversion: ZAR 5 value)
   - User Registration (ZAR 25 value)
   - Order Completion (Dynamic value based on order)

## 🔍 Key Performance Indicators (KPIs)

### Review System KPIs

| Metric | Target | Current Status |
|--------|--------|----------------|
| Review Conversion Rate | >15% | Track after launch |
| Average Review Rating | >4.2 | Track after launch |
| Seller Reply Rate | >70% | Track after launch |
| Review Approval Rate | >90% | Track after launch |

### Marketplace KPIs

| Metric | Target | Current Status |
|--------|--------|----------------|
| User Registration Rate | >5% | Track with GA4 |
| Listing to Inquiry Rate | >8% | Track with GA4 |
| Inquiry to Sale Rate | >25% | Track with GA4 |
| Monthly GMV Growth | >20% | Track with GA4 |

## 🎨 PostHog Integration

The app also includes PostHog for detailed user behavior analysis:

**Project Key**: `phc_yJW1VjHGGwmCbbrtczfqqNxgBDbhlhOWcdzcIJEOTFE`

PostHog provides:
- Heatmaps and session recordings
- Feature flag management
- Advanced cohort analysis
- Real-time event tracking

## 🚀 Implementation Status

### ✅ Completed

1. **Analytics Service** (`/src/services/analytics.js`)
   - Unified tracking for GA4 and PostHog
   - Review system specific events
   - Error and performance tracking

2. **React Hooks** (`/src/hooks/useAnalytics.js`)
   - Easy integration in React components
   - Automatic page view tracking
   - Specialized hooks for different features

3. **Review Components Integration**
   - All review components include analytics tracking
   - Funnel analysis for review creation process
   - Interaction tracking for rating badges

4. **Event Configuration** (`/src/config/analytics-events.js`)
   - Centralized event definitions
   - Custom dimensions and metrics
   - Goal configuration templates

### 🔄 Next Steps

1. **Set up Google Analytics 4 Dashboard**
   - Import custom reports
   - Configure conversion goals
   - Set up automated insights

2. **Create Data Studio Dashboards**
   - Executive summary dashboard
   - Review system performance dashboard
   - Marketplace health dashboard

3. **Implement Advanced Segmentation**
   - High-value buyer identification
   - At-risk user segments
   - Top-performing seller analysis

## 📱 Mobile App Analytics (Future)

When you expand to mobile apps, the same analytics service can be extended:

```javascript
// React Native integration
import analytics from '../services/analytics';

// Track mobile-specific events
analytics.trackEvent('mobile_app_opened', {
  platform: 'ios', // or 'android'
  version: '1.0.0'
});
```

## 🔐 Privacy & Compliance

### GDPR/POPIA Compliance

1. **Cookie Consent**: Implement cookie consent banner
2. **Data Retention**: Configure data retention policies in GA4
3. **User Rights**: Provide data export/deletion capabilities

### Data Privacy Configuration

```javascript
// GDPR-compliant initialization
gtag('config', 'G-1CB5KGJKK4', {
  anonymize_ip: true,
  cookie_expires: 63072000, // 2 years
  cookie_update: true,
  cookie_flags: 'SameSite=Strict;Secure'
});
```

## 📞 Support & Monitoring

### Automated Alerts

Set up alerts in Google Analytics for:
- Sudden drop in conversion rates
- High error rates
- Traffic anomalies
- Revenue fluctuations

### Regular Reviews

Schedule monthly analytics reviews to:
- Analyze review system performance
- Identify optimization opportunities
- Update tracking implementation
- Review KPI progress

## 🎯 Success Measurement

### Review System Success Metrics

- **Trust Increase**: Measured by seller rating improvements
- **Buyer Confidence**: Tracked through repeat purchase rates
- **Platform Quality**: Monitored via dispute reduction
- **User Engagement**: Analyzed through session duration increases

### ROI Calculation

```
Review System ROI = (Increased GMV - Implementation Cost) / Implementation Cost

Where:
- Increased GMV = Revenue attributed to improved trust from reviews
- Implementation Cost = Development + maintenance costs
```

---

## Quick Start Checklist

- [x] Google Analytics tracking code added
- [x] Analytics service implemented
- [x] Review components instrumented
- [x] Error tracking enabled
- [ ] GA4 dashboard configured
- [ ] Conversion goals set up
- [ ] Data Studio dashboards created
- [ ] Privacy compliance implemented

The analytics system is now ready to provide comprehensive insights into your livestock marketplace performance, with special focus on the new Reviews & Ratings System! 🎉