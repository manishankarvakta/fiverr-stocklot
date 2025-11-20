# StockLot Frontend Component Inventory

## Overview
This document provides a comprehensive list of all components used in the StockLot frontend application, organized by category and functionality.

---

## 📁 **Component Categories**

### 🔐 **Authentication Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `EmailVerificationPage` | `./components/auth/EmailVerificationPage` | Email verification page |
| `PasswordResetPage` | `./components/auth/PasswordResetPage` | Password reset functionality |
| `ForgotPasswordPage` | `./components/auth/ForgotPasswordPage` | Forgot password page |
| `EnhancedRegister` | `./components/auth/EnhancedRegister` | Enhanced registration form |
| `TwoFactorManagement` | `./components/auth/TwoFactorManagement` | 2FA management |
| `TwoFactorSetup` | `./components/auth/TwoFactorSetup` | 2FA setup process |
| `LoginGate` | `./components/auth/LoginGate` | Login modal/gate |

### 🏢 **Organization Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `CreateOrganizationPage` | `./components/orgs/CreateOrganizationPage` | Organization creation |
| `OrganizationDashboard` | `./components/orgs/OrganizationDashboard` | Organization dashboard |
| `OrganizationManagement` | `./components/admin/OrganizationManagement` | Admin org management |
| `AdminRoleManagement` | `./components/admin/AdminRoleManagement` | Admin role management |

### 📍 **Location & Geofencing Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `LocationPicker` | `./components/location/LocationPicker` | Location selection |
| `GeofenceBanner` | `./components/geofence/GeofenceBanner` | Geofence notifications |
| `RangeBadge` | `./components/geofence/RangeBadge` | Range indicator |
| `DeliverableFilterBar` | `./components/geofence/DeliverableFilterBar` | Delivery filter |

### 🔔 **Notification Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `NotificationBell` | `./components/notifications/NotificationBell` | Notification bell icon |
| `NotificationSettings` | `./components/settings/NotificationSettings` | Notification preferences |
| `AlertPreferences` | `./components/settings/AlertPreferences` | Alert settings |

### 📝 **Blog Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `BlogList` | `./components/blog/BlogList` | Blog listing |
| `BlogEditor` | `./components/blog/BlogEditor` | Blog editor |

### ⚖️ **Legal Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `TermsOfService` | `./components/legal/TermsOfService` | Terms of service |
| `PrivacyPolicy` | `./components/legal/PrivacyPolicy` | Privacy policy |

### 🛒 **Buy Request Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `CreateBuyRequestForm` | `./components/buyRequests/CreateBuyRequestForm` | Basic buy request form |
| `BuyRequestsList` | `./components/buyRequests/BuyRequestsList` | Buy requests listing |
| `EnhancedCreateBuyRequestForm` | `./components/buyRequests/EnhancedCreateBuyRequestForm` | Enhanced buy request form |

### 👨‍💼 **Admin Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `AdminDashboard` | `./components/admin/AdminDashboard` | Main admin dashboard |
| `AdminLayoutWithSidebar` | `./components/admin/AdminLayout` | Admin layout with sidebar |
| `AdminAnalyticsOverview` | `./components/admin/AdminAnalyticsOverview` | Analytics overview |
| `AdminAnalyticsPDP` | `./components/admin/AdminAnalyticsPDP` | Analytics PDP |
| `AdminSellerPerformance` | `./components/admin/AdminSellerPerformance` | Seller performance |
| `UserModeration` | `./components/admin/UserModeration` | User moderation |
| `AdminExperiments` | `./components/admin/AdminExperiments` | A/B testing |
| `AdminExperimentResults` | `./components/admin/AdminExperimentResults` | Experiment results |
| `ReviewModeration` | `./components/admin/ReviewModeration` | Review moderation |
| `ListingsModeration` | `./components/admin/ListingsModeration` | Listing moderation |
| `BuyRequestModeration` | `./components/admin/BuyRequestModeration` | Buy request moderation |
| `AdminRevenueReport` | `./components/admin/AdminRevenueReport` | Revenue reporting |
| `RolesQueue` | `./components/admin/RolesQueue` | Role management queue |

### 🏪 **Seller Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `ContextSwitcher` | `./components/seller/ContextSwitcher` | Role context switcher |
| `InventoryBulkUpdate` | `./components/seller/InventoryBulkUpdate` | Bulk inventory updates |
| `SellerAnalytics` | `./components/seller/SellerAnalytics` | Seller analytics |
| `SellerCampaigns` | `./components/seller/SellerCampaigns` | Marketing campaigns |
| `SellerOffers` | `./components/seller/SellerOffers` | Offer management |
| `SellerShippingRates` | `./components/seller/SellerShippingRates` | Shipping rate management |
| `MyListings` | `./components/seller/MyListings` | Seller's listings |
| `ListingPerformance` | `./components/seller/ListingPerformance` | Listing performance |
| `CustomerReviews` | `./components/seller/CustomerReviews` | Customer reviews |
| `SellerProfileLayout` | `./components/seller/SellerProfileLayout` | Seller profile layout |
| `BasicInfo` | `./components/seller/profile/BasicInfo` | Basic seller info |
| `BusinessInfo` | `./components/seller/profile/BusinessInfo` | Business information |
| `DeliveryRateForm` | `./components/seller/DeliveryRateForm` | Delivery rate form |
| `SellerProfile` | `./components/seller/SellerProfile` | Seller profile page |

### 🛍️ **Buyer Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `Wishlist` | `./components/buyer/Wishlist` | Buyer wishlist |
| `PriceAlerts` | `./components/buyer/PriceAlerts` | Price alert management |
| `SavedSearches` | `./components/buyer/SavedSearches` | Saved search queries |

### 📊 **Analytics Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `MonthlyTradingStatements` | `./components/analytics/MonthlyTradingStatements` | Trading statements |

### 🛒 **Order Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `MyOrders` | `./components/orders/MyOrders` | User orders |
| `OrderTracking` | `./components/orders/OrderTracking` | Order tracking |
| `OrderHistory` | `./components/orders/OrderHistory` | Order history |

### 📋 **Report Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `TaxReports` | `./components/reports/TaxReports` | Tax reporting |

### 🎛️ **Settings Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `NotificationSettings` | `./components/settings/NotificationSettings` | Notification settings |
| `AlertPreferences` | `./components/settings/AlertPreferences` | Alert preferences |

### 🔐 **KYC Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `KYCVerification` | `./components/kyc/KYCVerification` | KYC verification process |

### 🏗️ **Layout Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `DashboardLayout` | `./components/layout/DashboardLayout` | Main dashboard layout |
| `SellerProfileLayout` | `./components/seller/SellerProfileLayout` | Seller profile layout |

### 🎨 **Demo Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `SidebarDemo` | `./components/demo/SidebarDemo` | Sidebar demonstration |

### 💳 **Payment Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `PaymentMethodsForm` | `./components/PaymentMethodsForm` | Payment methods form |

### 💡 **Suggestion Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `SuggestButton` | `./components/suggestions/SuggestButton` | Suggestion button |

### 🛒 **Cart Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `ShoppingCartModal` | `./components/cart/ShoppingCart` | Shopping cart modal |

### 🆘 **Support Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `FAQChatbot` | `./components/support/FAQChatbot` | FAQ chatbot |

### 📄 **Page Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `PublicBuyRequestsPage` | `./pages/PublicBuyRequestsPage` | Public buy requests |
| `EnhancedPublicBuyRequestsPage` | `./pages/EnhancedPublicBuyRequestsPage` | Enhanced buy requests |
| `BuyerOffersPage` | `./pages/BuyerOffersPage` | Buyer offers page |
| `InboxPage` | `./pages/InboxPage` | Inbox page |
| `ReviewsTestPage` | `./pages/ReviewsTestPage` | Reviews test page |
| `CartPage` | `./pages/CartPage` | Cart page |
| `TestCartPage` | `./pages/TestCartPage` | Test cart page |

### 🏠 **Dashboard Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `UniversalDashboard` | `./components/dashboard/UniversalDashboard` | Universal dashboard |
| `OrganizationDashboardCard` | `./components/dashboard/OrganizationDashboardCard` | Organization dashboard card |

### 🛒 **Checkout Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `GuestCheckout` | `./components/checkout/GuestCheckout` | Guest checkout process |

### 📄 **PDP Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `ListingPDP` | `./components/pdp/ListingPDP` | Product detail page |

### 🎁 **Referral Components**
| Component | File Path | Description |
|-----------|-----------|-------------|
| `ReferralDashboard` | `./components/referrals/ReferralDashboard` | Referral dashboard |

---

## 🎯 **Inline Components (Defined in App.js)**

