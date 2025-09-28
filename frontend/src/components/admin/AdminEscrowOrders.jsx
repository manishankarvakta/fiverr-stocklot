import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Alert, AlertDescription
} from '../ui';
import {
  Package, Clock, CheckCircle, XCircle, AlertTriangle, 
  Eye, User, Calendar, RefreshCw, Filter, CreditCard, ArrowUpRight,
  DollarSign, Shield, Truck, MapPin, Phone, Mail, FileText
} from 'lucide-react';

const AdminEscrowOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [escrowFilter, setEscrowFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  
  // Approval modal state
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [approving, setApproving] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, escrowFilter]);

  const fetchOrders = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (escrowFilter !== 'all') queryParams.append('escrow_status', escrowFilter);
      queryParams.append('limit', '50');
      
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/admin/escrow/orders?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }

      const data = await response.json();
      setOrders(data.orders || []);
      
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  const handleApproveRelease = async () => {
    if (!selectedOrder) return;

    try {
      setApproving(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/admin/escrow/orders/${selectedOrder.id}/approve-release`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'Idempotency-Key': `approve-${selectedOrder.id}-${Date.now()}`
          }
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(`Order approved successfully! Seller payout has been enqueued.`);
        setShowApprovalModal(false);
        setSelectedOrder(null);
        fetchOrders(); // Refresh orders
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to approve order');
      }
    } catch (error) {
      console.error('Error approving order:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setApproving(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      placed: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
      delivered: { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Truck },
      approved: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      disputed: { color: 'bg-red-100 text-red-800 border-red-200', icon: AlertTriangle },
      cancelled: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.placed;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getEscrowStatusBadge = (status) => {
    const statusConfig = {
      HELD: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Shield },
      RELEASED: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      REFUND_REQUESTED: { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertTriangle },
      REFUNDED: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: ArrowUpRight },
      NONE: { color: 'bg-gray-100 text-gray-600 border-gray-200', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.NONE;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status === 'NONE' ? 'No Escrow' : status}
      </Badge>
    );
  };

  const formatAmount = (cents) => {
    return `R${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-ZA', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded mb-6 w-96"></div>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="h-6 bg-gray-200 rounded mb-4"></div>
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-16 bg-gray-100 rounded"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 flex items-center gap-3">
              <Package className="h-8 w-8" />
              Orders & Escrow Management
            </h1>
            <p className="text-emerald-600 mt-1">Comprehensive order lifecycle and escrow management</p>
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="placed">Placed</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="disputed">Disputed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={escrowFilter} onValueChange={setEscrowFilter}>
              <SelectTrigger className="w-48">
                <Shield className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Escrow</SelectItem>
                <SelectItem value="HELD">Held</SelectItem>
                <SelectItem value="RELEASED">Released</SelectItem>
                <SelectItem value="REFUND_REQUESTED">Refund Requested</SelectItem>
                <SelectItem value="REFUNDED">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => fetchOrders(true)}
              disabled={refreshing}
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Orders Table */}
        <Card className="shadow-lg border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900 flex items-center justify-between">
              <span>Comprehensive Orders ({orders.length})</span>
              <div className="flex gap-2">
                {statusFilter !== 'all' && (
                  <Badge variant="outline" className="capitalize">
                    Status: {statusFilter}
                  </Badge>
                )}
                {escrowFilter !== 'all' && (
                  <Badge variant="outline" className="capitalize">
                    Escrow: {escrowFilter}
                  </Badge>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8">
                <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
                <p className="text-gray-600">
                  {statusFilter === 'all' && escrowFilter === 'all' 
                    ? 'No orders have been placed yet' 
                    : 'No orders match the current filters'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Seller</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Order Status</TableHead>
                    <TableHead>Escrow Status</TableHead>
                    <TableHead>Refunds</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium">#{order.id?.slice(0, 8)}...</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{order.buyer_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="font-medium">{order.seller_name || 'Unknown'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-emerald-700">
                          {formatAmount(order.total_amount)}
                        </div>
                        {order.escrow_amount && order.escrow_amount !== order.total_amount && (
                          <div className="text-sm text-gray-500">
                            Escrow: {formatAmount(order.escrow_amount)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(order.status)}
                      </TableCell>
                      <TableCell>
                        {getEscrowStatusBadge(order.escrow_status)}
                      </TableCell>
                      <TableCell>
                        {order.pending_refunds > 0 ? (
                          <Badge variant="outline" className="bg-orange-100 text-orange-800">
                            {order.pending_refunds} Pending
                          </Badge>
                        ) : (
                          <span className="text-gray-400">None</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(order.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {/* Approve Release Button */}
                          {order.can_approve && (
                            <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
                              <DialogTrigger asChild>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={() => setSelectedOrder(order)}
                                >
                                  <CheckCircle className="h-4 w-4 mr-1" />
                                  Approve Release
                                </Button>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Approve Order Release</DialogTitle>
                                  <DialogDescription>
                                    Approve and release escrow for Order #{order.id?.slice(0, 8)}...
                                    <br />
                                    This will enqueue seller payout and mark the order as approved.
                                  </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4">
                                  <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                      <span className="font-medium">Buyer:</span> {order.buyer_name}
                                    </div>
                                    <div>
                                      <span className="font-medium">Seller:</span> {order.seller_name}
                                    </div>
                                    <div>
                                      <span className="font-medium">Amount:</span> {formatAmount(order.total_amount)}
                                    </div>
                                    <div>
                                      <span className="font-medium">Escrow:</span> {order.escrow_status}
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter>
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setShowApprovalModal(false);
                                      setSelectedOrder(null);
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={handleApproveRelease}
                                    disabled={approving}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    {approving ? 'Approving...' : 'Approve & Release Escrow'}
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          )}
                          
                          {/* View Order Button */}
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          
                          {/* Open Refund Button */}
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="border-red-300 text-red-700 hover:bg-red-50"
                            onClick={() => window.open(`/admin/escrow/refunds?order=${order.id}`, '_blank')}
                          >
                            <ArrowUpRight className="h-4 w-4 mr-1" />
                            Refund
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">Order Lifecycle & Escrow Management</h3>
                <ul className="text-blue-800 space-y-1 text-sm">
                  <li>• <strong>PLACED</strong> → Payment received, escrow HELD</li>
                  <li>• <strong>DELIVERED</strong> → Proof of delivery captured, pending approval</li>
                  <li>• <strong>APPROVED</strong> → Escrow released, seller payout enqueued</li>
                  <li>• <strong>DISPUTED</strong> → Hold escrow, requires manual resolution</li>
                  <li>• <strong>Refunds</strong> → Buyer-initiated, admin approval required</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminEscrowOrders;