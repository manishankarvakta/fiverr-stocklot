// Fixed SellerAnalytics Component
// All corrections applied. Mock data removed. Single API call. Clean state update.

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
  const [timeRange, setTimeRange] = useState('30days');

  const hasSellerRole = user && (user.roles?.includes('seller') || user.roles?.includes('both'));

  const { data: analyticsData, isLoading, error, refetch } = useGetMySellerAnalyticsQuery(
    { period: timeRange },
    {
      skip: !hasSellerRole,
      refetchOnMountOrArgChange: true,
      refetchOnFocus: true
    }
  );

  const [analytics, setAnalytics] = useState({
    overview: {},
    performance: {},
    top_listings: [],
    monthly_revenue: [],
    category_breakdown: []
  });

  useEffect(() => {
    if (analyticsData) {
      setAnalytics({
        overview: {
          total_revenue: analyticsData.overview?.total_revenue ?? 0,
          total_listings: analyticsData.overview?.total_listings ?? 0,
          total_views: analyticsData.overview?.total_views ?? 0,
          conversion_rate: analyticsData.overview?.conversion_rate ?? 0,
          active_listings: analyticsData.overview?.active_listings ?? 0,
          sold_listings: analyticsData.overview?.sold_listings ?? 0,
        },
        performance: {
          revenue_growth: analyticsData.performance?.revenue_growth ?? 0,
          listing_growth: analyticsData.performance?.listing_growth ?? 0,
          view_growth: analyticsData.performance?.view_growth ?? 0,
        },
        top_listings: analyticsData.top_listings ?? [],
        monthly_revenue: analyticsData.monthly_revenue ?? [],
        category_breakdown: analyticsData.category_breakdown ?? []
      });
    }
  }, [analyticsData]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format((amount || 0) / 100);
  };

  const getGrowthColor = (growth) =>
    growth > 0 ? 'text-green-600' : growth < 0 ? 'text-red-600' : 'text-gray-600';

  const getGrowthIcon = (growth) => {
    if (growth > 0) return <ArrowUp className="h-4 w-4 text-green-600" />;
    if (growth < 0) return <ArrowDown className="h-4 w-4 text-red-600" />;
    return null;
  };

  if (!hasSellerRole) {
    return (
      <div className="text-center p-8 text-yellow-700">
        <h2 className="font-bold">Seller Access Required</h2>
        <p>You must be a seller to view analytics.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
        <p className="mt-4">Loading analytics...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        <h3>Error loading analytics</h3>
        <p className="text-sm">{error?.data?.detail || error?.message || 'Something went wrong.'}</p>
        <Button onClick={() => refetch()} className="mt-4 bg-emerald-600 hover:bg-emerald-700">Retry</Button>
      </div>
    );
  }

  const ov = analytics.overview;
  const perf = analytics.performance;

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
          className="border px-3 py-2 rounded-lg"
        >
          <option value="7days">Last 7 Days</option>
          <option value="30days">Last 30 Days</option>
          <option value="3months">Last 3 Months</option>
          <option value="6months">Last 6 Months</option>
          <option value="1year">Last Year</option>
        </select>
      </div>

      {/* Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card><CardContent className="pt-6 flex justify-between"><div><p>Total Revenue</p><p className="text-2xl font-bold">{formatCurrency(ov.total_revenue)}</p><div className="flex gap-1 mt-1">{getGrowthIcon(perf.revenue_growth)}<span className={getGrowthColor(perf.revenue_growth)}>{Math.abs(perf.revenue_growth)}%</span></div></div><DollarSign className="h-8 w-8 text-emerald-600" /></CardContent></Card>

        <Card><CardContent className="pt-6 flex justify-between"><div><p>Total Listings</p><p className="text-2xl font-bold">{ov.total_listings}</p><div className="flex gap-2 mt-1"><Badge variant="outline">{ov.active_listings} Active</Badge><Badge variant="outline">{ov.sold_listings} Sold</Badge></div></div><Package className="h-8 w-8 text-emerald-600" /></CardContent></Card>

        <Card><CardContent className="pt-6 flex justify-between"><div><p>Total Views</p><p className="text-2xl font-bold">{(ov.total_views || 0).toLocaleString()}</p><div className="flex gap-1 mt-1">{getGrowthIcon(perf.view_growth)}<span className={getGrowthColor(perf.view_growth)}>{Math.abs(perf.view_growth)}%</span></div></div><Eye className="h-8 w-8 text-emerald-600" /></CardContent></Card>
      </div>

      {/* Monthly Revenue */}
      <Card>
        <CardHeader><CardTitle>Monthly Revenue</CardTitle></CardHeader>
        <CardContent>
          {analytics.monthly_revenue.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No revenue data</p>
          ) : (
            analytics.monthly_revenue.map((m, i) => {
              const max = Math.max(...analytics.monthly_revenue.map(r => r.revenue || 0), 1);
              return (
                <div key={i} className="flex justify-between items-center mb-3">
                  <span>{m.month}</span>
                  <div className="flex items-center gap-4">
                    <div className="w-48 h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-emerald-600 rounded-full" style={{ width: `${(m.revenue / max) * 100}%` }}></div>
                    </div>
                    <span className="w-20 text-right font-semibold">{formatCurrency(m.revenue)}</span>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Listings */}
        <Card>
          <CardHeader><CardTitle>Top Listings</CardTitle></CardHeader>
          <CardContent>
            {analytics.top_listings.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No listing data</p>
            ) : (
              analytics.top_listings.map((listing, i) => (
                <div key={i} className="flex justify-between border p-3 rounded-lg mb-3">
                  <div>
                    <h4 className="font-medium">{listing.title}</h4>
                    <p className="text-sm text-gray-600">{listing.views} views</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(listing.revenue)}</p>
                    <Badge variant="outline">#{i + 1}</Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Category Breakdown */}
        <Card>
          <CardHeader><CardTitle>Category Revenue</CardTitle></CardHeader>
          <CardContent>
            {analytics.category_breakdown.length === 0 ? (
              <p className="text-center py-8 text-gray-500">No category data</p>
            ) : (
              analytics.category_breakdown.map((cat, i) => (
                <div key={i} className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span>{cat.category}</span>
                    <span className="font-semibold">{formatCurrency(cat.revenue)} ({cat.percentage}%)</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full">
                    <div className="h-2 bg-emerald-600 rounded-full" style={{ width: `${cat.percentage}%` }}></div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SellerAnalytics;
