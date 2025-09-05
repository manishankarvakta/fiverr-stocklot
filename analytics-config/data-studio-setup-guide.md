# 📊 Google Data Studio Dashboard Setup Guide

## Overview

This guide will help you create comprehensive Data Studio dashboards to visualize your StockLot marketplace analytics, with special focus on the Reviews & Ratings System performance.

## Step 1: Access Google Data Studio

1. Go to [Google Data Studio](https://datastudio.google.com)
2. Sign in with the same Google account used for Analytics
3. Click **"Create"** → **"Data source"**

## Step 2: Connect Google Analytics 4

### 2.1 Add GA4 Data Source

1. Select **"Google Analytics"** connector
2. Choose **"GA4 Properties"**
3. Select your account and property: `G-1CB5KGJKK4`
4. Name the data source: **"StockLot GA4 Data"**
5. Click **"Connect"**

### 2.2 Configure Data Source Fields

Add these calculated fields in your data source:

```sql
-- Review Conversion Rate
Review Conversion Rate = 
COUNT(CASE WHEN Event Name = 'review_created' THEN Event Name END) / 
COUNT(CASE WHEN Event Name = 'purchase' THEN Event Name END) * 100

-- Seller Reply Rate
Seller Reply Rate = 
COUNT(CASE WHEN Event Name = 'review_reply_created' THEN Event Name END) / 
COUNT(CASE WHEN Event Name = 'review_created' AND Custom parameter (review_direction) = 'BUYER_ON_SELLER' THEN Event Name END) * 100

-- Average Review Rating
Average Review Rating = 
AVG(CASE WHEN Event Name = 'review_created' THEN CAST(Custom parameter (review_rating) AS NUMERIC) END)

-- Platform Trust Score
Platform Trust Score = 
AVG(CASE WHEN Event Name = 'review_created' AND Custom parameter (review_direction) = 'BUYER_ON_SELLER' THEN CAST(Custom parameter (review_rating) AS NUMERIC) END)

-- Revenue per User
Revenue per User = 
SUM(Total Revenue) / COUNT(DISTINCT User Pseudo ID)

-- Reviews with Photos Rate
Reviews with Photos Rate = 
COUNT(CASE WHEN Event Name = 'review_created' AND Custom parameter (has_photos) = 'true' THEN Event Name END) / 
COUNT(CASE WHEN Event Name = 'review_created' THEN Event Name END) * 100
```

## Step 3: Create Executive Summary Dashboard

### 3.1 Create New Report

1. Click **"Create"** → **"Report"**
2. Select your **"StockLot GA4 Data"** source
3. Name the report: **"StockLot Executive Summary"**

### 3.2 Add Key Performance Scorecards

Create these scorecards in the top row:

#### Total Users (30 days)
- **Chart type**: Scorecard
- **Metric**: Total Users
- **Date range**: Last 30 days
- **Comparison**: Previous period
- **Style**: Large font, green color

#### Total Revenue (30 days)
- **Chart type**: Scorecard  
- **Metric**: Total Revenue
- **Format**: Currency (ZAR)
- **Date range**: Last 30 days
- **Comparison**: Previous period

#### Conversion Rate
- **Chart type**: Scorecard
- **Metric**: Conversion Rate
- **Format**: Percentage
- **Date range**: Last 30 days
- **Comparison**: Previous period

#### Active Sellers
- **Chart type**: Scorecard
- **Metric**: Total Users
- **Filter**: Custom parameter (user_type) = "seller"
- **Date range**: Last 30 days

### 3.3 Add Trend Visualizations

#### Daily Revenue Trend
- **Chart type**: Time series
- **Metric**: Total Revenue
- **Dimension**: Date
- **Date range**: Last 30 days
- **Style**: Smooth line, green color

#### Revenue by Livestock Category
- **Chart type**: Bar chart
- **Metric**: Total Revenue
- **Dimension**: Custom parameter (livestock_category)
- **Sort**: Descending
- **Max rows**: 10

#### Geographic Distribution
- **Chart type**: Geo map
- **Metric**: Total Users
- **Dimension**: Region
- **Filter**: Country = "South Africa"
- **Color**: Heat map style

## Step 4: Create Reviews & Ratings Dashboard

### 4.1 Create New Report

1. Create new report: **"Reviews & Ratings Performance"**
2. Connect to the same data source

### 4.2 Review Overview Page

#### Review Metrics Scorecards
```
┌─────────────────┬─────────────────┬─────────────────┬─────────────────┐
│ Total Reviews   │ Avg Rating      │ Conversion Rate │ Seller Reply    │
│ (30 days)       │                 │                 │ Rate            │
│ Event Count     │ Avg Review      │ Calculated      │ Calculated      │
│ filter: review_ │ Rating          │ Field           │ Field           │
│ created         │                 │                 │                 │
└─────────────────┴─────────────────┴─────────────────┴─────────────────┘
```

#### Review Funnel Visualization
- **Chart type**: Funnel
- **Steps**:
  1. Orders Completed (purchase event)
  2. Review Modal Opened (review_modal_opened)
  3. Review Form Started (review_form_started)  
  4. Review Submitted (review_created)
- **Dimension**: Custom parameter (user_type)

#### Rating Distribution
- **Chart type**: Column chart
- **Metric**: Event Count
- **Dimension**: Custom parameter (review_rating)
- **Filter**: Event Name = "review_created"
- **Sort**: Dimension ascending

### 4.3 Add Interactive Filters

#### Date Range Filter
- **Type**: Date range control
- **Default**: Last 30 days
- **Position**: Top of dashboard

#### Review Direction Filter
- **Type**: Drop-down list
- **Dimension**: Custom parameter (review_direction)
- **Options**: All, BUYER_ON_SELLER, SELLER_ON_BUYER
- **Default**: All

#### Livestock Category Filter
- **Type**: Drop-down list
- **Dimension**: Custom parameter (livestock_category)
- **Include**: All categories from your data

## Step 5: Create Seller Performance Dashboard

### 5.1 Seller Engagement Table

- **Chart type**: Table
- **Dimensions**: 
  - Custom parameter (seller_id)
  - Custom parameter (seller_name)
- **Metrics**:
  - Event Count (review_created events)
  - Average Review Rating (calculated field)
  - Seller Reply Rate (calculated field)
  - Total Revenue
- **Sort**: Average Review Rating (descending)
- **Max rows**: 50

### 5.2 Seller Performance Scatter Plot

- **Chart type**: Scatter plot
- **X-axis**: Seller Reply Rate
- **Y-axis**: Average Review Rating
- **Size**: Event Count (reviews received)
- **Color**: Total Revenue

## Step 6: Advanced Analytics Page

### 6.1 Review Quality Analysis

#### Review Length Distribution
- **Chart type**: Histogram
- **Metric**: Custom parameter (review_length)
- **Bins**: 20
- **Filter**: Event Name = "review_created"

#### Reviews with Photos Trend
- **Chart type**: Time series
- **Metric**: Reviews with Photos Rate (calculated field)
- **Dimension**: Date
- **Date range**: Last 90 days

### 6.2 Platform Health Metrics

#### Trust Score Gauge
- **Chart type**: Gauge
- **Metric**: Platform Trust Score (calculated field)
- **Min**: 0, **Max**: 5
- **Target**: 4.5
- **Color ranges**: 
  - Red: 0-3.0
  - Yellow: 3.0-4.0  
  - Green: 4.0-5.0

## Step 7: Set Up Automated Reporting

### 7.1 Schedule Email Reports

1. Click **"Share"** → **"Schedule email delivery"**
2. **Recipients**: Add stakeholder emails
3. **Frequency**: Weekly (Mondays)
4. **Format**: PDF attachment + link
5. **Subject**: "StockLot Weekly Performance Report"

### 7.2 Create Alerts

1. In each chart, click **"..."** → **"Alert"**
2. Set up alerts for:
   - Review conversion rate drops below 10%
   - Average rating drops below 4.0
   - Revenue decrease > 20% week-over-week

## Step 8: Mobile Optimization

### 8.1 Mobile Layout

1. Click **"View"** → **"Mobile layout"**
2. Reorganize components for mobile viewing:
   - Stack scorecards vertically
   - Simplify table columns
   - Adjust chart sizes

### 8.2 Mobile-Specific Charts

- Use simpler visualizations for mobile
- Prioritize key metrics
- Reduce data density

## Step 9: Sharing & Permissions

### 9.1 Set Sharing Permissions

1. Click **"Share"** button
2. Set permissions:
   - **Executives**: Viewer access
   - **Marketing team**: Viewer access
   - **Data analysts**: Editor access
   - **Developers**: Editor access

### 9.2 Create Public Links

For stakeholder sharing:
- Click **"Share"** → **"Get shareable link"**
- Set to **"Anyone with the link can view"**
- Copy link for distribution

## Step 10: Dashboard Maintenance

### 10.1 Regular Updates

- **Weekly**: Check data freshness and accuracy
- **Monthly**: Review and update calculated fields
- **Quarterly**: Add new metrics and visualizations

### 10.2 Performance Optimization

- Use data source filters to improve loading speed
- Limit date ranges where appropriate
- Consider data blending for complex calculations

## 🎯 Dashboard Templates

### Template 1: Executive Summary
**URL Structure**: `/executive-summary`
- High-level KPIs
- Trend analysis
- Geographic performance
- Revenue metrics

### Template 2: Reviews Performance
**URL Structure**: `/reviews-performance`
- Review funnel analysis
- Rating distributions
- Seller engagement metrics
- Quality indicators

### Template 3: Marketplace Health
**URL Structure**: `/marketplace-health`
- Trust and safety metrics
- User behavior analysis
- Platform quality scores
- Operational KPIs

## 📱 Mobile Dashboard

Create a simplified mobile version with:
- Key scorecards only
- Single-metric charts
- Simplified tables
- Touch-friendly navigation

## 🔔 Alerts Setup

Configure these critical alerts:

| Alert | Condition | Frequency | Recipients |
|-------|-----------|-----------|------------|
| Review Rate Drop | < 10% conversion | Daily | Product team |
| Rating Decline | < 4.0 average | Daily | Customer success |
| Revenue Alert | 20% decrease | Daily | Leadership |
| Error Spike | 500+ errors/day | Hourly | Engineering |

## 📊 Success Metrics

Track these dashboard adoption metrics:
- **Daily active viewers**: Target > 10
- **Report engagement**: Target > 70% open rate
- **Data-driven decisions**: Track impact on business KPIs
- **User feedback**: Regular surveys on dashboard usefulness

Your Data Studio dashboards will provide comprehensive insights into the marketplace performance and the success of your Reviews & Ratings System! 🚀

## Quick Access Links

After setup, bookmark these dashboard URLs:
- Executive Summary: `[your-data-studio-url]/executive`
- Reviews Performance: `[your-data-studio-url]/reviews`
- Seller Analytics: `[your-data-studio-url]/sellers`
- Marketplace Health: `[your-data-studio-url]/health`