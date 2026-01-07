import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Eye, MousePointer, ShoppingCart, TrendingUp, Filter } from 'lucide-react';
import { useGetPDPAnalyticsQuery } from '@/store/api/analytics.api';

const AdminAnalyticsPDP = () => {
  const [filters, setFilters] = useState({
    period: 30,
    category: 'all',
    price_range: 'all'
  });

  // Fetch data from API
  // const { data, isLoading, isError, error } = useGetPDPAnalyticsQuery({ days: filters.period });
  const { data, isLoading, isError, error } = useGetPDPAnalyticsQuery({ days: 30 });
  console.log('pdp data', data)
  // Process data for conversion funnel
  const conversionFunnelData = useMemo(() => {
    if (!data) return [];

    return [
      { stage: 'Page Views', users: data.total_views || 0, percentage: 100 },
      { stage: 'Unique Viewers', users: data.unique_viewers || 0, percentage: ((data.unique_viewers / data.total_views) * 100 || 0).toFixed(1) },
      { stage: 'Cart Adds', users: data.cart_adds || 0, percentage: ((data.cart_adds / data.total_views) * 100 || 0).toFixed(1) },
      { stage: 'Purchases', users: Math.round((data.cart_adds * data.conversion_rate) / 100) || 0, percentage: data.conversion_rate || 0 }
    ];
  }, [data]);

  // Conversion metrics cards
  const conversionMetrics = useMemo(() => {
    if (!data) return [];

    return [
      {
        title: 'Total Page Views',
        value: data.total_views || 0,
        icon: Eye,
        color: 'text-blue-600',
        bgColor: 'bg-blue-100'
      },
      {
        title: 'Unique Viewers',
        value: data.unique_viewers || 0,
        icon: MousePointer,
        color: 'text-green-600',
        bgColor: 'bg-green-100'
      },
      {
        title: 'Cart Additions',
        value: data.cart_adds || 0,
        icon: ShoppingCart,
        color: 'text-orange-600',
        bgColor: 'bg-orange-100'
      },
      {
        title: 'Conversion Rate',
        value: `${data.conversion_rate || 0}%`,
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-100'
      }
    ];
  }, [data]);

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Analytics</h3>
        <p className="text-red-600">{error?.message || 'Failed to load PDP analytics data'}</p>
      </div>
    );
  }

  // No data state
  if (!data) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Product Page Analytics</h1>
          <p className="text-gray-600 mt-1">
            Product detail page performance over the last {data.period_days} days
          </p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <select
              value={filters.period}
              onChange={(e) => setFilters(prev => ({ ...prev, period: parseInt(e.target.value) }))}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Conversion Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {conversionMetrics.map((metric, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {typeof metric.value === 'number' ? metric.value.toLocaleString() : metric.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${metric.bgColor} ${metric.color}`}>
                  <metric.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Conversion Funnel Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Conversion Funnel</CardTitle>
          <p className="text-sm text-gray-500 mt-1">User journey from page view to purchase</p>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={conversionFunnelData}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === 'users') return [value.toLocaleString(), 'Users'];
                    return [value, name];
                  }}
                  labelFormatter={(label) => `Stage: ${label}`}
                />
                <Legend />
                <Bar dataKey="users" fill="#3b82f6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Funnel Summary */}
          <div className="mt-4 grid grid-cols-4 gap-4 border-t pt-4">
            {conversionFunnelData.map((stage, index) => (
              <div key={index} className="text-center">
                <p className="text-xs text-gray-500">{stage.stage}</p>
                <p className="text-lg font-bold text-gray-900">{stage.users.toLocaleString()}</p>
                <p className="text-xs text-gray-400">{stage.percentage}%</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performing Listings */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Listings</CardTitle>
          <p className="text-sm text-gray-500 mt-1">
            Showing {data.top_listings?.length || 0} listings sorted by performance
          </p>
        </CardHeader>
        <CardContent>
          {data.top_listings && data.top_listings.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold">Listing</th>
                    <th className="text-right py-3 px-4 font-semibold">Views</th>
                    <th className="text-right py-3 px-4 font-semibold">Cart Adds</th>
                    <th className="text-right py-3 px-4 font-semibold">Conversion Rate</th>
                    <th className="text-right py-3 px-4 font-semibold">Avg. Time</th>
                  </tr>
                </thead>
                <tbody>
                  {data.top_listings.map((listing, index) => (
                    <tr
                      key={listing.listing_id || index}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold text-xs">
                            #{index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{listing.title}</p>
                            <p className="text-gray-500 text-xs">{listing.listing_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-medium">
                        {(listing.views || 0).toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          {listing.cart_adds || 0}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="font-semibold text-purple-600">
                          {listing.conversion_rate || 0}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        {listing.avg_time_on_page || 0}s
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No listing data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Data Generation Info */}
      <div className="text-sm text-gray-500 text-right">
        <p>Last updated: {new Date(data.generated_at).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default AdminAnalyticsPDP;