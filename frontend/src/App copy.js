import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation, useParams } from 'react-router-dom';

// Enhanced Auth imports
import { AuthProvider, AuthGate, useAuth } from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';
import PublicOnlyRoute from './auth/PublicOnlyRoute';
import EmailVerificationPage from './components/auth/EmailVerificationPage';
import PasswordResetPage from './components/auth/PasswordResetPage';
import ForgotPasswordPage from './components/auth/ForgotPasswordPage';
import api from './utils/apiHelper';
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
  LogOut, Edit, Trash2, Plus, RefreshCw, ArrowRight, ArrowLeft, Upload, Download, 
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

// Simple inline cart component for testing
function InlineCartPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">🛒 Shopping Cart</h1>
        <p className="text-gray-600">Your cart is empty</p>
      </div>
    </div>
  );
}

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// API helper with auth token (keeping for backward compatibility)
const apiCall = async (method, url, data = null) => {
  const token = localStorage.getItem('token');
  
  try {
    const config = {
      method: method.toUpperCase(),
      url: `${API}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
    };
    
    if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error('API call failed:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

// Header component
function Header() {
  const auth = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  const user = auth.status === 'authenticated' ? auth.user : null;

  // Fetch cart count on component mount
  useEffect(() => {
    if (user) {
      fetchCartCount();
    }
  }, [user]);

  const fetchCartCount = async () => {
    try {
      // Use new API client with automatic cookie handling
      const response = await api.get('/cart');
      setCartItemCount(response.data.item_count || 0);
    } catch (error) {
      console.error('Error fetching cart count:', error);
    }
  };

  const isAdmin = user && (user.roles || []).includes('admin');
  const isSeller = user && (user.roles || []).includes('seller');

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchTerm.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  const handleLogout = () => {
    auth.signOut();
    navigate('/marketplace');
  };

  return (
    <header className="border-b border-emerald-200 pt-3 bg-white/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-600 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">🐄</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent">
                StockLot
              </h1>
              <p className="text-xs text-emerald-600 font-medium">Livestock Marketplace</p>
            </div>
          </Link>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-4 w-4" />
              <Input
                type="text"
                placeholder="Search livestock..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={handleSearch}
                className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-full"
              />
            </div>
          </div>

          {/* Desktop Navigation - Cleaned Up */}
          <nav className="hidden lg:flex items-center space-x-6">
            <Link 
              to="/marketplace" 
              className={`font-medium transition-colors hover:text-emerald-700 ${
                location.pathname === '/marketplace' ? 'text-emerald-700' : 'text-gray-600'
              }`}
            >
              Marketplace
            </Link>
            <Link 
              to="/buy-requests" 
              className={`font-medium transition-colors hover:text-emerald-700 ${
                location.pathname === '/buy-requests' ? 'text-emerald-700' : 'text-gray-600'
              }`}
            >
              Buy Requests
            </Link>
          </nav>

          {/* User Menu / Auth Buttons */}
          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-3">
                {/* Shopping Cart - Always visible */}
                <Button 
                  variant="ghost" 
                  onClick={() => setShowCart(true)}
                  className="relative p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                  title="Shopping Cart"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-emerald-600 text-white text-xs min-w-[20px] h-5 rounded-full flex items-center justify-center">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
                
                <NotificationBell />
                
                {/* Messages/Inbox Button */}
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/inbox')}
                  className="relative p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50"
                  title="Messages & Conversations"
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
                
                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center space-x-2 hover:bg-emerald-50">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-emerald-100 text-emerald-700 font-semibold">
                          {user.full_name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden md:flex flex-col text-left">
                        <p className="text-sm font-medium text-gray-900">{user.full_name}</p>
                        <div className="flex space-x-1">
                          {(user.roles || []).map(role => (
                            <Badge key={role} variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 capitalize">
                              {role}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <ChevronDown className="h-4 w-4 text-gray-500" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    
                    {/* Profile & Settings */}
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profile & Settings
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/payment-methods')}>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Payment Methods
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/addresses')}>
                      <MapPin className="mr-2 h-4 w-4" />
                      Addresses
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    
                    {/* Main Functions */}
                    <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                      <LayoutDashboard className="mr-2 h-4 w-4" />
                      Dashboard
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/inbox')}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Messages
                    </DropdownMenuItem>
                    
                    {user.roles.includes('buyer') && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/buy-requests')}>
                          <ShoppingCart className="mr-2 h-4 w-4" />
                          Buy Requests
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/create-buy-request')}>
                          <Plus className="mr-2 h-4 w-4" />
                          Post Request
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/create-organization')}>
                          <Building className="mr-2 h-4 w-4" />
                          Create Organization
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    {user.roles.includes('seller') && (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/create-listing')}>
                          <Package className="mr-2 h-4 w-4" />
                          Sell Livestock
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuItem onClick={() => navigate('/referrals')}>
                      <Users className="mr-2 h-4 w-4" />
                      Referrals
                    </DropdownMenuItem>
                    
                    {/* Admin Access */}
                    {user.roles.includes('admin') && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => navigate('/admin')} className="text-red-600">
                          <Shield className="mr-2 h-4 w-4" />
                          Admin Panel
                        </DropdownMenuItem>
                      </>
                    )}
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Button 
                  variant="outline" 
                  onClick={() => navigate('/login')}
                  className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  Login
                </Button>
                <Button 
                  onClick={() => navigate('/register')}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                >
                  Sign Up
                </Button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <Button
              variant="ghost"
              size="sm"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search */}
        <div className="md:hidden mt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-emerald-500 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search livestock..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={handleSearch}
              className="pl-10 border-emerald-200 focus:border-emerald-500 focus:ring-emerald-500 rounded-full"
            />
          </div>
        </div>

        {/* Location Picker */}
        <div className="mt-3 flex justify-center">
          <LocationPicker triggerClassName="text-emerald-600 hover:text-emerald-700" />
        </div>

        {/* Context Switcher for Sellers */}
        {isSeller && (
          <div className="mt-3 flex justify-center">
            <ContextSwitcher />
          </div>
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 pb-4 border-t border-emerald-200">
            <nav className="flex flex-col space-y-3 pt-4">
              <Link 
                to="/marketplace" 
                className="font-medium text-gray-600 hover:text-emerald-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Marketplace
              </Link>
              <Link 
                to="/buy-requests" 
                className="font-medium text-gray-600 hover:text-emerald-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Buy Requests
              </Link>
              {/* Authenticated User Links */}
              {user && (
                <>
                  {user.roles?.includes('buyer') && (
                    <>
                      <Link 
                        to="/my-buy-requests" 
                        className="font-medium text-gray-600 hover:text-emerald-700 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        My Buy Requests
                      </Link>
                      <Link 
                        to="/offers-inbox" 
                        className="font-medium text-gray-600 hover:text-emerald-700 transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Offers Inbox
                      </Link>
                    </>
                  )}
                  {user.roles?.includes('seller') && (
                    <Link 
                      to="/seller-dashboard" 
                      className="font-medium text-gray-600 hover:text-emerald-700 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Seller Dashboard
                    </Link>
                  )}
                </>
              )}
              {user && (
                <Link 
                  to="/create-buy-request" 
                  className="font-medium text-gray-600 hover:text-emerald-700 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Post Request
                </Link>
              )}
              <Link 
                to="/how-it-works" 
                className="font-medium text-gray-600 hover:text-emerald-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              {user && (
                <Link 
                  to="/dashboard" 
                  className="font-medium text-gray-600 hover:text-emerald-700 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
              )}
              {isSeller && (
                <Link 
                  to="/create-listing" 
                  className="font-medium text-gray-600 hover:text-emerald-700 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sell Livestock
                </Link>
              )}
              {isAdmin && (
                <Link 
                  to="/admin" 
                  className="font-medium text-gray-600 hover:text-emerald-700 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Admin
                </Link>
              )}
              <Link 
                to="/contact" 
                className="font-medium text-gray-600 hover:text-emerald-700 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </Link>
            </nav>
          </div>
        )}
      </div>
      
      {/* Shopping Cart Modal */}
      <ShoppingCartModal 
        isOpen={showCart} 
        onClose={() => setShowCart(false)}
        onCartUpdate={setCartItemCount}
      />
    </header>
  );
}

// Footer component
function Footer() {
  const [socialSettings, setSocialSettings] = useState({
    facebookUrl: '',
    twitterUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    linkedinUrl: ''
  });

  // Load social media settings from admin configuration
  useEffect(() => {
    const loadSocialSettings = async () => {
      try {
        const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
        const response = await fetch(`${backendUrl}/api/platform/config`);
        
        // Check if response is OK and content-type is JSON
        const contentType = response.headers.get('content-type');
        const isJson = contentType && contentType.includes('application/json');
        
        if (response.ok && isJson) {
          const config = await response.json();
          const settings = config.settings || {};
          const socialMedia = settings.social_media || {};
          console.log('Loaded social settings:', socialMedia);
          setSocialSettings({
            facebookUrl: socialMedia.facebook || socialMedia.facebook_url || 'https://facebook.com/stocklot',
            twitterUrl: socialMedia.twitter || socialMedia.x_url || 'https://x.com/stocklotmarket',
            instagramUrl: socialMedia.instagram || socialMedia.instagram_url || 'https://instagram.com/stocklot',
            youtubeUrl: socialMedia.youtube || socialMedia.youtube_url || 'https://www.youtube.com/@stocklotmarket',
            linkedinUrl: socialMedia.linkedin || socialMedia.linkedin_url || 'https://www.linkedin.com/company/stocklotmarket'
          });
        } else {
          // Set fallback social media URLs if endpoint doesn't exist or returns non-JSON
          setSocialSettings({
            facebookUrl: 'https://facebook.com/stocklot',
            twitterUrl: 'https://x.com/stocklotmarket',
            instagramUrl: 'https://instagram.com/stocklot',
            youtubeUrl: 'https://www.youtube.com/@stocklotmarket',
            linkedinUrl: 'https://www.linkedin.com/company/stocklotmarket'
          });
        }
      } catch (error) {
        console.error('Failed to load social settings:', error);
        // Set fallback social media URLs on error
        setSocialSettings({
          facebookUrl: 'https://facebook.com/stocklot',
          twitterUrl: 'https://x.com/stocklotmarket',
          instagramUrl: 'https://instagram.com/stocklot',
          youtubeUrl: 'https://www.youtube.com/@stocklotmarket',
          linkedinUrl: 'https://www.linkedin.com/company/stocklotmarket'
        });
      }
    };
    
    loadSocialSettings();
  }, []);

  return (
    <footer className="bg-emerald-900 p-6 pt-8 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg font-bold">🐄</span>
              </div>
              <h3 className="text-xl font-bold text-emerald-100">StockLot</h3>
            </div>
            <p className="text-emerald-200 text-sm leading-relaxed">
              South Africa's premier livestock marketplace, connecting farmers and buyers nationwide with secure escrow payments and comprehensive animal taxonomy.
            </p>
            
            {/* Social Media Buttons */}
            <div className="flex space-x-2">
              
              {socialSettings.facebookUrl && (
                <a 
                  href={socialSettings.facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  title="Follow us on Facebook"
                >
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
              )}
              
              {socialSettings.twitterUrl && (
                <a 
                  href={socialSettings.twitterUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-black hover:bg-gray-800 rounded-md transition-colors"
                  title="Follow us on X/Twitter"
                >
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
              )}
              
              {socialSettings.instagramUrl && (
                <a 
                  href={socialSettings.instagramUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-md transition-colors"
                  title="Follow us on Instagram"
                >
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
              )}
              
              {socialSettings.youtubeUrl && (
                <a 
                  href={socialSettings.youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                  title="Subscribe to our YouTube channel"
                >
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              )}
              
              {socialSettings.linkedinUrl && (
                <a 
                  href={socialSettings.linkedinUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-1.5 bg-blue-700 hover:bg-blue-800 rounded-md transition-colors"
                  title="Connect with us on LinkedIn"
                >
                  <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              )}
              
              {/* Show email as fallback if no social media is configured */}
              {!socialSettings.facebookUrl && !socialSettings.twitterUrl && !socialSettings.instagramUrl && !socialSettings.youtubeUrl && !socialSettings.linkedinUrl && (
                <a 
                  href="mailto:hello@stocklot.farm"
                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-md transition-colors"
                  title="Email us"
                >
                  <Mail className="h-4 w-4 text-white" />
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="font-semibold text-emerald-100 text-lg">Quick Links</h4>
            <div className="flex flex-col space-y-2 text-sm">
              <Link to="/marketplace" className="text-emerald-200 hover:text-emerald-100 transition-colors">Browse Animals</Link>
              <Link to="/how-it-works" className="text-emerald-200 hover:text-emerald-100 transition-colors">How It Works</Link>
              <Link to="/about" className="text-emerald-200 hover:text-emerald-100 transition-colors">About Us</Link>
              <Link to="/pricing" className="text-emerald-200 hover:text-emerald-100 transition-colors">Pricing</Link>
              <Link to="/blog" className="text-emerald-200 hover:text-emerald-100 transition-colors">Blog</Link>
              <Link to="/contact" className="text-emerald-200 hover:text-emerald-100 transition-colors">Contact Us</Link>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-4">
            <h4 className="font-semibold text-emerald-100 text-lg">Categories</h4>
            <div className="flex flex-col space-y-2 text-sm">
              <Link to="/marketplace?category=poultry" className="text-emerald-200 hover:text-emerald-100 transition-colors">Chickens & Poultry</Link>
              <Link to="/marketplace?category=ruminants" className="text-emerald-200 hover:text-emerald-100 transition-colors">Cattle & Goats</Link>
              <Link to="/marketplace?category=sheep" className="text-emerald-200 hover:text-emerald-100 transition-colors">Sheep</Link>
              <Link to="/marketplace?category=free-range" className="text-emerald-200 hover:text-emerald-100 transition-colors">Free Range</Link>
              <Link to="/marketplace" className="text-emerald-200 hover:text-emerald-100 transition-colors">View All Categories</Link>
            </div>
          </div>

          {/* Support & Help */}
          <div className="space-y-4">
            <h4 className="font-semibold text-emerald-100 text-lg">Support & Help</h4>
            <div className="flex flex-col space-y-3 text-sm">
              <div className="flex items-center space-x-2 text-emerald-200">
                <Mail className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                <span>hello@stocklot.farm</span>
              </div>
            </div>
            <div className="pt-4">
              <h5 className="font-medium text-emerald-100 mb-2">Trust & Safety</h5>
              <div className="flex flex-col space-y-2 text-xs">
                <div className="flex items-center space-x-2 text-emerald-200">
                  <Shield className="h-3 w-3 text-emerald-400" />
                  <span>Secure Payments</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-200">
                  <Award className="h-3 w-3 text-emerald-400" />
                  <span>Verified Sellers</span>
                </div>
                <div className="flex items-center space-x-2 text-emerald-200">
                  <Clock className="h-3 w-3 text-emerald-400" />
                  <span>24/7 Support</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-emerald-800 mt-8 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-emerald-300 text-sm">
              © 2024 StockLot. All rights reserved. | Connecting South Africa's Farmers | 
              <Link to="/privacy" className="text-emerald-200 hover:text-emerald-100 ml-1">Privacy Policy</Link> | 
              <Link to="/terms" className="text-emerald-200 hover:text-emerald-100 ml-1">Terms of Service</Link>
            </p>
            <SuggestButton compact />
          </div>
        </div>
      </div>
    </footer>
  );
}

// Enhanced Homepage Component with All Landing Page Sections
function Homepage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    total_listings: 0,
    total_users: 0,
    total_orders: 0
  });
  const [showFlash, setShowFlash] = useState(true);
  const [featuredListings, setFeaturedListings] = useState([]);

  useEffect(() => {
    // Load stats from API
    loadStats();
    loadFeaturedListings();
    
    // Hide flash screen after 3 seconds
    const timer = setTimeout(() => {
      setShowFlash(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const loadStats = async () => {
    try {
      const response = await apiCall('GET', '/admin/stats');
      setStats(response.data);
    } catch (error) {
      // Fallback to demo numbers
      setStats({
        total_listings: 15,
        total_users: 50,
        total_orders: 25
      });
    }
  };

  const loadFeaturedListings = async () => {
    try {
      const response = await apiCall('GET', '/listings');
      setFeaturedListings((response.data || []).slice(0, 3)); // Get first 3 listings with fallback
    } catch (error) {
      console.error('Error loading featured listings:', error);
      setFeaturedListings([]); // Set empty array as fallback
    }
  };

  const handleCategoryClick = (category) => {
    navigate('/marketplace');
  };

  const handleSearch = (searchTerm) => {
    if (searchTerm.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="homepage">
      {/* Flash Screen */}
      {showFlash && (
        <div className="flash-screen">
          <div className="flash-content">
            <div className="flash-logo">
              <i className="fas fa-cow"></i>
            </div>
            <h1 className="flash-title">StockLot</h1>
            <p className="flash-subtitle">South Africa's Premier Livestock Marketplace</p>
            <div className="progress-bar">
              <div className="progress"></div>
            </div>
            <div className="animal-icons">
              <span className="animal-icon">🐔</span>
              <span className="animal-icon">🐐</span>
              <span className="animal-icon">🐄</span>
              <span className="animal-icon">🐑</span>
              <span className="animal-icon">🦆</span>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="hero">
        <div className="container hero-content">
          <h1 className="hero-title">South Africa's Premier Livestock Marketplace</h1>
          <p className="hero-subtitle">
            Buy and sell chickens, goats, cattle, and more with secure escrow payments. 
            From day-old chicks to breeding stock, find quality livestock from trusted farmers.
          </p>
          <div className="hero-buttons">
            <Button 
              onClick={() => navigate('/marketplace')}
              className="btn-primary bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 text-lg"
            >
              Browse Animals
            </Button>
            <Button 
              onClick={() => navigate('/register')}
              variant="outline"
              className="btn-secondary border-2 border-white text-white hover:bg-white hover:text-emerald-600 px-8 py-3 text-lg"
            >
              Start Selling
            </Button>
          </div>
          <div className="hero-stats">
            <div className="stat">
              <div className="stat-number">{stats?.total_listings || 0}+</div>
              <div className="stat-label">Active Listings</div>
            </div>
            <div className="stat">
              <div className="stat-number">{stats?.total_users || 0}+</div>
              <div className="stat-label">Active Users</div>
            </div>
            <div className="stat">
              <div className="stat-number">{stats?.total_orders || 0}+</div>
              <div className="stat-label">Orders Completed</div>
            </div>
            <div className="stat">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfaction Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">Why Choose StockLot?</h2>
          <p className="section-subtitle">
            We provide a secure and efficient platform for buying and selling livestock across South Africa
          </p>
          <div className="features-grid">
            <Card className="feature-card border-emerald-200">
              <CardContent className="text-center p-8">
                <div className="feature-icon">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="feature-title text-xl font-semibold mb-4">Secure Escrow Payments</h3>
                <p className="feature-description text-emerald-700">
                  Funds held safely until delivery confirmation. Your money is protected with our secure payment system powered by trusted providers.
                </p>
              </CardContent>
            </Card>
            
            <Card className="feature-card border-emerald-200">
              <CardContent className="text-center p-8">
                <div className="feature-icon">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <h3 className="feature-title text-xl font-semibold mb-4">Verified Animals & Sellers</h3>
                <p className="feature-description text-emerald-700">
                  All sellers verified with ratings and reviews. Vet certificates and health documentation ensure quality livestock.
                </p>
              </CardContent>
            </Card>
            
            <Card className="feature-card border-emerald-200">
              <CardContent className="text-center p-8">
                <div className="feature-icon">
                  <Search className="h-8 w-8" />
                </div>
                <h3 className="feature-title text-xl font-semibold mb-4">Smart AI Search</h3>
                <p className="feature-description text-emerald-700">
                  Find exactly what you need with natural language search. "50 Boer goats in Limpopo under R1000" - we understand you!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories">
        <div className="container">
          <h2 className="section-title">Popular Categories</h2>
          <p className="section-subtitle">Browse through our comprehensive livestock categories</p>
          <div className="categories-grid">
            <Card 
              className="category-card cursor-pointer hover:shadow-lg transition-all border-emerald-200"
              onClick={() => handleCategoryClick('poultry')}
            >
              <CardContent className="text-center p-6">
                <span className="category-icon text-5xl mb-4 block">🐔</span>
                <h3 className="category-title text-lg font-semibold mb-2">Poultry</h3>
                <p className="category-description text-emerald-600 text-sm">Chickens, Ducks, Geese, Turkeys</p>
              </CardContent>
            </Card>
            
            <Card 
              className="category-card cursor-pointer hover:shadow-lg transition-all border-emerald-200"
              onClick={() => handleCategoryClick('ruminants')}
            >
              <CardContent className="text-center p-6">
                <span className="category-icon text-5xl mb-4 block">🐄</span>
                <h3 className="category-title text-lg font-semibold mb-2">Ruminants</h3>
                <p className="category-description text-emerald-600 text-sm">Cattle, Goats, Sheep</p>
              </CardContent>
            </Card>
            
            <Card 
              className="category-card cursor-pointer hover:shadow-lg transition-all border-emerald-200"
              onClick={() => handleCategoryClick('rabbits')}
            >
              <CardContent className="text-center p-6">
                <span className="category-icon text-5xl mb-4 block">🐰</span>
                <h3 className="category-title text-lg font-semibold mb-2">Rabbits</h3>
                <p className="category-description text-emerald-600 text-sm">Meat, Fur, Breeding Stock</p>
              </CardContent>
            </Card>
            
            <Card 
              className="category-card cursor-pointer hover:shadow-lg transition-all border-emerald-200"
              onClick={() => handleCategoryClick('aquaculture')}
            >
              <CardContent className="text-center p-6">
                <span className="category-icon text-5xl mb-4 block">🐟</span>
                <h3 className="category-title text-lg font-semibold mb-2">Aquaculture</h3>
                <p className="category-description text-emerald-600 text-sm">Fish, Fry, Fingerlings</p>
              </CardContent>
            </Card>
            
            <Card 
              className="category-card cursor-pointer hover:shadow-lg transition-all border-emerald-200"
              onClick={() => handleCategoryClick('free-range')}
            >
              <CardContent className="text-center p-6">
                <span className="category-icon text-5xl mb-4 block">🌿</span>
                <h3 className="category-title text-lg font-semibold mb-2">Free Range</h3>
                <p className="category-description text-emerald-600 text-sm">Certified Organic Livestock</p>
              </CardContent>
            </Card>
            
            <Card 
              className="category-card cursor-pointer hover:shadow-lg transition-all border-emerald-200"
              onClick={() => handleCategoryClick('other')}
            >
              <CardContent className="text-center p-6">
                <span className="category-icon text-5xl mb-4 block">🕊️</span>
                <h3 className="category-title text-lg font-semibold mb-2">Others</h3>
                <p className="category-description text-emerald-600 text-sm">Pigeons, Guinea Pigs</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Stock Section */}
      <section className="featured-stock">
        <div className="container">
          <h2 className="section-title">Featured Stock</h2>
          <p className="section-subtitle">Check out some of our premium livestock available for sale</p>
          <div className="stock-grid">
            {featuredListings.length > 0 ? (
              featuredListings.map((listing, index) => (
                <Card key={listing.id} className="stock-card border-emerald-200 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/listing/${listing.id}`)}>
                  <div className="stock-badge">
                    {index === 0 ? 'Premium' : index === 1 ? 'New' : 'Popular'}
                  </div>
                  <div className="stock-image">
                    <div className="placeholder-image bg-gradient-to-br from-emerald-100 to-green-100 h-48 flex items-center justify-center">
                      <span className="text-6xl">
                        {listing.title?.includes('Chicken') ? '🐔' : 
                         listing.title?.includes('Goat') ? '🐐' : 
                         listing.title?.includes('Cattle') ? '🐄' : '🐾'}
                      </span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="stock-title text-lg font-semibold mb-2">{listing.title}</h3>
                    <div className="stock-price text-xl font-bold text-emerald-600 mb-2">R{listing.price_per_unit}</div>
                    <div className="stock-info flex justify-between text-sm text-emerald-600 mb-3">
                      <span><MapPin className="inline h-4 w-4 mr-1" />{listing.city || listing.region}</span>
                      <span>Qty: {listing.quantity}</span>
                    </div>
                    <div className="stock-seller flex items-center gap-2">
                      <div className="seller-avatar w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="seller-name text-sm text-emerald-700">Verified Seller</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              // Demo featured stock
              <>
                <Card className="stock-card border-emerald-200 hover:shadow-lg transition-shadow">
                  <div className="stock-badge">Premium</div>
                  <div className="stock-image">
                    <div className="placeholder-image bg-gradient-to-br from-emerald-100 to-green-100 h-48 flex items-center justify-center">
                      <span className="text-6xl">🐄</span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="stock-title text-lg font-semibold mb-2">Premium Angus Cattle</h3>
                    <div className="stock-price text-xl font-bold text-emerald-600 mb-2">R25,000</div>
                    <div className="stock-info flex justify-between text-sm text-emerald-600 mb-3">
                      <span><MapPin className="inline h-4 w-4 mr-1" />Free State</span>
                      <span>450 kg</span>
                    </div>
                    <div className="stock-seller flex items-center gap-2">
                      <div className="seller-avatar w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="seller-name text-sm text-emerald-700">Van der Merwe Farms</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stock-card border-emerald-200 hover:shadow-lg transition-shadow">
                  <div className="stock-badge">New</div>
                  <div className="stock-image">
                    <div className="placeholder-image bg-gradient-to-br from-emerald-100 to-green-100 h-48 flex items-center justify-center">
                      <span className="text-6xl">🐐</span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="stock-title text-lg font-semibold mb-2">Purebred Boer Goats</h3>
                    <div className="stock-price text-xl font-bold text-emerald-600 mb-2">R3,500</div>
                    <div className="stock-info flex justify-between text-sm text-emerald-600 mb-3">
                      <span><MapPin className="inline h-4 w-4 mr-1" />Limpopo</span>
                      <span>45 kg</span>
                    </div>
                    <div className="stock-seller flex items-center gap-2">
                      <div className="seller-avatar w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="seller-name text-sm text-emerald-700">Khumalo Livestock</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="stock-card border-emerald-200 hover:shadow-lg transition-shadow">
                  <div className="stock-badge">Popular</div>
                  <div className="stock-image">
                    <div className="placeholder-image bg-gradient-to-br from-emerald-100 to-green-100 h-48 flex items-center justify-center">
                      <span className="text-6xl">🐔</span>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <h3 className="stock-title text-lg font-semibold mb-2">Layer Chickens (100 units)</h3>
                    <div className="stock-price text-xl font-bold text-emerald-600 mb-2">R3,200</div>
                    <div className="stock-info flex justify-between text-sm text-emerald-600 mb-3">
                      <span><MapPin className="inline h-4 w-4 mr-1" />Western Cape</span>
                      <span>20 weeks old</span>
                    </div>
                    <div className="stock-seller flex items-center gap-2">
                      <div className="seller-avatar w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center">
                        <User className="h-4 w-4 text-emerald-600" />
                      </div>
                      <span className="seller-name text-sm text-emerald-700">De Jong Poultry</span>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Featured Sellers Section */}
      <section className="featured-sellers">
        <div className="container">
          <h2 className="section-title">Featured Sellers</h2>
          <p className="section-subtitle">Meet our top-rated livestock farmers</p>
          <div className="sellers-grid">
            <Card className="seller-card border-emerald-200 hover:shadow-lg transition-shadow">
              <CardContent className="text-center p-6">
                <div className="seller-avatar-large">
                  <User className="h-8 w-8" />
                </div>
                <h3 className="seller-name-large text-lg font-semibold mb-2">Van der Merwe Farms</h3>
                <p className="seller-location text-emerald-600 mb-3">
                  <MapPin className="inline h-4 w-4 mr-1" />Free State
                </p>
                <div className="seller-rating text-emerald-600 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`inline h-4 w-4 ${i < 4 ? 'fill-current' : ''}`} />
                  ))}
                  <span className="ml-1">4.5</span>
                </div>
                <div className="seller-stats flex justify-around">
                  <div className="seller-stat">
                    <div className="stat-value font-bold text-emerald-600">120</div>
                    <div className="stat-label text-xs text-emerald-500">Listings</div>
                  </div>
                  <div className="seller-stat">
                    <div className="stat-value font-bold text-emerald-600">98%</div>
                    <div className="stat-label text-xs text-emerald-500">Rating</div>
                  </div>
                  <div className="seller-stat">
                    <div className="stat-value font-bold text-emerald-600">3y</div>
                    <div className="stat-label text-xs text-emerald-500">Member</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="seller-card border-emerald-200 hover:shadow-lg transition-shadow">
              <CardContent className="text-center p-6">
                <div className="seller-avatar-large">
                  <User className="h-8 w-8" />
                </div>
                <h3 className="seller-name-large text-lg font-semibold mb-2">Khumalo Livestock</h3>
                <p className="seller-location text-emerald-600 mb-3">
                  <MapPin className="inline h-4 w-4 mr-1" />Limpopo
                </p>
                <div className="seller-rating text-emerald-600 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="inline h-4 w-4 fill-current" />
                  ))}
                  <span className="ml-1">4.9</span>
                </div>
                <div className="seller-stats flex justify-around">
                  <div className="seller-stat">
                    <div className="stat-value font-bold text-emerald-600">85</div>
                    <div className="stat-label text-xs text-emerald-500">Listings</div>
                  </div>
                  <div className="seller-stat">
                    <div className="stat-value font-bold text-emerald-600">99%</div>
                    <div className="stat-label text-xs text-emerald-500">Rating</div>
                  </div>
                  <div className="seller-stat">
                    <div className="stat-value font-bold text-emerald-600">2y</div>
                    <div className="stat-label text-xs text-emerald-500">Member</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="seller-card border-emerald-200 hover:shadow-lg transition-shadow">
              <CardContent className="text-center p-6">
                <div className="seller-avatar-large">
                  <User className="h-8 w-8" />
                </div>
                <h3 className="seller-name-large text-lg font-semibold mb-2">De Jong Poultry</h3>
                <p className="seller-location text-emerald-600 mb-3">
                  <MapPin className="inline h-4 w-4 mr-1" />Western Cape
                </p>
                <div className="seller-rating text-emerald-600 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`inline h-4 w-4 ${i < 4 ? 'fill-current' : ''}`} />
                  ))}
                  <span className="ml-1">4.8</span>
                </div>
                <div className="seller-stats flex justify-around">
                  <div className="seller-stat">
                    <div className="stat-value font-bold text-emerald-600">210</div>
                    <div className="stat-label text-xs text-emerald-500">Listings</div>
                  </div>
                  <div className="seller-stat">
                    <div className="stat-value font-bold text-emerald-600">97%</div>
                    <div className="stat-label text-xs text-emerald-500">Rating</div>
                  </div>
                  <div className="seller-stat">
                    <div className="stat-value font-bold text-emerald-600">5y</div>
                    <div className="stat-label text-xs text-emerald-500">Member</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta">
        <div className="container text-center">
          <h2 className="cta-title text-4xl font-bold mb-6">Ready to Join StockLot?</h2>
          <p className="cta-subtitle text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of South African farmers buying and selling livestock with confidence.
          </p>
          <Button 
            onClick={() => navigate('/register')}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-4 text-lg"
          >
            Create Free Account
          </Button>
        </div>
      </section>
    </div>
  );
}

// Login component
function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { refetch } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if redirecting from admin
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Use new API client for login
      const response = await api.post('/auth/login', { 
        email: email, 
        password: password 
      });
      
      if (response.data.success) {
        // Refresh auth state to get user data
        await refetch();
        
        // Redirect to admin if that's where they came from, otherwise marketplace
        if (redirectTo === 'admin') {
          navigate('/admin');
        } else {
          navigate('/marketplace');
        }
      } else {
        setError('Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError(error.response?.data?.detail || 'Invalid credentials');
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-emerald-200">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">📦</span>
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-900">Welcome Back</CardTitle>
          <CardDescription className="text-emerald-600">
            Sign in to your StockLot account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-emerald-800">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-emerald-800">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                placeholder="Enter your password"
              />
            </div>
            <div className="flex items-center justify-between">
              <Link 
                to="/forgot-password" 
                className="text-sm text-emerald-600 hover:text-emerald-700 underline"
              >
                Forgot password?
              </Link>
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-emerald-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-emerald-800 hover:text-emerald-900 font-medium underline">
              Sign up here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

// Register component
function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    phone: '',
    role: 'buyer'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await register(formData);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-emerald-200 text-center">
          <CardContent className="pt-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-emerald-900 mb-2">Registration Successful!</h2>
            <p className="text-emerald-600">Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-emerald-200">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">📦</span>
          </div>
          <CardTitle className="text-2xl font-bold text-emerald-900">Join StockLot</CardTitle>
          <CardDescription className="text-emerald-600">
            Create your livestock marketplace account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-emerald-800">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                  className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-emerald-800">Account Type</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buyer">Buyer</SelectItem>
                    <SelectItem value="seller">Seller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-emerald-800">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-emerald-800">Phone (Optional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                placeholder="+27 123 456 789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-emerald-800">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                className="border-emerald-200 focus:border-emerald-400 focus:ring-emerald-400"
                placeholder="Create a strong password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-emerald-600">
            Already have an account?{' '}
            <Link to="/login" className="text-emerald-800 hover:text-emerald-900 font-medium underline">
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

// Enhanced Admin Dashboard - Now using AdminLayoutWithSidebar
function AdminDashboardRoute() {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!user) {
    // Redirect to login with admin redirect parameter
    window.location.href = '/login?redirect=admin';
    return null;
  }
  
  return <AdminLayoutWithSidebar user={user} />;
}

// User Orders Component
function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await apiCall('GET', '/orders');
      // Handle both direct array and wrapped response
      const ordersData = Array.isArray(response) ? response : (response.data || response.buyer_orders || []);
      setOrders(ordersData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]); // Set empty array on error
      setLoading(false);
    }
  };

  const confirmDelivery = async (orderId) => {
    try {
      await apiCall('POST', `/orders/${orderId}/confirm-delivery`, {
        order_id: orderId,
        delivery_rating: 5
      });
      fetchOrders(); // Refresh orders
    } catch (error) {
      console.error('Error confirming delivery:', error);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'pending_payment': 'bg-yellow-100 text-yellow-700',
      'payment_confirmed': 'bg-blue-100 text-blue-700',
      'funds_held': 'bg-purple-100 text-purple-700',
      'delivery_confirmed': 'bg-green-100 text-green-700',
      'funds_released': 'bg-green-100 text-green-700'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status) => {
    const statusText = {
      'pending_payment': 'Pending Payment',
      'payment_confirmed': 'Payment Confirmed',
      'funds_held': 'Awaiting Delivery',
      'delivery_confirmed': 'Delivered',
      'funds_released': 'Complete'
    };
    return statusText[status] || status;
  };

  if (loading) {
    return (
      <Card className="border-emerald-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-emerald-600">Loading your orders...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-emerald-200">
      <CardHeader>
        <CardTitle className="text-emerald-900">My Orders</CardTitle>
        <CardDescription>Track your livestock purchases</CardDescription>
      </CardHeader>
      <CardContent>
        {(orders || []).length === 0 ? (
          <div className="text-center py-8">
            <ShoppingCart className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
            <p className="text-emerald-600 mb-4">No orders yet.</p>
            <Link to="/marketplace">
              <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                Browse Livestock
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {(orders || []).map(order => (
              <Card key={order.id} className="border-emerald-100">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-emerald-900">Order #{order.id.slice(-8)}</h4>
                      <p className="text-sm text-emerald-600">
                        {new Date(order.created_at).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-emerald-700">
                        <strong>Total:</strong> R{order.total_amount}
                      </p>
                    </div>
                    <div className="text-right">
                      {/* Order Status Badge */}
                      <div className="mb-2">
                        <Badge className={getStatusColor(order.delivery_status || order.status)}>
                          {getStatusText(order.delivery_status || order.status)}
                        </Badge>
                      </div>
                      
                      {/* Delivery Confirmation Button */}
                      {(order.delivery_status === 'delivered' || order.status === 'funds_held') && (
                        <Button
                          size="sm"
                          onClick={() => confirmDelivery(order.id)}
                          className="bg-green-600 hover:bg-green-700 text-white mb-2"
                        >
                          Confirm Delivery
                        </Button>
                      )}
                      
                      {/* Payment Button */}
                      {order.payment_url && (order.status === 'pending_payment' || order.payment_status === 'pending') && (
                        <Button
                          size="sm"
                          onClick={() => window.open(order.payment_url, '_blank')}
                          className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                        >
                          Pay Now
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {/* Order Items */}
                  {order.items && order.items.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-emerald-100">
                      <p className="text-sm text-emerald-700 font-medium mb-2">Items:</p>
                      {order.items.map((item, index) => (
                        <div key={index} className="text-sm text-emerald-600 ml-2">
                          • {item.listing_title} (Qty: {item.quantity}) - R{item.item_total}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Shipping Address */}
                  {order.shipping_address && (
                    <div className="mt-3 pt-3 border-t border-emerald-100">
                      <p className="text-sm text-emerald-700 font-medium">Shipping to:</p>
                      <p className="text-sm text-emerald-600">
                        {order.shipping_address.line1}, {order.shipping_address.city}, {order.shipping_address.province}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Seller Orders Management Component
function SellerOrders() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderDetails, setShowOrderDetails] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchSellerOrders();
  }, []);

  const fetchSellerOrders = async () => {
    try {
      const response = await apiCall('GET', '/orders');
      // Filter orders where current user is the seller
      const sellerOrders = (Array.isArray(response) ? response : []).filter(order => 
        order.seller_id === user?.id || order.seller_id === 'admin_user_id' // Include admin orders for demo
      );
      setOrders(sellerOrders);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching seller orders:', error);
      setOrders([]);
      setLoading(false);
    }
  };

  const updateDeliveryStatus = async (orderId, newStatus) => {
    setUpdatingStatus(true);
    try {
      await apiCall('PUT', `/orders/${orderId}/status`, {
        delivery_status: newStatus
      });
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, delivery_status: newStatus, updated_at: new Date().toISOString() }
          : order
      ));
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, delivery_status: newStatus });
      }
      
    } catch (error) {
      console.error('Error updating delivery status:', error);
      alert('Failed to update delivery status. Please try again.');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'preparing': 'bg-yellow-100 text-yellow-700',
      'shipped': 'bg-blue-100 text-blue-700',
      'in_transit': 'bg-purple-100 text-purple-700',
      'delivered': 'bg-green-100 text-green-700',
      'cancelled': 'bg-red-100 text-red-700'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusText = (status) => {
    const statusText = {
      'preparing': 'Preparing',
      'shipped': 'Shipped',
      'in_transit': 'In Transit',
      'delivered': 'Delivered',
      'cancelled': 'Cancelled'
    };
    return statusText[status] || status;
  };

  if (loading) {
    return (
      <Card className="border-emerald-200">
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-emerald-600">Loading your sales...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-emerald-200">
        <CardHeader>
          <CardTitle className="text-emerald-900">My Sales</CardTitle>
          <CardDescription>Manage incoming orders and delivery status</CardDescription>
        </CardHeader>
        <CardContent>
          {(orders || []).length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-emerald-400 mx-auto mb-4" />
              <p className="text-emerald-600 mb-4">No sales yet.</p>
              <p className="text-sm text-emerald-500">Your incoming orders will appear here.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {(orders || []).map(order => (
                <Card key={order.id} className="border-emerald-100">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-emerald-900">Order #{order.id.slice(-8)}</h4>
                        <p className="text-sm text-emerald-600">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-emerald-900">R{order.total_amount}</p>
                        <Badge className={getStatusColor(order.delivery_status)}>
                          {getStatusText(order.delivery_status)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="mb-3">
                      <p className="text-sm text-emerald-700 font-medium">Items:</p>
                      {(order.items || []).map((item, index) => (
                        <div key={index} className="text-sm text-emerald-600 ml-2">
                          • {item.listing_title} (Qty: {item.quantity}) - R{item.item_total}
                        </div>
                      ))}
                    </div>

                    <div className="mb-3">
                      <p className="text-sm text-emerald-700 font-medium">Shipping Address:</p>
                      <p className="text-sm text-emerald-600">
                        {order.shipping_address?.line1}, {order.shipping_address?.city}, {order.shipping_address?.province}
                      </p>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        {order.delivery_status === 'preparing' && (
                          <Button
                            size="sm"
                            onClick={() => updateDeliveryStatus(order.id, 'shipped')}
                            disabled={updatingStatus}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            Mark as Shipped
                          </Button>
                        )}
                        {order.delivery_status === 'shipped' && (
                          <Button
                            size="sm"
                            onClick={() => updateDeliveryStatus(order.id, 'in_transit')}
                            disabled={updatingStatus}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Mark In Transit
                          </Button>
                        )}
                        {order.delivery_status === 'in_transit' && (
                          <Button
                            size="sm"
                            onClick={() => updateDeliveryStatus(order.id, 'delivered')}
                            disabled={updatingStatus}
                            className="bg-green-600 hover:bg-green-700 text-white"
                          >
                            Mark as Delivered
                          </Button>
                        )}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowOrderDetails(true);
                        }}
                        className="border-emerald-200 hover:bg-emerald-50"
                      >
                        View Details
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Details Modal */}
      <Dialog open={showOrderDetails} onOpenChange={setShowOrderDetails}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Order Details #{selectedOrder?.id.slice(-8)}</DialogTitle>
          </DialogHeader>
          
          {selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-emerald-800">Order Status</Label>
                  <Badge className={getStatusColor(selectedOrder.delivery_status)}>
                    {getStatusText(selectedOrder.delivery_status)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-emerald-800">Total Amount</Label>
                  <p className="font-bold text-emerald-900">R{selectedOrder.total_amount}</p>
                </div>
                <div>
                  <Label className="text-emerald-800">Order Date</Label>
                  <p className="text-emerald-700">{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-emerald-800">Payment Method</Label>
                  <p className="text-emerald-700">{selectedOrder.payment_method}</p>
                </div>
              </div>

              <div>
                <Label className="text-emerald-800">Items Ordered</Label>
                <div className="mt-2 space-y-2">
                  {(selectedOrder.items || []).map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-emerald-50 rounded">
                      <div>
                        <p className="font-medium text-emerald-900">{item.listing_title}</p>
                        <p className="text-emerald-600">Quantity: {item.quantity}</p>
                      </div>
                      <p className="font-bold text-emerald-900">R{item.item_total}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-emerald-800">Shipping Address</Label>
                <div className="mt-2 p-3 bg-emerald-50 rounded">
                  <p className="text-emerald-900">{selectedOrder.shipping_address?.line1}</p>
                  <p className="text-emerald-700">
                    {selectedOrder.shipping_address?.city}, {selectedOrder.shipping_address?.province} {selectedOrder.shipping_address?.postal_code}
                  </p>
                  <p className="text-emerald-700">{selectedOrder.shipping_address?.country}</p>
                </div>
              </div>

              <div>
                <Label className="text-emerald-800">Update Delivery Status</Label>
                <div className="mt-2 flex space-x-2">
                  {['preparing', 'shipped', 'in_transit', 'delivered'].map((status) => (
                    <Button
                      key={status}
                      variant={selectedOrder.delivery_status === status ? "default" : "outline"}
                      size="sm"
                      onClick={() => updateDeliveryStatus(selectedOrder.id, status)}
                      disabled={updatingStatus}
                      className={selectedOrder.delivery_status === status ? "bg-emerald-600 hover:bg-emerald-700" : "border-emerald-200"}
                    >
                      {getStatusText(status)}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOrderDetails(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// Unified Dashboard component (same as before, but with updated branding)
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

// Seller Dashboard with Delivery Rate Management
function SellerDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  if (!user || !user.roles?.includes('seller')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold text-emerald-900 mb-4">Seller Access Required</h2>
            <p className="text-emerald-700">Please log in as a seller to access this dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-900">Seller Dashboard</h1>
          <p className="text-emerald-700 mt-2">Manage your livestock business</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-emerald-200">
            <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
              Overview
            </TabsTrigger>
            <TabsTrigger value="listings" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
              My Listings
            </TabsTrigger>
            <TabsTrigger value="delivery" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
              Delivery Rates
            </TabsTrigger>
            <TabsTrigger value="orders" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
              Orders
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-emerald-100 data-[state=active]:text-emerald-800">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-600 text-sm font-medium">Active Listings</p>
                      <p className="text-2xl font-bold text-emerald-900">12</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-full">
                      <Package className="h-8 w-8 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-600 text-sm font-medium">Total Sales</p>
                      <p className="text-2xl font-bold text-emerald-900">R45,320</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-full">
                      <DollarSign className="h-8 w-8 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-600 text-sm font-medium">Pending Orders</p>
                      <p className="text-2xl font-bold text-emerald-900">3</p>
                    </div>
                    <div className="p-3 bg-emerald-100 rounded-full">
                      <Clock className="h-8 w-8 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="listings">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-900">My Listings</CardTitle>
                <CardDescription>Manage your livestock listings</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Your livestock listings will appear here.</p>
                <Button className="mt-4 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white">
                  Create New Listing
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delivery">
            <DeliveryRateForm />
          </TabsContent>

          <TabsContent value="orders">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-900">Order Management</CardTitle>
                <CardDescription>Track and manage your orders</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Your order history will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <Card className="border-emerald-200">
              <CardHeader>
                <CardTitle className="text-emerald-900">Sales Analytics</CardTitle>
                <CardDescription>Track your business performance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600">Your analytics dashboard will appear here.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Enhanced Marketplace component with Core/Exotic separation
function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState(null);
  const [lastSuccessfulListings, setLastSuccessfulListings] = useState([]); // Backup listings
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExotics, setShowExotics] = useState(false);
  const [filters, setFilters] = useState({
    category_group_id: '',
    species_id: '',
    breed_id: '',
    product_type_id: '',
    province: '',
    price_min: '',
    price_max: '',
    listing_type: 'all',
    include_exotics: false  // Default: core livestock only
  });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showBiddingModal, setShowBiddingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [deliverableOnly, setDeliverableOnly] = useState(false);
  const [smartSearchQuery, setSmartSearchQuery] = useState('');
  const [smartSearchResults, setSmartSearchResults] = useState(null);
  const [cartUpdateCallback, setCartUpdateCallback] = useState(() => {
    // Default cart callback function
    return (listing, quantity = 1) => {
      console.log('Adding to cart:', listing.title, 'Quantity:', quantity);
      // This can be enhanced later with actual cart functionality
    };
  });

  // Check URL params for exotic mode
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const includeExotics = urlParams.get('include_exotics') === 'true';
    
    if (includeExotics) {
      setShowExotics(true);
      setFilters(prev => ({ ...prev, include_exotics: true }));
    }
  }, []);

  useEffect(() => {
    fetchInitialData();
    
    // Set up real-time auction updates
    const interval = setInterval(() => {
      updateAuctionTimers();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Re-fetch categories when exotic toggle changes
  useEffect(() => {
    fetchInitialData();
  }, [showExotics]);

  useEffect(() => {
    fetchListings();
  }, [filters]);

  useEffect(() => {
    // Update filters when exotic toggle changes
    setFilters(prev => ({ ...prev, include_exotics: showExotics }));
  }, [showExotics]);

  useEffect(() => {
    // Fetch species when category group changes
    if (filters.category_group_id) {
      fetchSpeciesByGroup(filters.category_group_id);
    } else {
      setSpecies([]);
      setBreeds([]);
    }
  }, [filters.category_group_id]);

  useEffect(() => {
    // Fetch breeds when species changes
    if (filters.species_id) {
      fetchBreedsBySpecies(filters.species_id);
    } else {
      setBreeds([]);
    }
  }, [filters.species_id]);

  const updateAuctionTimers = () => {
    setListings(prevListings => 
      prevListings.map(listing => {
        if (listing.listing_type !== 'buy_now' && listing.auction_end_time) {
          const timeRemaining = new Date(listing.auction_end_time) - new Date();
          if (timeRemaining <= 0 && !listing.expired) {
            // Auction ended
            showNotification(`Auction ended: ${listing.title}`, 'info');
            return { ...listing, expired: true };
          }
        }
        return listing;
      })
    );
  };

  const handleViewDetails = (listing) => {
    // Navigate to the new PDP page
    navigate(`/listing/${listing.id}`);
  };

  const handlePlaceBid = (listing) => {
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedListing(listing);
    setShowBiddingModal(true);
  };

  const handleBidPlaced = (updatedListing, bidData) => {
    // Update the listing in the state
    setListings(prevListings =>
      prevListings.map(listing =>
        listing.id === updatedListing.id ? updatedListing : listing
      )
    );

    if (bidData.type === 'buy_now') {
      showNotification(`You successfully purchased ${updatedListing.title}!`, 'success');
    } else {
      showNotification(`Bid placed successfully on ${updatedListing.title}!`, 'success');
    }

    setShowBiddingModal(false);
  };

  const showNotification = (message, type) => {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date()
    };
    setNotifications(prev => [...prev, notification]);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  };

  const fetchInitialData = async () => {
    try {
      // Fetch core categories by default, exotic categories when enabled
      const categoryMode = showExotics ? 'all' : 'core';
      const [groupsRes, productTypesRes, speciesRes] = await Promise.all([
        fetch(`${API}/taxonomy/categories?mode=${categoryMode}`).then(r => r.json()),
        apiCall('GET', '/product-types'),
        fetch(`${API}/species`).then(r => r.json()) // Load all species for listing categorization
      ]);
      console.log(`${categoryMode} category groups loaded:`, groupsRes || []); // Debug log
      console.log('Product types loaded:', productTypesRes || []); // Debug log
      console.log('Species loaded for categorization:', speciesRes || []); // Debug log
      setCategoryGroups(groupsRes || []);
      setProductTypes(productTypesRes || []);
      setSpecies(speciesRes || []); // Set species data for listing enhancement
    } catch (error) {
      console.error('Error fetching initial data:', error);
      // Set empty arrays as fallback
      setCategoryGroups([]);
      setProductTypes([]);
      setSpecies([]);
    }
  };

  const fetchSpeciesByGroup = async (groupId) => {
    try {
      // Use the correct API endpoint for species by category
      const response = await fetch(`${API}/species?category_group_id=${groupId}`);
      if (response.ok) {
        const data = await response.json();
        setSpecies(data || []);
      } else {
        console.error('Failed to fetch species:', response.status);
        setSpecies([]);
      }
    } catch (error) {
      console.error('Error fetching species:', error);
      setSpecies([]);
    }
  };

  const fetchBreedsBySpecies = async (speciesId) => {
    try {
      const response = await fetch(`${API}/species/${speciesId}/breeds`);
      if (response.ok) {
        const data = await response.json();
        setBreeds(data || []);
      } else {
        console.error('Failed to fetch breeds:', response.status);
        setBreeds([]);
      }
    } catch (error) {
      console.error('Error fetching breeds:', error);
      setBreeds([]);
    }
  };

  const fetchListings = async (retryCount = 0) => {
    // STABILITY: Prevent multiple concurrent requests
    if (listingsLoading) {
      console.log('🔒 STABILITY: Listings already loading, skipping duplicate request');
      return;
    }
    
    try {
      setListingsLoading(true); // Use separate loading state
      setLoading(true);
      console.log(`🔍 STABILITY: Fetching listings (attempt ${retryCount + 1})`);
      
      const params = new URLSearchParams();
      if (filters.category_group_id) params.append('category_group_id', filters.category_group_id);
      if (filters.species_id) params.append('species_id', filters.species_id);
      if (filters.breed_id) params.append('breed_id', filters.breed_id);
      if (filters.product_type_id) params.append('product_type_id', filters.product_type_id);
      if (filters.province) params.append('region', filters.province);
      if (filters.price_min) params.append('price_min', filters.price_min);
      if (filters.price_max) params.append('price_max', filters.price_max);
      if (filters.listing_type && filters.listing_type !== 'all') params.append('listing_type', filters.listing_type);
      
      // CORE/EXOTIC FILTERING - This is the key change!
      params.append('include_exotics', filters.include_exotics.toString());

      if (deliverableOnly) {
        params.append('deliverable_only', 'true');
      }

      // Use direct fetch with timeout for stability
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

      const response = await fetch(`${API}/listings?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        if (response.status === 429 && retryCount < 3) {
          console.log(`⏳ STABILITY: Rate limited, retrying in ${2 + retryCount} seconds...`);
          setTimeout(() => fetchListings(retryCount + 1), (2 + retryCount) * 1000);
          return;
        }
        throw new Error(`Failed to fetch listings: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Backend returns listings in response.listings field
      const listingsArray = Array.isArray(data) ? data : (data.listings || data.data || []);
      
      console.log(`📊 Fetched ${listingsArray.length} listings from API`);
      
      // If we get empty results but have existing listings, keep the existing ones to prevent disappearing
      if (listingsArray.length === 0 && listings.length > 0 && retryCount === 0) {
        console.log('⚠️ Empty response but have existing listings - keeping current state');
        setLoading(false);
        return;
      }
      
      // Enhance listings with auction data and species information for proper categorization
      const enhancedListings = listingsArray.map(listing => {
        // Find species data for this listing
        const listingSpecies = species.find(s => s.id === listing.species_id);
        
        return {
          ...listing,
          // Add species name for string-based filtering
          species: listingSpecies ? listingSpecies.name : null,
          listing_type: listing.listing_type || 'buy_now',
          current_bid: listing.current_bid || (
            listing.listing_type === 'auction' || listing.listing_type === 'hybrid' 
              ? listing.starting_price || listing.price_per_unit 
              : null
          ),
          auction_end_time: listing.auction_end_time || (
            listing.listing_type !== 'buy_now' 
              ? new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
              : null
          ),
          total_bids: listing.total_bids || 0,
          starting_price: listing.starting_price || listing.price_per_unit,
          buy_now_price: listing.listing_type === 'hybrid' ? listing.buy_now_price || (listing.price_per_unit * 1.2) : null,
          reserve_price: listing.reserve_price || null
        };
      });
      
      setListings(enhancedListings);
      console.log(`✅ Loaded ${enhancedListings.length} listings successfully`);
    } catch (error) {
      console.error('🚨 Error fetching listings:', error);
      
      // CRITICAL FIX: NEVER clear existing listings on error
      // This prevents the disappearing listings issue
      if (listings.length > 0) {
        console.log(`💾 STABILITY: Keeping ${listings.length} existing listings despite error: ${error.message}`);
        // Don't touch listings state - keep what we have
      } else {
        console.log('⚠️ STABILITY: No existing listings to preserve, first load failed');
        // Only set empty on first load failure
        setListings([]);
      }
      
      // Enhanced retry logic for network issues
      if (retryCount < 3 && (
        error.message.includes('429') || 
        error.message.includes('503') || 
        error.message.includes('502') ||
        error.message.includes('timeout') ||
        error.message.includes('Failed to fetch')
      )) {
        console.log(`🔄 STABILITY: Auto-retry ${retryCount + 1}/3 in ${2 + retryCount} seconds...`);
        setTimeout(() => fetchListings(retryCount + 1), (2 + retryCount) * 1000);
        return;
      }
    } finally {
      setLoading(false);
      setListingsLoading(false); // Clear both loading states
    }
  };

  const getSpeciesName = (speciesId) => {
    const spec = species.find(s => s.id === speciesId);
    return spec ? spec.name : 'Unknown';
  };

  const handleSmartSearch = async () => {
    if (!smartSearchQuery.trim()) return;
    
    try {
      setLoading(true);
      
      const response = await fetch(`${API}/search/smart`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(localStorage.getItem('token') && { 
            'Authorization': `Bearer ${localStorage.getItem('token')}` 
          })
        },
        body: JSON.stringify({
          query: smartSearchQuery
        })
      });

      if (response.ok) {
        const data = await response.json();
        setSmartSearchResults(data.search);
        
        // Update listings with search results
        const searchListings = data.search.results
          .filter(result => result.type === 'listing')
          .map(result => result.data);
        
        setListings(searchListings);
        
        // Show success notification
        const notification = {
          id: Date.now(),
          type: 'success',
          message: `Found ${searchListings.length} results for "${smartSearchQuery}"${data.search.learned_from_query ? ' (Query learned for improvement!)' : ''}`,
          duration: 5000
        };
        setNotifications(prev => [...prev, notification]);
        
      } else {
        throw new Error('Search failed');
      }
    } catch (error) {
      console.error('Smart search error:', error);
      
      // Fallback to regular filtering
      const fallbackListings = listings.filter(listing => 
        listing.title?.toLowerCase().includes(smartSearchQuery.toLowerCase()) ||
        listing.description?.toLowerCase().includes(smartSearchQuery.toLowerCase()) ||
        listing.breed?.toLowerCase().includes(smartSearchQuery.toLowerCase()) ||
        listing.species?.toLowerCase().includes(smartSearchQuery.toLowerCase())
      );
      
      setListings(fallbackListings);
      
      const notification = {
        id: Date.now(),
        type: 'info',
        message: `Showing ${fallbackListings.length} results for "${smartSearchQuery}" (Basic search)`,
        duration: 4000
      };
      setNotifications(prev => [...prev, notification]);
    } finally {
      setLoading(false);
      setListingsLoading(false); // Clear both loading states
    }
  };

  const clearSmartSearch = () => {
    setSmartSearchQuery('');
    setSmartSearchResults(null);
    fetchListings(); // Reload all listings
  };

  // Enhanced handleFilterChange to clear smart search when filters are used
  const handleFilterChange = (key, value) => {
    console.log('Filter change called:', key, value); // Debug log
    const newFilters = { ...filters, [key]: value };
    
    // Reset dependent filters when parent changes
    if (key === 'category_group_id') {
      newFilters.species_id = '';
      newFilters.breed_id = '';
    } else if (key === 'species_id') {
      newFilters.breed_id = '';
    }
    
    // Clear smart search when using filters
    if (smartSearchResults) {
      clearSmartSearch();
    }
    
    console.log('Setting new filters:', newFilters); // Debug log
    setFilters(newFilters);
  };

  const handleAISearch = (searchQuery) => {
    if (!searchQuery.trim()) return;
    
    // Simple AI-like parsing for immediate value
    const query = searchQuery.toLowerCase();
    const newFilters = { ...filters };
    
    // Parse species/animals
    if (query.includes('chick') || query.includes('chicken')) {
      const broilerSpecies = species.find(s => s.name.includes('Commercial Broilers'));
      const freeRangeSpecies = species.find(s => s.name.includes('Free Range'));
      
      if (query.includes('free range')) {
        newFilters.species_id = freeRangeSpecies?.id || '';
      } else {
        newFilters.species_id = broilerSpecies?.id || '';
      }
    } else if (query.includes('goat')) {
      const goatSpecies = species.find(s => s.name === 'Goats');
      newFilters.species_id = goatSpecies?.id || '';
    } else if (query.includes('cattle') || query.includes('cow')) {
      const cattleSpecies = species.find(s => s.name === 'Cattle');
      newFilters.species_id = cattleSpecies?.id || '';
    } else if (query.includes('sheep')) {
      const sheepSpecies = species.find(s => s.name === 'Sheep');
      newFilters.species_id = sheepSpecies?.id || '';
    }
    
    // Parse breeds
    if (query.includes('ross 308') || query.includes('ross308')) {
      // Will be filtered by breed when breeds are loaded
    } else if (query.includes('boer')) {
      // Will be filtered by breed when breeds are loaded  
    }
    
    // Parse location
    const provinces = ['gauteng', 'western cape', 'limpopo', 'mpumalanga', 'free state', 'north west', 'northern cape', 'eastern cape', 'kwazulu natal'];
    provinces.forEach(province => {
      if (query.includes(province)) {
        newFilters.province = province.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
      }
    });
    
    // Parse price
    const priceMatch = query.match(/under r?(\d+)/i) || query.match(/below r?(\d+)/i);
    if (priceMatch) {
      newFilters.price_max = priceMatch[1];
    }
    
    const minPriceMatch = query.match(/above r?(\d+)/i) || query.match(/over r?(\d+)/i);
    if (minPriceMatch) {
      newFilters.price_min = minPriceMatch[1];
    }
    
    setFilters(newFilters);
  };

  const clearFilters = () => {
    setFilters({
      category_group_id: '',
      species_id: '',
      breed_id: '',
      product_type_id: '',
      province: '',
      price_min: '',
      price_max: ''
    });
  };

  const getFilteredProductTypes = () => {
    if (!filters.category_group_id) return productTypes;
    const selectedGroup = categoryGroups.find(g => g.id === filters.category_group_id);
    if (!selectedGroup) return productTypes;
    
    return productTypes.filter(pt => 
      pt.applicable_to_groups && pt.applicable_to_groups.includes(selectedGroup.name)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl">📦</span>
          </div>
          <p className="text-emerald-700">Loading livestock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-900 mb-2">Browse Livestock</h1>
          <p className="text-emerald-700">Find quality animals from verified sellers across South Africa</p>
        </div>

        {/* AI-Powered Search Bar */}
        <Card className="mb-6 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Search className="h-5 w-5 text-emerald-600" />
              <Input
                value={smartSearchQuery}
                onChange={(e) => setSmartSearchQuery(e.target.value)}
                placeholder="Try: '50 day-old Ross 308 chicks in Gauteng under R20 each' or 'Boer goats in Limpopo'"
                className="border-0 bg-transparent text-emerald-800 placeholder-emerald-500 flex-1"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSmartSearch();
                  }
                }}
              />
              <Button 
                onClick={handleSmartSearch}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
                disabled={!smartSearchQuery.trim()}
              >
                Search
              </Button>
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                <Brain className="h-3 w-3 mr-1" />
                ML Powered
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Deliverable Filter Bar */}
        <DeliverableFilterBar 
          value={deliverableOnly} 
          onChange={setDeliverableOnly}
        />

        {/* Exotic Livestock Toggle */}
        <Card className="mb-6 border-emerald-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <h3 className="text-lg font-semibold text-emerald-900">Livestock Categories</h3>
                <Badge variant="secondary" className="text-emerald-700">
                  {showExotics ? 'All Categories' : 'Core Livestock Only'}
                </Badge>
              </div>
              
              <label className="inline-flex items-center gap-3 cursor-pointer">
                <span className="text-sm text-gray-700">Show Exotic & Specialty</span>
                <input
                  type="checkbox"
                  checked={showExotics}
                  onChange={(e) => setShowExotics(e.target.checked)}
                  className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2"
                />
                <span className="text-xs text-gray-500">(Ostrich, Game Animals, Camelids, etc.)</span>
              </label>
            </div>
            
            {showExotics && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-sm font-medium text-amber-800">Exotic Livestock Notice</h4>
                    <p className="text-sm text-amber-700 mt-1">
                      Now showing exotic and specialty livestock. Some species require permits and special care. 
                      <a href="/exotics" className="underline ml-1">Learn more about exotic livestock →</a>
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advanced Filters */}
        <Card className="mb-8 border-emerald-200">
          <CardHeader>
            <CardTitle className="flex items-center text-emerald-900">
              <Filter className="mr-2 h-5 w-5" />
              Filter Animals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 lg:grid-cols-6 gap-4 mb-4">
              {/* Category Group */}
              <div>
                <Label className="text-emerald-800 text-sm">Category</Label>
                <Select value={filters.category_group_id || ""} onValueChange={(value) => handleFilterChange('category_group_id', value)}>
                  <SelectTrigger className="border-emerald-200">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryGroups.map((group, index) => (
                      <SelectItem key={group.id || index} value={group.id || ''}>
                        {group.name || 'Unknown Category'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Species */}
              <div>
                <Label className="text-emerald-800 text-sm">Species</Label>
                <Select value={filters.species_id || ""} onValueChange={(value) => handleFilterChange('species_id', value)} disabled={!filters.category_group_id}>
                  <SelectTrigger className="border-emerald-200">
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    {species.map((spec, index) => (
                      <SelectItem key={spec.id || index} value={spec.id || ''}>
                        {spec.name || 'Unknown Species'}
                        {spec.is_free_range && " 🌿"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Breed */}
              <div>
                <Label className="text-emerald-800 text-sm">Breed</Label>
                <Select value={filters.breed_id || ""} onValueChange={(value) => handleFilterChange('breed_id', value)} disabled={!filters.species_id}>
                  <SelectTrigger className="border-emerald-200">
                    <SelectValue placeholder="Any breed" />
                  </SelectTrigger>
                  <SelectContent>
                    {breeds.map(breed => (
                      <SelectItem key={breed.id} value={breed.id}>
                        {breed.name}
                        {breed.purpose_hint && ` (${breed.purpose_hint})`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Product Type */}
              <div>
                <Label className="text-emerald-800 text-sm">Product Type</Label>
                <Select value={filters.product_type_id || undefined} onValueChange={(value) => handleFilterChange('product_type_id', value || "")}>
                  <SelectTrigger className="border-emerald-200">
                    <SelectValue placeholder="Any type" />
                  </SelectTrigger>
                  <SelectContent>
                    {(getFilteredProductTypes() || []).filter(type => type && type.id && type.id !== "").map(type => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Listing Type Filter */}
              <div>
                <Label className="text-emerald-800 text-sm">Listing Type</Label>
                <Select value={filters.listing_type} onValueChange={(value) => handleFilterChange('listing_type', value)}>
                  <SelectTrigger className="border-emerald-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="buy_now">Buy Now Only</SelectItem>
                    <SelectItem value="auction">Auctions Only</SelectItem>
                    <SelectItem value="hybrid">Hybrid (Bid + Buy Now)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Province */}
              <div>
                <Label className="text-emerald-800 text-sm">Province</Label>
                <Input
                  placeholder="e.g., Gauteng"
                  value={filters.province}
                  onChange={(e) => handleFilterChange('province', e.target.value)}
                  className="border-emerald-200"
                />
              </div>
            </div>

            {/* Price Range & Sort */}
            <div className="grid md:grid-cols-4 gap-4">
              <div>
                <Label className="text-emerald-800 text-sm">Min Price (R)</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.price_min}
                  onChange={(e) => handleFilterChange('price_min', e.target.value)}
                  className="border-emerald-200"
                />
              </div>
              <div>
                <Label className="text-emerald-800 text-sm">Max Price (R)</Label>
                <Input
                  type="number"
                  placeholder="10000"
                  value={filters.price_max}
                  onChange={(e) => handleFilterChange('price_max', e.target.value)}
                  className="border-emerald-200"
                />
              </div>
              <div>
                <Label className="text-emerald-800 text-sm">Sort By</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="border-emerald-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="price_low">Price: Low to High</SelectItem>
                    <SelectItem value="price_high">Price: High to Low</SelectItem>
                    <SelectItem value="ending_soon">Ending Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button onClick={clearFilters} variant="outline" className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <div className="fixed top-20 right-4 z-50 space-y-2">
          {notifications.map(notification => (
            <Card key={notification.id} className={`p-4 shadow-lg ${
              notification.type === 'success' ? 'bg-green-50 border-green-200' :
              notification.type === 'error' ? 'bg-red-50 border-red-200' :
              'bg-blue-50 border-blue-200'
            }`}>
              <div className="flex items-center gap-2">
                {notification.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600" />}
                {notification.type === 'error' && <X className="h-5 w-5 text-red-600" />}
                {notification.type === 'info' && <Bell className="h-5 w-5 text-blue-600" />}
                <p className="text-sm font-medium">{notification.message}</p>
              </div>
            </Card>
          ))}
        </div>

        {/* Market Summary */}
        <Card className="mb-6 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
          <CardContent className="p-4">
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-emerald-900">{listings.length}</p>
                <p className="text-sm text-emerald-600">Total Listings</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-900">
                  {listings.filter(l => l.listing_type === 'buy_now').length}
                </p>
                <p className="text-sm text-blue-600">Buy Now</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-orange-900">
                  {listings.filter(l => l.listing_type === 'auction' || l.listing_type === 'hybrid').length}
                </p>
                <p className="text-sm text-orange-600">Active Auctions</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-purple-900">
                  {listings.filter(l => l.listing_type === 'hybrid').length}
                </p>
                <p className="text-sm text-purple-600">Hybrid Listings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Market Insights Panel (Future) */}
        {filters.species_id && (
          <Card className="mb-6 border-emerald-200 bg-gradient-to-r from-emerald-50 to-green-50">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm">AI</span>
                </div>
                <div>
                  <p className="text-emerald-800 font-medium">Market Insights</p>
                  <p className="text-emerald-600 text-sm">
                    {getSpeciesName(filters.species_id)} average price: R{Math.floor(Math.random() * 500 + 200)} per head
                    • {listings.length} listings available
                    {filters.province && ` in ${filters.province}`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Overview */}
        {!filters.category_group_id && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-emerald-900 mb-4">Browse by Category</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-4">
              {categoryGroups.map(group => {
                // Enhanced category count logic
                const groupListings = listings.filter(listing => {
                  // Method 1: Direct species matching
                  if (listing.species && typeof listing.species === 'string') {
                    const speciesName = listing.species.toLowerCase();
                    if (group.name === 'Poultry' && (speciesName.includes('chicken') || speciesName.includes('poultry'))) return true;
                    if (group.name === 'Ruminants' && (speciesName.includes('cattle') || speciesName.includes('goat') || speciesName.includes('sheep'))) return true;
                    if (group.name === 'Rabbits' && speciesName.includes('rabbit')) return true;
                    if (group.name === 'Aquaculture' && (speciesName.includes('fish') || speciesName.includes('aqua'))) return true;
                    if (group.name === 'Other Small Livestock' && (speciesName.includes('pig') || speciesName.includes('duck'))) return true;
                  }
                  
                  // Method 2: Species ID matching (fallback)
                  const listingSpecies = species.find(s => s.id === listing.species_id);
                  if (listingSpecies && listingSpecies.category_group_id === group.id) return true;
                  
                  // Method 3: Breed-based matching (additional fallback)
                  if (listing.breed && typeof listing.breed === 'string') {
                    const breedName = listing.breed.toLowerCase();
                    if (group.name === 'Poultry' && (breedName.includes('ross') || breedName.includes('koekoek') || breedName.includes('chicken'))) return true;
                    if (group.name === 'Ruminants' && (breedName.includes('boer') || breedName.includes('angus') || breedName.includes('brahman'))) return true;
                  }
                  
                  return false;
                });
                
                return (
                  <Card 
                    key={group.id} 
                    className="cursor-pointer hover:shadow-lg transition-shadow border-emerald-200"
                    onClick={() => handleFilterChange('category_group_id', group.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">
                        {group.name === 'Poultry' && '🐓'}
                        {group.name === 'Ruminants' && '🐄'}
                        {group.name === 'Rabbits' && '🐰'}
                        {group.name === 'Aquaculture' && '🐟'}
                        {group.name === 'Other Small Livestock' && '🕊️'}
                      </div>
                      <h3 className="font-semibold text-emerald-900">{group.name}</h3>
                      <p className="text-sm text-emerald-600">
                        {groupListings.length} listing{groupListings.length !== 1 ? 's' : ''}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Listings Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(() => {
            // Apply deliverable filtering
            let filteredListings = listings;
            
            if (deliverableOnly) {
              filteredListings = listings.filter(listing => {
                // Mock service area for demonstration - in real app this comes from API
                const serviceArea = listing.service_area || {
                  mode: 'RADIUS',
                  origin: { lat: -26.2041 + (Math.random() - 0.5) * 4, lng: 28.0473 + (Math.random() - 0.5) * 4 },
                  radius_km: 150 + Math.random() * 200
                };
                
                // Simplified deliverability check - just return true for now
                // In production, this would check actual delivery capabilities
                return listing.delivery_available !== false;
              });
            }
            
            // Apply sorting to filtered listings
            const sortedListings = [...filteredListings].sort((a, b) => {
              switch (sortBy) {
                case 'price_low':
                  return (a.current_bid || a.price_per_unit) - (b.current_bid || b.price_per_unit);
                case 'price_high':
                  return (b.current_bid || b.price_per_unit) - (a.current_bid || a.price_per_unit);
                case 'ending_soon':
                  if (a.listing_type === 'buy_now' && b.listing_type === 'buy_now') return 0;
                  if (a.listing_type === 'buy_now') return 1;
                  if (b.listing_type === 'buy_now') return -1;
                  return new Date(a.auction_end_time) - new Date(b.auction_end_time);
                case 'newest':
                default:
                  return new Date(b.created_at || b.id) - new Date(a.created_at || a.id);
              }
            });

            return sortedListings.length > 0 ? (
              sortedListings.map(listing => (
                <ListingCard 
                  key={listing.id} 
                  listing={listing} 
                  onViewDetails={handleViewDetails}
                  onBidPlaced={handlePlaceBid}
                  showNotification={showNotification}
                  onAddToCart={cartUpdateCallback}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="h-12 w-12 text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-2">
                  {deliverableOnly ? 'No deliverable listings found' : 'No livestock found'}
                </h3>
                <p className="text-emerald-600">
                  {deliverableOnly 
                    ? 'Try turning off the delivery filter or updating your location.'
                    : 'Try adjusting your filters or check back later for new listings.'
                  }
                </p>
                {deliverableOnly && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setDeliverableOnly(false)}
                  >
                    Show All Listings
                  </Button>
                )}
              </div>
            );
          })()}
        </div>
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedListing && (
        <OrderModal
          listing={selectedListing}
          isOpen={showOrderModal}
          onClose={() => setShowOrderModal(false)}
        />
      )}

      {/* Bidding Modal */}
      {showBiddingModal && selectedListing && (
        <BiddingModal
          listing={selectedListing}
          isOpen={showBiddingModal}
          onClose={() => setShowBiddingModal(false)}
          onBidPlaced={handleBidPlaced}
        />
      )}
    </div>
  );
}

// Bidding Modal Component
function BiddingModal({ listing, isOpen, onClose, onBidPlaced, onViewDetails }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bidAmount, setBidAmount] = useState('');
  const [maxBid, setMaxBid] = useState('');
  const [useAutoBidding, setUseAutoBidding] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBidHistory, setShowBidHistory] = useState(false);

  const currentBid = listing.current_bid || listing.starting_price;
  const minimumBid = currentBid + (currentBid * 0.05); // 5% increment minimum
  const timeRemaining = listing.auction_end_time ? new Date(listing.auction_end_time) - new Date() : 0;

  useEffect(() => {
    if (isOpen && listing.id) {
      fetchBidHistory();
      setBidAmount(Math.ceil(minimumBid).toString());
    }
  }, [isOpen, listing.id, minimumBid]);

  const fetchBidHistory = async () => {
    try {
      // Simulate bid history - in real app this would be an API call
      const mockHistory = [
        { id: 1, bidder: 'Anonymous', amount: listing.starting_price, timestamp: new Date(Date.now() - 3600000) },
        { id: 2, bidder: 'Anonymous', amount: currentBid, timestamp: new Date(Date.now() - 1800000) }
      ];
      setBidHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching bid history:', error);
    }
  };

  const placeBid = async () => {
    if (!user) {
      alert('Please login to place a bid');
      return;
    }

    const bidValue = parseFloat(bidAmount);
    if (bidValue < minimumBid) {
      alert(`Minimum bid is R${minimumBid.toFixed(2)}`);
      return;
    }

    if (listing.reserve_price && bidValue < listing.reserve_price) {
      alert(`Bid must meet reserve price of R${listing.reserve_price}`);
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to place bid
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newBid = {
        id: Date.now(),
        bidder: user.full_name,
        amount: bidValue,
        timestamp: new Date(),
        auto_bid: useAutoBidding,
        max_bid: useAutoBidding ? parseFloat(maxBid) : null
      };

      setBidHistory(prev => [...prev, newBid]);
      
      // Update listing current bid (in real app, this would come from server)
      listing.current_bid = bidValue;
      listing.total_bids = (listing.total_bids || 0) + 1;

      onBidPlaced(listing, newBid);
      
      // Show success notification
      showNotification('Bid placed successfully!', 'success');
      
      // Reset form
      setBidAmount(Math.ceil(bidValue * 1.05).toString());
      
    } catch (error) {
      console.error('Error placing bid:', error);
      showNotification('Failed to place bid. Please try again.', 'error');
    }
    setLoading(false);
  };

  const handleBuyNow = (listing) => {
    if (!user) {
      // For guest users, add to cart and redirect to guest checkout
      const cartItem = {
        listing_id: listing.id,
        title: listing.title,
        price: listing.price_per_unit,
        qty: 1,
        species: listing.species_id,
        product_type: listing.product_type_id
      };
      
      // Add to cart in localStorage
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = existingCart.findIndex(item => item.listing_id === listing.id);
      
      if (existingItemIndex >= 0) {
        existingCart[existingItemIndex].qty += 1;
      } else {
        existingCart.push(cartItem);
      }
      
      localStorage.setItem('cart', JSON.stringify(existingCart));
      
      // Redirect to guest checkout
      navigate('/checkout/guest'); 
      return;
    }
    
    // For authenticated users, show the listing details
    onViewDetails(listing);
  };

  // Separate function for viewing details (works for both guests and authenticated users)
  const handleViewDetails = (listing) => {
    // Navigate to PDP page for both guests and authenticated users
    navigate(`/listing/${listing.id}`);
  };

  const formatTimeRemaining = (ms) => {
    if (ms <= 0) return 'Auction Ended';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const showNotification = (message, type) => {
    // This would integrate with your notification system
    alert(message);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            {listing.listing_type === 'hybrid' ? 'Bid or Buy Now' : 'Place Your Bid'}
          </DialogTitle>
          <DialogDescription>
            {listing.title} • {formatTimeRemaining(timeRemaining)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Auction Status */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-orange-700">Current Bid</p>
                  <p className="text-2xl font-bold text-orange-900">R{currentBid}</p>
                </div>
                <div>
                  <p className="text-sm text-orange-700">Minimum Next Bid</p>
                  <p className="text-xl font-semibold text-orange-800">R{Math.ceil(minimumBid)}</p>
                </div>
              </div>
              
              {listing.reserve_price && (
                <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <Shield className="inline h-4 w-4 mr-1" />
                    Reserve Price: R{listing.reserve_price}
                    {currentBid >= listing.reserve_price ? ' (Met)' : ' (Not Met)'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bidding Form */}
          <div className="space-y-4">
            <div>
              <Label className="text-emerald-800">Your Bid Amount (R)</Label>
              <Input
                type="number"
                step="0.01"
                min={minimumBid}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Minimum: R${Math.ceil(minimumBid)}`}
                className="border-emerald-200 text-lg"
              />
            </div>

            {/* Auto-bidding Option */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="auto-bid"
                    checked={useAutoBidding}
                    onChange={(e) => setUseAutoBidding(e.target.checked)}
                    className="rounded border-blue-300"
                  />
                  <Label htmlFor="auto-bid" className="text-blue-900 font-semibold">
                    Enable Auto-bidding (Proxy Bidding)
                  </Label>
                </div>
                
                {useAutoBidding && (
                  <div>
                    <Label className="text-blue-800">Maximum Bid Amount (R)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={bidAmount}
                      value={maxBid}
                      onChange={(e) => setMaxBid(e.target.value)}
                      placeholder="Enter your maximum bid"
                      className="border-blue-200 mt-2"
                    />
                    <p className="text-xs text-blue-600 mt-2">
                      We'll automatically bid on your behalf up to this amount when others outbid you.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={placeBid}
              disabled={loading || timeRemaining <= 0}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Place Bid - R{bidAmount}
            </Button>
            
            {listing.listing_type === 'hybrid' && (
              <Button
                onClick={() => handleBuyNow(listing)}
                disabled={loading || timeRemaining <= 0}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Now - R{listing.buy_now_price}
              </Button>
            )}
          </div>

          {/* Bid History */}
          <div>
            <Button
              variant="outline"
              onClick={() => setShowBidHistory(!showBidHistory)}
              className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showBidHistory ? 'Hide' : 'Show'} Bid History ({bidHistory.length})
            </Button>
            
            {showBidHistory && (
              <Card className="mt-3 border-emerald-200">
                <CardContent className="p-4">
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {bidHistory.length > 0 ? (
                      bidHistory.slice().reverse().map((bid, index) => (
                        <div key={bid.id} className="flex justify-between items-center py-2 border-b border-emerald-100 last:border-b-0">
                          <div>
                            <p className="font-semibold text-emerald-900">
                              {bid.bidder === user?.full_name ? 'You' : bid.bidder}
                              {bid.auto_bid && <Badge className="ml-2 text-xs bg-blue-100 text-blue-700">Auto</Badge>}
                            </p>
                            <p className="text-xs text-emerald-600">
                              {new Date(bid.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <p className="font-bold text-emerald-900">R{bid.amount}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-emerald-600 text-center">No bids yet. Be the first!</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
function OrderModal({ listing, categoryName, isOpen, onClose }) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalAmount = (listing.price_per_unit * quantity).toFixed(2);
  const marketplaceFee = (totalAmount * 0.05).toFixed(2);
  const grandTotal = (parseFloat(totalAmount) + parseFloat(marketplaceFee)).toFixed(2);

  const handleOrder = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🛒 Creating order for listing:', listing.id, 'Quantity:', quantity);
      
      const response = await apiCall('POST', '/orders', {
        listing_id: listing.id,
        quantity: quantity
      });
      
      console.log('🛒 Order response:', response);
      
      if (response.data?.payment_url) {
        console.log('🛒 Payment URL received:', response.data.payment_url);
        // Redirect to actual payment URL
        window.open(response.data.payment_url, '_blank');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        console.log('🛒 No payment URL in response, marking as success');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('🚨 Error creating order:', error);
      // Add user feedback for errors
      alert('Failed to create order. Please try again.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-900 mb-2">Order Created Successfully!</h3>
            <p className="text-emerald-600">Your order has been placed and payment is being processed.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-emerald-900">Complete Your Order</DialogTitle>
          <DialogDescription className="text-emerald-600">
            Review your order details and confirm purchase
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Listing Summary */}
          <div className="border border-emerald-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-emerald-900">{listing.title}</h4>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                {categoryName}
              </Badge>
            </div>
            <p className="text-sm text-emerald-600 mb-2">R{listing.price_per_unit} per {listing.unit}</p>
            {listing.has_vet_certificate && (
              <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                Vet Certified
              </Badge>
            )}
          </div>

          {/* Quantity Selection */}
          <div>
            <Label className="text-emerald-800 mb-2 block">Quantity</Label>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="border-emerald-300"
              >
                -
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center border-emerald-200"
                min="1"
                max={listing.quantity}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.min(listing.quantity, quantity + 1))}
                className="border-emerald-300"
              >
                +
              </Button>
              <span className="text-sm text-emerald-600">of {listing.quantity} available</span>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
            <h4 className="font-semibold text-emerald-900 mb-3">Order Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-700">Subtotal ({quantity} {listing.unit})</span>
                <span className="text-emerald-900">R{totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700">Marketplace Fee (5%)</span>
                <span className="text-emerald-900">R{marketplaceFee}</span>
              </div>
              <div className="border-t border-emerald-200 pt-2 flex justify-between font-semibold">
                <span className="text-emerald-900">Total</span>
                <span className="text-emerald-900">R{grandTotal}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-emerald-300">
            Cancel
          </Button>
          <Button
            onClick={handleOrder}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
          >
            {loading ? 'Processing...' : `Pay R${grandTotal}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Enhanced Listing Card component with geofencing
function ListingCard({ listing, onViewDetails, onBidPlaced, showNotification, onAddToCart }) {
  console.log('🎯 ListingCard rendering:', listing.title); // Debug log
  
  const navigate = useNavigate();
  const { user } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [addingToCart, setAddingToCart] = useState(false);

  const handleAddToCart = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    setAddingToCart(true);
    try {
      // Fix environment variable access for different React setups
      const backendUrl = window.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        import.meta?.env?.REACT_APP_BACKEND_URL ||
                        'https://farmstock-hub-1.preview.emergentagent.com';
      
      console.log('🛒 Adding to cart:', listing.id, 'Backend URL:', backendUrl); // Debug log
      
      const response = await fetch(`${backendUrl}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || user.email}`
        },
        body: JSON.stringify({
          listing_id: listing.id,
          quantity: 1,
          shipping_option: 'standard'
        })
      });

      console.log('🛒 Cart response status:', response.status); // Debug log
      
      if (response.ok) {
        const data = await response.json();
        console.log('🛒 Cart response data:', data); // Debug log
        showNotification?.(`${listing.title} added to cart!`, 'success');
        onAddToCart?.(data.cart_item_count);
      } else {
        const errorData = await response.text();
        console.error('🛒 Cart error response:', response.status, errorData);
        throw new Error(`Failed to add to cart: ${response.status} ${errorData}`);
      }
    } catch (error) {
      console.error('🚨 Error adding to cart:', error);
      showNotification?.('Failed to add item to cart. Please try again.', 'error');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = (listing) => {
    if (!user) {
      // For guest users, add to cart and redirect to guest checkout
      const cartItem = {
        listing_id: listing.id,
        title: listing.title,
        price: listing.price_per_unit,
        qty: 1,
        species: listing.species_id,
        product_type: listing.product_type_id
      };
      
      // Add to cart in localStorage
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = existingCart.findIndex(item => item.listing_id === listing.id);
      
      if (existingItemIndex >= 0) {
        existingCart[existingItemIndex].qty += 1;
      } else {
        existingCart.push(cartItem);
      }
      
      localStorage.setItem('cart', JSON.stringify(existingCart));
      
      // Redirect to guest checkout
      navigate('/checkout/guest'); 
      return;
    }
    
    // For authenticated users, show the listing details
    onViewDetails(listing);
  };

  // Separate function for viewing details (works for both guests and authenticated users)
  const handleViewDetails = (listing) => {
    // Navigate to PDP page for both guests and authenticated users
    navigate(`/listing/${listing.id}`);
  };

  const isAuction = listing.listing_type === 'auction' || listing.listing_type === 'hybrid';
  const isExpired = listing.auction_end_time && new Date(listing.auction_end_time) < new Date();
  const timeRemainingCalc = listing.auction_end_time ? new Date(listing.auction_end_time) - new Date() : 0;
  
  // Update timeRemaining state
  useEffect(() => {
    setTimeRemaining(timeRemainingCalc);
  }, [timeRemainingCalc]);
  
  // Mock service area for demonstration - in real app this comes from listing data
  const serviceArea = listing.service_area || {
    mode: 'RADIUS',
    origin: { lat: -26.2041 + (Math.random() - 0.5) * 4, lng: 28.0473 + (Math.random() - 0.5) * 4 },
    radius_km: 150 + Math.random() * 200
  };
  
  // Format time remaining
  const formatTimeRemaining = (ms) => {
    if (ms <= 0) return 'Ended';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m ${seconds}s`;
  };

  const getCurrentPrice = () => {
    if (listing.listing_type === 'buy_now') {
      return listing.price_per_unit;
    }
    return listing.current_bid || listing.starting_price || listing.price_per_unit;
  };

  return (
    <Card className="border-emerald-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden">
      {/* Listing Type Badge */}
      <div className="absolute top-3 left-3 z-10">
        {listing.listing_type === 'buy_now' && (
          <Badge className="bg-blue-500 hover:bg-blue-600 text-white">
            <ShoppingCart className="h-3 w-3 mr-1" />
            Buy Now
          </Badge>
        )}
        {listing.listing_type === 'auction' && (
          <Badge className="bg-orange-500 hover:bg-orange-600 text-white">
            <TrendingUp className="h-3 w-3 mr-1" />
            Auction
          </Badge>
        )}
        {listing.listing_type === 'hybrid' && (
          <Badge className="bg-purple-500 hover:bg-purple-600 text-white">
            <DollarSign className="h-3 w-3 mr-1" />
            Hybrid
          </Badge>
        )}
      </div>

      {/* Countdown Timer for Auctions */}
      {isAuction && !isExpired && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-red-500 hover:bg-red-600 text-white animate-pulse">
            <Clock className="h-3 w-3 mr-1" />
            {formatTimeRemaining(timeRemaining)}
          </Badge>
        </div>
      )}

      {isExpired && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-gray-500 text-white">
            Ended
          </Badge>
        </div>
      )}

      <CardContent className="p-0">
        {/* Image */}
        <div className="h-48 bg-gradient-to-br from-emerald-100 to-green-100 flex items-center justify-center relative">
          <span className="text-6xl">
            {listing.title?.toLowerCase().includes('chicken') || listing.title?.toLowerCase().includes('poultry') ? '🐔' : 
             listing.title?.toLowerCase().includes('goat') ? '🐐' : 
             listing.title?.toLowerCase().includes('cattle') || listing.title?.toLowerCase().includes('cow') ? '🐄' : 
             listing.title?.toLowerCase().includes('sheep') ? '🐑' : 
             listing.title?.toLowerCase().includes('pig') ? '🐷' : '🐾'}
          </span>
        </div>

        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-emerald-900 line-clamp-2 flex-1">{listing.title}</h3>
            {/* Delivery Range Badge - Temporarily disabled until component is created */}
            <Badge variant="outline" className="text-xs">
              {listing.seller_country || 'ZA'}
            </Badge>
          </div>
          
          {/* Pricing Display */}
          <div className="mb-3">
            {listing.listing_type === 'buy_now' && (
              <div className="text-2xl font-bold text-emerald-600">
                R{getCurrentPrice()}
                <span className="text-sm text-emerald-500 ml-1">per {listing.unit}</span>
              </div>
            )}
            
            {listing.listing_type === 'auction' && (
              <div>
                <div className="text-lg text-emerald-700 mb-1">
                  Current Bid: <span className="font-bold text-emerald-600">R{getCurrentPrice()}</span>
                </div>
                {listing.reserve_price && (
                  <div className="text-sm text-emerald-500">
                    Reserve: R{listing.reserve_price}
                  </div>
                )}
                <div className="text-xs text-gray-500">
                  {listing.total_bids || 0} bid(s)
                </div>
              </div>
            )}
            
            {listing.listing_type === 'hybrid' && (
              <div>
                <div className="text-lg text-emerald-700 mb-1">
                  Current Bid: <span className="font-bold text-emerald-600">R{getCurrentPrice()}</span>
                </div>
                <div className="text-sm text-blue-600 font-semibold">
                  Buy Now: R{listing.buy_now_price}
                </div>
                <div className="text-xs text-gray-500">
                  {listing.total_bids || 0} bid(s)
                </div>
              </div>
            )}
          </div>

          {/* Location & Quantity */}
          <div className="flex justify-between text-sm text-emerald-600 mb-3">
            <span><MapPin className="inline h-4 w-4 mr-1" />{listing.city || listing.region}</span>
            <span>Qty: {listing.quantity}</span>
          </div>

          {/* Seller Info */}
          <div className="flex items-center gap-2 mb-3">
            <Avatar className="h-6 w-6">
              <AvatarFallback className="bg-emerald-100 text-emerald-700 text-xs">
                {listing.seller_name?.charAt(0) || 'S'}
              </AvatarFallback>
            </Avatar>
            <span className="text-sm text-emerald-700">{listing.seller_name || 'Verified Seller'}</span>
            {listing.has_vet_certificate && (
              <Badge className="text-xs bg-green-100 text-green-700">
                <CheckCircle className="h-3 w-3 mr-1" />
                Vet Certified
              </Badge>
            )}
          </div>

          {/* Livestock Specifications */}
          <div className="mb-4 space-y-2">
            {/* Weight and Age Information */}
            {(listing.weight_kg || listing.age_weeks || listing.age_days || listing.breed) && (
              <div className="grid grid-cols-2 gap-2 text-sm">
                {listing.weight_kg && (
                  <div>
                    <span className="font-semibold text-gray-700">Weight:</span> {listing.weight_kg} kg
                  </div>
                )}
                {(listing.age_weeks || listing.age_days) && (
                  <div>
                    <span className="font-semibold text-gray-700">Age:</span> 
                    {listing.age_weeks ? ` ${listing.age_weeks} weeks` : ''}
                    {listing.age_days ? ` ${listing.age_days} days` : ''}
                    {!listing.age_weeks && !listing.age_days && listing.age ? ` ${listing.age}` : ''}
                  </div>
                )}
                {listing.breed && (
                  <div className="col-span-2">
                    <span className="font-semibold text-gray-700">Breed:</span> {listing.breed}
                  </div>
                )}
              </div>
            )}

            {/* Health and Vaccination Information */}
            {(listing.vaccination_status || listing.health_certificates || listing.description?.includes('vaccin') || listing.description?.includes('health')) && (
              <div className="flex flex-wrap gap-1">
                {listing.vaccination_status && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    {listing.vaccination_status}
                  </Badge>
                )}
                {listing.health_certificates && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    Health Certificate
                  </Badge>
                )}
                {listing.description?.toLowerCase().includes('marek') && (
                  <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200">
                    Marek's Vaccinated
                  </Badge>
                )}
                {listing.description?.toLowerCase().includes('newcastle') && (
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    Newcastle Vaccinated
                  </Badge>
                )}
                {listing.has_vet_certificate && (
                  <Badge variant="outline" className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200">
                    Inspection OK
                  </Badge>
                )}
              </div>
            )}

            {/* Additional Specifications */}
            {listing.description && listing.description.length > 0 && (
              <div className="text-xs text-gray-600 line-clamp-2">
                {listing.description}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            {listing.listing_type === 'buy_now' && (
              <>
                <Button 
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                  onClick={handleAddToCart}
                  disabled={addingToCart}
                >
                  {addingToCart ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <ShoppingCart className="h-4 w-4 mr-2" />
                  )}
                  {addingToCart ? 'Adding...' : 'Add to Cart'}
                </Button>
                <Button 
                  variant="outline"
                  className="border-emerald-500 text-emerald-600 hover:bg-emerald-50"
                  onClick={() => handleViewDetails(listing)}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
              </>
            )}
            
            {listing.listing_type === 'auction' && !isExpired && (
              <Button 
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
                onClick={() => onBidPlaced(listing)}
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Place Bid
              </Button>
            )}
            
            {listing.listing_type === 'hybrid' && !isExpired && (
              <>
                <Button 
                  variant="outline"
                  className="flex-1 border-orange-500 text-orange-600 hover:bg-orange-50"
                  onClick={() => onBidPlaced(listing)}
                >
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Bid
                </Button>
                <Button 
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  onClick={() => handleBuyNow(listing)}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Buy Now
                </Button>
              </>
            )}
            
            {isExpired && (
              <Button variant="outline" className="flex-1" disabled>
                Auction Ended
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
// Enhanced CreateListing with Exotic Category Support
function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [taxonomy, setTaxonomy] = useState([]);
  const [coreCategories, setCoreCategories] = useState([]);
  const [exoticCategories, setExoticCategories] = useState([]);
  const [showExoticCategories, setShowExoticCategories] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    category_group_id: '',
    species_id: '',
    breed_id: '',
    product_type_id: '',
    title: '',
    description: '',
    quantity: 1,
    unit: 'head',
    price_per_unit: '',
    listing_type: 'buy_now', // New field: 'buy_now', 'auction', 'hybrid'
    starting_price: '', // For auctions
    reserve_price: '', // Optional reserve for auctions
    buy_now_price: '', // For hybrid listings
    auction_duration: '24', // Hours: 24, 48, 168 (7 days)
    delivery_available: false,
    has_vet_certificate: false,
    health_notes: '',
    region: '',
    city: '',
    images: [],
    certificates: [],
    // Animal Statistics Fields
    age: '',
    sex: '',
    weight: '',
    vaccination_status: '',
    health_status: 'healthy',
    veterinary_certificate: false,
    animal_type: '',
    survival_rate: ''
  });

  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [filteredBreeds, setFilteredBreeds] = useState([]);
  const [filteredProductTypes, setFilteredProductTypes] = useState([]);

  useEffect(() => {
    if (user && user.roles.includes('seller')) {
      fetchTaxonomy();
    }
  }, [user]);

  // Re-fetch categories when exotic toggle changes
  useEffect(() => {
    if (user && user.roles.includes('seller')) {
      fetchTaxonomy();
    }
  }, [showExoticCategories]);

  const fetchTaxonomy = async () => {
    try {
      setLoading(true);
      
      // Fetch core categories
      const coreResponse = await fetch('/api/taxonomy/categories?mode=core');
      if (coreResponse.ok) {
        const coreData = await coreResponse.json();
        setCoreCategories(coreData);
      }

      // Fetch exotic categories if enabled
      if (showExoticCategories) {
        const exoticResponse = await fetch('/api/taxonomy/categories?mode=exotic');
        if (exoticResponse.ok) {
          const exoticData = await exoticResponse.json();
          setExoticCategories(exoticData);
        }
      } else {
        setExoticCategories([]);
      }

      // Also fetch full taxonomy for species/breeds (keep existing functionality)
      const taxonomyResponse = await fetch('/api/taxonomy/full');
      if (taxonomyResponse.ok) {
        const data = await taxonomyResponse.json();
        setTaxonomy(data);
      }
      
    } catch (error) {
      console.error('Error fetching taxonomy:', error);
      setTaxonomy([]);
      setCoreCategories([]);
      setExoticCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryGroupChange = (groupId) => {
    const selectedGroup = taxonomy.find(t => t.group.id === groupId);
    setFormData({
      ...formData,
      category_group_id: groupId,
      species_id: '',
      breed_id: '',
      product_type_id: ''
    });
    
    setFilteredSpecies(selectedGroup ? selectedGroup.species : []);
    setFilteredProductTypes(selectedGroup ? selectedGroup.product_types : []);
    setFilteredBreeds([]);
  };

  const handleSpeciesChange = (speciesId) => {
    const selectedSpecies = filteredSpecies.find(s => s.id === speciesId);
    setFormData({
      ...formData,
      species_id: speciesId,
      breed_id: ''
    });
    
    setFilteredBreeds(selectedSpecies ? selectedSpecies.breeds : []);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Get current context
      const currentContext = localStorage.getItem('currentContext') || 'user';
      
      // Make request with organization context header
      const config = {
        method: 'POST',
        url: `${API}/listings`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'X-Org-Context': currentContext
        },
        data: formData
      };
      
      await axios(config);
      navigate('/dashboard');
    } catch (error) {
      console.error('Error creating listing:', error);
    }
    setSubmitting(false);
  };

  if (!user || !user.roles.includes('seller')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <Card className="p-8 text-center">
          <CardContent>
            <h2 className="text-2xl font-bold text-emerald-900 mb-4">Seller Access Required</h2>
            <p className="text-emerald-600">You need seller privileges to create listings.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl">📦</span>
          </div>
          <p className="text-emerald-700">Loading taxonomy...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-emerald-900 mb-2">Create New Listing</h1>
          <p className="text-emerald-700">List your livestock for sale on the StockLot marketplace</p>
        </div>

        {/* Context Banner */}
        <div className="max-w-4xl mx-auto mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2 text-sm">
              <span className="font-medium text-blue-900">Creating listing as:</span>
              <span className="text-blue-700">
                {localStorage.getItem('currentContext') === 'user' ? 
                  `${user.full_name} (Personal)` : 
                  'Organization'
                }
              </span>
              <span className="text-blue-600">•</span>
              <span className="text-blue-600">Switch context in the header above if needed</span>
            </div>
          </div>
        </div>

        <Card className="max-w-4xl mx-auto border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900">Livestock Details</CardTitle>
            <CardDescription>Provide comprehensive information about your livestock</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Exotic Categories Toggle */}
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-emerald-900 mb-1">Livestock Category Selection</h3>
                      <p className="text-sm text-emerald-700">Choose the category that best fits your livestock</p>
                    </div>
                    
                    <label className="inline-flex items-center gap-3 cursor-pointer">
                      <span className="text-sm text-gray-700">Show Exotic & Specialty</span>
                      <input
                        type="checkbox"
                        checked={showExoticCategories}
                        onChange={(e) => setShowExoticCategories(e.target.checked)}
                        className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 focus:ring-2"
                      />
                      <span className="text-xs text-gray-500">(Ostrich, Game Animals, etc.)</span>
                    </label>
                  </div>
                  
                  {showExoticCategories && (
                    <div className="mt-3 p-3 bg-amber-100 border border-amber-300 rounded-lg">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <svg className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-amber-800">Exotic Livestock Requirements</h4>
                          <p className="text-sm text-amber-700 mt-1">
                            Some exotic species require special permits, proper containment, and veterinary oversight. 
                            Ensure you comply with all regulations before listing.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Category Selection */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-emerald-800">Category Group *</Label>
                  <Select value={formData.category_group_id} onValueChange={handleCategoryGroupChange}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue placeholder="Select category group" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* Core Categories - Always Show */}
                      {coreCategories.map(category => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                      
                      {/* Exotic Categories - Show Only When Enabled */}
                      {showExoticCategories && exoticCategories.length > 0 && (
                        <>
                          <div className="px-2 py-1 text-xs font-semibold text-amber-700 bg-amber-100">
                            Exotic & Specialty
                          </div>
                          {exoticCategories.map(category => (
                            <SelectItem key={category.id} value={category.id}>
                              🌟 {category.name}
                            </SelectItem>
                          ))}
                        </>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-emerald-800">Species *</Label>
                  <Select value={formData.species_id} onValueChange={handleSpeciesChange} disabled={!formData.category_group_id}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue placeholder="Select species" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredSpecies.map((species, index) => (
                        <SelectItem key={species.id || index} value={species.id || ''}>
                          {species.name || 'Unknown Species'}
                          {species.is_free_range && " (Free Range)"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-emerald-800">Breed</Label>
                  <Select value={formData.breed_id} onValueChange={(value) => setFormData({...formData, breed_id: value})} disabled={!formData.species_id}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue placeholder="Select breed (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific breed</SelectItem>
                      {(filteredBreeds || []).filter(breed => breed && breed.id && breed.id !== "").map(breed => (
                        <SelectItem key={breed.id} value={breed.id}>
                          {breed.name}
                          {breed.purpose_hint && ` (${breed.purpose_hint})`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-emerald-800">Product Type *</Label>
                  <Select value={formData.product_type_id} onValueChange={(value) => setFormData({...formData, product_type_id: value})} disabled={!formData.category_group_id}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue placeholder="Select product type" />
                    </SelectTrigger>
                    <SelectContent>
                      {(filteredProductTypes || []).filter(type => type && type.id && type.id !== "").map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Basic Information */}
              <div>
                <Label className="text-emerald-800">Title *</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  placeholder="e.g., Premium Ross 308 Day-Old Chicks"
                  className="border-emerald-200"
                  required
                />
              </div>

              <div>
                <Label className="text-emerald-800">Description</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Detailed description of your livestock..."
                  className="border-emerald-200"
                  rows={4}
                />
              </div>

              {/* Quantity */}
              <div>
                <Label className="text-emerald-800">Quantity *</Label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})}
                  min="1"
                  className="border-emerald-200"
                  required
                />
              </div>

              {/* Pricing & Listing Type */}
              <div className="space-y-6">
                <div>
                  <Label className="text-emerald-800 text-lg font-semibold">Listing Type *</Label>
                  <p className="text-sm text-emerald-600 mb-4">Choose how you want to sell your livestock</p>
                  <div className="grid md:grid-cols-3 gap-4">
                    <Card 
                      className={`cursor-pointer transition-all ${formData.listing_type === 'buy_now' ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:bg-emerald-50'}`}
                      onClick={() => setFormData({...formData, listing_type: 'buy_now'})}
                    >
                      <CardContent className="p-4 text-center">
                        <ShoppingCart className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                        <h3 className="font-semibold text-emerald-900">Buy Now</h3>
                        <p className="text-xs text-emerald-600 mt-1">Fixed price, instant sale</p>
                        <p className="text-xs text-emerald-500 mt-2">Best for: Daily items, eggs, chicks, market-ready livestock</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer transition-all ${formData.listing_type === 'auction' ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:bg-emerald-50'}`}
                      onClick={() => setFormData({...formData, listing_type: 'auction'})}
                    >
                      <CardContent className="p-4 text-center">
                        <TrendingUp className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                        <h3 className="font-semibold text-emerald-900">Auction</h3>
                        <p className="text-xs text-emerald-600 mt-1">Competitive bidding</p>
                        <p className="text-xs text-emerald-500 mt-2">Best for: Rare breeds, breeding stock, bulk lots</p>
                      </CardContent>
                    </Card>
                    
                    <Card 
                      className={`cursor-pointer transition-all ${formData.listing_type === 'hybrid' ? 'ring-2 ring-emerald-500 bg-emerald-50' : 'hover:bg-emerald-50'}`}
                      onClick={() => setFormData({...formData, listing_type: 'hybrid'})}
                    >
                      <CardContent className="p-4 text-center">
                        <DollarSign className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                        <h3 className="font-semibold text-emerald-900">Hybrid</h3>
                        <p className="text-xs text-emerald-600 mt-1">Auction + Buy Now</p>
                        <p className="text-xs text-emerald-500 mt-2">Best for: Premium livestock with flexibility</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Buy Now Pricing */}
                {formData.listing_type === 'buy_now' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <Label className="text-emerald-800">Unit Type *</Label>
                      <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="head">Per Head</SelectItem>
                          <SelectItem value="dozen">Per Dozen</SelectItem>
                          <SelectItem value="kg">Per Kg</SelectItem>
                          <SelectItem value="box">Per Box</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-emerald-800">Price per Unit (R) *</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={formData.price_per_unit}
                        onChange={(e) => setFormData({...formData, price_per_unit: e.target.value})}
                        placeholder="0.00"
                        className="border-emerald-200"
                        required
                      />
                    </div>
                  </div>
                )}

                {/* Auction Pricing */}
                {formData.listing_type === 'auction' && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-emerald-800">Unit Type *</Label>
                        <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                          <SelectTrigger className="border-emerald-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="head">Per Head</SelectItem>
                            <SelectItem value="dozen">Per Dozen</SelectItem>
                            <SelectItem value="kg">Per Kg</SelectItem>
                            <SelectItem value="box">Per Box</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-emerald-800">Starting Price (R) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.starting_price}
                          onChange={(e) => setFormData({...formData, starting_price: e.target.value})}
                          placeholder="0.00"
                          className="border-emerald-200"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-emerald-800">Reserve Price (R)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.reserve_price}
                          onChange={(e) => setFormData({...formData, reserve_price: e.target.value})}
                          placeholder="Optional minimum"
                          className="border-emerald-200"
                        />
                        <p className="text-xs text-emerald-500 mt-1">Hidden minimum you'll accept</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-emerald-800">Auction Duration *</Label>
                      <Select value={formData.auction_duration} onValueChange={(value) => setFormData({...formData, auction_duration: value})}>
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24">24 Hours</SelectItem>
                          <SelectItem value="48">48 Hours (2 Days)</SelectItem>
                          <SelectItem value="168">7 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* Hybrid Pricing */}
                {formData.listing_type === 'hybrid' && (
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-4 gap-6">
                      <div>
                        <Label className="text-emerald-800">Unit Type *</Label>
                        <Select value={formData.unit} onValueChange={(value) => setFormData({...formData, unit: value})}>
                          <SelectTrigger className="border-emerald-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="head">Per Head</SelectItem>
                            <SelectItem value="dozen">Per Dozen</SelectItem>
                            <SelectItem value="kg">Per Kg</SelectItem>
                            <SelectItem value="box">Per Box</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-emerald-800">Starting Bid (R) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.starting_price}
                          onChange={(e) => setFormData({...formData, starting_price: e.target.value})}
                          placeholder="0.00"
                          className="border-emerald-200"
                          required
                        />
                      </div>

                      <div>
                        <Label className="text-emerald-800">Reserve Price (R)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.reserve_price}
                          onChange={(e) => setFormData({...formData, reserve_price: e.target.value})}
                          placeholder="Optional"
                          className="border-emerald-200"
                        />
                      </div>

                      <div>
                        <Label className="text-emerald-800">Buy Now Price (R) *</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.buy_now_price}
                          onChange={(e) => setFormData({...formData, buy_now_price: e.target.value})}
                          placeholder="0.00"
                          className="border-emerald-200"
                          required
                        />
                        <p className="text-xs text-emerald-500 mt-1">Skip auction price</p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-emerald-800">Auction Duration *</Label>
                      <Select value={formData.auction_duration} onValueChange={(value) => setFormData({...formData, auction_duration: value})}>
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24">24 Hours</SelectItem>
                          <SelectItem value="48">48 Hours (2 Days)</SelectItem>
                          <SelectItem value="168">7 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Card className="bg-emerald-50 border-emerald-200">
                      <CardContent className="p-4">
                        <h4 className="font-semibold text-emerald-900 mb-2">How Hybrid Works:</h4>
                        <ul className="text-sm text-emerald-700 space-y-1">
                          <li>• Buyers can either <strong>place bids</strong> starting at R{formData.starting_price || '0'}</li>
                          <li>• Or <strong>buy instantly</strong> for R{formData.buy_now_price || '0'}</li>
                          <li>• If someone buys instantly, auction ends immediately</li>
                          <li>• Otherwise, highest bidder wins at auction end</li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Animal Statistics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-emerald-900 border-b border-emerald-200 pb-2">
                  Animal Statistics & Health Information
                </h3>
                
                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-emerald-800">Age</Label>
                    <Input
                      value={formData.age}
                      onChange={(e) => setFormData({...formData, age: e.target.value})}
                      placeholder="e.g., 6 months, 2 years"
                      className="border-emerald-200"
                    />
                  </div>

                  <div>
                    <Label className="text-emerald-800">Sex</Label>
                    <Select value={formData.sex} onValueChange={(value) => setFormData({...formData, sex: value})}>
                      <SelectTrigger className="border-emerald-200">
                        <SelectValue placeholder="Select sex" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="mixed">Mixed (for groups)</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-emerald-800">Weight</Label>
                    <Input
                      value={formData.weight}
                      onChange={(e) => setFormData({...formData, weight: e.target.value})}
                      placeholder="e.g., 50kg, 2.5kg per bird"
                      className="border-emerald-200"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                  <div>
                    <Label className="text-emerald-800">Vaccination Status</Label>
                    <Select value={formData.vaccination_status} onValueChange={(value) => setFormData({...formData, vaccination_status: value})}>
                      <SelectTrigger className="border-emerald-200">
                        <SelectValue placeholder="Select vaccination status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="fully_vaccinated">Fully Vaccinated</SelectItem>
                        <SelectItem value="partially_vaccinated">Partially Vaccinated</SelectItem>
                        <SelectItem value="not_vaccinated">Not Vaccinated</SelectItem>
                        <SelectItem value="scheduled">Vaccination Scheduled</SelectItem>
                        <SelectItem value="unknown">Unknown</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-emerald-800">Health Status</Label>
                    <Select value={formData.health_status} onValueChange={(value) => setFormData({...formData, health_status: value})}>
                      <SelectTrigger className="border-emerald-200">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="excellent">Excellent</SelectItem>
                        <SelectItem value="healthy">Healthy</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                        <SelectItem value="recovering">Recovering</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-emerald-800">Animal Type</Label>
                    <Input
                      value={formData.animal_type}
                      onChange={(e) => setFormData({...formData, animal_type: e.target.value})}
                      placeholder="e.g., Breeding stock, Commercial, Show quality"
                      className="border-emerald-200"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label className="text-emerald-800">Survival Rate (%)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.survival_rate}
                      onChange={(e) => setFormData({...formData, survival_rate: e.target.value})}
                      placeholder="e.g., 95"
                      className="border-emerald-200"
                    />
                    <p className="text-xs text-emerald-600 mt-1">Expected survival rate (for young animals)</p>
                  </div>

                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      id="veterinary_certificate"
                      checked={formData.veterinary_certificate}
                      onChange={(e) => setFormData({...formData, veterinary_certificate: e.target.checked})}
                      className="h-4 w-4 text-emerald-600"
                    />
                    <Label htmlFor="veterinary_certificate" className="text-emerald-800">
                      Has Veterinary Certificate
                    </Label>
                  </div>
                </div>
              </div>

              {/* Location */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-emerald-800">Province/Region *</Label>
                  <Input
                    value={formData.region}
                    onChange={(e) => setFormData({...formData, region: e.target.value})}
                    placeholder="e.g., Gauteng"
                    className="border-emerald-200"
                    required
                  />
                </div>

                <div>
                  <Label className="text-emerald-800">City *</Label>
                  <Input
                    value={formData.city}
                    onChange={(e) => setFormData({...formData, city: e.target.value})}
                    placeholder="e.g., Pretoria"
                    className="border-emerald-200"
                    required
                  />
                </div>
              </div>

              {/* Health and Delivery */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="vet_certificate"
                    checked={formData.has_vet_certificate}
                    onChange={(e) => setFormData({...formData, has_vet_certificate: e.target.checked})}
                    className="rounded border-emerald-300"
                  />
                  <Label htmlFor="vet_certificate" className="text-emerald-800">
                    Has Veterinary Certificate
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="delivery"
                    checked={formData.delivery_available}
                    onChange={(e) => setFormData({...formData, delivery_available: e.target.checked})}
                    className="rounded border-emerald-300"
                  />
                  <Label htmlFor="delivery" className="text-emerald-800">
                    Delivery Available
                  </Label>
                </div>
              </div>

              {/* Image Upload Section */}
              <div>
                <Label className="text-emerald-800">Animal Photos *</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="animal_images" className="flex flex-col items-center justify-center w-full h-32 border-2 border-emerald-300 border-dashed rounded-lg cursor-pointer bg-emerald-50 hover:bg-emerald-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-emerald-500" />
                        <p className="mb-2 text-sm text-emerald-700">
                          <span className="font-semibold">Click to upload</span> animal photos
                        </p>
                        <p className="text-xs text-emerald-500">PNG, JPG, JPEG up to 5MB each (Max 5 photos)</p>
                      </div>
                      <input 
                        id="animal_images" 
                        type="file" 
                        multiple 
                        accept="image/*"
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          if (files.length > 5) {
                            alert('Maximum 5 images allowed');
                            return;
                          }
                          setFormData({...formData, images: files});
                        }}
                        className="hidden" 
                      />
                    </label>
                  </div>
                  {formData.images && formData.images.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-emerald-700 mb-2">Selected images: {formData.images.length}</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(formData.images).map((file, index) => (
                          <div key={index} className="flex items-center bg-emerald-100 rounded px-2 py-1">
                            <Image className="w-4 h-4 mr-1 text-emerald-600" />
                            <span className="text-xs text-emerald-700">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Certificate Upload Section */}
              <div>
                <Label className="text-emerald-800">Certificates (Optional)</Label>
                <div className="mt-2">
                  <div className="flex items-center justify-center w-full">
                    <label htmlFor="certificates" className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className="flex flex-col items-center justify-center pt-3 pb-4">
                        <FileText className="w-6 h-6 mb-2 text-gray-500" />
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold">Upload certificates</span>
                        </p>
                        <p className="text-xs text-gray-500">Vet certificates, health records (PDF, JPG, PNG) - Max 5 files</p>
                      </div>
                      <input 
                        id="certificates" 
                        type="file" 
                        multiple 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
                          if (files.length > 5) {
                            alert('Maximum 5 certificates allowed');
                            return;
                          }
                          setFormData({...formData, certificates: files});
                        }}
                        className="hidden" 
                      />
                    </label>
                  </div>
                  {formData.certificates && formData.certificates.length > 0 && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-700 mb-2">Uploaded certificates: {formData.certificates.length}</p>
                      <div className="flex flex-wrap gap-2">
                        {Array.from(formData.certificates).map((file, index) => (
                          <div key={index} className="flex items-center bg-gray-100 rounded px-2 py-1">
                            <FileText className="w-4 h-4 mr-1 text-gray-600" />
                            <span className="text-xs text-gray-700">{file.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-emerald-800">Health Notes</Label>
                <Textarea
                  value={formData.health_notes}
                  onChange={(e) => setFormData({...formData, health_notes: e.target.value})}
                  placeholder="Vaccination status, health conditions, etc."
                  className="border-emerald-200"
                  rows={3}
                />
              </div>

              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/dashboard')}
                  className="border-emerald-300 text-emerald-700"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting}
                  className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                >
                  {submitting ? 'Creating Listing...' : 'Create Listing'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Placeholder Pages
function HowItWorks() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-emerald-900 mb-4">How StockLot Works</h1>
            <p className="text-xl text-emerald-700">Simple, secure, and efficient livestock trading</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="border-emerald-200 text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Search className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-4">1. Browse & Search</h3>
                <p className="text-emerald-700">Use our smart search to find the exact livestock you need, from day-old chicks to breeding cattle.</p>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-200 text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-4">2. Secure Payment</h3>
                <p className="text-emerald-700">Pay safely with our escrow system. Your money is held securely until delivery is confirmed.</p>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-200 text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Truck className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-emerald-900 mb-4">3. Pickup/Delivery</h3>
                <p className="text-emerald-700">Arrange pickup or delivery with the seller. Confirm receipt to release payment.</p>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <Button 
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 text-lg"
              onClick={() => window.location.href = '/marketplace'}
            >
              Start Browsing
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AboutUs() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-emerald-900 mb-4">About StockLot</h1>
            <p className="text-xl text-emerald-700">Revolutionizing livestock trading in South Africa</p>
          </div>
          
          <Card className="border-emerald-200 mb-12">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold text-emerald-900 mb-6">Our Mission</h2>
              <p className="text-emerald-700 leading-relaxed mb-6">
                StockLot is South Africa's premier digital livestock marketplace, connecting farmers, buyers, and agricultural businesses across the country. We're committed to modernizing livestock trading with secure payments, verified sellers, and comprehensive animal categories.
              </p>
              <p className="text-emerald-700 leading-relaxed">
                From day-old chicks to breeding cattle, we provide a trusted platform where quality livestock meets reliable buyers, fostering growth in South Africa's agricultural sector.
              </p>
            </CardContent>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-emerald-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-emerald-900 mb-4">Why Choose StockLot?</h3>
                <ul className="space-y-2 text-emerald-700">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Secure escrow payments</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Verified sellers and animals</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Comprehensive categories</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Smart AI search</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-200">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-emerald-900 mb-4">Our Impact</h3>
                <div className="space-y-4">
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">10,000+</div>
                    <div className="text-emerald-700">Animals traded</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">500+</div>
                    <div className="text-emerald-700">Verified farmers</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-emerald-600">98%</div>
                    <div className="text-emerald-700">Satisfaction rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <Button 
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 text-lg"
              onClick={() => window.location.href = '/register'}
            >
              Join StockLot Today
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Pricing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-emerald-900 mb-4">Simple, Transparent Pricing</h1>
            <p className="text-xl text-emerald-700">No hidden fees. Pay only when you sell.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 mb-12">
            <Card className="border-emerald-200">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-semibold text-emerald-900 mb-4">For Buyers</h3>
                <div className="text-4xl font-bold text-emerald-600 mb-4">FREE</div>
                <p className="text-emerald-700 mb-6">Browse, search, and buy livestock with no fees</p>
                <ul className="space-y-2 text-emerald-700 text-left">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Unlimited browsing</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Smart AI search</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Secure payments</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Buyer protection</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-200 ring-2 ring-emerald-500">
              <CardContent className="p-8 text-center">
                <h3 className="text-2xl font-semibold text-emerald-900 mb-4">For Sellers</h3>
                <div className="text-4xl font-bold text-emerald-600 mb-4">10%</div>
                <p className="text-emerald-700 mb-6">Commission only on successful sales</p>
                <ul className="space-y-2 text-emerald-700 text-left">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Unlimited listings</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Seller verification</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> Escrow protection</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-emerald-600 mr-2" /> 24/7 support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          
          <div className="text-center">
            <Button 
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 text-lg mr-4"
              onClick={() => window.location.href = '/register'}
            >
              Start Selling
            </Button>
            <Button 
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-8 py-3 text-lg"
              onClick={() => window.location.href = '/marketplace'}
            >
              Browse Livestock
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Blog() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-emerald-900 mb-4">StockLot Blog</h1>
            <p className="text-xl text-emerald-700">Latest news and insights from the livestock industry</p>
          </div>
          
          <Card className="border-emerald-200 text-center">
            <CardContent className="p-12">
              <div className="text-6xl mb-6">📰</div>
              <h2 className="text-2xl font-semibold text-emerald-900 mb-4">Coming Soon</h2>
              <p className="text-emerald-700 mb-8">
                We're preparing valuable content about livestock farming, market trends, and trading tips. 
                Stay tuned for expert insights and industry updates.
              </p>
              <Button 
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white px-8 py-3 text-lg"
                onClick={() => window.location.href = '/marketplace'}
              >
                Explore Marketplace
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Contact() {
  const [contactForm, setContactForm] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    
    if (!contactForm.name || !contactForm.email || !contactForm.subject || !contactForm.message) {
      alert('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || '';
      const response = await fetch(`${backendUrl}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...contactForm,
          to_email: 'hello@stocklot.farm'
        })
      });

      if (response.ok) {
        alert('Message sent successfully! We\'ll get back to you soon.');
        setContactForm({ name: '', email: '', subject: '', message: '' });
      } else {
        alert('Failed to send message. Please try again or email us directly at hello@stocklot.farm');
      }
    } catch (error) {
      console.error('Contact form error:', error);
      alert('Failed to send message. Please email us directly at hello@stocklot.farm');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setContactForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-emerald-900 mb-4">Contact Us</h1>
            <p className="text-xl text-emerald-700">Get in touch with the StockLot team</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-emerald-200">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-emerald-900 mb-6">Get In Touch</h2>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-700">hello@stocklot.farm</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-700">24/7 Customer Support</span>
                  </div>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold text-emerald-900 mb-4">Quick Support</h3>
                  <div className="space-y-2">
                    <Button 
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                      onClick={() => window.location.href = '/marketplace'}
                    >
                      Browse Marketplace
                    </Button>
                    <Button 
                      variant="outline"
                      className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => window.location.href = '/how-it-works'}
                    >
                      How It Works
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="border-emerald-200">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold text-emerald-900 mb-6">Send a Message</h2>
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-emerald-700">Name</Label>
                    <Input 
                      id="name" 
                      value={contactForm.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="border-emerald-200 focus:border-emerald-500" 
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-emerald-700">Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      value={contactForm.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="border-emerald-200 focus:border-emerald-500" 
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="subject" className="text-emerald-700">Subject</Label>
                    <Input 
                      id="subject" 
                      value={contactForm.subject}
                      onChange={(e) => handleInputChange('subject', e.target.value)}
                      className="border-emerald-200 focus:border-emerald-500" 
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-emerald-700">Message</Label>
                    <Textarea 
                      id="message" 
                      rows={4} 
                      value={contactForm.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className="border-emerald-200 focus:border-emerald-500" 
                      required
                    />
                  </div>
                  <Button 
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Buy Requests Public Page - Enhanced with images, requirements, and comprehensive details
function BuyRequestsPage({ onLogin }) {
  const { user } = useAuth();
  return <EnhancedPublicBuyRequestsPage user={user} onLogin={onLogin} />;
}

// Create Buy Request Page  
function CreateBuyRequestPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
  }, [user, navigate]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🔒</span>
          </div>
          <p className="text-emerald-700">Please log in to create buy requests</p>
        </div>
      </div>
    );
  }

  const handleRequestCreated = (newRequestId) => {
    // Show success message and redirect
    alert('Enhanced buy request created successfully with comprehensive details!');
    navigate('/buy-requests');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-emerald-900 mb-2">Create Enhanced Buy Request</h1>
          <p className="text-emerald-700">Post a comprehensive request with images, requirements, and detailed specifications</p>
        </div>
        
        <EnhancedCreateBuyRequestForm onCreated={handleRequestCreated} />
      </div>
    </div>
  );
}

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
    <AuthProvider>
      <AuthGate>
        <Router>
          <div className="App">
            <Header />
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
                  <Route path="/dashboard" element={<UniversalDashboard />} />
                  <Route path="/seller-dashboard" element={<SellerDashboard />} />
                  <Route path="/create-organization" element={<CreateOrganizationPage />} />
                  <Route path="/orgs/:handle/dashboard" element={<OrganizationDashboard />} />
                  <Route path="/referrals" element={<ReferralDashboard />} />
                  <Route path="/offers-inbox" element={<BuyerOffersInbox />} />
                  <Route path="/inbox" element={<UnifiedInbox />} />
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
  );
}

// Profile Settings Page
function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user || {});
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [farmPhotos, setFarmPhotos] = useState([]);
  const [profileOptions, setProfileOptions] = useState({});
  const [completionScore, setCompletionScore] = useState(0);
  const [activeTab, setActiveTab] = useState('basic');

  // Determine user roles for conditional rendering
  const userRoles = user?.roles || ['buyer'];
  const isBuyer = userRoles.includes('buyer');
  const isSeller = userRoles.includes('seller');
  const isDualRole = isBuyer && isSeller;

  useEffect(() => {
    if (user) {
      setProfile(user);
      setProfilePhoto(user.profile_photo || null);
      setFarmPhotos(user.farm_photos || []);
      setCompletionScore(user.profile_completion_score || 0);
    }
    fetchProfileOptions();
  }, [user]);

  const fetchProfileOptions = async () => {
    try {
      const response = await fetch('/api/profile/options');
      const data = await response.json();
      setProfileOptions(data);
    } catch (error) {
      console.error('Error fetching profile options:', error);
    }
  };

  const updateProfile = async (data) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      if (response.ok) {
        setProfile(result.user);
        setCompletionScore(result.profile_completion);
        alert('Profile updated successfully!');
      } else {
        throw new Error(result.detail || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile: ' + error.message);
    }
    setLoading(false);
  };

  const handlePhotoUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG)');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      formData.append('photo', file);
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/photo', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setProfilePhoto(result.photo_url);
        alert('Profile photo updated successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Photo upload error:', error);
      alert('Failed to upload photo: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleFarmPhotosUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    if (files.length > 10) {
      alert('Maximum 10 photos allowed');
      return;
    }

    setUploading(true);
    
    try {
      const formData = new FormData();
      files.forEach(file => formData.append('photos', file));
      
      const token = localStorage.getItem('token');
      const response = await fetch('/api/profile/farm-photos', {
        method: 'POST',
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        setFarmPhotos(prev => [...prev, ...result.photo_urls]);
        alert('Farm photos uploaded successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Upload failed');
      }
    } catch (error) {
      console.error('Farm photos upload error:', error);
      alert('Failed to upload farm photos: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  const updateArrayField = (fieldName, value, isChecked) => {
    setProfile(prev => {
      const currentArray = prev[fieldName] || [];
      if (isChecked) {
        return { ...prev, [fieldName]: [...currentArray, value] };
      } else {
        return { ...prev, [fieldName]: currentArray.filter(item => item !== value) };
      }
    });
  };

  const ProfileCompletionIndicator = () => (
    <div className="mb-8 p-6 bg-gradient-to-r from-emerald-50 to-green-50 rounded-xl border border-emerald-200 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-emerald-900">Profile Completion</h3>
        <span className="text-2xl font-bold text-emerald-600">{completionScore}%</span>
      </div>
      <div className="w-full bg-emerald-100 rounded-full h-4 mb-4">
        <div 
          className="bg-gradient-to-r from-emerald-500 to-green-500 h-4 rounded-full transition-all duration-500 shadow-sm"
          style={{ width: `${completionScore}%` }}
        ></div>
      </div>
      <p className="text-sm text-emerald-700 leading-relaxed">
        {isDualRole ? "Complete both buyer and seller sections for maximum trust!" :
         isSeller ? (completionScore < 50 ? "Complete your seller profile to build buyer trust!" :
                     completionScore < 80 ? "Great seller profile! Add more details to stand out." :
                     "Excellent! Your seller profile looks professional and complete.") :
         (completionScore < 50 ? "Complete your buyer profile to access premium livestock!" :
          completionScore < 80 ? "Good buyer profile! Add more details to gain seller trust." :
          "Excellent! Sellers will trust you as a reliable buyer.")}
      </p>
    </div>
  );

  // Dynamic tab configuration based on user roles
  const getTabsForRole = () => {
    const commonTabs = [
      { value: 'basic', label: 'Basic Info' }
    ];

    if (isSeller) {
      commonTabs.push(
        { value: 'seller-business', label: 'Business' },
        { value: 'seller-expertise', label: 'Expertise' },
        { value: 'photos', label: 'Photos' },
        { value: 'seller-policies', label: 'Policies' }
      );
    }

    if (isBuyer) {
      commonTabs.push(
        { value: 'buyer-preferences', label: 'Buying Prefs' },
        { value: 'buyer-facility', label: 'Facility Info' },
        { value: 'buyer-experience', label: 'Experience' }
      );
    }

    return commonTabs;
  };

  const tabConfig = getTabsForRole();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl border-emerald-200">
            <CardHeader>
              <CardTitle className="text-emerald-900">
                {isDualRole ? 'Buyer & Seller Profile Settings' : 
                 isSeller ? 'Seller Profile Settings' : 
                 'Buyer Profile Settings'}
              </CardTitle>
              <CardDescription>
                {isDualRole ? 'Build comprehensive buyer and seller profiles for maximum marketplace trust' :
                 isSeller ? 'Build a comprehensive seller profile to gain buyer trust' :
                 'Build a comprehensive buyer profile to access premium livestock and gain seller trust'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ProfileCompletionIndicator />
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Improved Horizontal Tab Layout */}
                <div className="mb-8">
                  <TabsList className="w-full h-auto p-1 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1">
                      {tabConfig.map(tab => (
                        <TabsTrigger 
                          key={tab.value} 
                          value={tab.value}
                          className="flex-1 py-3 px-4 text-sm font-medium text-center rounded-md data-[state=active]:bg-emerald-50 data-[state=active]:text-emerald-700 data-[state=active]:border-emerald-200 whitespace-nowrap"
                        >
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </div>
                  </TabsList>
                </div>

                {/* Basic Information Tab - Common to all users */}
                <TabsContent value="basic" className="space-y-6">
                  {/* Profile Photo Section - Improved Spacing */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h3>
                    <div className="flex items-start space-x-6">
                      <Avatar className="h-32 w-32 flex-shrink-0">
                        {profilePhoto ? (
                          <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover rounded-full" />
                        ) : (
                          <AvatarFallback className="bg-emerald-100 text-emerald-700 text-3xl font-bold">
                            {profile.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="mb-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-1">Upload Photo</h4>
                          <p className="text-sm text-gray-600 mb-3">Professional photo builds trust (JPG, PNG up to 5MB)</p>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                            className="hidden"
                            id="photo-upload"
                          />
                          <Button 
                            variant="outline" 
                            onClick={() => document.getElementById('photo-upload').click()}
                            disabled={uploading}
                            className="min-w-[120px]"
                          >
                            {uploading ? 'Uploading...' : 'Upload Photo'}
                          </Button>
                        </div>
                        <div className="text-xs text-gray-500 space-y-1">
                          <p className="flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                            Complete both buyer and seller sections for maximum trust!
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="full_name">Full Name *</Label>
                      <Input 
                        id="full_name"
                        value={profile.full_name || ''}
                        onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                        placeholder="Your legal name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email *</Label>
                      <Input 
                        id="email"
                        type="email"
                        value={profile.email || ''}
                        onChange={(e) => setProfile({...profile, email: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone">Phone *</Label>
                      <Input 
                        id="phone"
                        value={profile.phone || ''}
                        onChange={(e) => setProfile({...profile, phone: e.target.value})}
                        placeholder="+27 XX XXX XXXX"
                      />
                    </div>
                    <div>
                      <Label htmlFor="business_name">{isSeller ? 'Business/Farm Name' : 'Business/Organization Name'}</Label>
                      <Input 
                        id="business_name"
                        value={profile.business_name || ''}
                        onChange={(e) => setProfile({...profile, business_name: e.target.value})}
                        placeholder={isSeller ? 'e.g., Green Valley Farm' : 'e.g., ABC Livestock Trading'}
                      />
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location_region">Province/Region</Label>
                      <Select 
                        value={profile.location_region || ''}
                        onValueChange={(value) => setProfile({...profile, location_region: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select your province" />
                        </SelectTrigger>
                        <SelectContent>
                          {profileOptions.south_african_provinces?.map(province => (
                            <SelectItem key={province} value={province}>{province}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="location_city">City/Town</Label>
                      <Input 
                        id="location_city"
                        value={profile.location_city || ''}
                        onChange={(e) => setProfile({...profile, location_city: e.target.value})}
                        placeholder="e.g., Stellenbosch"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="bio">About You/Your Business</Label>
                    <Textarea 
                      id="bio"
                      rows={4}
                      value={profile.bio || ''}
                      onChange={(e) => setProfile({...profile, bio: e.target.value})}
                      placeholder={isDualRole ? "Tell other users about your experience with livestock as both buyer and seller..." :
                                  isSeller ? "Tell buyers about your experience, farming practices, and what makes your livestock special..." :
                                  "Tell sellers about your livestock experience, facility, and what you're looking for..."}
                    />
                  </div>
                  
                  <div>
                    <Label>Preferred Communication Methods</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {profileOptions.communication_preferences?.map(method => (
                        <label key={method} className="flex items-center space-x-2 p-2 border rounded">
                          <input
                            type="checkbox"
                            checked={profile.preferred_communication?.includes(method) || false}
                            onChange={(e) => updateArrayField('preferred_communication', method, e.target.checked)}
                          />
                          <span className="capitalize">{method.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Expertise Tab */}
                <TabsContent value="expertise" className="space-y-6">
                  <div>
                    <Label>Primary Livestock (What you specialize in)</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
                      {profileOptions.livestock_types?.map(type => (
                        <label key={type} className="flex items-center space-x-2 p-2 border rounded">
                          <input
                            type="checkbox"
                            checked={profile.primary_livestock?.includes(type) || false}
                            onChange={(e) => updateArrayField('primary_livestock', type, e.target.checked)}
                          />
                          <span className="capitalize">{type.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Farming Methods</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {profileOptions.farming_methods?.map(method => (
                        <label key={method} className="flex items-center space-x-2 p-2 border rounded">
                          <input
                            type="checkbox"
                            checked={profile.farming_methods?.includes(method) || false}
                            onChange={(e) => updateArrayField('farming_methods', method, e.target.checked)}
                          />
                          <span className="capitalize">{method.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Certifications & Credentials</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {profileOptions.certifications?.map(cert => (
                        <label key={cert} className="flex items-center space-x-2 p-2 border rounded">
                          <input
                            type="checkbox"
                            checked={profile.certifications?.includes(cert) || false}
                            onChange={(e) => updateArrayField('certifications', cert, e.target.checked)}
                          />
                          <span className="capitalize">{cert.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <Label>Professional Associations</Label>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {profileOptions.associations?.map(assoc => (
                        <label key={assoc} className="flex items-center space-x-2 p-2 border rounded">
                          <input
                            type="checkbox"
                            checked={profile.associations?.includes(assoc) || false}
                            onChange={(e) => updateArrayField('associations', assoc, e.target.checked)}
                          />
                          <span>{assoc.replace('_', ' ')}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                {/* Photos Tab */}
                <TabsContent value="photos" className="space-y-6">
                  <div>
                    <Label>Farm/Facility Photos</Label>
                    <p className="text-sm text-gray-600 mb-4">
                      Show buyers your facilities, livestock environment, and farming setup (max 10 photos)
                    </p>
                    
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFarmPhotosUpload}
                      className="hidden"
                      id="farm-photos-upload"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => document.getElementById('farm-photos-upload').click()}
                      disabled={uploading}
                      className="mb-4"
                    >
                      {uploading ? 'Uploading...' : 'Upload Farm Photos'}
                    </Button>
                    
                    {farmPhotos.length > 0 && (
                      <div className="grid grid-cols-3 gap-4">
                        {farmPhotos.map((photo, index) => (
                          <div key={index} className="relative">
                            <img 
                              src={photo} 
                              alt={`Farm photo ${index + 1}`} 
                              className="w-full h-32 object-cover rounded-lg border"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* Policies Tab */}
                <TabsContent value="policies" className="space-y-6">
                  <div>
                    <Label htmlFor="return_policy">Return Policy</Label>
                    <Textarea 
                      id="return_policy"
                      rows={3}
                      value={profile.return_policy || ''}
                      onChange={(e) => setProfile({...profile, return_policy: e.target.value})}
                      placeholder="e.g., 7-day return policy for livestock with health issues..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="health_guarantee">Health Guarantee</Label>
                    <Textarea 
                      id="health_guarantee"
                      rows={3}
                      value={profile.health_guarantee || ''}
                      onChange={(e) => setProfile({...profile, health_guarantee: e.target.value})}
                      placeholder="e.g., All livestock comes with veterinary health certificates..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="delivery_policy">Delivery Policy</Label>
                    <Textarea 
                      id="delivery_policy"
                      rows={3}
                      value={profile.delivery_policy || ''}
                      onChange={(e) => setProfile({...profile, delivery_policy: e.target.value})}
                      placeholder="e.g., Free delivery within 50km, R5/km beyond..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Textarea 
                      id="payment_terms"
                      rows={3}
                      value={profile.payment_terms || ''}
                      onChange={(e) => setProfile({...profile, payment_terms: e.target.value})}
                      placeholder="e.g., 50% deposit required, balance on delivery..."
                    />
                  </div>
                </TabsContent>

                {/* SELLER-SPECIFIC TABS */}
                {isSeller && (
                  <>
                    {/* Seller Business Information Tab */}
                    <TabsContent value="seller-business" className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="experience_years">Years of Experience</Label>
                          <Input 
                            id="experience_years"
                            type="number"
                            value={profile.experience_years || ''}
                            onChange={(e) => setProfile({...profile, experience_years: parseInt(e.target.value) || 0})}
                            placeholder="Years in livestock/agriculture"
                          />
                        </div>
                        <div>
                          <Label htmlFor="business_hours">Business Hours</Label>
                          <Input 
                            id="business_hours"
                            value={profile.business_hours || ''}
                            onChange={(e) => setProfile({...profile, business_hours: e.target.value})}
                            placeholder="e.g., Monday-Friday 8AM-5PM"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Delivery Areas</Label>
                        <Textarea 
                          value={profile.delivery_areas?.join(', ') || ''}
                          onChange={(e) => setProfile({...profile, delivery_areas: e.target.value.split(', ').filter(area => area.trim())})}
                          placeholder="e.g., Western Cape, Eastern Cape, Northern Cape"
                          rows={2}
                        />
                      </div>
                    </TabsContent>

                    {/* Seller Expertise Tab */}
                    <TabsContent value="seller-expertise" className="space-y-6">
                      <div>
                        <Label>Primary Livestock (What you specialize in)</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
                          {profileOptions.livestock_types?.map(type => (
                            <label key={type} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.primary_livestock?.includes(type) || false}
                                onChange={(e) => updateArrayField('primary_livestock', type, e.target.checked)}
                              />
                              <span className="capitalize">{type.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Farming Methods</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {profileOptions.farming_methods?.map(method => (
                            <label key={method} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.farming_methods?.includes(method) || false}
                                onChange={(e) => updateArrayField('farming_methods', method, e.target.checked)}
                              />
                              <span className="capitalize">{method.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Certifications & Credentials</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {profileOptions.certifications?.map(cert => (
                            <label key={cert} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.certifications?.includes(cert) || false}
                                onChange={(e) => updateArrayField('certifications', cert, e.target.checked)}
                              />
                              <span className="capitalize">{cert.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Professional Associations</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {profileOptions.associations?.map(assoc => (
                            <label key={assoc} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.associations?.includes(assoc) || false}
                                onChange={(e) => updateArrayField('associations', assoc, e.target.checked)}
                              />
                              <span>{assoc.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </TabsContent>

                    {/* Photos Tab */}
                    <TabsContent value="photos" className="space-y-6">
                      <div>
                        <Label>Farm/Facility Photos</Label>
                        <p className="text-sm text-gray-600 mb-4">
                          Show buyers your facilities, livestock environment, and farming setup (max 10 photos)
                        </p>
                        
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleFarmPhotosUpload}
                          className="hidden"
                          id="farm-photos-upload"
                        />
                        <Button 
                          variant="outline" 
                          onClick={() => document.getElementById('farm-photos-upload').click()}
                          disabled={uploading}
                          className="mb-4"
                        >
                          {uploading ? 'Uploading...' : 'Upload Farm Photos'}
                        </Button>
                        
                        {farmPhotos.length > 0 && (
                          <div className="grid grid-cols-3 gap-4">
                            {farmPhotos.map((photo, index) => (
                              <div key={index} className="relative">
                                <img 
                                  src={photo} 
                                  alt={`Farm photo ${index + 1}`} 
                                  className="w-full h-32 object-cover rounded-lg border"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </TabsContent>

                    {/* Seller Policies Tab */}
                    <TabsContent value="seller-policies" className="space-y-6">
                      <div>
                        <Label htmlFor="return_policy">Return Policy</Label>
                        <Textarea 
                          id="return_policy"
                          rows={3}
                          value={profile.return_policy || ''}
                          onChange={(e) => setProfile({...profile, return_policy: e.target.value})}
                          placeholder="e.g., 7-day return policy for livestock with health issues..."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="health_guarantee">Health Guarantee</Label>
                        <Textarea 
                          id="health_guarantee"
                          rows={3}
                          value={profile.health_guarantee || ''}
                          onChange={(e) => setProfile({...profile, health_guarantee: e.target.value})}
                          placeholder="e.g., All livestock comes with veterinary health certificates..."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="delivery_policy">Delivery Policy</Label>
                        <Textarea 
                          id="delivery_policy"
                          rows={3}
                          value={profile.delivery_policy || ''}
                          onChange={(e) => setProfile({...profile, delivery_policy: e.target.value})}
                          placeholder="e.g., Free delivery within 50km, R5/km beyond..."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="payment_terms">Payment Terms</Label>
                        <Textarea 
                          id="payment_terms"
                          rows={3}
                          value={profile.payment_terms || ''}
                          onChange={(e) => setProfile({...profile, payment_terms: e.target.value})}
                          placeholder="e.g., 50% deposit required, balance on delivery..."
                        />
                      </div>
                    </TabsContent>
                  </>
                )}

                {/* BUYER-SPECIFIC TABS */}
                {isBuyer && (
                  <>
                    {/* Buyer Preferences Tab */}
                    <TabsContent value="buyer-preferences" className="space-y-6">
                      <div>
                        <Label>Livestock Interests (What you want to buy)</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2 max-h-48 overflow-y-auto">
                          {profileOptions.livestock_types?.map(type => (
                            <label key={type} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.livestock_interests?.includes(type) || false}
                                onChange={(e) => updateArrayField('livestock_interests', type, e.target.checked)}
                              />
                              <span className="capitalize">{type.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Buying Purpose</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {profileOptions.buying_purposes?.map(purpose => (
                            <label key={purpose} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.buying_purpose?.includes(purpose) || false}
                                onChange={(e) => updateArrayField('buying_purpose', purpose, e.target.checked)}
                              />
                              <span className="capitalize">{purpose.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="purchase_frequency">Purchase Frequency</Label>
                          <Select 
                            value={profile.purchase_frequency || ''}
                            onValueChange={(value) => setProfile({...profile, purchase_frequency: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="How often do you buy?" />
                            </SelectTrigger>
                            <SelectContent>
                              {profileOptions.purchase_frequencies?.map(freq => (
                                <SelectItem key={freq} value={freq}>{freq.replace('_', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="budget_range">Budget Range</Label>
                          <Select 
                            value={profile.budget_range || ''}
                            onValueChange={(value) => setProfile({...profile, budget_range: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select your budget range" />
                            </SelectTrigger>
                            <SelectContent>
                              {profileOptions.budget_ranges?.map(range => (
                                <SelectItem key={range} value={range}>{range.replace('_', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </TabsContent>

                    {/* Buyer Facility Information Tab */}
                    <TabsContent value="buyer-facility" className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="facility_type">Facility Type</Label>
                          <Select 
                            value={profile.facility_type || ''}
                            onValueChange={(value) => setProfile({...profile, facility_type: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select facility type" />
                            </SelectTrigger>
                            <SelectContent>
                              {profileOptions.facility_types?.map(type => (
                                <SelectItem key={type} value={type}>{type.replace('_', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="farm_size_hectares">Farm Size (Hectares)</Label>
                          <Input 
                            id="farm_size_hectares"
                            type="number"
                            value={profile.farm_size_hectares || ''}
                            onChange={(e) => setProfile({...profile, farm_size_hectares: parseInt(e.target.value) || 0})}
                            placeholder="e.g., 50"
                          />
                        </div>
                        <div>
                          <Label htmlFor="animal_capacity">Animal Capacity</Label>
                          <Input 
                            id="animal_capacity"
                            type="number"
                            value={profile.animal_capacity || ''}
                            onChange={(e) => setProfile({...profile, animal_capacity: parseInt(e.target.value) || 0})}
                            placeholder="Max animals you can house"
                          />
                        </div>
                        <div>
                          <Label htmlFor="veterinary_contact">Veterinary Contact</Label>
                          <Input 
                            id="veterinary_contact"
                            value={profile.veterinary_contact || ''}
                            onChange={(e) => setProfile({...profile, veterinary_contact: e.target.value})}
                            placeholder="Your vet's name and contact"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Farm Infrastructure</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {profileOptions.farm_infrastructure?.map(infra => (
                            <label key={infra} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.farm_infrastructure?.includes(infra) || false}
                                onChange={(e) => updateArrayField('farm_infrastructure', infra, e.target.checked)}
                              />
                              <span className="capitalize">{infra.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="quarantine_facilities"
                          checked={profile.quarantine_facilities || false}
                          onChange={(e) => setProfile({...profile, quarantine_facilities: e.target.checked})}
                        />
                        <Label htmlFor="quarantine_facilities">I have quarantine facilities for new animals</Label>
                      </div>
                    </TabsContent>

                    {/* Buyer Experience Tab */}
                    <TabsContent value="buyer-experience" className="space-y-6">
                      <div>
                        <Label>Livestock Experience</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {profileOptions.livestock_experience?.map(exp => (
                            <label key={exp} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.livestock_experience?.includes(exp) || false}
                                onChange={(e) => updateArrayField('livestock_experience', exp, e.target.checked)}
                              />
                              <span className="capitalize">{exp.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Buyer Certifications</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {profileOptions.buyer_certifications?.map(cert => (
                            <label key={cert} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.buyer_certifications?.includes(cert) || false}
                                onChange={(e) => updateArrayField('buyer_certifications', cert, e.target.checked)}
                              />
                              <span className="capitalize">{cert.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label>Animal Welfare Standards</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          {profileOptions.animal_welfare_standards?.map(standard => (
                            <label key={standard} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.animal_welfare_standards?.includes(standard) || false}
                                onChange={(e) => updateArrayField('animal_welfare_standards', standard, e.target.checked)}
                              />
                              <span className="capitalize">{standard.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="payment_timeline">Preferred Payment Timeline</Label>
                          <Select 
                            value={profile.payment_timeline || ''}
                            onValueChange={(value) => setProfile({...profile, payment_timeline: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="When can you pay?" />
                            </SelectTrigger>
                            <SelectContent>
                              {profileOptions.payment_timelines?.map(timeline => (
                                <SelectItem key={timeline} value={timeline}>{timeline.replace('_', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="collection_preference">Collection Preference</Label>
                          <Select 
                            value={profile.collection_preference || ''}
                            onValueChange={(value) => setProfile({...profile, collection_preference: value})}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="How will you collect?" />
                            </SelectTrigger>
                            <SelectContent>
                              {profileOptions.collection_preferences?.map(pref => (
                                <SelectItem key={pref} value={pref}>{pref.replace('_', ' ')}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label>Preferred Payment Methods</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {profileOptions.payment_methods?.map(method => (
                            <label key={method} className="flex items-center space-x-2 p-2 border rounded">
                              <input
                                type="checkbox"
                                checked={profile.payment_methods?.includes(method) || false}
                                onChange={(e) => updateArrayField('payment_methods', method, e.target.checked)}
                              />
                              <span className="capitalize">{method.replace('_', ' ')}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="previous_suppliers">Previous Suppliers/References</Label>
                        <Textarea 
                          id="previous_suppliers"
                          rows={3}
                          value={profile.previous_suppliers || ''}
                          onChange={(e) => setProfile({...profile, previous_suppliers: e.target.value})}
                          placeholder="Names and contacts of previous livestock suppliers who can provide references..."
                        />
                      </div>
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => updateProfile(profile)}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? 'Updating...' : 'Save Profile'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Payment Methods Page
function PaymentMethodsPage() {
  const { user } = useAuth();
  
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please sign in to manage your payment methods.</p>
          <button 
            onClick={() => window.location.href = '/login'}
            className="bg-emerald-600 text-white px-4 py-2 rounded hover:bg-emerald-700"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-emerald-900">Payment Methods</h1>
            <p className="text-emerald-700">Manage your South African banking details for payments and payouts</p>
          </div>
          
          <PaymentMethodsForm user={user} />
        </div>
      </div>
    </div>
  );
}

// Addresses Page
function AddressesPage() {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAddresses();
  }, []);

  const fetchAddresses = async () => {
    try {
      const response = await apiCall('GET', '/addresses');
      setAddresses(response || []);
    } catch (error) {
      console.error('Failed to fetch addresses');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-emerald-900">Delivery Addresses</h1>
            <p className="text-emerald-700">Manage your delivery and pickup locations</p>
          </div>
          
          <div className="grid gap-6">
            <Card className="shadow-xl border-emerald-200">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-emerald-900">Saved Addresses</CardTitle>
                  <Button className="bg-emerald-600 hover:bg-emerald-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Address
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p>Loading addresses...</p>
                ) : addresses.length === 0 ? (
                  <div className="text-center py-8">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">No addresses saved yet</p>
                    <Button className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                      Add Your First Address
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {addresses.map((address, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border border-emerald-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <MapPin className="h-8 w-8 text-emerald-600" />
                          <div>
                            <p className="font-medium">{address.name}</p>
                            <p className="text-sm text-gray-600">{address.street_address}</p>
                            <p className="text-sm text-gray-600">{address.city}, {address.province} {address.postal_code}</p>
                          </div>
                          {address.is_default && (
                            <Badge className="bg-emerald-100 text-emerald-700">Default</Badge>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm" className="text-red-600">Remove</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Request Detail Modal Component
function RequestDetailModal({ request, user, onClose, onSendOffer }) {
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState([]);
  const [showOffers, setShowOffers] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);

  const timeRemaining = (deadlineAt) => {
    const deadline = new Date(deadlineAt);
    const now = new Date();
    const diff = deadline - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours`;
    return `${hours} hours`;
  };

  // Load offers if user is the buyer
  const loadOffers = async () => {
    if (!user || !user.roles?.includes('buyer') || request.buyer_id !== user.id) return;
    
    setOffersLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/buy-requests/${request.id}/offers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOffers(data.items || []);
        setShowOffers(true);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setOffersLoading(false);
    }
  };

  // Handle accept offer
  const handleAcceptOffer = async (offer) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/buy-requests/${request.id}/offers/${offer.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Idempotency-Key': `${Date.now()}-${Math.random()}`
        },
        body: JSON.stringify({
          qty: offer.qty,
          address_id: user.addresses?.[0]?.id || 'default',
          delivery_mode: offer.delivery_mode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to accept offer');
      }

      const result = await response.json();
      
      // Show success message and redirect
      alert(`Offer Accepted! Order created successfully (ID: ${result.order_group_id}). Redirecting to checkout...`);
      
      // Close modal and redirect
      onClose();
      window.location.href = `/checkout/${result.order_group_id}`;
      
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert(`Failed to accept offer: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-emerald-900 mb-2">
                {request.title || `${request.species} Needed`}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {request.province}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {timeRemaining(request.deadline_at)} remaining
                </span>
                {user && user.roles?.includes('buyer') && request.buyer_id === user.id && request.offers_count > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Package className="h-4 w-4" />
                    {request.offers_count} offers received
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Show offers section for buyers */}
          {user && user.roles?.includes('buyer') && request.buyer_id === user.id && request.offers_count > 0 && (
            <Card className="mb-6 border-emerald-200 bg-emerald-50">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg text-emerald-900">Offers on Your Request</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadOffers}
                    disabled={offersLoading}
                    className="border-emerald-300 text-emerald-700"
                  >
                    {offersLoading ? 'Loading...' : showOffers ? 'Refresh Offers' : 'View Offers'}
                  </Button>
                </div>
              </CardHeader>
              {showOffers && (
                <CardContent>
                  {offers.length > 0 ? (
                    <div className="space-y-3">
                      {offers.map((offer, index) => {
                        const unitPrice = offer.unit_price_minor / 100;
                        const totalPrice = unitPrice * offer.qty;
                        const timeLeft = timeRemaining(offer.validity_expires_at);
                        
                        return (
                          <div key={offer.id} className="bg-white border border-emerald-200 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                              <div>
                                <h5 className="font-medium">Offer #{index + 1}</h5>
                                <p className="text-sm text-gray-600">{offer.qty} {request.unit}</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold text-emerald-600">
                                  R{totalPrice.toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  R{unitPrice.toFixed(2)} per {request.unit}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm">
                                  <span className="text-gray-600">Delivery:</span><br />
                                  {offer.delivery_mode === 'SELLER' ? 'Seller delivers' : 'Buyer pickup'}
                                </p>
                              </div>
                              <div className="text-center">
                                {offer.status === 'pending' && timeLeft !== 'Expired' ? (
                                  <Button 
                                    onClick={() => handleAcceptOffer(offer)}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                                  >
                                    Accept & Checkout
                                  </Button>
                                ) : (
                                  <div className="text-sm text-gray-500">
                                    {offer.status === 'accepted' ? 'Accepted' : 'Expired'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-600">No offers available.</p>
                  )}
                </CardContent>
              )}
            </Card>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Species:</span>
                  <span className="font-medium">{request.species}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Product Type:</span>
                  <span className="font-medium">{request.product_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{request.qty} {request.unit}</span>
                </div>
                {request.breed && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Breed:</span>
                    <span className="font-medium">{request.breed}</span>
                  </div>
                )}
                {request.target_price && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Price:</span>
                    <span className="font-medium text-green-600">R{request.target_price}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Buyer & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Buyer & Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.buyer && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Buyer:</span>
                      <span className="font-medium">{request.buyer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{request.buyer.province}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Verified:</span>
                      <span className={`font-medium ${request.buyer.verified ? 'text-green-600' : 'text-gray-500'}`}>
                        {request.buyer.verified ? '✓ Verified' : 'Not verified'}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted:</span>
                  <span className="font-medium">{new Date(request.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deadline:</span>
                  <span className="font-medium">{new Date(request.deadline_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Offers Received:</span>
                  <span className="font-medium">{request.offers_count}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {request.notes_excerpt && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {request.notes_excerpt}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Compliance Flags */}
          {(request.compliance_flags?.kyc || request.compliance_flags?.live) && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800">Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {request.compliance_flags?.live && (
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>Live animals - KYC verification required</span>
                  </div>
                )}
                {request.compliance_flags?.kyc && (
                  <div className="flex items-center gap-2 text-yellow-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>KYC verification needed for this transaction</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            {user && user.roles?.includes('seller') ? (
              <Button 
                onClick={onSendOffer}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                disabled={!request.can_send_offer}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Send Offer
              </Button>
            ) : user && user.roles?.includes('buyer') && request.buyer_id === user.id ? (
              <div className="text-sm text-gray-600">
                This is your request. Offers will appear above when received.
              </div>
            ) : (
              <Button variant="outline" disabled>
                {!user ? 'Login required' : 'Seller access only'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Send Offer Modal Component
function SendOfferModal({ request, user, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    qty: Math.min(request.qty, 1),
    unit_price_minor: 0,
    delivery_mode: 'SELLER',
    abattoir_fee_minor: 0,
    validity_days: 7,
    notes: ''
  });
  const [shippingCost, setShippingCost] = useState(0);

  // Calculate shipping cost based on distance
  const calculateShippingCost = (deliveryMode, distance) => {
    if (deliveryMode !== 'SELLER' || !distance) return 0;
    
    // Basic shipping calculation: R2 per km per unit, minimum R50
    const costPerKmPerUnit = 2;
    const minimumCost = 50;
    const calculatedCost = distance * costPerKmPerUnit * formData.qty;
    
    return Math.max(minimumCost, calculatedCost);
  };

  // Update shipping cost when delivery mode or quantity changes
  useEffect(() => {
    if (formData.delivery_mode === 'SELLER' && request.distance_km) {
      const newShippingCost = calculateShippingCost(formData.delivery_mode, request.distance_km);
      setShippingCost(newShippingCost);
    } else {
      setShippingCost(0);
    }
  }, [formData.delivery_mode, formData.qty, request.distance_km]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (formData.qty <= 0 || formData.qty > request.qty) {
        throw new Error(`Quantity must be between 1 and ${request.qty}`);
      }

      if (formData.unit_price_minor <= 0) {
        throw new Error('Price must be greater than 0');
      }

      // Calculate validity expiry
      const validityExpiresAt = new Date();
      validityExpiresAt.setDate(validityExpiresAt.getDate() + formData.validity_days);

      // Prepare offer data
      const offerData = {
        qty: parseInt(formData.qty),
        unit_price_minor: Math.round(formData.unit_price_minor * 100), // Convert to cents
        delivery_mode: formData.delivery_mode,
        abattoir_fee_minor: Math.round(formData.abattoir_fee_minor * 100),
        validity_expires_at: validityExpiresAt.toISOString(),
        notes: formData.notes
      };

      // Send offer
      const response = await fetch(`${BACKEND_URL}/api/buy-requests/${request.id}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(offerData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send offer');
      }

      const result = await response.json();
      
      // Success
      alert('Offer sent successfully! The buyer will be notified.');
      onSuccess && onSuccess(result);

    } catch (error) {
      console.error('Error sending offer:', error);
      setError(error.message || 'Failed to send offer');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = formData.qty * formData.unit_price_minor;
  const abattoir_fee = formData.delivery_mode === 'RFQ' ? formData.abattoir_fee_minor * formData.qty : 0;
  const total = subtotal + abattoir_fee + shippingCost;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit} className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-emerald-900">
              Send Offer - {request.title || request.species}
            </h2>
            <Button variant="outline" size="sm" onClick={onClose} type="button">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Request Summary */}
          <Card className="mb-6 bg-gray-50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Requested:</span>
                  <p className="font-medium">{request.qty} {request.unit} of {request.species}</p>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <p className="font-medium">{request.province}</p>
                </div>
                {request.target_price && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Buyer's target price:</span>
                    <p className="font-medium text-green-600">R{request.target_price} per {request.unit}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Offer Form */}
          <div className="space-y-4 mb-6">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity Offering *
              </label>
              <input
                type="number"
                min="1"
                max={request.qty}
                value={formData.qty}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  qty: parseInt(e.target.value) || 1
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                Maximum: {request.qty} {request.unit}
              </p>
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (ZAR) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.unit_price_minor}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  unit_price_minor: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="0.00"
                required
              />
            </div>

            {/* Delivery Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Method *
              </label>
              <select
                value={formData.delivery_mode}
                onChange={(e) => setFormData(prev => ({...prev, delivery_mode: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                <option value="SELLER">I will deliver{request.distance_km ? ` (${request.distance_km}km away)` : ''}</option>
                <option value="RFQ">Buyer arranges pickup</option>
              </select>
              {formData.delivery_mode === 'SELLER' && request.distance_km && (
                <p className="text-sm text-blue-600 mt-1">
                  Shipping cost will be calculated: R{shippingCost.toFixed(2)} 
                  (R2/km/unit, min R50)
                </p>
              )}
            </div>

            {/* Validity Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Offer Valid For
              </label>
              <select
                value={formData.validity_days}
                onChange={(e) => setFormData(prev => ({...prev, validity_days: parseInt(e.target.value)}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">1 week</option>
                <option value="14">2 weeks</option>
                <option value="30">1 month</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Any additional details about your offer..."
              />
            </div>
          </div>

          {/* Offer Summary */}
          <Card className="mb-6 bg-emerald-50 border-emerald-200">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-3 text-emerald-900">Offer Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{formData.qty} {request.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span>R{formData.unit_price_minor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R{subtotal.toFixed(2)}</span>
                </div>
                {shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping ({request.distance_km}km):</span>
                    <span>R{shippingCost.toFixed(2)}</span>
                  </div>
                )}
                {abattoir_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Abattoir Fee:</span>
                    <span>R{abattoir_fee.toFixed(2)}</span>
                  </div>
                )}
                <hr className="border-emerald-200" />
                <div className="flex justify-between font-medium text-emerald-900">
                  <span>Total:</span>
                  <span>R{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Valid until:</span>
                  <span>
                    {new Date(Date.now() + formData.validity_days * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
            >
              {loading ? 'Sending...' : 'Send Offer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Login Dialog Component
function LoginDialog({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'seller'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { 
            email: formData.email, 
            password: formData.password, 
            full_name: formData.full_name,
            role: formData.role 
          };

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || (isLogin ? 'Login failed' : 'Registration failed'));
      }

      const data = await response.json();
      
      // Store token and user data
      localStorage.setItem('token', data.access_token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      // Reload page to update user context
      alert(isLogin ? 'Login successful!' : 'Registration successful!');
      window.location.reload();

    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-emerald-900">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <Button variant="outline" size="sm" onClick={onClose} type="button">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({...prev, full_name: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  I want to
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({...prev, role: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="seller">Sell livestock</option>
                  <option value="buyer">Buy livestock</option>
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setFormData({ email: '', password: '', full_name: '', role: 'seller' });
              }}
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

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
function BuyerOffersInbox() {
  const { user } = useAuth();
  return <BuyerOffersPage user={user} />;
}

// Unified Inbox Page - All notifications and messages
function UnifiedInbox() {
  const { user } = useAuth();
  return <InboxPage user={user} />;
}

// Exotics Page - Dedicated page for exotic livestock
function ExoticsPage() {
  const [listings, setListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [listingsError, setListingsError] = useState(null);
  const [lastSuccessfulListings, setLastSuccessfulListings] = useState([]); // Backup listings
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchExoticData = async () => {
      try {
        setLoading(true);
        
        // Fetch exotic categories
        const categoriesResponse = await fetch('/api/taxonomy/categories?mode=exotic');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData);
        }

        // Fetch exotic listings ONLY (not all listings with exotic flag)
        const listingsResponse = await fetch('/api/exotic-livestock/species');
        if (listingsResponse.ok) {
          const speciesData = await listingsResponse.json();
          
          // For now, create mock exotic listings since we may not have real ones yet
          const mockExoticListings = [
            {
              id: 'exotic-1',
              title: 'Ostrich Breeding Pair - African Black',
              species: 'Ostrich',
              breed: 'African Black',
              price: 45000,
              seller: 'Kalahari Ratite Farm'
            },
            {
              id: 'exotic-2', 
              title: 'Kudu Bull - Live Game Animal',
              species: 'Kudu',
              breed: 'Greater Kudu',
              price: 35000,
              seller: 'Limpopo Game Ranch'
            },
            {
              id: 'exotic-3',
              title: 'Alpaca Breeding Stock - Huacaya',
              species: 'Alpaca', 
              breed: 'Huacaya',
              price: 25000,
              seller: 'Mountain View Alpacas'
            }
          ];
          
          setListings(mockExoticListings);
        }
      } catch (error) {
        console.error('Error fetching exotic data:', error);
      } finally {
        setLoading(false);
        setListingsLoading(false); // Clear both loading states
      }
    };

    fetchExoticData();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-amber-600 to-orange-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Exotic & Specialty Livestock
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-amber-100">
            Premium game animals, ratites, camelids, and specialty species
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              className="bg-white text-amber-600 hover:bg-amber-50 px-8 py-3"
              onClick={() => document.getElementById('categories-section').scrollIntoView({ behavior: 'smooth' })}
            >
              Browse Categories
            </Button>
            <Button
              variant="outline"
              className="border-2 border-white text-white hover:bg-white hover:text-amber-600 px-8 py-3"
              onClick={() => window.location.href = '/marketplace'}
            >
              View Core Livestock
            </Button>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div id="categories-section" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Exotic Categories</h2>
          
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categories.map(category => (
                <Card key={category.id} className="hover:shadow-lg transition-shadow bg-white">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">{category.name}</h3>
                    <p className="text-gray-600 mb-4">{category.description}</p>
                    <Button
                      variant="outline"
                      className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
                      onClick={() => window.location.href = `/marketplace?category=${category.slug}&include_exotics=true`}
                    >
                      Browse {category.name}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Featured Listings */}
      {listings.length > 0 && (
        <div className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Featured Exotic Listings</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.slice(0, 8).map(listing => (
                <Card key={listing.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-0">
                    <div className="h-48 bg-gradient-to-br from-amber-400 to-orange-500 rounded-t-lg"></div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">{listing.title}</h3>
                      <p className="text-sm text-gray-600 mb-2">{listing.species} • {listing.breed}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-amber-600">
                          R{listing.price?.toLocaleString() || 'Price on request'}
                        </span>
                        <Button
                          size="sm"
                          className="bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={() => window.location.href = `/listing/${listing.id}`}
                        >
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            <div className="text-center mt-12">
              <Button
                className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3"
                onClick={() => window.location.href = '/marketplace?include_exotics=true'}
              >
                View All Exotic Listings
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="bg-amber-50 border-t border-amber-200 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-lg font-semibold text-amber-900 mb-2">Important Notice</h3>
            <p className="text-amber-800">
              Exotic livestock sales are for live animals only. Some species require special permits, 
              proper containment, and veterinary oversight. All transactions are protected by our secure escrow system.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
export default App;