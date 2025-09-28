import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/select";
import { Badge } from "./components/ui/badge";
import { Avatar, AvatarFallback } from "./components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "./components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { Textarea } from "./components/ui/textarea";
import { ShoppingCart, User, Plus, Search, MapPin, Calendar, CheckCircle, Star, MessageCircle, Filter } from "lucide-react";
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
  const config = {
    method,
    url: `${API}${url}`,
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  };
  
  if (data) {
    config.data = data;
  }
  
  return axios(config);
};

// Header component
function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="border-b border-amber-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-600 to-orange-600 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">🐄</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-700 to-green-700 bg-clip-text text-transparent">
              StockLot
            </h1>
            <p className="text-xs text-emerald-600 font-medium">Livestock Marketplace</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/marketplace" className="text-amber-700 hover:text-amber-900 font-medium transition-colors">
            Browse Animals
          </Link>
          {user && user.roles.includes('seller') && (
            <Link to="/sell" className="text-amber-700 hover:text-amber-900 font-medium transition-colors">
              Sell Animals
            </Link>
          )}
          {user && (
            <Link to="/orders" className="text-amber-700 hover:text-amber-900 font-medium transition-colors">
              My Orders
            </Link>
          )}
        </nav>

        <div className="flex items-center space-x-3">
          {user ? (
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarFallback className="bg-amber-100 text-amber-700">
                  {user.full_name.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-amber-900">{user.full_name}</p>
                <div className="flex space-x-1">
                  {user.roles.map(role => (
                    <Badge key={role} variant="secondary" className="text-xs bg-amber-100 text-amber-700">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={logout}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                Logout
              </Button>
            </div>
          ) : (
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/login')}
                className="border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                Login
              </Button>
              <Button 
                size="sm" 
                onClick={() => navigate('/register')}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    if (result.success) {
      navigate('/marketplace');
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-amber-200">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🐄</span>
          </div>
          <CardTitle className="text-2xl font-bold text-amber-900">Welcome Back</CardTitle>
          <CardDescription className="text-amber-600">
            Sign in to your FarmStock account
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
              <Label htmlFor="email" className="text-amber-800">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                placeholder="Enter your email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-amber-800">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                placeholder="Enter your password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white" 
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-amber-600">
            Don't have an account?{' '}
            <Link to="/register" className="text-amber-800 hover:text-amber-900 font-medium underline">
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
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-xl border-amber-200 text-center">
          <CardContent className="pt-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-amber-900 mb-2">Registration Successful!</h2>
            <p className="text-amber-600">Redirecting to login...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl border-amber-200">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🐄</span>
          </div>
          <CardTitle className="text-2xl font-bold text-amber-900">Join FarmStock</CardTitle>
          <CardDescription className="text-amber-600">
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
                <Label htmlFor="full_name" className="text-amber-800">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  required
                  className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-amber-800">Account Type</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({...formData, role: value})}>
                  <SelectTrigger className="border-amber-200 focus:border-amber-400 focus:ring-amber-400">
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
              <Label htmlFor="email" className="text-amber-800">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
                className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone" className="text-amber-800">Phone (Optional)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                placeholder="+27 123 456 789"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-amber-800">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
                required
                className="border-amber-200 focus:border-amber-400 focus:ring-amber-400"
                placeholder="Create a strong password"
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white" 
              disabled={loading}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="text-center">
          <p className="text-sm text-amber-600">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-800 hover:text-amber-900 font-medium underline">
              Sign in here
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

// Homepage component
function Homepage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-amber-800 via-orange-700 to-amber-900 bg-clip-text text-transparent">
                South Africa's Premier
              </span>
              <br />
              <span className="text-amber-900">Livestock Marketplace</span>
            </h1>
            <p className="text-xl md:text-2xl text-amber-700 mb-8 leading-relaxed">
              Buy and sell chickens, goats, cattle, and more with secure escrow payments. 
              From day-old chicks to breeding stock, find quality livestock from trusted farmers.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-8 py-4 text-lg"
                onClick={() => navigate('/marketplace')}
              >
                <Search className="mr-2 h-5 w-5" />
                Browse Animals
              </Button>
              {(!user || user.roles.includes('seller')) && (
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white px-8 py-4 text-lg"
                  onClick={() => user ? navigate('/sell') : navigate('/register')}
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Start Selling
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-white/60 backdrop-blur-sm">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-900 mb-12">
            Why Choose FarmStock?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="text-center border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">Secure Payments</h3>
                <p className="text-amber-700">
                  Escrow system holds funds until delivery confirmation. Your money is safe with Paystack integration.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Star className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">Verified Sellers</h3>
                <p className="text-amber-700">
                  All sellers are verified with ratings and reviews. Buy with confidence from trusted farmers.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center border-amber-200 shadow-lg hover:shadow-xl transition-shadow">
              <CardContent className="pt-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-amber-900 mb-2">Direct Communication</h3>
                <p className="text-amber-700">
                  Chat directly with sellers to arrange pickup or delivery. No middlemen, just farmers.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Animal Categories Preview */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-amber-900 mb-12">
            Popular Categories
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {[
              { name: 'Chickens', emoji: '🐔', desc: 'Broilers, Layers, Chicks' },
              { name: 'Goats', emoji: '🐐', desc: 'Boer, Dairy, Kids' },
              { name: 'Cattle', emoji: '🐄', desc: 'Beef, Dairy, Calves' },
              { name: 'Sheep', emoji: '🐑', desc: 'Meat, Wool, Lambs' },
              { name: 'Rabbits', emoji: '🐰', desc: 'Meat, Fur, Kits' },
              { name: 'Ducks', emoji: '🦆', desc: 'Meat, Eggs, Ducklings' }
            ].map((category) => (
              <Card key={category.name} className="text-center cursor-pointer hover:shadow-lg transition-shadow border-amber-200">
                <CardContent className="pt-4 pb-4">
                  <div className="text-4xl mb-2">{category.emoji}</div>
                  <h3 className="font-semibold text-amber-900 mb-1">{category.name}</h3>
                  <p className="text-xs text-amber-600">{category.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button 
              onClick={() => navigate('/marketplace')}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
            >
              View All Categories
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

// Marketplace component
function Marketplace() {
  const [listings, setListings] = useState([]);
  const [species, setSpecies] = useState([]);
  const [productTypes, setProductTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    species_id: '',
    product_type_id: '',
    region: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchListings();
  }, [filters]);

  const fetchData = async () => {
    try {
      const [speciesRes, productTypesRes] = await Promise.all([
        apiCall('GET', '/species'),
        apiCall('GET', '/product-types')
      ]);
      
      setSpecies(speciesRes.data);
      setProductTypes(productTypesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const fetchListings = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.species_id && filters.species_id !== "all") params.append('species_id', filters.species_id);
      if (filters.product_type_id && filters.product_type_id !== "all") params.append('product_type_id', filters.product_type_id);
      if (filters.region) params.append('region', filters.region);

      const response = await apiCall('GET', `/listings?${params.toString()}`);
      setListings(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching listings:', error);
      setLoading(false);
    }
  };

  const getSpeciesName = (speciesId) => {
    const speciesItem = species.find(s => s.id === speciesId);
    return speciesItem ? speciesItem.name : 'Unknown';
  };

  const getProductTypeName = (productTypeId) => {
    const productType = productTypes.find(pt => pt.id === productTypeId);
    return productType ? productType.label : 'Unknown';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-amber-600 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <span className="text-white text-2xl">🐄</span>
          </div>
          <p className="text-amber-700">Loading livestock...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-amber-900 mb-2">Browse Livestock</h1>
          <p className="text-amber-700">Find quality animals from verified sellers across South Africa</p>
        </div>

        {/* Filters */}
        <Card className="mb-8 border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center text-amber-900">
              <Filter className="mr-2 h-5 w-5" />
              Filter Animals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label className="text-amber-800">Animal Type</Label>
                <Select value={filters.species_id || undefined} onValueChange={(value) => setFilters({...filters, species_id: value || ""})}>
                  <SelectTrigger className="border-amber-200">
                    <SelectValue placeholder="All animals" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All animals</SelectItem>
                    {species.map(s => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-amber-800">Category</Label>
                <Select value={filters.product_type_id || undefined} onValueChange={(value) => setFilters({...filters, product_type_id: value || ""})}>
                  <SelectTrigger className="border-amber-200">
                    <SelectValue placeholder="All categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All categories</SelectItem>
                    {productTypes.map(pt => (
                      <SelectItem key={pt.id} value={pt.id}>{pt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-amber-800">Region</Label>
                <Input
                  placeholder="Enter region (e.g., Gauteng)"
                  value={filters.region}
                  onChange={(e) => setFilters({...filters, region: e.target.value})}
                  className="border-amber-200"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Listings Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(listing => (
            <ListingCard 
              key={listing.id} 
              listing={listing} 
              speciesName={getSpeciesName(listing.species_id)}
              productTypeName={getProductTypeName(listing.product_type_id)}
            />
          ))}
        </div>

        {listings.length === 0 && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-12 w-12 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-amber-900 mb-2">No animals found</h3>
            <p className="text-amber-600">Try adjusting your filters or check back later for new listings.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Listing Card component
function ListingCard({ listing, speciesName, productTypeName }) {
  const { user } = useAuth();
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    if (!user) {
      alert('Please login to make a purchase');
      return;
    }

    setLoading(true);
    try {
      const response = await apiCall('POST', '/orders', {
        listing_id: listing.id,
        quantity: quantity
      });

      // In a real implementation, redirect to payment URL
      alert('Order created! Redirecting to payment...');
      setShowPurchaseDialog(false);
    } catch (error) {
      alert('Failed to create order: ' + (error.response?.data?.detail || 'Unknown error'));
    }
    setLoading(false);
  };

  const totalPrice = (listing.price_per_unit * quantity).toFixed(2);

  return (
    <Card className="hover:shadow-xl transition-shadow border-amber-200 overflow-hidden">
      <div className="h-48 bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
        <div className="text-6xl opacity-60">
          {speciesName === 'Chickens' && '🐔'}
          {speciesName === 'Goats' && '🐐'}
          {speciesName === 'Cattle' && '🐄'}
          {speciesName === 'Sheep' && '🐑'}
          {speciesName === 'Rabbits' && '🐰'}
          {speciesName === 'Ducks' && '🦆'}
          {!['Chickens', 'Goats', 'Cattle', 'Sheep', 'Rabbits', 'Ducks'].includes(speciesName) && '🐾'}
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-semibold text-amber-900 line-clamp-2">{listing.title}</h3>
          <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-xs">
            {productTypeName}
          </Badge>
        </div>
        
        <p className="text-sm text-amber-600 mb-2">{speciesName}</p>
        
        {listing.description && (
          <p className="text-sm text-amber-700 mb-3 line-clamp-2">{listing.description}</p>
        )}
        
        <div className="flex items-center text-sm text-amber-600 mb-3">
          <MapPin className="h-4 w-4 mr-1" />
          {listing.city && listing.region ? `${listing.city}, ${listing.region}` : listing.region || listing.country}
        </div>
        
        <div className="flex justify-between items-center mb-3">
          <div>
            <p className="text-sm text-amber-600">Available: {listing.quantity} {listing.unit}</p>
            {listing.has_vet_certificate && (
              <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                Vet Certified
              </Badge>
            )}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-900">R{listing.price_per_unit}</p>
            <p className="text-xs text-amber-600">per {listing.unit}</p>
          </div>
        </div>
      </CardContent>
      
      <CardFooter className="p-4 pt-0">
        <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
          <DialogTrigger asChild>
            <Button 
              className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              disabled={!user}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              {user ? 'Buy Now' : 'Login to Buy'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-amber-900">Purchase Animals</DialogTitle>
              <DialogDescription>
                {listing.title} - R{listing.price_per_unit} per {listing.unit}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="quantity" className="text-amber-800">Quantity ({listing.unit})</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max={listing.quantity}
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                  className="border-amber-200"
                />
              </div>
              <div className="bg-amber-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Subtotal:</span>
                  <span>R{totalPrice}</span>
                </div>
                <div className="flex justify-between text-sm text-amber-600">
                  <span>Marketplace fee (5%):</span>
                  <span>R{(listing.price_per_unit * quantity * 0.05).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold text-amber-900 border-t border-amber-200 pt-2 mt-2">
                  <span>Total:</span>
                  <span>R{totalPrice}</span>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setShowPurchaseDialog(false)}
                className="border-amber-300"
              >
                Cancel
              </Button>
              <Button 
                onClick={handlePurchase}
                disabled={loading}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white"
              >
                {loading ? 'Creating Order...' : 'Proceed to Payment'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

// Main App component
function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Header />
          <Routes>
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/marketplace" element={<Marketplace />} />
            {/* Add more routes as needed */}
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;