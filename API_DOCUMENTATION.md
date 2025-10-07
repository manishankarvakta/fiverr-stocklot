# StockLot API Documentation

## Overview
StockLot is a South African Livestock & Meat Marketplace with Escrow Payments. This document provides a comprehensive list of all API endpoints organized by functionality and user access levels.
#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 as well as facebook and 
#pcsk_5emnYA_AtFrs3Wb4Xc8hnzuYEGtKp3ER5YcsnqLSF4bUeT2CosQcAJG2CJXJ9kMKfnB4T9

## User Types & Roles

### Primary User Roles
1. **BUYER** - Users who purchase livestock and meat products
2. **SELLER** - Users who sell livestock and meat products  
3. **ADMIN** - Platform administrators with full access

### Extended User Roles (Inbox System)
1. **TRANSPORTER** - Users who provide transportation services
2. **ABATTOIR** - Users who provide slaughterhouse services
3. **EXPORTER** - Users who export products


### Admin Sub-Roles
1. **SUPER_ADMIN** - Full platform control
2. **ADMIN** - General administrative access
3. **MODERATOR** - Content and user moderation
4. **SUPPORT** - Customer support access
5. **VIEWER** - Read-only administrative access

### Organization Roles
1. **OWNER** - Organization owner
2. **ADMIN** - Organization administrator
3. **MANAGER** - Organization manager
4. **STAFF** - Organization staff member
5. **VIEWER** - Organization viewer

---

## API Endpoints by Category

### 1. AUTHENTICATION & USER MANAGEMENT

#### Public Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/social` | Social authentication (Google/Facebook) | Public |
| POST | `/api/auth/forgot-password` | Request password reset | Public |
| GET | `/api/auth/reset-token/{token}` | Verify reset token | Public |
| POST | `/api/auth/reset-password` | Complete password reset | Public |

#### Authenticated User Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/auth/me` | Get current user session | Authenticated |
| POST | `/api/auth/logout` | Logout user | Authenticated |
| POST | `/api/auth/refresh` | Refresh session | Authenticated |
| PUT | `/api/auth/update-role` | Update user role | Authenticated |

#### 2FA Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/2fa/setup` | Setup 2FA | Authenticated |
| POST | `/api/auth/2fa/verify-setup` | Verify 2FA setup | Authenticated |
| POST | `/api/auth/2fa/verify` | Verify 2FA during login | Public |
| POST | `/api/auth/2fa/disable` | Disable 2FA | Authenticated |
| POST | `/api/auth/2fa/regenerate-backup-codes` | Regenerate backup codes | Authenticated |
| GET | `/api/auth/2fa/status` | Get 2FA status | Authenticated |

#### KYC (Know Your Customer) Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/kyc/start` | Start KYC verification | Authenticated |
| POST | `/api/kyc/upload-document` | Upload KYC documents | Authenticated |
| POST | `/api/kyc/submit` | Submit KYC for review | Authenticated |
| GET | `/api/kyc/status` | Get KYC status | Authenticated |

### 2. LISTINGS & MARKETPLACE

#### Public Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/public/buy-requests` | Get public buy requests | Public |
| GET | `/api/listings` | Browse listings | Public |
| GET | `/api/listings/{listing_id}` | Get listing details | Public |
| GET | `/api/listings/search` | Search listings | Public |

#### Seller Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/listings` | Create listing | Seller |
| PUT | `/api/listings/{listing_id}` | Update listing | Seller |
| DELETE | `/api/listings/{listing_id}` | Delete listing | Seller |
| GET | `/api/listings/my` | Get my listings | Seller |
| POST | `/api/listings/{listing_id}/enhance` | Enhance listing with AI | Seller |

#### Buy Request Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/buy-requests` | Create buy request | Buyer |
| GET | `/api/buy-requests/my` | Get my buy requests | Buyer |
| PUT | `/api/buy-requests/{request_id}` | Update buy request | Buyer |
| DELETE | `/api/buy-requests/{request_id}` | Delete buy request | Buyer |
| POST | `/api/buy-requests/{request_id}/offers` | Submit offer | Seller |
| GET | `/api/buy-requests/{request_id}/offers` | Get offers | Buyer/Seller |
| PUT | `/api/offers/{offer_id}/accept` | Accept offer | Buyer |
| PUT | `/api/offers/{offer_id}/reject` | Reject offer | Buyer |

### 3. SHOPPING CART & CHECKOUT

#### Cart Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/cart` | Get user cart | Authenticated |
| POST | `/api/cart/add` | Add item to cart | Authenticated |
| DELETE | `/api/cart/item/{item_id}` | Remove item from cart | Authenticated |
| PUT | `/api/cart/update` | Update cart item | Authenticated |

#### Checkout Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/checkout/create` | Create checkout session | Authenticated |
| POST | `/api/checkout/{session_id}/complete` | Complete checkout | Authenticated |
| GET | `/api/checkout/preview` | Preview checkout | Authenticated |

### 4. ORDERS & PAYMENTS

#### Order Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/orders/user` | Get user orders | Authenticated |
| GET | `/api/orders/{order_id}` | Get order details | Authenticated |
| PUT | `/api/orders/{order_id}/status` | Update order status | Seller/Buyer |
| POST | `/api/orders/{order_id}/delivery-confirm` | Confirm delivery | Buyer |
| POST | `/api/orders/{order_id}/dispute` | Create dispute | Buyer/Seller |

#### Payment Endpoints
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/payments/initialize` | Initialize payment | Authenticated |
| POST | `/api/payments/verify` | Verify payment | Authenticated |
| POST | `/api/payments/refund` | Request refund | Buyer |
| GET | `/api/payments/history` | Get payment history | Authenticated |

### 5. MESSAGING & COMMUNICATION

#### Inbox System
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/inbox/events` | SSE stream for real-time updates | Authenticated |
| GET | `/api/inbox/summary` | Get inbox summary | Authenticated |
| GET | `/api/inbox` | Get inbox conversations | Authenticated |
| POST | `/api/inbox/conversations` | Create conversation | Authenticated |
| GET | `/api/inbox/conversations/{conversation_id}` | Get conversation | Authenticated |
| POST | `/api/inbox/conversations/{conversation_id}/messages` | Send message | Authenticated |
| GET | `/api/inbox/conversations/{conversation_id}/messages` | Get messages | Authenticated |

#### Messaging System
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/messaging/conversations` | Create conversation | Authenticated |
| GET | `/api/messaging/conversations` | Get conversations | Authenticated |
| POST | `/api/messaging/conversations/{conversation_id}/messages` | Send message | Authenticated |
| GET | `/api/messaging/conversations/{conversation_id}/messages` | Get messages | Authenticated |
| POST | `/api/messaging/upload-media` | Upload media | Authenticated |
| GET | `/api/messaging/templates` | Get message templates | Authenticated |

### 6. NOTIFICATIONS

#### User Notifications
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/notifications` | Get user notifications | Authenticated |
| PUT | `/api/notifications/{notification_id}/read` | Mark notification as read | Authenticated |
| GET | `/api/me/notifications` | Get notification preferences | Authenticated |
| PUT | `/api/me/notifications` | Update notification preferences | Authenticated |

#### Email Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/email/preferences` | Get email preferences | Authenticated |
| PUT | `/api/email/preferences` | Update email preferences | Authenticated |
| GET | `/api/email/templates` | Get email templates | Authenticated |
| POST | `/api/email/test` | Send test email | Authenticated |

### 7. WISHLIST & PRICE ALERTS

#### Wishlist
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/wishlist/add` | Add to wishlist | Authenticated |
| DELETE | `/api/wishlist/remove/{item_id}` | Remove from wishlist | Authenticated |
| GET | `/api/wishlist` | Get user wishlist | Authenticated |
| PUT | `/api/wishlist/{wishlist_id}` | Update wishlist item | Authenticated |
| GET | `/api/wishlist/check/{item_id}` | Check wishlist status | Authenticated |
| GET | `/api/wishlist/stats` | Get wishlist statistics | Authenticated |

#### Price Alerts
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/price-alerts/create` | Create price alert | Authenticated |
| GET | `/api/price-alerts` | Get user price alerts | Authenticated |
| PUT | `/api/price-alerts/{alert_id}` | Update price alert | Authenticated |
| DELETE | `/api/price-alerts/{alert_id}` | Delete price alert | Authenticated |
| GET | `/api/price-alerts/stats` | Get price alert statistics | Authenticated |

### 8. SEARCH & AI

#### Advanced Search
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/search/semantic` | AI-powered semantic search | Public |
| POST | `/api/search/visual` | Visual search with images | Public |
| GET | `/api/search/autocomplete` | Smart autocomplete | Public |
| POST | `/api/search/intelligent-filters` | Intelligent filter suggestions | Public |
| GET | `/api/search/predictive` | Predictive search | Authenticated |
| GET | `/api/search/analytics` | Search analytics | Authenticated |

#### AI Services
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/ai/listing-suggest` | AI listing suggestions | Seller |
| POST | `/api/ai/listing-feedback` | Submit AI feedback | Seller |
| GET | `/api/ai/listing-suggestions/{user_id}` | Get user AI suggestions | Seller |

### 9. ANALYTICS & REPORTING

#### User Analytics
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/analytics/platform-overview` | Platform overview | Admin |
| GET | `/api/analytics/seller/{seller_id}` | Seller analytics | Seller/Admin |
| GET | `/api/analytics/buyer/{buyer_id}` | Buyer insights | Buyer/Admin |
| GET | `/api/analytics/market-intelligence` | Market intelligence | Admin |
| GET | `/api/analytics/real-time` | Real-time metrics | Admin |
| POST | `/api/analytics/custom-report` | Generate custom report | Admin |

#### Seller Analytics
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/seller/analytics/performance` | Performance analytics | Seller |
| GET | `/api/seller/promotion/campaigns` | Get campaigns | Seller |
| POST | `/api/seller/promotion/campaigns` | Create campaign | Seller |
| GET | `/api/seller/promotion/stats` | Campaign statistics | Seller |
| PATCH | `/api/seller/promotion/campaigns/{campaign_id}` | Update campaign | Seller |

### 10. ADMIN ENDPOINTS

#### User Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/admin/users` | Get all users | Admin |
| GET | `/api/admin/users/{user_id}` | Get user details | Admin |
| PUT | `/api/admin/users/{user_id}/status` | Update user status | Admin |
| POST | `/api/admin/users/{user_id}/suspend` | Suspend user | Admin |
| POST | `/api/admin/users/{user_id}/ban` | Ban user | Admin |

#### Moderation
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/admin/moderation/stats` | Moderation statistics | Admin |
| GET | `/api/admin/moderation/pending` | Pending moderation items | Admin |
| POST | `/api/admin/moderation/{item_id}/approve` | Approve item | Admin |
| POST | `/api/admin/moderation/{item_id}/reject` | Reject item | Admin |

#### KYC Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/admin/kyc/stats` | KYC statistics | Admin |
| GET | `/api/admin/kyc/pending` | Pending KYC verifications | Admin |
| POST | `/api/admin/kyc/{verification_id}/approve` | Approve KYC | Admin |
| POST | `/api/admin/kyc/{verification_id}/reject` | Reject KYC | Admin |

#### Reports & Analytics
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/admin/reports/revenue` | Revenue report | Admin |
| POST | `/api/admin/reports/export` | Export analytics data | Admin |
| GET | `/api/admin/2fa/stats` | 2FA statistics | Admin |
| GET | `/api/admin/password-reset/stats` | Password reset statistics | Admin |

### 11. FILE UPLOADS

#### Image Uploads
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/upload/listing-image` | Upload listing image | Seller |
| POST | `/api/upload/profile-image` | Upload profile image | Authenticated |
| POST | `/api/upload/livestock-image` | Upload livestock image | Seller |
| POST | `/api/upload/buy-request-image` | Upload buy request image | Buyer |
| POST | `/api/upload/vet-certificate` | Upload vet certificate | Seller |

#### File Serving
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/uploads/{folder}/{filename}` | Serve uploaded files | Public |

### 12. BULK OPERATIONS

#### Inventory Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/seller/inventory/bulk-update` | Bulk update inventory | Seller |
| GET | `/api/seller/inventory/bulk-update/template` | Download CSV template | Seller |
| GET | `/api/seller/inventory/export` | Export inventory | Seller |

### 13. SYSTEM & HEALTH

#### Health & Status
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/health` | Health check | Public |
| GET | `/api/performance/health-check` | Enhanced health check | Public |

#### Development (Non-Production)
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/dev/sse-topics` | Get SSE topics | Dev |
| GET | `/api/dev/communication-summary` | Communication summary | Dev |
| POST | `/api/dev/refresh-inventory` | Refresh endpoint inventory | Dev |

### 14. CONTACT & SUPPORT

#### Contact Forms
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/contact` | Submit contact form | Public |

---

## Authentication Methods

### 1. Session-Based Authentication
- Uses HTTP-only cookies
- Automatic session management
- CSRF protection

### 2. Bearer Token Authentication
- JWT tokens for API access
- Stateless authentication
- Token refresh mechanism

### 3. Social Authentication
- Google OAuth
- Facebook OAuth
- Automatic account creation

## Rate Limiting

The API implements rate limiting on various endpoints:
- **Authentication endpoints**: 5 requests per minute
- **Search endpoints**: 60 requests per minute
- **Upload endpoints**: 10 requests per minute
- **General API**: 100 requests per minute

## Error Handling

All endpoints return consistent error responses:
```json
{
  "error": "Error message",
  "detail": "Detailed error information",
  "status_code": 400
}
```

## Response Format

Successful responses follow this format:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message"
}
```

## Webhooks

The system supports webhooks for:
- Payment events (Paystack)
- Order status changes
- User registration
- Listing updates

## Real-time Features

- Server-Sent Events (SSE) for real-time updates
- WebSocket connections for messaging
- Live notifications
- Real-time analytics

---

*This documentation covers all 400+ API endpoints in the StockLot platform. For specific implementation details, refer to the individual service files in the backend directory.*
