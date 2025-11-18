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

function Dashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({});

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      const response = await apiCall('GET', '/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold text-emerald-900 mb-4">Please Login</h2>
            <p className="text-emerald-600 mb-4">You need to be logged in to access the dashboard.</p>
            <Link to="/login">
              <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                Login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isSeller = user.roles.includes('seller');
  const isBuyer = user.roles.includes('buyer');

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-900 mb-2">Dashboard</h1>
          <p className="text-emerald-700">Manage your livestock marketplace activities</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 lg:grid-cols-5 mb-8">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            {isBuyer && <TabsTrigger value="orders">My Orders</TabsTrigger>}
            {isSeller && <TabsTrigger value="listings">My Listings</TabsTrigger>}
            {isSeller && <TabsTrigger value="sales">My Sales</TabsTrigger>}
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Organization Dashboard Card - Prominent Display */}
            {isSeller && (
              <OrganizationDashboardCard user={user} />
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {isBuyer && (
                <Card className="border-emerald-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-emerald-600 text-sm font-medium">My Orders</p>
                        <p className="text-2xl font-bold text-emerald-900">{stats?.buyer_orders || 0}</p>
                      </div>
                      <ShoppingCart className="h-8 w-8 text-emerald-600" />
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {isSeller && (
                <>
                  <Card className="border-emerald-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-emerald-600 text-sm font-medium">My Listings</p>
                          <p className="text-2xl font-bold text-emerald-900">{stats?.seller_listings || 0}</p>
                        </div>
                        <Package className="h-8 w-8 text-emerald-600" />
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-emerald-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-emerald-600 text-sm font-medium">Sales</p>
                          <p className="text-2xl font-bold text-emerald-900">{stats?.seller_orders || 0}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-emerald-600" />
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-900">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {isSeller && (
                    <Link to="/create-listing">
                      <Button className="w-full justify-start bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                        <Plus className="mr-2 h-4 w-4" />
                        Create New Listing
                      </Button>
                    </Link>
                  )}
                  <Link to="/marketplace">
                    <Button variant="outline" className="w-full justify-start border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                      <Search className="mr-2 h-4 w-4" />
                      Browse Marketplace
                    </Button>
                  </Link>
                  <Button variant="outline" className="w-full justify-start border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Messages
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-900">Account Status</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-emerald-700">Email Verified</span>
                    <Badge className={user.is_verified ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                      {user.is_verified ? "Verified" : "Pending"}
                    </Badge>
                  </div>
                  {isSeller && (
                    <div className="flex items-center justify-between">
                      <span className="text-emerald-700">KYC Status</span>
                      <Badge className={user.kyc_status === 'approved' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>
                        {user.kyc_status === 'approved' ? "Approved" : "Pending"}
                      </Badge>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {isBuyer && (
            <TabsContent value="orders">
              <UserOrders />
            </TabsContent>
          )}

          {isSeller && (
            <TabsContent value="listings">
              <Card className="border-emerald-200">
                <CardHeader>
                  <CardTitle className="text-emerald-900">My Listings</CardTitle>
                  <CardDescription>Manage your livestock listings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-emerald-600">No listings yet. Create your first listing to start selling.</p>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {isSeller && (
            <TabsContent value="sales">
              <SellerOrders />
            </TabsContent>
          )}

          <TabsContent value="profile">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-900">Profile Settings</CardTitle>
                <CardDescription>Manage your account information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-emerald-800">Full Name</Label>
                    <Input value={user.full_name} readOnly className="border-emerald-200" />
                  </div>
                  <div>
                    <Label className="text-emerald-800">Email</Label>
                    <Input value={user.email} readOnly className="border-emerald-200" />
                  </div>
                  <div>
                    <Label className="text-emerald-800">Phone</Label>
                    <Input value={user.phone || ''} placeholder="Add phone number" className="border-emerald-200" />
                  </div>
                  <div>
                    <Label className="text-emerald-800">Roles</Label>
                    <div className="flex space-x-2 mt-2">
                      {(user.roles || []).map(role => (
                        <Badge key={role} className="bg-emerald-100 text-emerald-700 capitalize">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                  Update Profile
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}