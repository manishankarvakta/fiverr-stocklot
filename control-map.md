# 🗺️ StockLot Control Coverage Map
Generated: 2025-09-09T16:30:28.802Z

## 📊 Coverage Summary
| Metric | Current | Planned | Target |
|--------|---------|---------|--------|
| Total Endpoints | 371 | 371 | - |
| UI Consumers | 54 | 49 | 334 |
| Coverage % | 15% | 13% | 90% |
| Meets Target | ❌ | ❌ | - |

## 🎯 Epic Analysis
### ADMIN_ANALYTICS_UI
**Goal**: Expose all admin analytics endpoints in dashboards with charts and export
**Routes**: 4 planned
**Endpoints**: 4/6 available (67%)
**Missing Endpoints**:
- GET /api/admin/reports/revenue
- POST /api/admin/reports/export

### ADVANCED_MODERATION_UI
**Goal**: Granular moderation for users, listings, buy-requests, reviews, role approvals
**Routes**: 5 planned
**Endpoints**: 7/7 available (100%)

### SELLER_GROWTH_TOOLS
**Goal**: Seller performance, bulk inventory, promotions, offers
**Routes**: 4 planned
**Endpoints**: 2/6 available (33%)
**Missing Endpoints**:
- GET /api/seller/analytics/performance
- POST /api/seller/inventory/bulk-update
- GET /api/seller/promotion/campaigns
- POST /api/seller/promotion/campaigns

### AB_TESTING_UI
**Goal**: Enable A/B tests on PDP and track events
**Routes**: 2 planned
**Endpoints**: 5/5 available (100%)

### BUYER_PERSONALIZATION
**Goal**: Recommendations, wishlist, price alerts, advanced search
**Routes**: 2 planned
**Endpoints**: 0/6 available (0%)
**Missing Endpoints**:
- GET /api/buyer/recommendations/similar
- GET /api/buyer/wishlist
- POST /api/buyer/wishlist
- DELETE /api/buyer/wishlist/{id}
- POST /api/buyer/price-alerts
- GET /api/buyer/search/advanced

## 🧩 Components to Scaffold
| Epic | Component | Route | Status |
|------|-----------|-------|--------|
| ADMIN_ANALYTICS_UI | AdminAnalyticsOverview | /admin/analytics/overview | TO_BE_SCAFFOLDED |
| ADMIN_ANALYTICS_UI | AdminAnalyticsPDP | /admin/analytics/pdp | TO_BE_SCAFFOLDED |
| ADMIN_ANALYTICS_UI | AdminSellerPerformance | /admin/analytics/sellers/:id | TO_BE_SCAFFOLDED |
| ADMIN_ANALYTICS_UI | AdminRevenueReport | /admin/reports/revenue | TO_BE_SCAFFOLDED |
| ADVANCED_MODERATION_UI | UserModeration | /admin/moderation/users | TO_BE_SCAFFOLDED |
| ADVANCED_MODERATION_UI | ListingsModeration | /admin/moderation/listings | TO_BE_SCAFFOLDED |
| ADVANCED_MODERATION_UI | BuyRequestModeration | /admin/moderation/buy-requests | TO_BE_SCAFFOLDED |
| ADVANCED_MODERATION_UI | ReviewModeration | /admin/moderation/reviews | TO_BE_SCAFFOLDED |
| ADVANCED_MODERATION_UI | RolesQueue | /admin/moderation/roles | TO_BE_SCAFFOLDED |
| SELLER_GROWTH_TOOLS | SellerAnalytics | /seller/analytics | TO_BE_SCAFFOLDED |
| SELLER_GROWTH_TOOLS | InventoryBulkUpdate | /seller/inventory/bulk | TO_BE_SCAFFOLDED |
| SELLER_GROWTH_TOOLS | SellerCampaigns | /seller/promotions | TO_BE_SCAFFOLDED |
| SELLER_GROWTH_TOOLS | SellerOffers | /seller/offers | TO_BE_SCAFFOLDED |
| AB_TESTING_UI | AdminExperiments | /admin/experiments | TO_BE_SCAFFOLDED |
| AB_TESTING_UI | AdminExperimentResults | /admin/experiments/:id | TO_BE_SCAFFOLDED |
| BUYER_PERSONALIZATION | Wishlist | /buyer/wishlist | TO_BE_SCAFFOLDED |
| BUYER_PERSONALIZATION | PriceAlerts | /alerts/prices | TO_BE_SCAFFOLDED |

## 🧪 Tests to Create
- **ADMIN_ANALYTICS_UI**: e2e_admin_analytics_overview.spec.ts
- **ADVANCED_MODERATION_UI**: e2e_admin_moderation_actions.spec.ts
- **SELLER_GROWTH_TOOLS**: e2e_seller_growth.spec.ts
- **AB_TESTING_UI**: e2e_admin_abtests.spec.ts
- **BUYER_PERSONALIZATION**: e2e_buyer_personalization.spec.ts

## 📡 SSE Coverage
**Topics in Epics**: flags.updated, fees.updated, inbox.new_message, role.upgrade.approved, role.upgrade.rejected, orders.updated
**Currently Used**: focus
**To Wire**: flags.updated, fees.updated, inbox.new_message, role.upgrade.approved, role.upgrade.rejected, orders.updated