### **Main Application Components**
| Component | Description | Purpose |
|-----------|-------------|---------|
| `InlineCartPage` | Simple cart page | Testing cart functionality |
| `Header` | Main navigation header | Site navigation and user menu |
| `Footer` | Site footer | Footer links and information |
| `Homepage` | Landing page | Main entry point |
| `Login` | Login form | User authentication |
| `Register` | Registration form | User registration |
| `AdminDashboardRoute` | Admin dashboard route | Admin dashboard wrapper |
| `UserOrders` | User orders page | Order management for users |
| `SellerOrders` | Seller orders page | Order management for sellers |
| `Dashboard` | Main dashboard | User dashboard |
| `SellerDashboard` | Seller dashboard | Seller-specific dashboard |
| `Marketplace` | Marketplace page | Browse and search listings |
| `BiddingModal` | Bidding modal | Place bids on listings |
| `OrderModal` | Order modal | Create orders |
| `ListingCard` | Listing card | Display listing information |
| `CreateListing` | Create listing form | Add new listings |
| `HowItWorks` | How it works page | Platform explanation |
| `AboutUs` | About us page | Company information |
| `Pricing` | Pricing page | Pricing information |
| `Blog` | Blog page | Blog content |
| `Contact` | Contact page | Contact information |
| `BuyRequestsPage` | Buy requests page | View buy requests |
| `CreateBuyRequestPage` | Create buy request page | Create new buy requests |
| `ProfilePage` | User profile page | User profile management |
| `PaymentMethodsPage` | Payment methods page | Manage payment methods |
| `AddressesPage` | Addresses page | Manage addresses |
| `RequestDetailModal` | Request detail modal | View request details |
| `SendOfferModal` | Send offer modal | Send offers to requests |
| `LoginDialog` | Login dialog | Login modal |
| `ViewOffersModal` | View offers modal | View received offers |
| `BuyerOffersInbox` | Buyer offers inbox | Manage buyer offers |
| `UnifiedInbox` | Unified inbox | Central messaging |
| `ExoticsPage` | Exotics page | Exotic livestock page |

---

## 🔧 **UI Components (Imported from UI Library)**

### **Form Components**
- `Button`, `Input`, `Label`, `Textarea`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue`
- `Switch`, `Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`

### **Layout Components**
- `Card`, `CardContent`, `CardDescription`, `CardFooter`, `CardHeader`, `CardTitle`
- `Dialog`, `DialogContent`, `DialogDescription`, `DialogFooter`, `DialogHeader`, `DialogTitle`, `DialogTrigger`
- `Table`, `TableBody`, `TableCell`, `TableHead`, `TableHeader`, `TableRow`

### **Display Components**
- `Badge`, `Avatar`, `AvatarFallback`
- `Alert`, `AlertDescription`
- `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuLabel`, `DropdownMenuSeparator`, `DropdownMenuTrigger`

---

## 📊 **Component Statistics**

### **Total Components: 150+**
- **Authentication Components**: 7
- **Organization Components**: 4
- **Location & Geofencing**: 4
- **Notification Components**: 3
- **Blog Components**: 2
- **Legal Components**: 2
- **Buy Request Components**: 3
- **Admin Components**: 13
- **Seller Components**: 14
- **Buyer Components**: 3
- **Analytics Components**: 1
- **Order Components**: 3
- **Report Components**: 1
- **Settings Components**: 2
- **KYC Components**: 1
- **Layout Components**: 2
- **Demo Components**: 1
- **Payment Components**: 1
- **Suggestion Components**: 1
- **Cart Components**: 1
- **Support Components**: 1
- **Page Components**: 7
- **Dashboard Components**: 2
- **Checkout Components**: 1
- **PDP Components**: 1
- **Referral Components**: 1
- **Inline Components**: 35
- **UI Library Components**: 20+

---

## 🎯 **Component Architecture Patterns**

### **1. Page-Level Components**
- Full-page components that handle routing and layout
- Examples: `Homepage`, `Marketplace`, `Dashboard`, `AdminDashboard`

### **2. Feature Components**
- Components that handle specific features
- Examples: `Wishlist`, `PriceAlerts`, `SellerAnalytics`

### **3. Modal Components**
- Overlay components for specific actions
- Examples: `BiddingModal`, `OrderModal`, `LoginDialog`

### **4. Layout Components**
- Components that provide structure and layout
- Examples: `Header`, `Footer`, `DashboardLayout`

### **5. Form Components**
- Components for data input and editing
- Examples: `CreateListing`, `CreateBuyRequestForm`, `PaymentMethodsForm`

### **6. Display Components**
- Components for showing data and information
- Examples: `ListingCard`, `ListingPDP`, `SellerProfile`

---

## 🔄 **Component Dependencies**

### **High-Level Dependencies**
- **React Router**: Navigation and routing
- **Axios**: API communication
- **Lucide React**: Icon library
- **Custom UI Library**: Reusable UI components

### **State Management**
- **React Context**: Global state management
- **useState/useEffect**: Local component state
- **Custom Hooks**: Reusable state logic

### **Authentication Flow**
- **AuthProvider**: Global authentication context
- **ProtectedRoute**: Route protection
- **PublicOnlyRoute**: Public-only routes

---

This comprehensive component inventory provides a complete overview of all components used in the StockLot frontend application, organized by functionality and purpose for easy reference and maintenance.

