# 📡 StockLot Communication Coverage Report
Generated: 2025-09-09T16:30:20.630Z
Backend Source: introspection_api

## 📊 Summary
| Metric | Backend | Frontend | Status |
|--------|---------|----------|--------|
| API Endpoints | 371 | 54 | ✅ |
| SSE Topics | 31 | 1 | ✅ |
| Missing in Backend | - | 0 | ✅ |
| Unused in Frontend | 305 | - | ℹ️ |

## ℹ️ Unused Backend Endpoints
_Backend implements these but frontend doesn't use them:_

- `/api/__introspection/communication-summary`
- `/api/__introspection/endpoints`
- `/api/__introspection/refresh-inventory`
- `/api/__introspection/sse-topics`
- `/api/ab-test/pdp-config/{listing_id}`
- `/api/ab-test/track-event`
- `/api/admin/ab-tests`
- `/api/admin/ab-tests`
- `/api/admin/ab-tests/{experiment_id}/results`
- `/api/admin/abattoirs`
- _... and 295 more_

## 🧩 Component Coverage
| Component | Coverage | APIs | Missing |
|-----------|----------|------|---------|
| InlineCartPage | ✅ 100% | 13 | 0 |
| API | ✅ 100% | 13 | 0 |
| Header | ✅ 100% | 13 | 0 |
| Footer | ✅ 100% | 13 | 0 |
| Homepage | ✅ 100% | 13 | 0 |
| Login | ✅ 100% | 13 | 0 |
| Register | ✅ 100% | 13 | 0 |
| AdminDashboardRoute | ✅ 100% | 13 | 0 |
| UserOrders | ✅ 100% | 13 | 0 |
| SellerOrders | ✅ 100% | 13 | 0 |
| Dashboard | ✅ 100% | 13 | 0 |
| SellerDashboard | ✅ 100% | 13 | 0 |
| Marketplace | ✅ 100% | 13 | 0 |
| BiddingModal | ✅ 100% | 13 | 0 |
| OrderModal | ✅ 100% | 13 | 0 |
| ListingCard | ✅ 100% | 13 | 0 |
| CreateListing | ✅ 100% | 13 | 0 |
| HowItWorks | ✅ 100% | 13 | 0 |
| AboutUs | ✅ 100% | 13 | 0 |
| Pricing | ✅ 100% | 13 | 0 |
| Blog | ✅ 100% | 13 | 0 |
| Contact | ✅ 100% | 13 | 0 |
| BuyRequestsPage | ✅ 100% | 13 | 0 |
| CreateBuyRequestPage | ✅ 100% | 13 | 0 |
| App | ✅ 100% | 13 | 0 |
| ProfilePage | ✅ 100% | 13 | 0 |
| ProfileCompletionIndicator | ✅ 100% | 13 | 0 |
| PaymentMethodsPage | ✅ 100% | 13 | 0 |
| AddressesPage | ✅ 100% | 13 | 0 |
| RequestDetailModal | ✅ 100% | 13 | 0 |
| SendOfferModal | ✅ 100% | 13 | 0 |
| LoginDialog | ✅ 100% | 13 | 0 |
| ViewOffersModal | ✅ 100% | 13 | 0 |
| BuyerOffersInbox | ✅ 100% | 13 | 0 |
| UnifiedInbox | ✅ 100% | 13 | 0 |
| ExoticsPage | ✅ 100% | 13 | 0 |
| ExoticsLanding | ✅ 100% | 1 | 0 |
| AuthContext | ✅ 100% | 3 | 0 |
| AuthProvider | ✅ 100% | 3 | 0 |
| AuthGate | ✅ 100% | 3 | 0 |
| ContextSwitcher | ✅ 100% | 2 | 0 |
| SellerReviewsSection | ✅ 100% | 3 | 0 |
| PostOrderReviewPrompt | ✅ 100% | 2 | 0 |
| OrganizationMembers | ✅ 100% | 1 | 0 |
| OrganizationDashboard | ✅ 100% | 1 | 0 |
| ROLES | ✅ 100% | 1 | 0 |
| InviteMemberForm | ✅ 100% | 1 | 0 |
| CreateOrganizationForm | ✅ 100% | 1 | 0 |
| ListingCategoryStep | ✅ 100% | 2 | 0 |
| SellerPayoutDashboard | ✅ 100% | 2 | 0 |
| FeeBreakdownDisplay | ✅ 100% | 1 | 0 |
| CheckoutFeePreview | ✅ 100% | 1 | 0 |
| AdminFeeConfiguration | ✅ 100% | 2 | 0 |
| OrganizationDashboardCard | ✅ 100% | 3 | 0 |
| GuestCheckout | ✅ 100% | 2 | 0 |
| CategoryList | ✅ 100% | 1 | 0 |
| EnhancedCreateBuyRequestForm | ✅ 100% | 1 | 0 |
| EnhancedRegister | ✅ 100% | 3 | 0 |
| OrganizationManagement | ✅ 100% | 4 | 0 |
| ComprehensiveAdminControls | ✅ 100% | 10 | 0 |
| UserManagementTab | ✅ 100% | 10 | 0 |
| ListingManagementTab | ✅ 100% | 10 | 0 |
| AdminRoleManagement | ✅ 100% | 3 | 0 |
| AdminDashboard | ✅ 100% | 1 | 0 |

## 🎯 Recommendations
### 🟡 Unused Backend Endpoints
305 backend endpoints have no frontend consumers
**Action:** Consider deprecating unused endpoints or add frontend integration
- /api/__introspection/communication-summary
- /api/__introspection/endpoints
- /api/__introspection/refresh-inventory
- /api/__introspection/sse-topics
- /api/ab-test/pdp-config/{listing_id}
- /api/ab-test/track-event
- /api/admin/ab-tests
- /api/admin/ab-tests
- /api/admin/ab-tests/{experiment_id}/results
- /api/admin/abattoirs
