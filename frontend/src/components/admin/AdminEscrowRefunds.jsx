import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Alert, AlertDescription
} from '../ui';
import { 
  ArrowLeftRight, Clock, CheckCircle, XCircle, AlertTriangle, 
  Eye, User, Calendar, RefreshCw, Filter, CreditCard, DollarSign,
  FileText, MessageSquare, AlertCircle
} from 'lucide-react';

const AdminEscrowRefunds = () => {
  const [searchParams] = useSearchParams();
  const orderIdFilter = searchParams.get('order');
  
  const [refunds, setRefunds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [refreshing, setRefreshing] = useState(false);
  
  // Modal states
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);
  const [selectedRefund, setSelectedRefund] = useState(null);
  const [cancellationFee, setCancellationFee] = useState('0.00');
  const [declineReason, setDeclineReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchRefunds();
  }, [statusFilter, orderIdFilter]);

  const fetchRefunds = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (orderIdFilter) queryParams.append('order', orderIdFilter);
      queryParams.append('limit', '50');
      
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/admin/refunds?${queryParams}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch refunds');
      }

      const data = await response.json();
      setRefunds(data.refunds || []);
      
    } catch (err) {
      console.error('Error fetching refunds:', err);
      setError(err.message);
    } finally {
      setLoading(false);
      if (showRefresh) setRefreshing(false);
    }
  };

  const handleApproveRefund = async () => {
    if (!selectedRefund) return;

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/admin/refunds/${selectedRefund.id}/approve`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            cancellation_fee_cents: Math.round(parseFloat(cancellationFee || '0') * 100)
          })
        }
      );

      if (response.ok) {
        alert('Refund approved successfully! Buyer will receive their funds.');
        setShowApprovalModal(false);
        setSelectedRefund(null);
        setCancellationFee('0.00');
        fetchRefunds();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to approve refund');
      }
    } catch (error) {
      console.error('Error approving refund:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeclineRefund = async () => {
    if (!selectedRefund || !declineReason.trim()) {
      alert('Please provide a reason for declining the refund');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(
        `${import.meta.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_BACKEND_URL}/api/admin/refunds/${selectedRefund.id}/decline`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            reason: declineReason
          })
        }
      );

      if (response.ok) {
        alert('Refund declined successfully.');
        setShowDeclineModal(false);
        setSelectedRefund(null);
        setDeclineReason('');
        fetchRefunds();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to decline refund');
      }
    } catch (error) {
      console.error('Error declining refund:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      PENDING: { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      APPROVED: { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: CheckCircle },
      SETTLED: { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      DECLINED: { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      CANCELLED: { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant="outline" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  const getMethodBadge = (method) => {
    const methodConfig = {
      WALLET: { color: 'bg-emerald-100 text-emerald-800', label: 'Credit Wallet', icon: DollarSign },
      BANK_ORIGINAL: { color: 'bg-blue-100 text-blue-800', label: 'Bank Transfer', icon: CreditCard },
      CARD_ORIGINAL: { color: 'bg-purple-100 text-purple-800', label: 'Original Card', icon: CreditCard }
    };

    const config = methodConfig[method] || methodConfig.WALLET;
    const Icon = config.icon;

    return (
      <Badge variant="secondary" className={config.color}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const formatAmount = (cents) => {
    return `R${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString) => {
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
              <ArrowLeftRight className="h-8 w-8" />
              Refund Management
            </h1>
            <p className="text-emerald-600 mt-1">
              Review and process customer refund requests
              {orderIdFilter && <span className="font-medium"> (Order #{orderIdFilter.slice(0, 8)}...)</span>}
            </p>
          </div>
          <div className="flex gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Refunds</SelectItem>
                <SelectItem value="PENDING">Needs Review</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="SETTLED">Settled</SelectItem>
                <SelectItem value="DECLINED">Declined</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => fetchRefunds(true)}
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

        {/* Refunds Table */}
        <Card className="shadow-lg border-emerald-200">
          <CardHeader>
            <CardTitle className="text-emerald-900 flex items-center justify-between">
              <span>Refund Requests ({refunds.length})</span>
              {statusFilter !== 'all' && (
                <Badge variant="outline" className="capitalize">
                  {statusFilter.replace('_', ' ')} Only
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {refunds.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No refund requests</h3>
                <p className="text-gray-600">
                  {statusFilter === 'all' 
                    ? 'No refund requests have been submitted' 
                    : `No ${statusFilter.toLowerCase()} refund requests found`}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Refund ID</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {refunds.map((refund) => (
                    <TableRow key={refund.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="font-medium text-sm">#{refund.id?.slice(0, 8)}...</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">#{refund.order_id?.slice(0, 8)}...</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="font-medium">{refund.customer_name || 'Unknown'}</div>
                            <div className="text-sm text-gray-500">{refund.customer_email}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-emerald-700">
                          {formatAmount(refund.amount_cents)}
                        </div>
                        {refund.cancellation_fee_cents > 0 && (
                          <div className="text-sm text-red-600">
                            Fee: -{formatAmount(refund.cancellation_fee_cents)}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="capitalize text-xs">
                          {refund.reason_code.toLowerCase().replace('_', ' ')}
                        </Badge>
                        {refund.notes && (
                          <div className="flex items-center gap-1 mt-1">
                            <MessageSquare className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">Has notes</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {getMethodBadge(refund.prefer_method)}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(refund.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDate(refund.created_at)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          {refund.status === 'PENDING' && (
                            <>
                              {/* Approve Button */}
                              <Dialog open={showApprovalModal} onOpenChange={setShowApprovalModal}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700"
                                    onClick={() => setSelectedRefund(refund)}
                                  >
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Approve
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Approve Refund Request</DialogTitle>
                                    <DialogDescription>
                                      Review and approve refund for Order #{refund.order_id?.slice(0, 8)}...
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                                      <div>
                                        <span className="font-medium">Customer:</span> {refund.customer_name}
                                      </div>
                                      <div>
                                        <span className="font-medium">Amount:</span> {formatAmount(refund.amount_cents)}
                                      </div>
                                      <div>  
                                        <span className="font-medium">Reason:</span> {refund.reason_code.replace('_', ' ')}
                                      </div>
                                      <div>
                                        <span className="font-medium">Method:</span> {refund.prefer_method}
                                      </div>
                                    </div>
                                    {refund.notes && (
                                      <div className="mb-4">
                                        <span className="font-medium">Customer Notes:</span>
                                        <p className="text-gray-600 mt-1 p-2 bg-gray-50 rounded text-sm">{refund.notes}</p>
                                      </div>
                                    )}
                                    <div>
                                      <Label htmlFor="cancellation-fee">Cancellation Fee (Optional)</Label>
                                      <Input
                                        id="cancellation-fee"
                                        type="number"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={cancellationFee}
                                        onChange={(e) => setCancellationFee(e.target.value)}
                                      />
                                      <p className="text-sm text-gray-500 mt-1">
                                        Fee will be deducted from refund amount
                                      </p>
                                    </div>
                                    {refund.prefer_method === 'WALLET' && (
                                      <Alert className="border-green-200 bg-green-50">
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                        <AlertDescription className="text-green-800">
                                          Wallet refunds are processed instantly.
                                        </AlertDescription>
                                      </Alert>
                                    )}
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setShowApprovalModal(false);
                                        setSelectedRefund(null);
                                        setCancellationFee('0.00');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleApproveRefund}
                                      disabled={processing}
                                      className="bg-green-600 hover:bg-green-700"
                                    >
                                      {processing ? 'Processing...' : 'Approve Refund'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              {/* Decline Button */}
                              <Dialog open={showDeclineModal} onOpenChange={setShowDeclineModal}>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="border-red-300 text-red-700 hover:bg-red-50"
                                    onClick={() => setSelectedRefund(refund)}
                                  >
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Decline
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Decline Refund Request</DialogTitle>
                                    <DialogDescription>
                                      Decline refund for Order #{refund.order_id?.slice(0, 8)}...
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="decline-reason">Reason for Decline *</Label>
                                      <Textarea
                                        id="decline-reason"
                                        placeholder="Please provide a reason for declining this refund request..."
                                        value={declineReason}
                                        onChange={(e) => setDeclineReason(e.target.value)}
                                        rows={3}
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setShowDeclineModal(false);
                                        setSelectedRefund(null);
                                        setDeclineReason('');
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={handleDeclineRefund}
                                      disabled={processing || !declineReason.trim()}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      {processing ? 'Processing...' : 'Decline Refund'}
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </>
                          )}
                          
                          {/* View Order Button */}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => window.open(`/admin/escrow/orders?order=${refund.order_id}`, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Order
                          </Button>
                          
                          {refund.status !== 'PENDING' && (
                            <Badge variant="outline" className="text-xs">
                              {refund.status === 'SETTLED' ? 'Completed' : refund.status}
                            </Badge>
                          )}
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
        <Card className="mt-6 bg-orange-50 border-orange-200">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-orange-900 mb-2">Refund Processing Guidelines</h3>
                <ul className="text-orange-800 space-y-1 text-sm">
                  <li>• <strong>Wallet refunds</strong> are processed instantly</li>
                  <li>• <strong>Bank/Card refunds</strong> take 3-5 business days</li>
                  <li>• Apply cancellation fees according to policy</li>
                  <li>• Require evidence for disputed refunds</li>
                  <li>• Declined refunds revert escrow to seller</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminEscrowRefunds;