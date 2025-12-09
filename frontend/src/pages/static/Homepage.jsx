import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { Button, Card, CardContent } from "@/components/ui";
import { Shield, CheckCircle, Search, MapPin, User, Star } from "lucide-react";
import { useGetListingsQuery } from "@/store/api/listings.api";
import { useAdminStatsQuery, useGetModerationStatsQuery } from "@/store/api/admin.api";
import Header from "@/components/ui/common/Header";
import Footer from "@/components/ui/common/Footer";
// import Header from "@/components/layout/Header";


// API helper with auth token (keeping for backward compatibility)
const apiCall = async (method, url, data = null) => {
  const token = localStorage.getItem('token');
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;
  
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
    
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: data ? JSON.stringify(data) : undefined
    });
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

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



  // FETCH LISTINGS using RTK Query
  const {data: featuredListingsData, isSuccess: isFeaturedListingsSuccess} = useGetListingsQuery({ limit: 3 });

  useEffect(() => {
    if (featuredListingsData) {
      setFeaturedListings(featuredListingsData.items || featuredListingsData || []);
    }
  }, [featuredListingsData, isFeaturedListingsSuccess]);

  // Only fetch admin stats if user is admin using RTK Query
  const isAdmin = user?.roles?.includes('admin');
  const {data: statsData, isSuccess: isStatsSuccess} = useAdminStatsQuery(undefined, {
    skip: !isAdmin, // Skip query if user is not admin
  });
  
  useEffect(() => {
    if (statsData) {
      setStats({
        total_listings: statsData.total_listings || 15,
        total_users: statsData.total_users || 50,
        total_orders: statsData.total_orders || 25
      });
    } else {
      // Fallback to demo numbers
      setStats({
        total_listings: 15,
        total_users: 50,
        total_orders: 25
      });
    }
    
    // Hide flash screen after 3 seconds
    const timer = setTimeout(() => {
      setShowFlash(false);
    }, 3000);
  
    return () => clearTimeout(timer);
  }, [statsData, isStatsSuccess]);

  // const loadFeaturedListings = async () => {
  //   try {
  //     const response = await apiCall('GET', '/listings');
  //     setFeaturedListings((response.data || []).slice(0, 3)); // Get first 3 listings with fallback
  //   } catch (error) {
  //     console.error('Error loading featured listings:', error);
  //     setFeaturedListings([]); // Set empty array as fallback
  //   }
  // };

  const handleCategoryClick = (category) => {
    navigate(`/marketplace?category=${category}`);
  };

  const handleSearch = (searchTerm) => {
    if (searchTerm.trim()) {
      navigate(`/marketplace?search=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <div className="homepage">
      <Header />

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
          <h2 className="section-title">Featured Stock 0</h2>
          <p className="section-subtitle">Check out some of our premium livestock available for sale</p>
          <div className="stock-grid">
            {featuredListings?.length > 0 ? (
              featuredListings?.map((listing, index) => (
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
      <Footer />
    </div>
  );
}

export default Homepage;
