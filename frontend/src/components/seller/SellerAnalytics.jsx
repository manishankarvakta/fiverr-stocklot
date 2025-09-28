import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  DollarSign, Package, Eye, TrendingUp, Users, Calendar,
  BarChart3, PieChart, Activity, ArrowUp, ArrowDown
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';

const SellerAnalytics = () => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    overview: {
      total_revenue: 0,
      total_listings: 0,
      total_views: 0,
      conversion_rate: 0,
      active_listings: 0,
      sold_listings: 0
    },
    performance: {
      revenue_growth: 0,
      listing_growth: 0,
      view_growth: 0
    },
    top_listings: [],
    monthly_revenue: [],
    category_breakdown: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30days');

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/seller/analytics?period=${timeRange}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        // Mock data for demo
        setAnalytics({
          overview: {
            total_revenue: 125000,
            total_listings: 23,
            total_views: 1847,
            conversion_rate: 12.5,
            active_listings: 18,
            sold_listings: 5
          },
          performance: {
            revenue_growth: 15.2,
            listing_growth: 8.7,
            view_growth: 22.1
          },
          top_listings: [
            { id: 1, title: "Premium Angus Cattle", views: 342, revenue: 45000 },
            { id: 2, title: "Purebred Boer Goats", views: 289, revenue: 28000 },
            { id: 3, title: "Layer Chickens", views: 201, revenue: 15000 }
          ],
          monthly_revenue: [
            { month: 'Jan', revenue: 18000 },
            { month: 'Feb', revenue: 22000 },
            { month: 'Mar', revenue: 28000 },
            { month: 'Apr', revenue: 32000 },
            { month: 'May', revenue: 25000 }
          ],
          category_breakdown: [
            { category: 'Cattle', percentage: 45, revenue: 56250 },
            { category: 'Goats', percentage: 30, revenue: 37500 },
            { category: 'Poultry', percentage: 25, revenue: 31250 }
          ]
        });
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount / 100);
  };

  const getGrowthColor = (growth) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getGrowthIcon = (growth) => {
    if (growth > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Seller Analytics</h1>
          <p className="text-emerald-700">Track your sales performance and insights</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(analytics.overview.total_revenue)}
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(analytics.performance.revenue_growth)}
                  <span className={`text-sm ${getGrowthColor(analytics.performance.revenue_growth)}`}>
                    {Math.abs(analytics.performance.revenue_growth)}% vs last period
                  </span>
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Listings</p>
                <p className="text-2xl font-bold text-emerald-900">{analytics.overview.total_listings}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-xs text-green-700 border-green-300">
                    {analytics.overview.active_listings} Active
                  </Badge>
                  <Badge variant="outline" className="text-xs text-blue-700 border-blue-300">
                    {analytics.overview.sold_listings} Sold
                  </Badge>
                </div>
              </div>
              <Package className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-emerald-900">{analytics.overview.total_views.toLocaleString()}</p>
                <div className="flex items-center gap-1 mt-1">
                  {getGrowthIcon(analytics.performance.view_growth)}
                  <span className={`text-sm ${getGrowthColor(analytics.performance.view_growth)}`}>
                    {Math.abs(analytics.performance.view_growth)}% vs last period
                  </span>
                </div>
              </div>
              <Eye className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
                <p className="text-2xl font-bold text-emerald-900">{analytics.overview.conversion_rate}%</p>
                <p className="text-sm text-gray-500 mt-1">Views to sales</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg. Sale Value</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {formatCurrency(analytics.overview.sold_listings > 0 ? analytics.overview.total_revenue / analytics.overview.sold_listings : 0)}
                </p>
                <p className="text-sm text-gray-500 mt-1">Per transaction</p>
              </div>
              <BarChart3 className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Rate</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {analytics.overview.total_listings > 0 ? Math.round((analytics.overview.active_listings / analytics.overview.total_listings) * 100) : 0}%
                </p>
                <p className="text-sm text-gray-500 mt-1">Listings active</p>
              </div>
              <Activity className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.monthly_revenue.map((month, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{month.month}</span>
                <div className="flex items-center gap-4">
                  <div className="w-48 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{
                        width: `${(month.revenue / Math.max(...analytics.monthly_revenue.map(m => m.revenue))) * 100}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-semibold text-emerald-900 w-20 text-right">
                    {formatCurrency(month.revenue)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.top_listings.map((listing, index) => (
                <div key={listing.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900">{listing.title}</h4>
                    <p className="text-sm text-gray-600">{listing.views} views</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-emerald-900">{formatCurrency(listing.revenue)}</p>
                    <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.category_breakdown.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{category.category}</span>
                    <span className="text-sm font-semibold text-emerald-900">
                      {formatCurrency(category.revenue)} ({category.percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-emerald-600 h-2 rounded-full"
                      style={{ width: `${category.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerAnalytics;