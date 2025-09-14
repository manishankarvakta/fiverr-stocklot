// 💸 SELLER PAYOUT DASHBOARD COMPONENT
// Dashboard for sellers to track their payouts and earnings

import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, Clock, CheckCircle, AlertCircle,
  Calendar, Download, Filter, Eye, RefreshCw 
} from 'lucide-react';

const SellerPayoutDashboard = ({ currentUser, sellerId }) => {
  const [payouts, setPayouts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [dateRange, setDateRange] = useState('30');

  useEffect(() => {
    if (sellerId || currentUser?.id) {
      fetchPayouts();
    }
  }, [sellerId, currentUser, filterStatus]);

  const fetchPayouts = async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = sellerId || currentUser?.id;
      const params = new URLSearchParams({
        limit: '50',
        ...(filterStatus && { status: filterStatus })
      });

      const response = await fetch(`/api/payouts/seller/${userId}?${params}`, {
        headers: {
          'Authorization': `Bearer ${currentUser?.token || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch payouts');
      }

      const data = await response.json();
      
      if (data.success) {
        setPayouts(data.payouts || []);
        setSummary(data.summary || {});
      } else {
        throw new Error(data.message || 'Failed to load payouts');
      }

    } catch (err) {
      console.error('Fetch payouts error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReleasePayout = async (sellerOrderId) => {
    if (!confirm('Are you sure you want to request payout release for this order?')) {
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`/api/payouts/${sellerOrderId}/release`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentUser?.token || localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to release payout');
      }

      const data = await response.json();
      
      if (data.success) {
        await fetchPayouts();
        alert('Payout released successfully!');
      } else {
        throw new Error(data.message || 'Failed to release payout');
      }

    } catch (err) {
      console.error('Release payout error:', err);
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amountMinor) => {
    if (typeof amountMinor !== 'number') return 'R0.00';
    return `R${(amountMinor / 100).toFixed(2)}`;
  };

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'SENT':
        return 'bg-green-100 text-green-800';
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle className="w-4 h-4" />;
      case 'PENDING':
        return <Clock className="w-4 h-4" />;
      case 'FAILED':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  // Check if user has access
  if (!currentUser || (sellerId && currentUser.id !== sellerId && !currentUser.roles?.includes('admin'))) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5" />
          <span>Access denied. You can only view your own payout information.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-green-600" />
          <h1 className="text-2xl font-bold text-gray-900">Payout Dashboard</h1>
        </div>
        <button
          onClick={fetchPayouts}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Payouts</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.total_payouts || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Amount</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {formatCurrency(summary.pending_amount_minor || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Paid Amount</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(summary.sent_amount_minor || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.total_payouts > 0 
                    ? Math.round((payouts.filter(p => p.status === 'SENT').length / summary.total_payouts) * 100)
                    : 0
                  }%
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filters:</span>
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all-default">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="SENT">Sent</option>
            <option value="FAILED">Failed</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="365">Last year</option>
          </select>
        </div>
      </div>

      {/* Payouts List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Payouts</h2>
        </div>

        {loading && payouts.length === 0 ? (
          <div className="p-6">
            <div className="animate-pulse space-y-4">
              {[1, 2, 3, 4, 5].map(n => (
                <div key={n} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ) : payouts.length === 0 ? (
          <div className="p-8 text-center">
            <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payouts found</h3>
            <p className="text-gray-500">Complete some orders to see your payouts here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {payouts.map((payout) => (
              <div key={payout.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${getStatusColor(payout.status)}`}>
                      {getStatusIcon(payout.status)}
                    </div>
                    
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatCurrency(payout.amount_minor)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Order: {payout.seller_order_id.replace(`_${currentUser.id}`, '')}
                      </div>
                      <div className="text-xs text-gray-400">
                        {formatDate(payout.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(payout.status)}`}>
                      {payout.status}
                    </span>
                    
                    {payout.transfer_ref && (
                      <div className="text-xs text-gray-500">
                        Ref: {payout.transfer_ref}
                      </div>
                    )}

                    {payout.status === 'PENDING' && (
                      <button
                        onClick={() => handleReleasePayout(payout.seller_order_id)}
                        disabled={loading}
                        className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        Release
                      </button>
                    )}

                    <button className="p-1 text-gray-400 hover:text-gray-600">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {payout.attempts > 1 && (
                  <div className="mt-2 text-xs text-yellow-600">
                    Retry attempts: {payout.attempts}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Export Options */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Export Data</h3>
            <p className="text-sm text-gray-500">Download your payout history for accounting</p>
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">
              <Download className="w-4 h-4" />
              PDF
            </button>
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-800">
            <h4 className="font-medium mb-1">Payout Information</h4>
            <ul className="space-y-1 text-xs">
              <li>• Payouts are automatically calculated based on your order fees</li>
              <li>• Pending payouts can be released after order completion</li>
              <li>• Failed payouts are automatically retried up to 3 times</li>
              <li>• All payouts are processed securely through our payment partners</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerPayoutDashboard;