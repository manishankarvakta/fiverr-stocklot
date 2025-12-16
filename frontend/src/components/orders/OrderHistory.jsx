import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Calendar, Package, DollarSign, Filter, Download, 
  Star, MessageSquare, RotateCcw
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { useGetOrderHistoryQuery, useGetOrdersQuery } from '../../store/api/orders.api';

const OrderHistory = () => {
  const { user } = useAuth();
  const [dateFilter, setDateFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('completed');

  // Use RTK Query - if history endpoint doesn't exist, use orders endpoint with filters
  const { data: historyData, isLoading: historyLoading, error: historyError } = useGetOrderHistoryQuery({
    period: dateFilter !== 'all' ? dateFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  }, { skip: false });

  // Fallback to orders endpoint if history endpoint doesn't exist
  const { data: ordersData, isLoading: ordersLoading, error: ordersError } = useGetOrdersQuery({}, {
    skip: !historyError || historyError?.status !== 404
  });

  const loading = historyLoading || ordersLoading;
  const error = historyError && historyError?.status !== 404 ? historyError : ordersError;
  
  // Extract orders - prefer history data, fallback to orders data filtered client-side
  const allOrders = historyData?.orders || (Array.isArray(ordersData) ? ordersData : ordersData?.orders || []);
  
  // Client-side filtering if using orders endpoint
  const orders = useMemo(() => {
    if (historyData?.orders) return historyData.orders;
    
    let filtered = allOrders;
    
    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => 
        order.status?.toLowerCase() === statusFilter.toLowerCase() ||
        order.delivery_status?.toLowerCase() === statusFilter.toLowerCase()
      );
    }
    
    // Filter by date period
    if (dateFilter !== 'all') {
      const now = new Date();
      const periodDays = {
        '30days': 30,
        '3months': 90,
        '6months': 180,
        '1year': 365
      };
      
      const days = periodDays[dateFilter];
      if (days) {
        const cutoffDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
        filtered = filtered.filter(order => {
          const orderDate = new Date(order.created_at || order.completed_at);
          return orderDate >= cutoffDate;
        });
      }
    }
    
    return filtered;
  }, [allOrders, statusFilter, dateFilter, historyData]);

  const downloadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/orders/history/export`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        }
      );

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `order-history-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error downloading history:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded': return 'bg-orange-100 text-orange-800 border-orange-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading order history...</p>
      </div>
    );
  }

  if (error && error?.status !== 404) {
    return (
      <div className="text-center p-8 text-red-600">
        <h3>Error loading order history</h3>
        <p className="text-sm">{error?.data?.detail || error?.message || 'Something went wrong.'}</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">Order History</h1>
          <p className="text-emerald-700">Complete history of your transactions</p>
        </div>
        <Button 
          onClick={downloadHistory}
          variant="outline"
          className="flex items-center gap-2"
        >
          <Download className="h-4 w-4" />
          Export History
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="all">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="1year">Last Year</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="refunded">Refunded</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order History List */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Order History</h3>
            <p className="text-gray-600">No orders found matching your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Order #{order.id?.slice(0, 8)}...</h3>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      {new Date(order.completed_at || order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge className={`${getStatusColor(order.status)} border mb-2`}>
                      {order.status || 'Unknown'}
                    </Badge>
                    <p className="text-lg font-bold">R{((order.total_amount || 0) / 100).toFixed(2)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Seller</p>
                    <p className="font-medium">{order.seller_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Items</p>
                    <p className="font-medium">{order.items?.length || 0} item(s)</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-medium">{order.payment_method || 'Card'}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/orders/${order.id}`}
                    >
                      View Details
                    </Button>
                    
                    {order.status === 'completed' && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <Star className="h-3 w-3" />
                          Review
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-1"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Reorder
                        </Button>
                      </>
                    )}
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <MessageSquare className="h-3 w-3" />
                    Contact Seller
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;