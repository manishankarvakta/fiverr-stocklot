## Frontend API Usage Map

This document lists API endpoints invoked by the frontend, where they are used, typical operations, input shape, and expected response shape (as used by the UI). Base URL is `${REACT_APP_BACKEND_URL}/api` unless otherwise stated.

### Legend
- Input/Response are summarized from usage context; refer to backend Swagger `/docs` for authoritative schemas.

### Authentication
| Endpoint | Method | Used by | Operation | Input | Response |
|---|---|---|---|---|---|
| `/auth/login` | POST | `frontend/src/components/pages/Login.jsx`, `authAPI.login` | Login user | `{ email, password }` | `{ success?, user?, message? }` and sets HttpOnly cookie |
| `/auth/register` | POST | `authAPI.register` | Register user | `{ email, password, full_name, phone, role }` | `{ message?, user_id? }` |
| `/auth/logout` | POST | `authAPI.logout` | Logout user | none | `{ ok? }` |
| `/auth/me` | GET | `authAPI.getProfile` | Get current session profile | none | `user` object |
| `/auth/refresh` | POST | `authAPI.refresh`, axios interceptor | Refresh session/token | none | `{ ok? }` |

### Listings
| Endpoint | Method | Used by | Operation | Input | Response |
|---|---|---|---|---|---|
| `/listings` | GET | `listingsAPI.getAll` | List listings (with params) | `?params` | array/list payload |
| `/listings` | POST | `listingsAPI.create` | Create listing | listing data | created listing |
| `/listings/{id}` | GET | `listingsAPI.getById` | Get listing | none | listing |
| `/listings/{id}` | PUT | `listingsAPI.update` | Update listing | listing fields | updated listing |
| `/listings/{id}` | DELETE | `listingsAPI.delete` | Delete listing | none | `{ ok }` |
| `/listings/{id}/pdp` | GET | `components/pdp/ListingPDP.jsx` | PDP data | none | `{ ...PDP data }` |

### Cart
| Endpoint | Method | Used by | Operation | Input | Response |
|---|---|---|---|---|---|
| `/cart` | GET | `components/ui/common/Header.jsx` | Get cart summary | none | `{ item_count?, ... }` |
| `/cart` | GET | `cartAPI.get` | Get cart | none | cart object |
| `/cart/add` | POST | `cartAPI.add`, PDP Add-to-cart, Wishlist add | Add item to cart | `{ listing_id, quantity, ... }` | updated cart/confirmation |
| `/cart/update` | PUT | `cartAPI.update` | Update cart | `{ items: [...] }` | updated cart |
| `/cart/item/{itemId}` | DELETE | `cartAPI.remove` | Remove item | none | `{ ok }` |

### Orders
| Endpoint | Method | Used by | Operation | Input | Response |
|---|---|---|---|---|---|
| `/orders/user` | GET | `orderAPI.getAll` | Get user orders | none | orders list |
| `/orders/{id}` | GET | `orderAPI.getById` | Get order by id | none | order |
| `/orders/{id}/status` | PUT | `orderAPI.updateStatus` | Update order status | `{ status }` | updated order/status |

### Checkout
| Endpoint | Method | Used by | Operation | Input | Response |
|---|---|---|---|---|---|
| `/checkout/guest/quote` | POST | `checkoutAPI.guestQuote` | Guest shipping/payment quote | checkout data | quote details |
| `/checkout/guest/create` | POST | `checkoutAPI.guestCreate` | Guest checkout | checkout data | order/session |
| `/checkout/create` | POST | `checkoutAPI.create` | Authenticated checkout | checkout data | order/session |

### Transport / Insurance / Financing (Checkout Options)
| Endpoint | Method | Used by | Operation | Input | Response |
|---|---|---|---|---|---|
| `/transport/quotes` | POST | `components/checkout/CheckoutOptions.jsx` | Get delivery quotes | `{ pickup_lat, pickup_lng, dropoff_lat, dropoff_lng, ... }` | `{ quotes: [...] }` |
| `/transport/book` | POST | `components/checkout/CheckoutOptions.jsx` | Book selected transport | `{ quote_id }` | confirmation |
| `/insurance/quotes/{requestId}` | GET | `components/checkout/CheckoutOptions.jsx` | Poll insurance quotes | none | `{ quotes: [...] }` |
| `/insurance/quotes` | POST | `components/checkout/CheckoutOptions.jsx` | Request insurance quotes | `{ order_id }` | `{ request_id }` |
| `/insurance/buy` | POST | `components/checkout/CheckoutOptions.jsx` | Buy insurance | `{ quote_id }` | confirmation |
| `/financing/apply` | POST | `components/checkout/CheckoutOptions.jsx` | Apply financing | `{ order_id, ... }` | decision/enqueue |

### Wallet
| Endpoint | Method | Used by | Operation | Input | Response |
|---|---|---|---|---|---|
| `/wallets/me` | GET | `components/wallet/CreditWallet.jsx` | Get wallet balance | none | wallet summary |
| `/wallets/me/ledger?limit=50` | GET | `components/wallet/CreditWallet.jsx` | Get ledger entries | none | `{ entries: [...] }` |
| `/wallets/me/bank-accounts` | GET | `components/wallet/CreditWallet.jsx` | Get bank accounts | none | `{ bank_accounts: [...] }` |
| `/wallets/me/payouts?limit=20` | GET | `components/wallet/CreditWallet.jsx` | Get payout history | none | `{ payouts: [...] }` |
| `/wallets/me/payouts` | POST | `components/wallet/CreditWallet.jsx` | Request payout | `{ amount_cents }` | confirmation |
| `/wallets/me/bank-accounts` | POST | `components/wallet/CreditWallet.jsx` | Add bank account | bank form | confirmation |

### Buyer: Wishlist & Price Alerts
| Endpoint | Method | Used by | Operation | Input | Response |
|---|---|---|---|---|---|
| `/buyer/wishlist` | GET | `components/buyer/Wishlist.jsx` | List wishlist | `?params` | list |
| `/buyer/wishlist/{id}` | DELETE | `components/buyer/Wishlist.jsx` | Remove wishlist item | none | `{ ok }` |
| `/buyer/price-alerts` | GET | `components/buyer/PriceAlerts.jsx` | List price alerts | `?params` | list |
| `/buyer/price-alerts/stats` | GET | `components/buyer/PriceAlerts.jsx` | Stats | none | `{ ... }` |
| `/buyer/price-alerts` | POST | `components/buyer/PriceAlerts.jsx` | Create alert | alert data | created alert |
| `/buyer/price-alerts/{id}` | DELETE | `components/buyer/PriceAlerts.jsx` | Delete alert | none | `{ ok }` |

### Auctions
| Endpoint | Method | Used by | Operation | Input | Response |
|---|---|---|---|---|---|
| `/auctions/{auctionId}` | GET | `components/features/AuctionWidget.jsx`, `AuctionCard.jsx` | Get auction | none | auction |
| `/auctions` | POST | `components/features/AuctionWidget.jsx` | Create auction | `{ listing_id, ... }` | auction |
| `/auctions/{id}/bids` | POST | `components/features/AuctionWidget.jsx`, `AuctionCard.jsx` | Place bid | `{ amount_cents }` | bid result |

### Group Buys
| Endpoint | Method | Used by | Operation | Input | Response |
|---|---|---|---|---|---|
| `/group-buys/by-listing/{listingId}` | GET | `components/features/GroupBuyWidget.jsx` | Get group by listing | none | group |
| `/group-buys` | POST | `components/features/GroupBuyWidget.jsx` | Create group buy | `{ listing_id, ... }` | group |
| `/group-buys/{id}/pledge` | POST | `components/features/GroupBuyWidget.jsx` | Pledge | `{ pledge_cents }` | confirmation |
| `/group-buys/{id}/pay` | POST | `components/features/GroupBuyWidget.jsx` | Pay pledge | none | confirmation |

### Trust/Reputation
| Endpoint | Method | Used by | Operation | Input | Response |
|---|---|---|---|---|---|
| `/trust/score/{userId}` | GET | `TrustScoreDisplay.jsx`, `TrustScoreBadge.jsx` | Get trust score | none | numeric/score payload |

### Seller Offers
| Endpoint | Method | Used by | Operation | Input | Response |
|---|---|---|---|---|---|
| `/seller/offers` | GET | `components/seller/SellerOffers.jsx` | List offers | `?params` | offers |
| `/seller/offers/stats` | GET | `components/seller/SellerOffers.jsx` | Offer stats | none | stats |
| `/seller/offers/{offerId}/respond` | POST | `components/seller/SellerOffers.jsx` | Respond to offer | `{ response }` | confirmation |
| `/seller/offers/{offerId}/counter` | POST | `components/seller/SellerOffers.jsx` | Counter offer | `{ ... }` | confirmation |

### PDP Analytics & Experiments
| Endpoint | Method | Used by | Operation | Input | Response |
|---|---|---|---|---|---|
| `/ab-test/pdp-config/{id}` | GET | `components/pdp/ListingPDP.jsx` | Get PDP A/B config | none | `{ experiment_tracking: [...] }` |
| `/ab-test/track-event` | POST | `components/pdp/ListingPDP.jsx` | Track experiment event | `{ experiment_id, event }` | `{ ok }` |
| `/analytics/track` | POST | `components/pdp/ListingPDP.jsx` | Track analytics event | `{ event_type, ... }` | `{ ok }` |

### Admin (examples observed)
| Endpoint | Method | Used by | Operation | Input | Response |
|---|---|---|---|---|---|
| `/admin/dashboard/stats` | GET | `components/admin/AdminDashboard.jsx` | Admin dashboard stats | none | stats object |
| `/admin/users` | GET | `components/admin/AdminDashboard.jsx` | List users | none | `{ users: [...] }` or list |

### Notes
- Additional endpoints are also referenced via `frontend/src/lib/api.js` and other components not listed here. For a complete authoritative list, use the backend dev introspection: `GET /api/__introspection/endpoints`.
- Requests made through `client.js` include credentials (HttpOnly cookie) and Bearer token when available.


