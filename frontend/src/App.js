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
import api from './api/client';

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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || 'https://stockdiff-app.preview.emergentagent.com';
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



// Footer component

<>
<Login />
<Footer />

{/* <CreatingList/> */}
</>

// Enhanced Homepage Component with All Landing Page Sections

// Login component



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


// Enhanced Marketplace component with Core/Exotic separation


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
                        'https://stockdiff-app.preview.emergentagent.com';
      
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


// Placeholder Pages

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