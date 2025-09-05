# 🎯 Google Analytics 4 Dashboard Configuration Guide

## Step 1: Access Google Analytics 4

1. Go to [Google Analytics](https://analytics.google.com)
2. Select your property with ID: `G-1CB5KGJKK4`
3. Navigate to **Reports** → **Library**

## Step 2: Create Custom Reports

### 2.1 Review System Performance Report

1. Click **"Create new report"** → **"Custom report"**
2. Name: **"Review System Performance"**
3. Configure dimensions:
   ```
   - Event name
   - Custom parameter: review_direction
   - Custom parameter: review_rating
   - User type
   - Device category
   ```
4. Configure metrics:
   ```
   - Event count
   - Total users
   - Conversions
   - Conversion rate
   - Event value
   ```
5. Add filter: `Event name contains "review"`
6. Save report

### 2.2 Livestock Marketplace Funnel Report

1. Create new custom report
2. Name: **"Livestock Marketplace Funnel"**
3. Dimensions:
   ```
   - Event name
   - Custom parameter: livestock_category
   - Custom parameter: price_range
   - Country
   - Region
   ```
4. Metrics:
   ```
   - Event count
   - Total users
   - New users
   - Sessions
   - Conversions
   - Total revenue
   ```
5. Filter: `Event name in list: livestock_search, listing_viewed, offer_made, purchase`

### 2.3 Geographic Performance Report

1. Create new custom report
2. Name: **"South African Geographic Performance"**
3. Dimensions:
   ```
   - Region
   - City
   - Custom parameter: location_province
   - Custom parameter: livestock_category
   ```
4. Metrics: `Total users, Sessions, Conversions, Total revenue`
5. Filter: `Country exactly matches "South Africa"`

## Step 3: Set Up Conversion Goals

### 3.1 Navigate to Conversions

1. Go to **Configure** → **Events**
2. Click **"Create event"** for each conversion

### 3.2 Create Conversion Events

#### Review Submission Conversion
```yaml
Event Name: review_created
Mark as conversion: Yes
Value: 5 ZAR
Conditions:
  - review_rating >= 1
```

#### User Registration Conversion
```yaml
Event Name: sign_up  
Mark as conversion: Yes
Value: 25 ZAR
Conditions:
  - registration_method is not null
```

#### Purchase Conversion
```yaml
Event Name: purchase
Mark as conversion: Yes
Value: Dynamic (from event)
Conditions:
  - value > 0
```

#### High Value Purchase
```yaml
Event Name: purchase
Mark as conversion: Yes
Value: Dynamic (from event)
Conditions:
  - value > 10000
```

#### KYC Completion
```yaml
Event Name: kyc_completed
Mark as conversion: Yes
Value: 15 ZAR
Conditions:
  - kyc_level >= 2
```

## Step 4: Configure Custom Dimensions

### 4.1 Navigate to Custom Definitions

1. Go to **Configure** → **Custom definitions**
2. Click **"Create custom dimension"**

### 4.2 Create Each Custom Dimension

| Parameter Name | Display Name | Description | Scope |
|---------------|--------------|-------------|-------|
| user_type | User Type | Buyer, Seller, or Both | USER |
| kyc_level | KYC Level | User verification level (0-3) | USER |
| livestock_category | Livestock Category | Type of livestock | EVENT |
| review_direction | Review Direction | BUYER_ON_SELLER or SELLER_ON_BUYER | EVENT |
| review_rating | Review Rating | Star rating (1-5) | EVENT |
| seller_rating | Seller Rating | Average seller rating | EVENT |
| location_province | South African Province | Province where user is located | USER |
| registration_method | Registration Method | How user registered | USER |

## Step 5: Create Audiences

### 5.1 Navigate to Audiences

1. Go to **Configure** → **Audiences**
2. Click **"Create audience"**

### 5.2 Create Key Audiences

#### High Value Buyers
```yaml
Name: High Value Buyers
Conditions:
  - Total revenue > 50,000 ZAR (lifetime)
  - Purchase event count >= 3
Duration: 540 days
```

#### Active Reviewers
```yaml
Name: Active Reviewers  
Conditions:
  - review_created event count >= 5
Duration: 540 days
```

#### Top Sellers
```yaml
Name: Top Sellers
Conditions:
  - seller_rating >= 4.5
  - Linked to purchase events >= 10
Duration: 540 days
```

#### At Risk Users
```yaml
Name: At Risk Users
Conditions:
  - Days since last session > 30
  - Purchase event count >= 1
Duration: 540 days
```

## Step 6: Set Up Enhanced Ecommerce

### 6.1 Enable Enhanced Ecommerce

1. Go to **Configure** → **Data streams**
2. Select your web data stream
3. Click **"Enhanced measurement"**
4. Enable **"Purchases"** and **"File downloads"**

### 6.2 Configure Item Categories

In your ecommerce tracking, use these standardized categories:
```javascript
item_category: "Cattle" | "Sheep" | "Goats" | "Pigs" | "Poultry" | "Other"
```

## Step 7: Set Up Alerts

### 7.1 Navigate to Intelligence

1. Go to **Configure** → **Custom insights**
2. Click **"Create custom insight"**

### 7.2 Create Key Alerts

#### Conversion Rate Drop Alert
```yaml
Name: Review Conversion Rate Drop
Condition: Conversion rate decreases by > 20%
Period: Week over week
Notification: Email
```

#### Revenue Anomaly Alert
```yaml
Name: Revenue Anomaly
Condition: Revenue changes by > 30%
Period: Day over day
Notification: Email + Slack
```

#### High Error Rate Alert
```yaml
Name: High Error Rate
Condition: exception event count > 100/day
Period: Daily
Notification: Email
```

## Step 8: Create Exploration Reports

### 8.1 Review System Funnel Analysis

1. Go to **Explore** → **Funnel exploration**
2. Name: **"Review Creation Funnel"**
3. Steps:
   ```
   Step 1: purchase (Order completed)
   Step 2: review_modal_opened
   Step 3: review_form_started  
   Step 4: review_created
   Step 5: review_moderation (approved)
   ```
4. Dimensions: `User type`, `Device category`
5. Save exploration

### 8.2 User Journey Path Analysis

1. Go to **Explore** → **Path exploration**
2. Name: **"Livestock Purchase Journey"**
3. Starting point: `livestock_search`
4. Dimensions: `Event name`, `Livestock category`
5. Save exploration

## Step 9: Dashboard Customization

### 9.1 Create Custom Dashboard

1. Go to **Reports** → **Overview**
2. Click **"Customize report"**
3. Add cards for:
   ```
   - Review Submissions (today)
   - Average Review Rating
   - New User Registrations
   - Total Revenue
   - Top Livestock Categories
   - Geographic Distribution
   ```

### 9.2 Set Up Real-time Monitoring

1. Go to **Reports** → **Realtime**
2. Customize to show:
   ```
   - Active users by user type
   - Current conversions
   - Top events (reviews, purchases)
   - Geographic activity
   ```

## Step 10: Data Retention & Privacy

### 10.1 Configure Data Retention

1. Go to **Configure** → **Data settings** → **Data retention**
2. Set to: **26 months**
3. Enable **"Reset user data on new activity"**

### 10.2 Privacy Settings

1. Enable **"Google signals"** for demographics
2. Configure **"Data deletion requests"**
3. Set up **"Consent mode"** for GDPR/POPIA compliance

## Step 11: Verification & Testing

### 11.1 Real-time Testing

1. Go to **Reports** → **Realtime**
2. Visit your website and perform test actions:
   - Create a test review
   - Browse livestock listings
   - Simulate a purchase (test mode)
3. Verify events appear in real-time report

### 11.2 DebugView Testing

1. Go to **Configure** → **DebugView**
2. Add your test device
3. Perform test actions and verify event parameters

## 🎯 Quick Setup Checklist

- [ ] Custom reports created (5 reports)
- [ ] Conversion goals configured (6 conversions)
- [ ] Custom dimensions added (8 dimensions)
- [ ] Audiences created (4 key audiences)  
- [ ] Enhanced ecommerce enabled
- [ ] Alerts configured (3 critical alerts)
- [ ] Exploration reports built (2 funnels)
- [ ] Dashboard customized
- [ ] Data retention configured
- [ ] Privacy settings enabled
- [ ] Real-time testing completed

## 📊 Expected Timeline

- **Setup**: 2-3 hours
- **Testing**: 1 hour  
- **Data collection**: 24-48 hours for meaningful data
- **Full insights**: 1-2 weeks for trend analysis

Your GA4 setup will provide comprehensive insights into the livestock marketplace performance and the new Reviews & Ratings System! 🚀