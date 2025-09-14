import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Star, Package, TrendingUp, DollarSign, Users, ArrowLeft } from 'lucide-react';
import adminApi from '../../api/adminClient';

const AdminSellerPerformance = () => {
  const { id } = useParams();
  const [sellerData, setSellerData] = useState({});
  const [performanceData, setPerformanceData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadSellerPerformance();
    }
  }, [id]);

  const loadSellerPerformance = async () => {
    try {
      setLoading(true);
      
      const response = await adminApi.get(`/admin/analytics/seller/${id}`);
      const data = response.data;
      
      setSellerData(data.seller || {});
      setPerformanceData(data.performance_timeline || []);
      
    } catch (error) {
      console.error('Error loading seller performance:', error);
    } finally {
      setLoading(false);
    }
  };

  const performanceMetrics = [
    {
      title: 'Total Revenue',
      value: `R${(sellerData.total_revenue || 0).toLocaleString()}`,
      change: sellerData.revenue_change || 0,
      icon: DollarSign,
      color: 'text-green-600'
    },
    {
      title: 'Active Listings',
      value: (sellerData.active_listings || 0).toLocaleString(),
      change: sellerData.listings_change || 0,
      icon: Package,
      color: 'text-blue-600'
    },
    {
      title: 'Customer Rating',
      value: `${(sellerData.average_rating || 0).toFixed(1)} ⭐`,
      change: sellerData.rating_change || 0,
      icon: Star,
      color: 'text-yellow-600'
    },
    {
      title: 'Repeat Customers',
      value: (sellerData.repeat_customers || 0).toLocaleString(),
      change: sellerData.customer_retention || 0,
      icon: Users,
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
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.history.back()}
          className="p-2 hover:bg-gray-100 rounded-lg"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {sellerData.business_name || sellerData.full_name}
          </h1>
          <p className="text-gray-600 mt-1">
            Seller performance analytics • Joined {new Date(sellerData.created_at).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {performanceMetrics.map((metric, index) => (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
                  <div className="flex items-center mt-2">
                    {metric.change >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-red-500 mr-1 rotate-180" />
                    )}
                    <span className={`text-sm ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(metric.change)}%
                    </span>
                  </div>
                </div>
                <div className={`p-3 rounded-full bg-gray-100 ${metric.color}`}>
                  <metric.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Performance Timeline */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(date) => new Date(date).toLocaleDateString()}
                />
                <YAxis tickFormatter={(value) => `R${value.toLocaleString()}`} />
                <Tooltip 
                  labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  formatter={(value) => [`R${value.toLocaleString()}`, 'Revenue']}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#10b981" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity & Listings Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value) => [value, 'Orders']}
                  />
                  <Bar dataKey="orders" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Performing Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(sellerData.top_listings || []).map((listing, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{listing.title}</p>
                    <p className="text-xs text-gray-500">{listing.category}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-sm">R{listing.revenue.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">{listing.orders} orders</p>
                  </div>
                </div>
              ))}
              
              {(!sellerData.top_listings || sellerData.top_listings.length === 0) && (
                <div className="text-center py-8 text-gray-500">
                  No listing data available
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seller Details */}
      <Card>
        <CardHeader>
          <CardTitle>Seller Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-3">Contact Information</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-600">Email:</span> {sellerData.email}</p>
                <p><span className="text-gray-600">Phone:</span> {sellerData.phone || 'Not provided'}</p>
                <p><span className="text-gray-600">Location:</span> {sellerData.province}, {sellerData.country}</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium mb-3">Business Details</h4>
              <div className="space-y-2 text-sm">
                <p><span className="text-gray-600">Business Type:</span> {sellerData.business_type || 'Individual'}</p>
                <p><span className="text-gray-600">KYC Level:</span> {sellerData.kyc_level || 'Basic'}</p>
                <p><span className="text-gray-600">Verification:</span> 
                  <span className={`ml-1 px-2 py-1 rounded text-xs ${
                    sellerData.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {sellerData.is_verified ? 'Verified' : 'Pending'}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminSellerPerformance;