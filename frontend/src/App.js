import React, { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
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
  LayoutDashboard, MessageCircle, Ban, Check, Copy, Heart, Award, Truck, LogIn
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
import PaymentMethodsForm from './components/PaymentMethodsForm';
import SuggestButton from './components/suggestions/SuggestButton';
import ShoppingCartModal from './components/cart/ShoppingCart';
import FAQChatbot from './components/support/FAQChatbot';
import PublicBuyRequestsPage from './pages/PublicBuyRequestsPage';
import EnhancedPublicBuyRequestsPage from './pages/EnhancedPublicBuyRequestsPage';
import EnhancedCreateBuyRequestForm from './components/buyRequests/EnhancedCreateBuyRequestForm';
import BuyerOffersPage from './pages/BuyerOffersPage';
import UnifiedInboxPage from './pages/UnifiedInboxPage';
import ReviewsTestPage from './pages/ReviewsTestPage';
import "./App.css";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// Authentication Context
const AuthContext = React.createContext();

function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { access_token, user: userData } = response.data;
      
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Login failed' };
    }
  };

  const register = async (userData) => {
    try {
      await axios.post(`${API}/auth/register`, userData);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.detail || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

// Custom hook to use auth context
function useAuth() {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// API helper with auth token
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [cartItemCount, setCartItemCount] = useState(0);

  // Fetch cart count on component mount
  useEffect(() => {
    if (user) {
      fetchCartCount();
    }
  }, [user]);

  const fetchCartCount = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cart`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCartItemCount(data.item_count || 0);
      }
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

  return (
    <header className="border-b border-emerald-200 bg-white/90 backdrop-blur-sm sticky top-0 z-50 shadow-sm">
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
                    <DropdownMenuItem onClick={logout} className="text-red-600">
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
        const backendUrl = process.env.REACT_APP_BACKEND_URL || 'https://stocklot-repair.preview.emergentagent.com/api';
        const response = await fetch(`${backendUrl}/platform/config`);
        if (response.ok) {
          const config = await response.json();
          const settings = config.settings || {};
          console.log('Loaded social settings:', settings); // Debug log
          setSocialSettings({
            facebookUrl: settings.facebookUrl || '',
            twitterUrl: settings.twitterUrl || '',
            instagramUrl: settings.instagramUrl || '',
            youtubeUrl: settings.youtubeUrl || '',
            linkedinUrl: settings.linkedinUrl || ''
          });
        }
      } catch (error) {
        console.error('Failed to load social settings:', error);
      }
    };
    
    loadSocialSettings();
  }, []);

  return (
    <footer className="bg-emerald-900 text-white">
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
                <Card key={listing.id} className="stock-card border-emerald-200 hover:shadow-lg transition-shadow">
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
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Check if redirecting from admin
  const searchParams = new URLSearchParams(location.search);
  const redirectTo = searchParams.get('redirect');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    if (result.success) {
      // Redirect to admin if that's where they came from, otherwise dashboard
      if (redirectTo === 'admin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } else {
      setError(result.error);
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

// Enhanced Marketplace component with improved filtering
function Marketplace() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [listings, setListings] = useState([]);
  const [categoryGroups, setCategoryGroups] = useState([]);
  const [species, setSpecies] = useState([]);
  const [breeds, setBreeds] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    category_group_id: '',
    species_id: '',
    breed_id: '',
    product_type_id: '',
    province: '',
    price_min: '',
    price_max: '',
    listing_type: 'all'
  });
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showBiddingModal, setShowBiddingModal] = useState(false);
  const [selectedListing, setSelectedListing] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [deliverableOnly, setDeliverableOnly] = useState(true);
  const [cartUpdateCallback, setCartUpdateCallback] = useState(null);

  useEffect(() => {
    fetchInitialData();
    
    // Set up real-time auction updates
    const interval = setInterval(() => {
      updateAuctionTimers();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchListings();
  }, [filters]);

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
    if (!user) {
      navigate('/login');
      return;
    }
    setSelectedListing(listing);
    setShowOrderModal(true);
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
      const [groupsRes, productTypesRes] = await Promise.all([
        apiCall('GET', '/category-groups'),
        apiCall('GET', '/product-types')
      ]);
      setCategoryGroups(groupsRes.data || []);
      setProductTypes(productTypesRes.data || []);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      // Set empty arrays as fallback
      setCategoryGroups([]);
      setProductTypes([]);
    }
  };

  const fetchSpeciesByGroup = async (groupId) => {
    try {
      const response = await apiCall('GET', `/species?category_group_id=${groupId}`);
      setSpecies(response.data);
    } catch (error) {
      console.error('Error fetching species:', error);
    }
  };

  const fetchBreedsBySpecies = async (speciesId) => {
    try {
      const response = await apiCall('GET', `/species/${speciesId}/breeds`);
      setBreeds(response.data);
    } catch (error) {
      console.error('Error fetching breeds:', error);
    }
  };

  const fetchListings = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.species_id) params.append('species_id', filters.species_id);
      if (filters.breed_id) params.append('breed_id', filters.breed_id);
      if (filters.product_type_id) params.append('product_type_id', filters.product_type_id);
      if (filters.province) params.append('region', filters.province);
      if (filters.price_min) params.append('price_min', filters.price_min);
      if (filters.price_max) params.append('price_max', filters.price_max);
      if (filters.listing_type && filters.listing_type !== 'all') params.append('listing_type', filters.listing_type);

      if (deliverableOnly) {
        params.append('deliverable_only', 'true');
      }

      const response = await apiCall('GET', `/listings?${params.toString()}`);
      
      // Backend returns array directly, not wrapped in .data
      const listingsArray = Array.isArray(response) ? response : (response.data || []);
      
      // Enhance listings with auction data for demonstration and ensure it's an array
      const enhancedListings = listingsArray.map(listing => ({
        ...listing,
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
      }));
      
      setListings(enhancedListings);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]); // Set empty array as fallback
    } finally {
      setLoading(false);
    }
  };

  const getSpeciesName = (speciesId) => {
    const spec = species.find(s => s.id === speciesId);
    return spec ? spec.name : 'Unknown';
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    
    // Reset dependent filters when parent changes
    if (key === 'category_group_id') {
      newFilters.species_id = '';
      newFilters.breed_id = '';
    } else if (key === 'species_id') {
      newFilters.breed_id = '';
    }
    
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
                placeholder="Try: '50 day-old Ross 308 chicks in Gauteng under R20 each' or 'Boer goats in Limpopo'"
                className="border-0 bg-transparent text-emerald-800 placeholder-emerald-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAISearch(e.target.value);
                  }
                }}
              />
              <Badge variant="outline" className="text-emerald-600 border-emerald-300">
                Smart Search
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Deliverable Filter Bar */}
        <DeliverableFilterBar 
          value={deliverableOnly} 
          onChange={setDeliverableOnly}
        />

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
                <Select value={filters.category_group_id || undefined} onValueChange={(value) => handleFilterChange('category_group_id', value || "")}>
                  <SelectTrigger className="border-emerald-200">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    {(categoryGroups || []).filter(group => group && group.id && group.id !== "").map(group => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Species */}
              <div>
                <Label className="text-emerald-800 text-sm">Species</Label>
                <Select value={filters.species_id || undefined} onValueChange={(value) => handleFilterChange('species_id', value || "")} disabled={!filters.category_group_id}>
                  <SelectTrigger className="border-emerald-200">
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    {(species || []).filter(spec => spec && spec.id && spec.id !== "").map(spec => (
                      <SelectItem key={spec.id} value={spec.id}>
                        {spec.name}
                        {spec.is_free_range && " 🌿"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Breed */}
              <div>
                <Label className="text-emerald-800 text-sm">Breed</Label>
                <Select value={filters.breed_id || undefined} onValueChange={(value) => handleFilterChange('breed_id', value || "")} disabled={!filters.species_id}>
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
                const groupListings = listings.filter(l => {
                  const listingSpecies = species.find(s => s.id === l.species_id);
                  return listingSpecies && listingSpecies.category_group_id === group.id;
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
                      <p className="text-sm text-emerald-600">{groupListings.length} listings</p>
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
                
                const { deliverabilityStatus } = require('./lib/deliverability');
                const { useBuyerLocation } = require('./lib/locationStore');
                
                // In a real implementation, you'd call the store hook properly
                // For now, we'll simulate allowing most listings
                return Math.random() > 0.3; // Show ~70% of listings as deliverable
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
      const response = await apiCall('POST', '/orders', {
        listing_id: listing.id,
        quantity: quantity
      });
      
      if (response.data.payment_url) {
        // In a real implementation, redirect to payment
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('Error creating order:', error);
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
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          listing_id: listing.id,
          quantity: 1,
          shipping_option: 'standard'
        })
      });

      if (response.ok) {
        const data = await response.json();
        showNotification?.(`${listing.title} added to cart!`, 'success');
        onAddToCart?.(data.cart_item_count);
      } else {
        throw new Error('Failed to add to cart');
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      showNotification?.('Failed to add item to cart', 'error');
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
            {/* Delivery Range Badge */}
            <RangeBadge 
              serviceArea={serviceArea} 
              sellerCountry={listing.seller_country || 'ZA'} 
              compact={true}
            />
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
          <div className="flex items-center gap-2 mb-4">
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
                  onClick={() => handleBuyNow(listing)}
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
// Create Listing Component
function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [taxonomy, setTaxonomy] = useState([]);
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
    certificates: []
  });

  const [filteredSpecies, setFilteredSpecies] = useState([]);
  const [filteredBreeds, setFilteredBreeds] = useState([]);
  const [filteredProductTypes, setFilteredProductTypes] = useState([]);

  useEffect(() => {
    if (user && user.roles.includes('seller')) {
      fetchTaxonomy();
    }
  }, [user]);

  const fetchTaxonomy = async () => {
    try {
      const response = await apiCall('GET', '/taxonomy/full');
      // Handle both direct array and wrapped response
      const taxonomyData = Array.isArray(response) ? response : response.data;
      setTaxonomy(taxonomyData || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching taxonomy:', error);
      setTaxonomy([]);
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
              {/* Category Selection */}
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-emerald-800">Category Group *</Label>
                  <Select value={formData.category_group_id} onValueChange={handleCategoryGroupChange}>
                    <SelectTrigger className="border-emerald-200">
                      <SelectValue placeholder="Select category group" />
                    </SelectTrigger>
                    <SelectContent>
                      {(taxonomy || []).filter(t => t && t.group && t.group.id && t.group.id !== "").map(t => (
                        <SelectItem key={t.group.id} value={t.group.id}>
                          {t.group.name}
                        </SelectItem>
                      ))}
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
                      {(filteredSpecies || []).filter(species => species && species.id && species.id !== "").map(species => (
                        <SelectItem key={species.id} value={species.id}>
                          {species.name}
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
                        <p className="text-xs text-gray-500">Vet certificates, health records (PDF, JPG, PNG)</p>
                      </div>
                      <input 
                        id="certificates" 
                        type="file" 
                        multiple 
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          const files = Array.from(e.target.files);
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
                    <MapPin className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-700">Agricultural Hub, South Africa</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-700">+27 12 345 6789</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="h-5 w-5 text-emerald-600" />
                    <span className="text-emerald-700">info@stocklot.co.za</span>
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
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-emerald-700">Name</Label>
                    <Input id="name" className="border-emerald-200 focus:border-emerald-500" />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-emerald-700">Email</Label>
                    <Input id="email" type="email" className="border-emerald-200 focus:border-emerald-500" />
                  </div>
                  <div>
                    <Label htmlFor="subject" className="text-emerald-700">Subject</Label>
                    <Input id="subject" className="border-emerald-200 focus:border-emerald-500" />
                  </div>
                  <div>
                    <Label htmlFor="message" className="text-emerald-700">Message</Label>
                    <Textarea id="message" rows={4} className="border-emerald-200 focus:border-emerald-500" />
                  </div>
                  <Button 
                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                    onClick={() => alert('Message sent! We\'ll get back to you soon.')}
                  >
                    Send Message
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

// Buy Requests Public Page - Enhanced with images, requirements, and comprehensive details
function BuyRequestsPage() {
  const { user } = useAuth();
  return <EnhancedPublicBuyRequestsPage user={user} />;
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
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <main className="min-h-screen">
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<EnhancedRegister />} />
              <Route path="/marketplace" element={<Marketplace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/payment-methods" element={<PaymentMethodsPage />} />
              <Route path="/addresses" element={<AddressesPage />} />
              <Route path="/admin" element={<AdminDashboardRoute />} />
              <Route path="/create-listing" element={<CreateListing />} />
              <Route path="/create-organization" element={<CreateOrganizationPage />} />
              <Route path="/orgs/:handle/dashboard" element={<OrganizationDashboard />} />
              <Route path="/checkout/guest" element={<GuestCheckout />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/about" element={<AboutUs />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/admin/blog/create" element={<BlogEditor />} />
              <Route path="/admin/blog/edit/:id" element={<BlogEditor />} />
              <Route path="/create-blog" element={<BlogEditor />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/referrals" element={<ReferralDashboard />} />
              <Route path="/buy-requests" element={<BuyRequestsPage />} />
              <Route path="/offers-inbox" element={<BuyerOffersInbox />} />
              <Route path="/inbox" element={<UnifiedInbox />} />
              <Route path="/create-buy-request" element={<CreateBuyRequestPage />} />
              <Route path="/reviews-test" element={<ReviewsTestPage />} />
              <Route path="/contact" element={<Contact />} />
            </Routes>
          </main>
          <Footer />
        </div>
        
        {/* Global FAQ Chatbot */}
        <FAQChatbot />
      </Router>
    </AuthProvider>
  );
}

// Profile Settings Page
function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(user || {});
  const [loading, setLoading] = useState(false);

  const updateProfile = async (data) => {
    setLoading(true);
    try {
      const response = await apiCall('PATCH', '/profile', data);
      setProfile(response);
      alert('Profile updated successfully!');
    } catch (error) {
      alert('Failed to update profile');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="shadow-xl border-emerald-200">
            <CardHeader>
              <CardTitle className="text-emerald-900">Profile Settings</CardTitle>
              <CardDescription>Manage your account information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-emerald-100 text-emerald-700 text-2xl font-bold">
                    {profile.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Button variant="outline">Upload Photo</Button>
                  <p className="text-sm text-gray-500 mt-1">JPG, PNG up to 5MB</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input 
                    id="full_name"
                    value={profile.full_name || ''}
                    onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email"
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => setProfile({...profile, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input 
                    id="phone"
                    value={profile.phone || ''}
                    onChange={(e) => setProfile({...profile, phone: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="business_name">Business Name</Label>
                  <Input 
                    id="business_name"
                    value={profile.business_name || ''}
                    onChange={(e) => setProfile({...profile, business_name: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea 
                  id="bio"
                  rows={3}
                  value={profile.bio || ''}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  placeholder="Tell us about yourself..."
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => updateProfile(profile)}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? 'Updating...' : 'Save Changes'}
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
  return <UnifiedInboxPage user={user} />;
}
export default App;