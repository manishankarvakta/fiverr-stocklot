import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { 
  DollarSign, Package, Eye, TrendingUp, Users, Calendar,
  BarChart3, PieChart, Activity, ArrowUp, ArrowDown
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { useGetMySellerAnalyticsQuery } from '../../store/api/seller.api';

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
  const [timeRange, setTimeRange] = useState('30days');

  // Use Redux Toolkit Query hook - refetch when timeRange changes
  // Skip if user doesn't have seller role
  const hasSellerRole = user && (user.roles?.includes('seller') || user.roles?.includes('both'));
  
  console.log("User:", user);
  console.log("User Roles:", user?.roles);
  console.log("Has Seller Role:", hasSellerRole);
  console.log("Time Range:", timeRange);
  
  const { data: analyticsData, isLoading: loading, error, refetch } = useGetMySellerAnalyticsQuery(
    { period: timeRange },
    { 
      skip: !hasSellerRole,
      refetchOnMountOrArgChange: true,
      // Don't cache to ensure fresh data
      refetchOnFocus: true
    }
  );

  console.log("Analytics Query State:", { 
    loading, 
    error: error ? { message: error.message, status: error.status, data: error.data } : null, 
    analyticsData, 
    hasSellerRole,
    skipped: !hasSellerRole
  });

  // Refetch when time range changes - removed to avoid infinite loop
  // RTK Query will automatically refetch when params change due to refetchOnMountOrArgChange
  
  // Debug logging
  useEffect(() => {
    if (error) {
      console.error("Analytics Error:", error);
    }
    if (analyticsData) {
      console.log("Analytics Data Received:", analyticsData);
    }
  }, [analyticsData, error]);

  // Update analytics state when data changes
  useEffect(() => {
    if (analyticsData) {
      console.log("Setting analytics data:", analyticsData);
      // Ensure all required fields exist with defaults
      const newAnalytics = {
        overview: {
          total_revenue: analyticsData.overview?.total_revenue ?? 0,
          total_listings: analyticsData.overview?.total_listings ?? 0,
          total_views: analyticsData.overview?.total_views ?? 0,
          conversion_rate: analyticsData.overview?.conversion_rate ?? 0,
          active_listings: analyticsData.overview?.active_listings ?? 0,
          sold_listings: analyticsData.overview?.sold_listings ?? 0
        },
        performance: {
          revenue_growth: analyticsData.performance?.revenue_growth ?? 0,
          listing_growth: analyticsData.performance?.listing_growth ?? 0,
          view_growth: analyticsData.performance?.view_growth ?? 0
        },
        top_listings: Array.isArray(analyticsData.top_listings) ? analyticsData.top_listings : [],
        monthly_revenue: Array.isArray(analyticsData.monthly_revenue) ? analyticsData.monthly_revenue : [],
        category_breakdown: Array.isArray(analyticsData.category_breakdown) ? analyticsData.category_breakdown : []
      };
      console.log("Processed analytics:", newAnalytics);
      setAnalytics(newAnalytics);
    } else if (!loading && !analyticsData && !error) {
      // If not loading and no data/error, show empty state
      console.log("No data received, showing empty state");
      setAnalytics({
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
    } else if (error) {
      // Fallback to mock data on error
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
  }, [analyticsData, error]);

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

  // Show loading state
  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading analytics...</p>
        {!hasSellerRole && (
          <p className="text-yellow-600 text-sm mt-2">Waiting for user authentication...</p>
        )}
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">
          <p className="font-semibold">Error loading analytics</p>
          <p className="text-sm mt-2">{error?.data?.detail || error?.message || 'Unknown error'}</p>
          <p className="text-xs mt-1 text-gray-500">Status: {error?.status}</p>
        </div>
        <Button onClick={() => refetch()} className="bg-emerald-600 hover:bg-emerald-700">
          Retry
        </Button>
      </div>
    );
  }

  // Show message if query is skipped
  if (!hasSellerRole) {
    return (
      <div className="text-center p-8">
        <div className="text-yellow-600 mb-4">
          <p className="font-semibold">Seller Access Required</p>
          <p className="text-sm mt-2">You need seller privileges to view analytics.</p>
          <p className="text-xs mt-1">Current roles: {user?.roles?.join(', ') || 'None'}</p>
        </div>
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

      {/* Show message if no data */}
      {!loading && analyticsData && analyticsData.overview?.total_listings === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="text-center">
              <Package className="h-12 w-12 text-yellow-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">No Analytics Data Yet</h3>
              <p className="text-yellow-700 mb-4">
                You don't have any listings or orders yet. Start by creating your first listing!
              </p>
              <Button 
                onClick={() => window.location.href = '/create-listing'}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Create Your First Listing
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

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
                <p className="text-2xl font-bold text-emerald-900">{(analytics.overview.total_views || 0).toLocaleString()}</p>
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
          {analytics.monthly_revenue.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No revenue data available for this period</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.monthly_revenue.map((month, index) => {
                const maxRevenue = Math.max(...analytics.monthly_revenue.map(m => m.revenue || 0), 1);
                return (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">{month.month}</span>
                    <div className="flex items-center gap-4">
                      <div className="w-48 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full"
                          style={{
                            width: `${((month.revenue || 0) / maxRevenue) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm font-semibold text-emerald-900 w-20 text-right">
                        {formatCurrency(month.revenue || 0)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Listings */}
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Listings</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.top_listings.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No listing data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.top_listings.map((listing, index) => (
                  <div key={listing.id || index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{listing.title || 'Untitled Listing'}</h4>
                      <p className="text-sm text-gray-600">{listing.views || 0} views</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-emerald-900">{formatCurrency(listing.revenue || 0)}</p>
                      <Badge variant="outline" className="text-xs">#{index + 1}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {analytics.category_breakdown.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No category data available</p>
              </div>
            ) : (
              <div className="space-y-4">
                {analytics.category_breakdown.map((category, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">{category.category}</span>
                      <span className="text-sm font-semibold text-emerald-900">
                        {formatCurrency(category.revenue || 0)} ({category.percentage || 0}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-emerald-600 h-2 rounded-full"
                        style={{ width: `${category.percentage || 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerAnalytics;