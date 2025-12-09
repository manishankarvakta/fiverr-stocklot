import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Package, Search, Eye, Truck, Clock, CheckCircle, XCircle, 
  AlertTriangle, RefreshCw, ArrowLeft, DollarSign, AlertCircle
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { useGetOrdersQuery } from '../../store/api/orders.api';

const MyOrders = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Refund request state
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [refundReason, setRefundReason] = useState('');
  const [refundMethod, setRefundMethod] = useState('WALLET');
  const [refundNotes, setRefundNotes] = useState('');
  const [submittingRefund, setSubmittingRefund] = useState(false);

  // Use RTK Query to fetch orders
  const { data: ordersData, isLoading: loading, error, refetch } = useGetOrdersQuery({});
  
  // Extract orders from API response - handle both array and object responses
  const orders = Array.isArray(ordersData) ? ordersData : (ordersData?.orders || ordersData?.buyer_orders || []);

  const handleRefundRequest = async () => {
    if (!selectedOrder || !refundReason) {
      alert('Please select a reason for the refund');
      return;
    }

    try {
      setSubmittingRefund(true);
      const token = localStorage.getItem('token');
      
      const refundData = {
        order_id: selectedOrder.id,
        reason_code: refundReason,
        prefer_method: refundMethod,
        notes: refundNotes,
        amount_cents: selectedOrder.total_amount || 0
      };

      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/refunds`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `refund-${selectedOrder.id}-${Date.now()}`
          },
          body: JSON.stringify(refundData)
        }
      );

      if (response.ok) {
        const refund = await response.json();
        alert('Refund request submitted successfully! You will be notified once it is processed.');
        setShowRefundModal(false);
        setSelectedOrder(null);
        setRefundReason('');
        setRefundNotes('');
        // Refresh orders to show updated status
        fetchOrders();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to submit refund request');
      }
    } catch (error) {
      console.error('Error submitting refund:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setSubmittingRefund(false);
    }
  };

  const canRequestRefund = (order) => {
    // Allow refund for orders that are placed, confirmed, or delivered
    const refundableStatuses = ['placed', 'confirmed', 'shipped', 'delivered'];
    return refundableStatuses.includes(order.status?.toLowerCase()) && !order.refund_requested;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <CheckCircle className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <Package className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          order.seller_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status?.toLowerCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        <h3>Error loading orders</h3>
        <p className="text-sm">{error?.data?.detail || error?.message || 'Something went wrong.'}</p>
        <Button onClick={() => refetch()} className="mt-4 bg-emerald-600 hover:bg-emerald-700">Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-emerald-900">My Orders</h1>
          <p className="text-emerald-700">Track and manage your livestock orders</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by order ID or seller..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Orders Found</h3>
            <p className="text-gray-600">
              {orders.length === 0 
                ? "You haven't placed any orders yet." 
                : "No orders match your current filters."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">Order #{order.id?.slice(0, 8)}...</CardTitle>
                    <p className="text-sm text-gray-600">
                      Placed on {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} border`}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(order.status)}
                      {order.status || 'Pending'}
                    </div>
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Seller</p>
                    <p className="font-medium">{order.seller_name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-medium">R{((order.total_amount || 0) / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Items</p>
                    <p className="font-medium">{order.items?.length || 0} item(s)</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => window.location.href = `/orders/${order.id}`}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>
                    
                    {order.status === 'shipped' && (
                      <Button
                        onClick={() => window.location.href = `/orders/${order.id}/tracking`}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Truck className="h-4 w-4 mr-2" />
                        Track Order
                      </Button>
                    )}
                  </div>
                  
                  {/* Refund Request Button */}
                  {canRequestRefund(order) && (
                    <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-red-300 text-red-700 hover:bg-red-50"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <DollarSign className="h-4 w-4 mr-2" />
                          Request Refund
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle>Request Refund</DialogTitle>
                          <DialogDescription>
                            Request a refund for Order #{order.id?.slice(0, 8)}...
                            <br />
                            <span className="font-medium">Amount: R{((order.total_amount || 0) / 100).toFixed(2)}</span>
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="reason">Reason for Refund *</Label>
                            <Select value={refundReason} onValueChange={setRefundReason}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a reason" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CHANGE_OF_MIND">Change of Mind</SelectItem>
                                <SelectItem value="NOT_AS_DESCRIBED">Not as Described</SelectItem>
                                <SelectItem value="HEALTH_ISSUE">Health Issue</SelectItem>
                                <SelectItem value="DELIVERY_FAILED">Delivery Failed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="method">Refund Method</Label>
                            <Select value={refundMethod} onValueChange={setRefundMethod}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="WALLET">Credit Wallet (Instant)</SelectItem>
                                <SelectItem value="BANK_ORIGINAL">Original Payment Method (3-5 days)</SelectItem>
                                <SelectItem value="CARD_ORIGINAL">Original Card (3-5 days)</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div>
                            <Label htmlFor="notes">Additional Notes (Optional)</Label>
                            <Textarea
                              id="notes"
                              placeholder="Please provide any additional details..."
                              value={refundNotes}
                              onChange={(e) => setRefundNotes(e.target.value)}
                              rows={3}
                            />
                          </div>
                          
                          {refundMethod === 'WALLET' && (
                            <Alert>
                              <AlertCircle className="h-4 w-4" />
                              <AlertDescription>
                                Wallet credits are available instantly and valid for 36 months.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => {
                              setShowRefundModal(false);
                              setSelectedOrder(null);
                              setRefundReason('');
                              setRefundNotes('');
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleRefundRequest}
                            disabled={submittingRefund || !refundReason}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            {submittingRefund ? 'Submitting...' : 'Submit Refund Request'}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyOrders;