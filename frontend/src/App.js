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


import APIServices from './services/api';
import { 
  Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Input, Label, Textarea, Badge, Avatar, AvatarFallback,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger, Tabs, TabsList, TabsTrigger, TabsContent,
  Switch, Alert, AlertDescription, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "./components/ui";
import { 
  Bell, Search, Menu, X, Users, Package, TrendingUp, DollarSign, 
  Eye, ChevronDown, ChevronUp, Calendar, Clock, MapPin, Phone, Mail, Star, ShoppingCart, 
  CheckCircle, XCircle, AlertTriangle, AlertCircle, Filter, SortAsc, Home, Building, User, Settings, 
  LogOut, Edit, Trash2, Plus, RefreshCw, ArrowRight, ArrowLeft, ArrowLeftRight, Upload, Download, 
  FileText, Image, Video, Play, Pause, BarChart3, PieChart, Zap, Globe, Shield, CreditCard, 
  LayoutDashboard, MessageCircle, Ban, Check, Copy, Heart, Award, Truck, LogIn, Brain
} from "lucide-react";
import LocationPicker from './components/location/LocationPicker';
import GeofenceBanner from './components/geofence/GeofenceBanner';
import RangeBadge from './components/geofence/RangeBadge';
import DeliverableFilterBar from './components/geofence/DeliverableFilterBar';
import ContextSwitcher from './components/seller/ContextSwitcher';
import CreateOrganizationPage from './components/orgs/CreateOrganizationPage';
import OrganizationDashboard from './components/orgs/OrganizationDashboard';
import OrganizationManagement from './components/admin/OrganizationManagement';
import AdminRoleManagement from './components/admin/AdminRoleManagement';
import EnhancedRegister from './components/auth/EnhancedRegister';
import TwoFactorManagement from './components/auth/TwoFactorManagement';
import TwoFactorSetup from './components/auth/TwoFactorSetup';
import OrganizationDashboardCard from './components/dashboard/OrganizationDashboardCard';
import GuestCheckout from './components/checkout/GuestCheckout';

// Import new components
import NotificationBell from './components/notifications/NotificationBell';
import ReferralDashboard from './components/referrals/ReferralDashboard';
import BlogList from './components/blog/BlogList';
import BlogEditor from './components/blog/BlogEditor';
import TermsOfService from './components/legal/TermsOfService';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import CreateBuyRequestForm from './components/buyRequests/CreateBuyRequestForm';
import BuyRequestsList from './components/buyRequests/BuyRequestsList';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminLayoutWithSidebar from './components/admin/AdminLayout';
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
import PaymentMethodsForm from './components/PaymentMethodsForm';

// Wallet Components
import CreditWallet from './components/wallet/CreditWallet';

import SuggestButton from './components/suggestions/SuggestButton';
import ShoppingCartModal from './components/cart/ShoppingCart';
import FAQChatbot from './components/support/FAQChatbot';
import PublicBuyRequestsPage from './pages/PublicBuyRequestsPage';
import EnhancedPublicBuyRequestsPage from './pages/EnhancedPublicBuyRequestsPage';
import EnhancedCreateBuyRequestForm from './components/buyRequests/EnhancedCreateBuyRequestForm';
import BuyerOffersPage from './pages/BuyerOffersPage';
import InboxPage from './pages/InboxPage';
import ReviewsTestPage from './pages/ReviewsTestPage';
import CartPage from './pages/CartPage';
import TestCartPage from './pages/TestCartPage';
import DeliveryRateForm from './components/seller/DeliveryRateForm';
import LoginGate from './components/auth/LoginGate';

// Import comprehensive PDP component
import ListingPDP from './components/pdp/ListingPDP';

// PDP and Seller Profile imports

import SellerProfile from './components/seller/SellerProfile';

import "./App.css";
import Homepage from "./components/pages/Home";
import Header from "./components/ui/common/Header";
import Footer from "./components/ui/common/Footer";
import Login from "./components/pages/Login";
// import CreateListing from "./components/pages/CreateListing";
import CreateBuyRequestPage from "./components/pages/CreateByRequestPage";
import PaymentMethodsPage from "./components/pages/PaymentMethodsPage";
import CreateListing from "./components/pages/CreateListing";
import ProfilePage from "./components/pages/ProfilePage";
import AddressesPage from "./components/pages/AddressesPage";
import SellerDashboard from "./components/pages/SellerDashboard";
import BuyerOffersInbox from "./components/pages/BuyerOffersInbox";
import AdminDashboardRoute from "./components/pages/AdminDashboardRoute";
import UnifiedInboxPage from "./pages/UnifiedInboxPage";
import Marketplace from "./components/pages/Marketplace";
import ExoticsPage from "./components/pages/ExoticsPage";
import BuyRequestsPage from "./components/pages/BuyRequestsPage";
import HowItWorks from "./components/pages/HowItWorks";
import AboutUs from "./components/pages/AboutUs";
import Pricing from "./components/pages/Pricing";
import Contact from "./components/pages/Contact";
import RequestDetailModal from "./components/pages/RequestDetailModal";
import SendOfferModal from "./components/buyRequests/SendOfferModal";
import LoginDialog from "./components/pages/LoginDialog";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://stockdiff-app.preview.emergentagent.com';
const API = `${BACKEND_URL}/api`;

console.log("Backend URL:", BACKEND_URL,API);







{/* <>
<Login />
<Footer />


</> */}






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
                  <Route path="/seller-dashboard" element={<SellerDashboard />} />
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




// Send Offer Modal Component


// Login Dialog Component


// View Offers Modal Component (for buyers to see and accept offers)
function ViewOffersModal({ request, user, onClose, onAcceptOffer }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load offers for the request
  useEffect(() => {
    const loadOffers = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/buy-requests/${request.id}/offers`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load offers');
        }

        const data = await response.json();
        setOffers(data.items || []);
        setError(null);
      } catch (error) {
        console.error('Error loading offers:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (request.id) {
      loadOffers();
    }
  }, [request.id]);

  const getTimeRemaining = (expiresAt) => {
    const deadline = new Date(expiresAt);
    const now = new Date();
    const diff = deadline - now;
    
    if (diff <= 0) return { text: 'Expired', color: 'text-red-600' };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return { text: `${days}d ${hours}h`, color: 'text-green-600' };
    return { text: `${hours}h`, color: 'text-yellow-600' };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-emerald-900 mb-2">
                Offers for: {request.title || `${request.species} Request`}
              </h2>
              <p className="text-gray-600">
                {offers.length} offers received for {request.qty} {request.unit}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-600">Loading offers...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Offers List */}
          {!loading && offers.length > 0 && (
            <div className="space-y-4">
              {offers.map((offer, index) => {
                const timeRemaining = getTimeRemaining(offer.validity_expires_at);
                const unitPrice = offer.unit_price_minor / 100; // Convert from cents
                const totalPrice = unitPrice * offer.qty;
                
                return (
                  <Card key={offer.id} className="border-2 hover:border-emerald-300 transition-colors">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Offer Details */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-lg">Offer #{index + 1}</h4>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-medium">{offer.qty} {request.unit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Unit Price:</span>
                              <span className="font-medium">R{unitPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total:</span>
                              <span className="font-medium text-emerald-600 text-lg">R{totalPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Delivery:</span>
                              <span className="font-medium">
                                {offer.delivery_mode === 'SELLER' ? 'Seller delivers' : 'Buyer pickup'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Seller Info */}
                        <div className="space-y-3">
                          <h5 className="font-medium">Seller Information</h5>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Seller:</span>
                              <span className="font-medium">{offer.seller_name || 'Anonymous'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rating:</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">{offer.seller_rating || 'New'}</span>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Location:</span>
                              <span className="font-medium">{offer.seller_province || 'Not specified'}</span>
                            </div>
                          </div>
                          {offer.notes && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 mb-1">Notes:</p>
                              <p className="text-sm bg-gray-50 p-2 rounded">{offer.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Status & Actions */}
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className={`text-sm font-medium ${timeRemaining.color}`}>
                              {timeRemaining.text} remaining
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Expires: {new Date(offer.validity_expires_at).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              offer.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              offer.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {offer.status?.charAt(0).toUpperCase() + offer.status?.slice(1) || 'Pending'}
                            </span>
                          </div>

                          {offer.status === 'pending' && timeRemaining.text !== 'Expired' && (
                            <Button 
                              onClick={() => onAcceptOffer(offer)}
                              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept & Checkout
                            </Button>
                          )}
                          
                          {timeRemaining.text === 'Expired' && (
                            <Button 
                              variant="outline" 
                              disabled
                              className="w-full"
                            >
                              Expired
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && offers.length === 0 && !error && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No offers yet</h3>
              <p className="text-gray-600">
                Sellers haven't submitted offers for this request yet. Check back later!
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-6 border-t mt-6">
            <div className="text-sm text-gray-600">
              Request deadline: {new Date(request.deadline_at).toLocaleDateString()}
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Buyer Offers Inbox Page - Where buyers see all offers sent to them

// Unified Inbox Page - All notifications and messages


// Exotics Page - Dedicated page for exotic livestock

export default App;