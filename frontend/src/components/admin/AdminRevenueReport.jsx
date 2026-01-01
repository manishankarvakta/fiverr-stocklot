import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, Calendar, TrendingUp, DollarSign, FileText, Users } from 'lucide-react';
import { useGetRevenueSummaryQuery } from '@/store/api/admin.api';

const AdminRevenueReport = () => {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [reportType, setReportType] = useState('monthly');

  // Convert dates to ISO format for API
  const apiDateRange = useMemo(() => ({
    startDate: `${dateRange.start}T00:00:00Z`,
    endDate: `${dateRange.end}T23:59:59Z`
  }), [dateRange]);

  // Fetch data from API using RTK Query
  const { data, isLoading, isError, error } = useGetRevenueSummaryQuery(apiDateRange);

  // Debug logging
  console.log('🔍 Revenue Summary Query:', {
    dateRange: apiDateRange,
    data,
    isLoading,
    isError,
    error
  });

  const summary = data?.summary;

  // Export functionality
  const exportReport = async (format = 'csv') => {
    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/admin/reports/export`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            report_type: 'revenue',
            format,
            date_range: dateRange,
            filters: { type: reportType }
          })
        }
      );

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `revenue_report_${dateRange.start}_${dateRange.end}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

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
          <div className="h-80 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-red-800 font-semibold mb-2">Error Loading Revenue Report</h3>
        <p className="text-red-600 mb-4">{error?.message || error?.data?.detail || 'Failed to load revenue data'}</p>
        <div className="text-sm text-gray-600 mb-4">
          <p>Please check:</p>
          <ul className="list-disc ml-5 mt-2">
            <li>You are logged in as an admin</li>
            <li>The date range is valid</li>
            <li>The backend server is running</li>
          </ul>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
        <p className="text-yellow-800">No revenue data available for the selected period</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Revenue Reports</h1>
          <p className="text-gray-600 mt-1">
            Comprehensive revenue analysis from {dateRange.start} to {dateRange.end}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Report Type */}
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
          
          {/* Date Range */}
          <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-lg px-3 py-2">
            <Calendar className="h-4 w-4 text-gray-500" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="border-none outline-none text-sm w-32"
            />
            <span className="text-gray-500 text-sm">to</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="border-none outline-none text-sm w-32"
            />
          </div>
          
          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => exportReport('csv')}
              className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors text-sm"
            >
              <Download className="h-4 w-4" />
              CSV
            </button>
            <button
              onClick={() => exportReport('pdf')}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              <FileText className="h-4 w-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  R{(summary.total_gross_revenue || 0).toLocaleString()}
                </p>
                {summary.growth?.revenue_growth && (
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">
                      {summary.growth.revenue_growth.toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Platform Commission */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Platform Fees</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  R{(summary.total_platform_fees || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {summary.total_gross_revenue > 0 
                    ? ((summary.total_platform_fees / summary.total_gross_revenue) * 100).toFixed(1)
                    : 0}% of total
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transaction Volume */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {(summary.total_orders || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  R{(summary.growth?.average_order_value || 0).toLocaleString()} avg
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <FileText className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seller Payouts */}
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Seller Payouts</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  R{(summary.total_seller_payouts || 0).toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  R{(summary.pending_payouts || 0).toLocaleString()} pending
                </p>
              </div>
              <div className="p-3 rounded-full bg-orange-100 text-orange-600">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Trend</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Daily revenue and platform fees over time</p>
        </CardHeader>
        <CardContent>
          {summary.daily_revenue && summary.daily_revenue.length > 0 ? (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.daily_revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString('en-ZA', { month: 'short', day: 'numeric' })}
                  />
                  <YAxis tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString('en-ZA')}
                    formatter={(value, name) => [
                      `R${value.toLocaleString()}`, 
                      name === 'gross_revenue' ? 'Gross Revenue' : 'Platform Fees'
                    ]}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="gross_revenue" 
                    stroke="#10b981" 
                    strokeWidth={3}
                    name="Gross Revenue"
                    dot={{ fill: '#10b981', r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="platform_fees" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Platform Fees"
                    dot={{ fill: '#3b82f6', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-96 flex items-center justify-center text-gray-500">
              <p>No timeline data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue by Category</CardTitle>
          <p className="text-sm text-gray-500 mt-1">Performance breakdown across product categories</p>
        </CardHeader>
        <CardContent>
          {summary.category_revenue && summary.category_revenue.length > 0 ? (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.category_revenue}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis tickFormatter={(value) => `R${(value / 1000).toFixed(0)}k`} />
                  <Tooltip 
                    formatter={(value, name) => {
                      if (name === 'revenue') return [`R${value.toLocaleString()}`, 'Revenue'];
                      if (name === 'fees') return [`R${value.toLocaleString()}`, 'Platform Fees'];
                      if (name === 'orders') return [value, 'Orders'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="revenue" fill="#f59e0b" radius={[8, 8, 0, 0]} name="Revenue" />
                  <Bar dataKey="fees" fill="#3b82f6" radius={[8, 8, 0, 0]} name="Platform Fees" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-80 flex items-center justify-center text-gray-500">
              <p>No category data available</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Top Sellers Table */}
      {summary.top_sellers && summary.top_sellers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Performing Sellers</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Sellers with highest revenue contribution</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-4 font-semibold">Rank</th>
                    <th className="text-left py-3 px-4 font-semibold">Seller</th>
                    <th className="text-right py-3 px-4 font-semibold">Revenue</th>
                    <th className="text-right py-3 px-4 font-semibold">Platform Fees</th>
                    <th className="text-right py-3 px-4 font-semibold">Orders</th>
                    <th className="text-right py-3 px-4 font-semibold">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {summary.top_sellers.map((seller, index) => (
                    <tr key={seller.seller_id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-semibold">
                          #{index + 1}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium text-gray-900">{seller.seller_name}</p>
                          <p className="text-xs text-gray-500">{seller.seller_id}</p>
                        </div>
                      </td>
                      <td className="text-right py-3 px-4 font-semibold text-green-600">
                        R{seller.gross_revenue.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        R{seller.platform_fees.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {seller.orders}
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-gray-600">
                        {seller.percentage_of_total.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generation Info */}
      <div className="text-sm text-gray-500 text-right">
        <p>Report generated at: {new Date(summary.generated_at).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default AdminRevenueReport;