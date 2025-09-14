import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Search, Filter, Eye, CheckCircle, XCircle, MessageSquare, Clock } from 'lucide-react';
import adminApi from '../../api/adminClient';

const BuyRequestModeration = () => {
  const [buyRequests, setBuyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'pending',
    category: 'all',
    search: ''
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    loadBuyRequests();
  }, [filters]);

  const loadBuyRequests = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (filters.status !== 'all') params.moderation_status = filters.status;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.search) params.search = filters.search;
      
      const response = await adminApi.get('/admin/buy-requests', { params });
      setBuyRequests(response.data.buy_requests || []);
      
    } catch (error) {
      console.error('Error loading buy requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const moderateRequest = async (requestId, action, reason = '') => {
    try {
      setActionLoading(prev => ({ ...prev, [requestId]: action }));
      
      await adminApi.post(`/admin/buy-requests/${requestId}/moderate`, {
        action,
        reason
      });
      
      await loadBuyRequests();
      alert(`Buy request ${action}d successfully`);
      
    } catch (error) {
      console.error(`Error ${action}ing buy request:`, error);
      alert(`Failed to ${action} buy request`);
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[requestId];
        return newState;
      });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      flagged: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const getPriorityBadge = (priority) => {
    const styles = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[priority] || styles.low}`}>
        {priority}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Buy Request Moderation</h1>
          <p className="text-gray-600 mt-1">Review and moderate livestock buy requests</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search buy requests..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="flagged">Flagged</option>
            </select>
            
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="poultry">Poultry</option>
              <option value="ruminants">Ruminants</option>
              <option value="exotic">Exotic</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Buy Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Buy Requests ({buyRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Request</th>
                  <th className="text-left py-3">Buyer</th>
                  <th className="text-left py-3">Category</th>
                  <th className="text-left py-3">Budget</th>
                  <th className="text-left py-3">Priority</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Created</th>
                  <th className="text-right py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {buyRequests.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-gray-500 text-xs">
                          {request.quantity} {request.unit} • {request.location}
                        </p>
                      </div>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{request.buyer_name}</p>
                        <p className="text-gray-500 text-xs">{request.buyer_email}</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {request.category}
                      </span>
                    </td>
                    <td className="py-3 font-medium">
                      R{request.budget_min?.toLocaleString()} - R{request.budget_max?.toLocaleString()}
                    </td>
                    <td className="py-3">
                      {getPriorityBadge(request.priority || 'medium')}
                    </td>
                    <td className="py-3">
                      {getStatusBadge(request.moderation_status || 'pending')}
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(request.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {request.moderation_status === 'pending' && (
                          <>
                            <button
                              onClick={() => moderateRequest(request.id, 'approve')}
                              disabled={actionLoading[request.id]}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Approve Request"
                            >
                              {actionLoading[request.id] === 'approve' ? (
                                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason) moderateRequest(request.id, 'reject', reason);
                              }}
                              disabled={actionLoading[request.id]}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Reject Request"
                            >
                              {actionLoading[request.id] === 'reject' ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {buyRequests.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No buy requests found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Request Detail Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{selectedRequest.title}</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-600">Buyer:</label>
                <p className="font-medium">{selectedRequest.buyer_name}</p>
              </div>
              
              <div>
                <label className="text-gray-600">Category:</label>
                <p className="font-medium">{selectedRequest.category}</p>
              </div>
              
              <div>
                <label className="text-gray-600">Quantity:</label>
                <p className="font-medium">{selectedRequest.quantity} {selectedRequest.unit}</p>
              </div>
              
              <div>
                <label className="text-gray-600">Budget Range:</label>
                <p className="font-medium">
                  R{selectedRequest.budget_min?.toLocaleString()} - R{selectedRequest.budget_max?.toLocaleString()}
                </p>
              </div>
              
              <div>
                <label className="text-gray-600">Priority:</label>
                <p className="font-medium">{selectedRequest.priority || 'Medium'}</p>
              </div>
              
              <div>
                <label className="text-gray-600">Delivery Date:</label>
                <p className="font-medium">
                  {selectedRequest.delivery_date 
                    ? new Date(selectedRequest.delivery_date).toLocaleDateString()
                    : 'Flexible'
                  }
                </p>
              </div>
              
              <div className="col-span-2">
                <label className="text-gray-600">Description:</label>
                <p className="font-medium mt-1">{selectedRequest.description}</p>
              </div>
              
              <div className="col-span-2">
                <label className="text-gray-600">Location:</label>
                <p className="font-medium">{selectedRequest.location}</p>
              </div>

              {selectedRequest.special_requirements && (
                <div className="col-span-2">
                  <label className="text-gray-600">Special Requirements:</label>
                  <p className="font-medium mt-1">{selectedRequest.special_requirements}</p>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              {selectedRequest.moderation_status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      moderateRequest(selectedRequest.id, 'approve');
                      setSelectedRequest(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) {
                        moderateRequest(selectedRequest.id, 'reject', reason);
                        setSelectedRequest(null);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                  
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for flagging:');
                      if (reason) {
                        moderateRequest(selectedRequest.id, 'flag', reason);
                        setSelectedRequest(null);
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                  >
                    Flag for Review
                  </button>
                </>
              )}
              
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BuyRequestModeration;