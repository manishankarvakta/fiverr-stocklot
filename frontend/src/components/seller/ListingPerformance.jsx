import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Eye, Heart, MessageSquare, TrendingUp, Clock, Search,
  Star, Share2, Users, Calendar, Package, BarChart3
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

const ListingPerformance = () => {
  const { user } = useAuth();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('views');

  useEffect(() => {
    fetchListingPerformance();
  }, []);

  const fetchListingPerformance = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/seller/performance`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      } else {
        // Mock data for demo
        setListings([
          {
            id: 1,
            title: "Premium Angus Cattle",
            status: "active",
            views: 342,
            saves: 28,
            inquiries: 15,
            shares: 8,
            conversion_rate: 4.4,
            avg_time_on_page: 145,
            created_at: "2024-11-15",
            price: 2500000,
            category: "Cattle",
            performance_score: 92
          },
          {
            id: 2,
            title: "Purebred Boer Goats",
            status: "sold",
            views: 289,
            saves: 22,
            inquiries: 12,
            shares: 5,
            conversion_rate: 4.2,
            avg_time_on_page: 132,
            created_at: "2024-11-10",
            price: 350000,
            category: "Goats",
            performance_score: 88
          },
          {
            id: 3,
            title: "Layer Chickens - Brown",
            status: "active",
            views: 201,
            saves: 18,
            inquiries: 9,
            shares: 3,
            conversion_rate: 4.5,
            avg_time_on_page: 98,
            created_at: "2024-11-20",
            price: 32000,
            category: "Poultry",
            performance_score: 75
          },
          {
            id: 4,
            title: "Holstein Dairy Cows",
            status: "active",
            views: 178,
            saves: 15,
            inquiries: 7,
            shares: 2,
            conversion_rate: 3.9,
            avg_time_on_page: 156,
            created_at: "2024-11-12",
            price: 4500000,
            category: "Cattle",
            performance_score: 82
          },
          {
            id: 5,
            title: "Free Range Chickens",
            status: "expired",
            views: 156,
            saves: 12,
            inquiries: 5,
            shares: 1,
            conversion_rate: 3.2,
            avg_time_on_page: 87,
            created_at: "2024-10-28",
            price: 28000,
            category: "Poultry",
            performance_score: 68
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching listing performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'sold': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPerformanceColor = (score) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount / 100);
  };

  const filteredListings = listings.filter(listing =>
    listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    listing.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedListings = [...filteredListings].sort((a, b) => {
    switch (sortBy) {
      case 'views': return b.views - a.views;
      case 'saves': return b.saves - a.saves;
      case 'inquiries': return b.inquiries - a.inquiries;
      case 'performance': return b.performance_score - a.performance_score;
      case 'created': return new Date(b.created_at) - new Date(a.created_at);
      default: return 0;
    }
  });

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading performance data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-900">Listing Performance</h1>
        <p className="text-emerald-700">Detailed analytics for your livestock listings</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {listings.reduce((sum, listing) => sum + listing.views, 0).toLocaleString()}
                </p>
              </div>
              <Eye className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Saves</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {listings.reduce((sum, listing) => sum + listing.saves, 0)}
                </p>
              </div>
              <Heart className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Inquiries</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {listings.reduce((sum, listing) => sum + listing.inquiries, 0)}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Performance</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {listings.length > 0 ? Math.round(listings.reduce((sum, listing) => sum + listing.performance_score, 0) / listings.length) : 0}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search listings..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="views">Sort by Views</option>
          <option value="saves">Sort by Saves</option>
          <option value="inquiries">Sort by Inquiries</option>
          <option value="performance">Sort by Performance</option>
          <option value="created">Sort by Date Created</option>
        </select>
      </div>

      {/* Listings Performance */}
      <div className="space-y-4">
        {sortedListings.map((listing) => (
          <Card key={listing.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-emerald-900">{listing.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={`${getStatusColor(listing.status)} border text-xs`}>
                      {listing.status}
                    </Badge>
                    <span className="text-sm text-gray-600">{listing.category}</span>
                    <span className="text-sm text-gray-600">•</span>
                    <span className="text-sm text-gray-600">{formatCurrency(listing.price)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(listing.performance_score)}`}>
                    <Star className="h-3 w-3 mr-1" />
                    {listing.performance_score}% Score
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Created {new Date(listing.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Views</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-900">{listing.views}</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Heart className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Saves</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-900">{listing.saves}</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Inquiries</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-900">{listing.inquiries}</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Share2 className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Shares</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-900">{listing.shares}</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Conv. Rate</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-900">{listing.conversion_rate}%</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Avg. Time</span>
                  </div>
                  <p className="text-lg font-bold text-emerald-900">{listing.avg_time_on_page}s</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/listing/${listing.id}`}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Listing
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.location.href = `/listing/${listing.id}/edit`}
                  >
                    Edit
                  </Button>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    Last updated: {new Date(listing.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {sortedListings.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Listings Found</h3>
            <p className="text-gray-600">No listings match your current search.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ListingPerformance;