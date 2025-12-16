import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';

// 🚀 API Optimization - Initialize early to catch all API calls
import SmartAPIInterceptor from './services/SmartAPIInterceptor';

// Initialize API optimization immediately
if (process.env.NODE_ENV === 'production' || window.location.hostname.includes('preview')) {
  SmartAPIInterceptor.initialize();
  console.log('🚀 API Optimization enabled');
}

// Enhanced Auth imports
import { AuthProvider, AuthGate, useAuth } from './auth/AuthProvider';
import { FeatureFlagsProvider } from './providers/FeatureFlagsProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import PublicOnlyRoute from './auth/PublicOnlyRoute';
import EmailVerificationPage from './components/auth/EmailVerificationPage';
import PasswordResetPage from './components/auth/PasswordResetPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';

import CreateOrganizationPage from './components/orgs/CreateOrganizationPage';
import OrganizationDashboard from './components/orgs/OrganizationDashboard';
import EnhancedRegister from './components/auth/EnhancedRegister';
import TwoFactorManagement from './components/auth/TwoFactorManagement';
import GuestCheckout from './components/checkout/GuestCheckout';

// Import new components
import ReferralDashboard from './components/referrals/ReferralDashboard';
import BlogList from './components/blog/BlogList';
import BlogEditor from './components/blog/BlogEditor';
import TermsOfService from './components/legal/TermsOfService';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import AdminAnalyticsOverview from './components/admin/AdminAnalyticsOverview';
import AdminAnalyticsPDP from './components/admin/AdminAnalyticsPDP';
import AdminSellerPerformance from './components/admin/AdminSellerPerformance';
import UserModeration from './components/admin/UserModeration';
import AdminExperiments from './components/admin/AdminExperiments';
import AdminExperimentResults from './components/admin/AdminExperimentResults';
import ReviewModeration from './components/admin/ReviewModeration';
import ListingsModeration from './components/admin/ListingsModeration';
import BuyRequestModeration from './components/admin/BuyRequestModeration';
import AdminRevenueReport from './components/admin/AdminRevenueReport';
import RolesQueue from './components/admin/RolesQueue';
import InventoryBulkUpdate from './components/seller/InventoryBulkUpdate';
import SellerAnalytics from './components/seller/SellerAnalytics';
import SellerCampaigns from './components/seller/SellerCampaigns';
import SellerOffers from './components/seller/SellerOffers';
import Wishlist from './components/buyer/Wishlist';
import PriceAlerts from './components/buyer/PriceAlerts';

// New integrated components
import SellerShippingRates from './components/seller/SellerShippingRates';
import MonthlyTradingStatements from './components/analytics/MonthlyTradingStatements';

// Dashboard component imports
import UniversalDashboard from './components/dashboard/UniversalDashboard';

// Orders components
import MyOrders from './components/orders/MyOrders';
import OrderTracking from './components/orders/OrderTracking';
import OrderHistory from './components/orders/OrderHistory';

// Seller components  
import MyListings from './components/seller/MyListings';
import ListingPerformance from './components/seller/ListingPerformance';
import CustomerReviews from './components/seller/CustomerReviews';

// Settings components
import NotificationSettings from './components/settings/NotificationSettings';

// Buyer components
import SavedSearches from './components/buyer/SavedSearches';

// Reports components
import TaxReports from './components/reports/TaxReports';

// Settings components  
import AlertPreferences from './components/settings/AlertPreferences';

// KYC components
import KYCVerification from './components/kyc/KYCVerification';

// Layout Components
import DashboardLayout from './components/layout/DashboardLayout';
import SellerProfileLayout from './components/seller/SellerProfileLayout';
import BasicInfo from './components/seller/profile/BasicInfo';
import BusinessInfo from './components/seller/profile/BusinessInfo';
import SidebarDemo from './components/demo/SidebarDemo';

// Wallet Components
import CreditWallet from './components/wallet/CreditWallet';

import FAQChatbot from './components/support/FAQChatbot';
import ReviewsTestPage from './pages/ReviewsTestPage';
import CartPage from './pages/CartPage';
import LoginGate from './components/auth/LoginGate';

// Import comprehensive PDP component
import ListingPDP from './components/pdp/ListingPDP';

// PDP and Seller Profile imports

import SellerProfile from './components/seller/SellerProfile';

import "./App.css";
import Homepage from "./components/pagesNo/Home";
import Header from "./components/ui/common/Header";
import Footer from "./components/ui/common/Footer";
import Login from "./components/pagesNo/Login";
// import CreateListing from "./components/pages/CreateListing";
import CreateBuyRequestPage from "./components/pagesNo/CreateByRequestPage";
import PaymentMethodsPage from "./components/pagesNo/PaymentMethodsPage";
import CreateListing from "./components/pagesNo/CreateListing";
import ProfilePage from "./components/pagesNo/ProfilePage";
import AddressesPage from "./components/pagesNo/AddressesPage";
import SellerDashboard from "./components/pagesNo/SellerDashboard";
import BuyerOffersInbox from "./components/pagesNo/BuyerOffersInbox";
import AdminDashboardRoute from "./components/pagesNo/AdminDashboardRoute";
import UnifiedInboxPage from "./pages/UnifiedInboxPage";
import Marketplace from "./components/pagesNo/Marketplace";
import ExoticsPage from "./components/pagesNo/ExoticsPage";
import BuyRequestsPage from "./components/pagesNo/BuyRequestsPage";
import HowItWorks from "./components/pagesNo/HowItWorks";
import AboutUs from "./components/pagesNo/AboutUs";
import Pricing from "./components/pagesNo/Pricing";
import Contact from "./components/pagesNo/Contact";
import RequestDetailModal from "./components/pagesNo/RequestDetailModal";
import SendOfferModal from "./components/buyRequests/SendOfferModal";
import LoginDialog from "./components/pagesNo/LoginDialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://apilifestock.aamardokan.online';
const API = `${BACKEND_URL}/api`;

console.log("Backend URL:", BACKEND_URL,API);



// Main App component
function App() {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleOpenLogin = () => {
    setShowLoginModal(true);
  };

  const handleCloseLogin = () => {
    setShowLoginModal(false);
  };

  const handleLoginSuccess = (userData) => {
    setShowLoginModal(false);
    // Refresh page or update auth state
    window.location.reload();
  };

  return (
    <FeatureFlagsProvider>
    <AuthProvider>
      <AuthGate>
        <Router>
          <div className="App">
              <Header/>
            <main className="min-h-screen">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Homepage />} />
                <Route path="/sidebar-demo" element={<SidebarDemo />} />
                <Route path="/debug-cart" element={<div>Debug cart route working!</div>} />
                
                {/* Email verification and password reset routes */}
                <Route path="/verify-email" element={<EmailVerificationPage />} />
                <Route path="/reset-password" element={<PasswordResetPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                
                {/* Public-only routes (redirect if authenticated) */}
                <Route element={<PublicOnlyRoute redirectTo="/marketplace" />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<EnhancedRegister />} />
                </Route>
                
                {/* Protected routes (require authentication) */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/create-listing" element={<CreateListing />} />
                  <Route path="/create-buy-request" element={<CreateBuyRequestPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/payment-methods" element={<PaymentMethodsPage />} />
                  <Route path="/addresses" element={<AddressesPage />} />
                  <Route path="/account/credit-wallet" element={<CreditWallet />} />
                  <Route path="/dashboard" element={<UniversalDashboard />} />
                  <Route path="/seller/dashboard" element={<SellerDashboard />} />
                  <Route path="/create-organization" element={<CreateOrganizationPage />} />
                  <Route path="/orgs/:handle/dashboard" element={<OrganizationDashboard />} />
                  <Route path="/referrals" element={<ReferralDashboard />} />
                  <Route path="/offers-inbox" element={<BuyerOffersInbox />} />
                  <Route path="/inbox" element={<UnifiedInboxPage />} />
                  <Route path="/reviews-test" element={<ReviewsTestPage />} />
                  
                  {/* Orders & Tracking Routes */}
                  <Route path="/orders" element={<MyOrders />} />
                  <Route path="/orders/tracking" element={<OrderTracking />} />
                  <Route path="/orders/history" element={<OrderHistory />} />
                  
                  {/* Seller Routes */}
                  <Route path="/seller/listings" element={<MyListings />} />
                  <Route path="/seller/analytics" element={<SellerAnalytics />} />
                  <Route path="/seller/performance" element={<ListingPerformance />} />
                  <Route path="/seller/reviews" element={<CustomerReviews />} />
                  
                  {/* Buyer Routes */}
                  <Route path="/buyer/saved-searches" element={<SavedSearches />} />
                  
                  {/* Reports Routes */}
                  <Route path="/reports/tax" element={<TaxReports />} />
                  
                  {/* Settings Routes */}
                  <Route path="/settings/notifications" element={<NotificationSettings />} />
                  <Route path="/settings/alerts" element={<AlertPreferences />} />
                  
                  {/* Security routes (authenticated) */}
                  <Route path="/auth/two-factor" element={<TwoFactorManagement />} />
                  <Route path="/auth/reset-password" element={<PasswordResetPage />} />
                  <Route path="/kyc" element={<KYCVerification />} />
                </Route>
                
                {/* Admin-only routes */}
                <Route element={<ProtectedRoute roles={['admin']} />}>
                  <Route path="/admin" element={<AdminDashboardRoute />} />
                  <Route path="/admin/blog/create" element={<BlogEditor />} />
                  <Route path="/admin/blog/edit/:id" element={<BlogEditor />} />
                  <Route path="/create-blog" element={<BlogEditor />} />
                  
                  {/* New Admin Analytics Routes */}
                  <Route path="/admin/analytics/overview" element={<AdminAnalyticsOverview />} />
                  <Route path="/admin/analytics/pdp" element={<AdminAnalyticsPDP />} />
                  <Route path="/admin/analytics/sellers/:id" element={<AdminSellerPerformance />} />
                  <Route path="/admin/reports/revenue" element={<AdminRevenueReport />} />
                  
                  {/* Admin Moderation Routes */}
                  <Route path="/admin/moderation/users" element={<UserModeration />} />
                  <Route path="/admin/moderation/listings" element={<ListingsModeration />} />
                  <Route path="/admin/moderation/buy-requests" element={<BuyRequestModeration />} />
                  <Route path="/admin/moderation/reviews" element={<ReviewModeration />} />
                  <Route path="/admin/moderation/roles" element={<RolesQueue />} />
                  
                  {/* Admin A/B Testing Routes */}
                  <Route path="/admin/experiments" element={<AdminExperiments />} />
                  <Route path="/admin/experiments/:id" element={<AdminExperimentResults />} />
                </Route>
                
                {/* Seller Growth Tools Routes */}
                <Route element={<ProtectedRoute roles={['seller']} />}>
                  <Route path="/seller/analytics" element={<SellerAnalytics />} />
                  <Route path="/seller/inventory/bulk" element={<InventoryBulkUpdate />} />
                  <Route path="/seller/promotions" element={<SellerCampaigns />} />
                  <Route path="/seller/offers" element={<SellerOffers />} />
                </Route>
                
                {/* Buyer Personalization Routes */}
                <Route element={<ProtectedRoute roles={['buyer']} />}>
                  <Route path="/buyer/wishlist" element={<Wishlist />} />
                  <Route path="/alerts/prices" element={<PriceAlerts />} />
                </Route>

                {/* ============= NEW SIDEBAR-BASED DASHBOARD LAYOUTS ============= */}
                
                {/* Admin Dashboard with Sidebar */}
                <Route element={<ProtectedRoute roles={['admin']} />}>
                  <Route path="/admin/dashboard/*" element={<DashboardLayout userRole="admin" />}>
                    <Route index element={<AdminAnalyticsOverview />} />
                    <Route path="analytics" element={<AdminAnalyticsOverview />} />
                    <Route path="moderation" element={<UserModeration />} />
                    <Route path="experiments" element={<AdminExperiments />} />
                  </Route>
                </Route>
                
                {/* Seller Dashboard with Sidebar */}
                <Route element={<ProtectedRoute roles={['seller']} />}>
                  <Route path="/seller/dashboard/*" element={<DashboardLayout userRole="seller" />}>
                    <Route index element={<SellerAnalytics />} />
                    <Route path="analytics" element={<SellerAnalytics />} />
                    <Route path="listings" element={<div>Seller Listings</div>} />
                    <Route path="orders" element={<div>Seller Orders</div>} />
                    <Route path="shipping-rates" element={<SellerShippingRates />} />
                    <Route path="trading-statements" element={<MonthlyTradingStatements />} />
                  </Route>
                  
                  {/* Seller Profile with Sidebar Navigation */}
                  <Route path="/seller/profile/*" element={<SellerProfileLayout />}>
                    <Route index element={<BasicInfo />} />
                    <Route path="basic" element={<BasicInfo />} />
                    <Route path="business" element={<BusinessInfo />} />
                    <Route path="expertise" element={<div>Expertise Section</div>} />
                    <Route path="photos" element={<div>Photos Section</div>} />
                    <Route path="policies" element={<div>Policies Section</div>} />
                    <Route path="preferences" element={<div>Preferences Section</div>} />
                    <Route path="facility" element={<div>Facility Info Section</div>} />
                    <Route path="experience" element={<div>Experience Section</div>} />
                  </Route>
                </Route>
                
                {/* Buyer Dashboard with Sidebar */}
                <Route element={<ProtectedRoute roles={['buyer']} />}>
                  <Route path="/buyer/dashboard/*" element={<DashboardLayout userRole="buyer" />}>
                    <Route index element={<Wishlist />} />
                    <Route path="orders" element={<div>Buyer Orders</div>} />
                    <Route path="wishlist" element={<Wishlist />} />
                    <Route path="price-alerts" element={<PriceAlerts />} />
                    <Route path="trading-statements" element={<MonthlyTradingStatements />} />
                  </Route>
                </Route>
                
                {/* Public marketplace routes */}
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/exotics" element={<ExoticsPage />} />
                <Route path="/listing/:id" element={<ListingPDP />} />
                <Route path="/seller/:handle" element={<SellerProfile />} />
                <Route path="/buy-requests" element={<BuyRequestsPage onLogin={handleOpenLogin} />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout/guest" element={<GuestCheckout />} />
                <Route path="/checkout" element={<GuestCheckout />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/about" element={<AboutUs />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/blog" element={<BlogList />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/contact" element={<Contact />} />
                
                {/* Error routes */}
                <Route path="/403" element={<div className="text-center p-8"><h1 className="text-2xl font-bold text-red-600">Access Denied</h1><p>You don't have permission to access this page.</p></div>} />
                <Route path="*" element={<div className="text-center p-8"><h1 className="text-2xl font-bold">Page Not Found</h1></div>} />
              </Routes>
            </main>
            <Footer />
          </div>
          
          {/* Global FAQ Chatbot */}
          <FAQChatbot />
          
          {/* Login Modal */}
          <LoginGate
            open={showLoginModal}
            onClose={handleCloseLogin}
            onLogin={handleLoginSuccess}
          />
        </Router>
      </AuthGate>
    </AuthProvider>
    </FeatureFlagsProvider>
  );
}
<>
<RequestDetailModal />
<SendOfferModal />
<LoginDialog />
</>



export default App;