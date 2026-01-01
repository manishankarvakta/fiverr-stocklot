import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Eye, MousePointer, ShoppingCart, TrendingUp, Filter } from 'lucide-react';
import { useGetPDPAnalyticsQuery } from '@/store/api/analytics.api';
// import adminApi from '../../api/adminClient';

const AdminAnalyticsPDP = () => {
  const [pdpData, setPdpData] = useState({});
  const [topListings, setTopListings] = useState([]);
  const [conversionData, setConversionData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    period: '30d',
    category: 'all',
    price_range: 'all'
  });

  useEffect(() => {
    loadPDPAnalytics();
  }, [filters]);
  const {data , isLoading, isError, error} = useGetPDPAnalyticsQuery({ days: 30 });
  console.log('this is the pdp data', data, isLoading, isError, error);

  const loadPDPAnalytics = async () => {
    try {
      setLoading(true);
      
      const response = await adminApi.get('/admin/analytics/pdp', {
        params: filters
      });

      
      // const data = response.data;
      setPdpData(data.overview || {});
      setTopListings(data.top_listings || []);
      setConversionData(data.conversion_funnel || []);
      
    } catch (error) {
      console.error('Error loading PDP analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const conversionColors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const conversionMetrics = [
    {
      title: 'Page Views',
      value: pdpData.total_views || 0,
      icon: Eye,
      color: 'text-blue-600'
    },
    {
      title: 'Click-Through Rate',
      value: `${((pdpData.clicks / pdpData.total_views) * 100 || 0).toFixed(1)}%`,
      icon: MousePointer,
      color: 'text-green-600'
    },
    {
      title: 'Add to Cart Rate',
      value: `${((pdpData.cart_adds / pdpData.total_views) * 100 || 0).toFixed(1)}%`,
      icon: ShoppingCart,
      color: 'text-orange-600'
    },
    {
      title: 'Conversion Rate',
      value: `${((pdpData.purchases / pdpData.total_views) * 100 || 0).toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600'
    }
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Page Analytics</h1>
          <p className="text-gray-600 mt-1">Product detail page performance and optimization insights</p>
        </div>
        
        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
          
          <select
            value={filters.category}
            onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
            className="border border-gray-300 rounded px-3 py-1 text-sm"
          >
            <option value="all">All Categories</option>
            <option value="poultry">Poultry</option>
            <option value="ruminants">Ruminants</option>
            <option value="exotic">Exotic</option>
          </select>
        </div>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {conversionMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${metric.color}`}>
                  <metric.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={conversionData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={120} />
                <Tooltip formatter={(value) => [value.toLocaleString(), 'Users']} />
                <Bar dataKey="users" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Listings */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Listing</th>
                  <th className="text-right py-2">Views</th>
                  <th className="text-right py-2">CTR</th>
                  <th className="text-right py-2">Conversion</th>
                  <th className="text-right py-2">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {topListings.map((listing, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{listing.title}</p>
                        <p className="text-gray-500 text-xs">{listing.category}</p>
                      </div>
                    </td>
                    <td className="text-right py-3">{listing.views.toLocaleString()}</td>
                    <td className="text-right py-3">{(listing.ctr * 100).toFixed(1)}%</td>
                    <td className="text-right py-3">{(listing.conversion_rate * 100).toFixed(1)}%</td>
                    <td className="text-right py-3">R{listing.revenue.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalyticsPDP;