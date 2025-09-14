import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';
import { DollarSign, Search, Eye, Check, X, AlertTriangle, Clock, Filter, User, Calendar } from 'lucide-react';

const AdminPayoutsManagement = () => {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    method: '',
    search: ''
  });
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadPayouts();
  }, [filters]);

  const loadPayouts = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.method) params.append('method', filters.method);
      if (filters.search) params.append('q', filters.search);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/payouts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setPayouts(Array.isArray(data) ? data : data.payouts || []);
      } else {
        console.error('Failed to load payouts:', response.status);
        alert('Failed to load payouts. Please check your permissions.');
      }
    } catch (error) {
      console.error('Error loading payouts:', error);
      alert('Error loading payouts: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePayoutAction = async (payoutId, action) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/payouts/${payoutId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          admin_notes: `${action} by admin`,
          reason: action === 'reject' ? 'Admin review required' : undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success || result.message) {
          alert(`Payout ${action} successful!`);
          loadPayouts(); // Refresh list
        } else {
          alert(`Failed to ${action} payout: ` + (result.message || 'Unknown error'));
        }
      } else {
        const error = await response.json();
        alert(`Failed to ${action} payout: ` + (error.detail || 'Server error'));
      }
    } catch (error) {
      console.error(`Error ${action} payout:`, error);
      alert(`Error ${action} payout: ` + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed': return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Completed</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'failed': 
      case 'rejected': return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Failed</Badge>;
      case 'processing': return <Badge className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />Processing</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getTotalPayouts = () => {
    return payouts.reduce((sum, payout) => sum + (payout.amount_minor || 0), 0) / 100;
  };

  const getPendingPayouts = () => {
    return payouts.filter(p => p.status === 'pending').length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Seller Payouts</h2>
          <p className="text-gray-600">Manage seller payouts and earnings distribution</p>
        </div>
        <Button onClick={loadPayouts} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          <DollarSign className="h-4 w-4 mr-2" />
          {loading ? 'Loading...' : 'Refresh Payouts'}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payouts</p>
                <p className="text-2xl font-bold text-green-600">R{getTotalPayouts().toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Payouts</p>
                <p className="text-2xl font-bold text-yellow-600">{getPendingPayouts()}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold text-blue-600">{payouts.length}</p>
              </div>
              <User className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Payouts</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by seller or reference..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-default">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Method</label>
              <Select value={filters.method} onValueChange={(value) => setFilters(prev => ({ ...prev, method: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-default">All Methods</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="ewallet">E-Wallet</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="crypto">Cryptocurrency</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payouts List */}
      <Card>
        <CardHeader>
          <CardTitle>Payouts ({payouts.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p>Loading payouts...</p>
              </div>
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No payouts found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payouts.map(payout => (
                <div key={payout.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">Payout #{payout.id?.substring(0, 8)}</h3>
                          <p className="text-sm text-gray-600">To: {payout.seller_name || payout.seller_email || 'Unknown Seller'}</p>
                        </div>
                        {getStatusBadge(payout.status)}
                        <Badge variant="outline">{payout.method || 'Unknown Method'}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <p className="flex items-center font-semibold text-green-600">
                          <DollarSign className="h-3 w-3 mr-1" />
                          R{payout.amount_minor ? (payout.amount_minor / 100).toLocaleString() : 'N/A'}
                        </p>
                        <p>Reference: {payout.reference || 'N/A'}</p>
                        <p className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Requested: {payout.created_at ? new Date(payout.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                        <p>
                          Processed: {payout.processed_at ? new Date(payout.processed_at).toLocaleDateString() : 'Not processed'}
                        </p>
                        <p>Bank: {payout.bank_name || 'N/A'}</p>
                        <p>Account: {payout.account_number ? `****${payout.account_number.slice(-4)}` : 'N/A'}</p>
                      </div>
                      {payout.notes && (
                        <div className="mt-2 text-sm bg-yellow-50 p-2 rounded">
                          <strong>Notes:</strong> {payout.notes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedPayout(payout);
                          setShowDetail(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {payout.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handlePayoutAction(payout.id, 'approve')}
                            disabled={actionLoading}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handlePayoutAction(payout.id, 'reject')}
                            disabled={actionLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {payout.status === 'processing' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handlePayoutAction(payout.id, 'complete')}
                          disabled={actionLoading}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPayoutsManagement;