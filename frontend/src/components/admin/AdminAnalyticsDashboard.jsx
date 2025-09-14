import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';
import { TrendingUp, DollarSign, Users, Package, ShoppingCart, Calendar, Download, RefreshCw } from 'lucide-react';

const AdminAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState({
    overview: {
      total_revenue: 0,
      total_users: 0,
      total_listings: 0,
      total_orders: 0,
      platform_commission: 0,
      active_sellers: 0,
      active_buyers: 0,
      conversion_rate: 0
    },
    trends: [],
    top_categories: [],
    recent_activities: []
  });
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('30d');
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const params = new URLSearchParams();
      params.append('range', timeRange);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/analytics/overview?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAnalytics(data);
      } else {
        console.error('Failed to load analytics:', response.status);
        alert('Failed to load analytics. Please check your permissions.');
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
      alert('Error loading analytics: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const params = new URLSearchParams();
      params.append('range', timeRange);
      params.append('format', 'csv');

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/analytics/export?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        alert('Analytics exported successfully!');
      } else {
        alert('Failed to export analytics');
      }
    } catch (error) {
      console.error('Error exporting analytics:', error);
      alert('Error exporting analytics: ' + error.message);
    } finally {
      setExportLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `R${(amount / 100).toLocaleString()}`;
  };

  const formatPercentage = (value) => {
    return `${(value || 0).toFixed(1)}%`;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Business Analytics</h2>
          <p className="text-gray-600">Comprehensive platform performance insights</p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="12m">Last 12 months</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportAnalytics} disabled={exportLoading} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {exportLoading ? 'Exporting...' : 'Export'}
          </Button>
          <Button onClick={loadAnalytics} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
            <RefreshCw className="h-4 w-4 mr-2" />
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(analytics.overview.total_revenue)}</p>
                <p className="text-xs text-gray-500 mt-1">Platform earnings</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold text-blue-600">{analytics.overview.total_users.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{analytics.overview.active_sellers} sellers, {analytics.overview.active_buyers} buyers</p>
              </div>
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Listings</p>
                <p className="text-2xl font-bold text-purple-600">{analytics.overview.total_listings.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">Livestock inventory</p>
              </div>
              <Package className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-orange-600">{analytics.overview.total_orders.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{formatPercentage(analytics.overview.conversion_rate)} conversion rate</p>
              </div>
              <ShoppingCart className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Commission & Platform Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Platform Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Commission Earned</span>
                <span className="font-semibold text-green-600">{formatCurrency(analytics.overview.platform_commission)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Commission Rate</span>
                <span className="font-semibold">10%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Processing Fees</span>
                <span className="font-semibold text-blue-600">1.5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Conversion Rate</span>
                <span className="font-semibold text-green-600">{formatPercentage(analytics.overview.conversion_rate)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Average Order Value</span>
                <span className="font-semibold">{formatCurrency(analytics.overview.total_revenue / Math.max(analytics.overview.total_orders, 1))}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Seller-to-Buyer Ratio</span>
                <span className="font-semibold">1:{Math.round(analytics.overview.active_buyers / Math.max(analytics.overview.active_sellers, 1))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Categories */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p>Loading category data...</p>
              </div>
            </div>
          ) : analytics.top_categories && analytics.top_categories.length > 0 ? (
            <div className="space-y-4">
              {analytics.top_categories.map((category, index) => (
                <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center text-sm font-semibold">
                      {index + 1}
                    </span>
                    <div>
                      <h4 className="font-medium">{category.name || 'Unknown Category'}</h4>
                      <p className="text-sm text-gray-600">{category.listings_count || 0} listings</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">{formatCurrency(category.revenue || 0)}</p>
                    <p className="text-sm text-gray-600">{category.orders_count || 0} orders</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No category data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Platform Activities</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p>Loading recent activities...</p>
              </div>
            </div>
          ) : analytics.recent_activities && analytics.recent_activities.length > 0 ? (
            <div className="space-y-3">
              {analytics.recent_activities.map((activity, index) => (
                <div key={index} className="flex items-start gap-3 py-2">
                  <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm">{activity.description || activity.message}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp ? new Date(activity.timestamp).toLocaleString() : 'Unknown time'}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No recent activities</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsDashboard;