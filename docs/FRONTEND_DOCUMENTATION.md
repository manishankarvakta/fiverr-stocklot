# StockLot Frontend Documentation

## Overview
The StockLot frontend is a React-based single-page application (SPA) built with modern web technologies. It provides a comprehensive livestock marketplace interface with role-based access control, real-time features, and mobile-responsive design.

## Technology Stack

### Core Technologies
- **React 18** - Frontend framework
- **React Router v6** - Client-side routing
- **Axios** - HTTP client for API communication
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library

### State Management
- **Redux Toolkit (RTK Query)** - Global state management and API calls
- **React Context API** - Authentication and UI state
- **useState/useEffect** - Local component state
- **RTK Query Hooks** - Data fetching, caching, and mutations

### UI Components
- **Custom UI Library** - Built with Radix UI primitives
- **Responsive Design** - Mobile-first approach
- **Dark/Light Mode** - Theme switching capability

---

## User Types & Authentication

### User Roles
1. **BUYER** - Users who purchase livestock and meat products
2. **SELLER** - Users who sell livestock and meat products
3. **ADMIN** - Platform administrators with full access

### Authentication Flow
- **Session-based Authentication** - HTTP-only cookies
- **JWT Tokens** - For API access
- **Social Authentication** - Google/Facebook OAuth
- **2FA Support** - Two-factor authentication
- **Password Reset** - Email-based reset flow

### Protected Routes
- **Public Routes** - Homepage, login, register
- **Protected Routes** - Dashboard, listings, orders
- **Role-based Routes** - Admin panels, seller tools

---

## Application Structure

### Main Application (`App.js`)
- **Router Configuration** - Route definitions and guards
- **Authentication Provider** - Global auth state
- **Layout Components** - Header, sidebar, navigation
- **Error Boundaries** - Error handling

### Directory Structure
```
src/
├── api/                    # API client configuration
├── auth/                   # Authentication components
├── components/             # Reusable UI components
│   ├── admin/             # Admin-specific components
│   ├── buyer/             # Buyer-specific components
│   ├── seller/            # Seller-specific components
│   ├── ui/                # Base UI components
│   └── ...                # Feature-specific components
├── hooks/                  # Custom React hooks
├── lib/                    # Utility libraries
├── pages/                  # Page components
├── services/               # API service layer
└── utils/                  # Helper functions
```

---

## Core Modules & Components

### 1. Authentication Module

#### Components
- **AuthProvider** - Global authentication context
- **ProtectedRoute** - Route protection wrapper
- **PublicOnlyRoute** - Public-only route wrapper
- **LoginGate** - Login modal component
- **EnhancedRegister** - Registration form
- **TwoFactorSetup** - 2FA configuration
- **TwoFactorManagement** - 2FA management

#### Features
- Session persistence
- Automatic token refresh
- Role-based access control
- Social login integration
- Password reset flow

#### API Integration
```javascript
// Authentication API calls using Redux RTK Query
import { 
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
  useForgotPasswordMutation,
  useResetPasswordMutation
} from '@/store/api/user.api';

// In component:
const [login, { isLoading }] = useLoginMutation();
const { data: user } = useGetMeQuery();
const [forgotPassword] = useForgotPasswordMutation();

// Usage:
await login({ email, password }).unwrap();
await forgotPassword({ email }).unwrap();
```

### 2. Dashboard Module

#### Universal Dashboard (`UniversalDashboard.jsx`)
- **Role-based Navigation** - Different views for buyers/sellers
- **Quick Actions** - Common tasks and shortcuts
- **Statistics Overview** - Key metrics and KPIs
- **Recent Activity** - Latest transactions and updates

#### Specialized Dashboards
- **BuyRequestDashboard** - Buy request management
- **MLEnhancedSellerDashboard** - AI-powered seller tools
- **OrganizationDashboard** - Organization management

#### Features
- Real-time updates
- Responsive design
- Quick navigation
- Statistics visualization

### 3. Seller Module

#### Core Components
- **SellerProfile** - Seller profile management
- **MyListings** - Listing management
- **SellerAnalytics** - Performance analytics
- **SellerOffers** - Offer management
- **SellerCampaigns** - Marketing campaigns
- **InventoryBulkUpdate** - Bulk inventory management

#### Profile Management
- **BasicInfo** - Personal information
- **BusinessInfo** - Business details
- **Expertise** - Specializations and certifications
- **Photos** - Profile and facility photos
- **Policies** - Terms and conditions
- **Preferences** - Buying preferences
- **Facility** - Farm/facility information
- **Experience** - Years of experience

#### Features
- Listing creation and management
- Performance analytics
- Customer reviews
- Shipping rate configuration
- Bulk operations
- AI-powered suggestions

#### API Integration
```javascript
// Seller API calls using Redux RTK Query
import {
  useCreateListingMutation,
  useGetMyListingsQuery,
  useUpdateListingMutation,
  useDeleteListingMutation
} from '@/store/api/listings.api';

// In component:
const { data: listings, isLoading } = useGetMyListingsQuery();
const [createListing] = useCreateListingMutation();
const [updateListing] = useUpdateListingMutation();

// Usage:
await createListing(listingData).unwrap();
await updateListing({ listingId: id, ...data }).unwrap();
```

### 4. Buyer Module

#### Core Components
- **Wishlist** - Saved listings management
- **PriceAlerts** - Price monitoring
- **SavedSearches** - Search history and alerts
- **BuyerOffers** - Offer management

#### Features
- Wishlist management
- Price alert creation
- Saved search functionality
- Offer tracking
- Purchase history

#### API Integration
```javascript
// Buyer API calls using Redux RTK Query
import {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useGetPriceAlertsQuery,
  useCreatePriceAlertMutation
} from '@/store/api/notifications.api';

// In component:
const { data: wishlist } = useGetWishlistQuery();
const [addToWishlist] = useAddToWishlistMutation();
const { data: priceAlerts } = useGetPriceAlertsQuery();
const [createPriceAlert] = useCreatePriceAlertMutation();

// Usage:
await addToWishlist({ listing_id: itemId }).unwrap();
await createPriceAlert(alertData).unwrap();
```

### 5. Admin Module

#### Admin Layout (`AdminLayout.jsx`)
- **Comprehensive Navigation** - 20+ admin sections
- **Role-based Access** - Different admin roles
- **Real-time Monitoring** - Live system status

#### Admin Sections
1. **Dashboard Overview** - Platform statistics
2. **Moderation Center** - Content moderation
3. **User Management** - User administration
4. **Livestock Listings** - Listing management
5. **Buy Requests** - Request management
6. **Orders & Escrow** - Order processing
7. **Financial Management** - Payouts and payments
8. **Business Operations** - Organizations and compliance
9. **Technical Management** - Webhooks and logistics
10. **Analytics & Optimization** - Performance metrics
11. **Content & System** - CMS and settings

#### Features
- Comprehensive admin controls
- Real-time monitoring
- Bulk operations
- Analytics dashboards
- User management
- Content moderation

### 6. Marketplace Module

#### Core Components
- **Marketplace** - Main listing browser
- **ListingCard** - Individual listing display
- **FilterBar** - Search and filter controls
- **SearchResults** - Search result display
- **ProductDetailPage** - Detailed listing view

#### Features
- Advanced search and filtering
- Map integration
- Image galleries
- Contact seller functionality
- Add to cart/wishlist

### 7. Orders & Checkout Module

#### Core Components
- **ShoppingCart** - Cart management
- **CheckoutFlow** - Checkout process
- **GuestCheckout** - Guest checkout option
- **OrderTracking** - Order status tracking
- **OrderHistory** - Purchase history

#### Features
- Shopping cart management
- Secure checkout process
- Order tracking
- Payment integration
- Guest checkout support

### 8. Messaging & Communication Module

#### Core Components
- **UnifiedInbox** - Centralized messaging
- **InboxPage** - Message management
- **NotificationBell** - Real-time notifications
- **MessageThread** - Conversation view

#### Features
- Real-time messaging
- Notification system
- File sharing
- Message templates
- Conversation management

### 9. Analytics & Reporting Module

#### Core Components
- **MarketAnalyticsDashboard** - Market insights
- **MLAnalyticsDashboard** - AI-powered analytics
- **MonthlyTradingStatements** - Financial reports
- **AdminAnalyticsDashboard** - Admin analytics

#### Features
- Performance metrics
- Market intelligence
- Financial reporting
- AI-powered insights
- Custom reports

---

## Pages & Routes

### Public Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Homepage | Landing page |
| `/login` | Login | User login |
| `/register` | EnhancedRegister | User registration |
| `/verify-email` | EmailVerificationPage | Email verification |
| `/forgot-password` | ForgotPasswordPage | Password reset request |
| `/reset-password` | PasswordResetPage | Password reset form |

### Protected Routes
| Route | Component | Description | Access Level |
|-------|-----------|-------------|--------------|
| `/dashboard` | UniversalDashboard | Main dashboard | Authenticated |
| `/marketplace` | Marketplace | Browse listings | Public |
| `/create-listing` | CreateListing | Create new listing | Seller |
| `/create-buy-request` | CreateBuyRequestPage | Create buy request | Buyer |
| `/profile` | ProfilePage | User profile | Authenticated |
| `/orders` | MyOrders | Order management | Authenticated |
| `/inbox` | UnifiedInbox | Messaging center | Authenticated |

### Seller Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/seller/listings` | MyListings | Manage listings |
| `/seller/analytics` | SellerAnalytics | Performance analytics |
| `/seller/performance` | ListingPerformance | Listing performance |
| `/seller/reviews` | CustomerReviews | Customer reviews |
| `/seller/campaigns` | SellerCampaigns | Marketing campaigns |
| `/seller/offers` | SellerOffers | Offer management |

### Buyer Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/buyer/wishlist` | Wishlist | Saved listings |
| `/buyer/price-alerts` | PriceAlerts | Price monitoring |
| `/buyer/saved-searches` | SavedSearches | Search history |

### Admin Routes
| Route | Component | Description |
|-------|-----------|-------------|
| `/admin` | AdminDashboard | Admin overview |
| `/admin/users` | AdminUsersQueue | User management |
| `/admin/listings` | AdminListingsQueue | Listing moderation |
| `/admin/orders` | AdminOrdersManagement | Order management |
| `/admin/analytics` | AdminAnalyticsDashboard | Platform analytics |

---

## Data Flow & State Management

### Authentication State
```javascript
// AuthProvider context
const AuthContext = {
  status: "loading" | "authenticated" | "anonymous",
  user: User | null,
  signOut: () => Promise<void>,
  refetch: () => Promise<void>
}
```

### API Service Layer (Redux RTK Query)
```javascript
// All API calls use Redux RTK Query hooks
// Import from store/api modules:

// Authentication
import { useLoginMutation, useGetMeQuery } from '@/store/api/user.api';

// Listings
import { useGetListingsQuery, useCreateListingMutation } from '@/store/api/listings.api';

// Cart
import { useGetCartQuery, useAddToCartMutation } from '@/store/api/cart.api';

// Orders
import { useGetUserOrdersQuery, useCreateOrderMutation } from '@/store/api/orders.api';

// Notifications
import { useGetNotificationsQuery } from '@/store/api/notifications.api';

// Buy Requests
import { useGetPublicBuyRequestsQuery, useCreateBuyRequestMutation } from '@/store/api/buyRequests.api';

// Messaging
import { useGetInboxConversationsQuery, useSendMessageMutation } from '@/store/api/messaging.api';

// Admin
import { useGetAllUsersQuery } from '@/store/api/admin.api';

// Search
import { useSemanticSearchMutation } from '@/store/api/search.api';

// Uploads
import { useUploadListingImageMutation } from '@/store/api/uploads.api';
```

### Real-time Features
- **Server-Sent Events (SSE)** - Real-time updates
- **WebSocket Connections** - Live messaging
- **Polling** - Periodic data refresh
- **Push Notifications** - Browser notifications

---

## API Integration

### Redux RTK Query Architecture

All API calls are now handled through Redux Toolkit Query (RTK Query), which provides:
- Automatic caching and data synchronization
- Request deduplication
- Optimistic updates
- Automatic refetching on window focus/reconnect
- Built-in loading and error states

### API Modules Structure
```javascript
// All API modules are in store/api/
store/api/
├── baseApi.js          // Base API configuration
├── user.api.js         // Authentication & user management
├── listings.api.js     // Listings CRUD operations
├── cart.api.js         // Shopping cart operations
├── orders.api.js       // Order management
├── buyRequests.api.js  // Buy request operations
├── notifications.api.js // Notifications, wishlist, price alerts
├── messaging.api.js   // Messaging and inbox
├── admin.api.js       // Admin operations
├── search.api.js      // Search and AI features
└── uploads.api.js     // File uploads
```

### Usage Pattern
```javascript
// Query hooks (GET requests)
const { data, isLoading, error, refetch } = useGetListingsQuery(filters);

// Mutation hooks (POST/PUT/DELETE)
const [createListing, { isLoading: isCreating }] = useCreateListingMutation();

// Using mutations
const handleSubmit = async () => {
  try {
    const result = await createListing(formData).unwrap();
    // Success handling
  } catch (error) {
    // Error handling
  }
};
```

### Temporary API Helper (For Endpoints Not Yet in Redux)

For endpoints that don't have Redux hooks yet, use the temporary `apiHelper` utility:

```javascript
import api from '@/utils/apiHelper';

// GET request
const response = await api.get('/endpoint', { params: { key: 'value' } });

// POST request
const response = await api.post('/endpoint', { data: 'value' });

// PUT/PATCH/DELETE
await api.put('/endpoint', data);
await api.delete('/endpoint');
```

**Note**: The `apiHelper` is a temporary solution. All endpoints should eventually be migrated to Redux RTK Query hooks in `store/api/` modules.

### Error Handling
- **Global Error Interceptors** - Automatic error handling
- **Retry Logic** - Automatic retry on failure
- **User-friendly Messages** - Clear error messages
- **Fallback States** - Graceful degradation

---

## UI/UX Features

### Responsive Design
- **Mobile-first** - Optimized for mobile devices
- **Breakpoints** - sm, md, lg, xl, 2xl
- **Flexible Layouts** - Adaptive components
- **Touch-friendly** - Mobile interactions

### Accessibility
- **ARIA Labels** - Screen reader support
- **Keyboard Navigation** - Full keyboard access
- **Color Contrast** - WCAG compliance
- **Focus Management** - Proper focus handling

### Performance
- **Code Splitting** - Lazy loading
- **Image Optimization** - Optimized images
- **Caching** - SWR data caching
- **Bundle Optimization** - Minimized bundle size

---

## Security Features

### Authentication Security
- **HTTP-only Cookies** - Secure session storage
- **CSRF Protection** - Cross-site request forgery prevention
- **Token Refresh** - Automatic token renewal
- **Session Timeout** - Automatic logout

### Data Protection
- **Input Validation** - Client-side validation
- **XSS Prevention** - Cross-site scripting protection
- **HTTPS Only** - Secure communication
- **Content Security Policy** - CSP headers

---

## Development & Deployment

### Development Tools
- **React DevTools** - Component debugging
- **Redux DevTools** - State inspection
- **ESLint** - Code linting
- **Prettier** - Code formatting

### Build Process
- **Webpack** - Module bundling
- **Babel** - JavaScript compilation
- **PostCSS** - CSS processing
- **Tailwind** - CSS generation

### Environment Configuration
```javascript
// Environment variables
REACT_APP_BACKEND_URL     // Backend API URL
REACT_APP_GOOGLE_CLIENT_ID // Google OAuth
REACT_APP_FACEBOOK_APP_ID  // Facebook OAuth
REACT_APP_MAPBOX_TOKEN     // Map integration
```

---

## Component Library

### Base UI Components
- **Button** - Interactive buttons
- **Card** - Content containers
- **Input** - Form inputs
- **Modal** - Overlay dialogs
- **Table** - Data tables
- **Badge** - Status indicators
- **Avatar** - User avatars
- **Tabs** - Tab navigation
- **Select** - Dropdown selects
- **Switch** - Toggle switches

### Layout Components
- **Header** - Top navigation
- **Sidebar** - Side navigation
- **Footer** - Page footer
- **Container** - Content wrapper
- **Grid** - Layout grid
- **Flex** - Flexbox utilities

### Feature Components
- **ListingCard** - Listing display
- **SearchBar** - Search interface
- **FilterPanel** - Filter controls
- **Pagination** - Page navigation
- **NotificationBell** - Notification center
- **UserMenu** - User dropdown

---

## Testing Strategy

### Component Testing
- **Unit Tests** - Individual component testing
- **Integration Tests** - Component interaction testing
- **Snapshot Tests** - UI regression testing

### E2E Testing
- **User Flows** - Complete user journeys
- **Cross-browser** - Browser compatibility
- **Mobile Testing** - Mobile device testing

---

## Performance Optimization

### Code Splitting
- **Route-based** - Lazy load routes
- **Component-based** - Lazy load components
- **Library-based** - Split vendor bundles

### Caching Strategy
- **API Caching** - Redux RTK Query automatic caching with tag-based invalidation
- **Image Caching** - Optimized image loading
- **Static Assets** - CDN caching
- **Query Deduplication** - Automatic request deduplication
- **Cache Invalidation** - Tag-based cache invalidation on mutations

### Bundle Optimization
- **Tree Shaking** - Remove unused code
- **Minification** - Compress JavaScript/CSS
- **Compression** - Gzip/Brotli compression

---

## Mobile Features

### Mobile-specific Components
- **MobileCameraAutofill** - Camera integration
- **MobileNavigation** - Mobile menu
- **TouchGestures** - Touch interactions
- **SwipeActions** - Swipe gestures

### PWA Features
- **Service Worker** - Offline functionality
- **App Manifest** - App installation
- **Push Notifications** - Mobile notifications
- **Offline Support** - Offline data access

---

## Integration Points

### Backend API
- **RESTful API** - REST endpoints
- **WebSocket** - Real-time communication
- **File Upload** - Media uploads
- **Authentication** - Session management

### Third-party Services
- **Google Maps** - Location services
- **Paystack** - Payment processing
- **Mailgun** - Email services
- **Cloudinary** - Image hosting

### Analytics
- **Google Analytics** - User tracking
- **Custom Events** - Business metrics
- **Performance Monitoring** - App performance
- **Error Tracking** - Error monitoring

---

*This documentation covers the complete frontend architecture, components, and functionality of the StockLot platform. For specific implementation details, refer to the individual component files in the src/components directory.*
