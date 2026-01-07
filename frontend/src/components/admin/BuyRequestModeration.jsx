import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Search, Filter, Eye, CheckCircle, XCircle, MessageSquare, Clock } from 'lucide-react';
import { useGetAdminBuyRequestsQuery, useModerateBuyRequestMutation } from '@/store/api/admin.api';

const BuyRequestModeration = () => {
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: ''
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

  // RTK Query hooks
  const { data: buyRequestsData, isLoading, refetch } = useGetAdminBuyRequestsQuery();
  const [moderateBuyRequest] = useModerateBuyRequestMutation();

  console.log("Buy Requests Data:", buyRequestsData);

  // Filter buy requests based on filters
  const filteredRequests = React.useMemo(() => {
    if (!buyRequestsData?.buy_requests) return [];

    let filtered = [...buyRequestsData.buy_requests];

    // Filter by status
    if (filters.status !== 'all') {
      filtered = filtered.filter(req => req.moderation_status === filters.status);
    }

    // Filter by category/species
    if (filters.category !== 'all') {
      filtered = filtered.filter(req =>
        req.species?.toLowerCase().includes(filters.category.toLowerCase())
      );
    }

    // Filter by search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(req =>
        req.species?.toLowerCase().includes(searchLower) ||
        req.buyer_name?.toLowerCase().includes(searchLower) ||
        req.buyer_email?.toLowerCase().includes(searchLower) ||
        req.product_type?.toLowerCase().includes(searchLower)
      );
    }

    return filtered;
  }, [buyRequestsData, filters]);

  const moderateRequest = async (requestId, action, reason = '') => {
    try {
      setActionLoading(prev => ({ ...prev, [requestId]: action }));
      await moderateBuyRequest({ requestId, action, reason }).unwrap();
      alert(`Buy request ${action}d successfully`);
      refetch(); // Refresh data
    } catch (error) {
      console.error(error);
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
      flagged: 'bg-orange-100 text-orange-800',
      auto_pass: 'bg-blue-100 text-blue-800'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status ? status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ') : 'Pending'}
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
        {priority || 'Medium'}
      </span>
    );
  };

  if (isLoading) {
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
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh
        </button>
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
              <option value="auto_pass">Auto Pass</option>
            </select>

            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="chicken">Chickens</option>
              <option value="duck">Ducks</option>
              <option value="goat">Goats</option>
              <option value="sheep">Sheep</option>
              <option value="cattle">Cattle</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Buy Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Buy Requests ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Request</th>
                  <th className="text-left py-3">Buyer</th>
                  <th className="text-left py-3">Species</th>
                  <th className="text-left py-3">Quantity</th>
                  <th className="text-left py-3">Price</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Created</th>
                  <th className="text-right py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((request) => (
                  <tr key={request.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{request.product_type || request.species}</p>
                        <p className="text-gray-500 text-xs">
                          {request.province && `${request.province}, ${request.country}`}
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
                        {request.species}
                      </span>
                    </td>
                    <td className="py-3 font-medium">
                      {request.qty} {request.unit}
                    </td>
                    <td className="py-3 font-medium">
                      R{request.target_price?.toLocaleString()}
                    </td>
                    <td className="py-3">
                      {getStatusBadge(request.moderation_status)}
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
                              className="p-1 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
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
                              className="p-1 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
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

            {filteredRequests.length === 0 && (
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
            <h3 className="text-lg font-bold mb-4">
              {selectedRequest.product_type || selectedRequest.species}
            </h3>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-600">Buyer:</label>
                <p className="font-medium">{selectedRequest.buyer_name}</p>
                <p className="text-xs text-gray-500">{selectedRequest.buyer_email}</p>
              </div>

              <div>
                <label className="text-gray-600">Species:</label>
                <p className="font-medium">{selectedRequest.species}</p>
              </div>

              {selectedRequest.breed && (
                <div>
                  <label className="text-gray-600">Breed:</label>
                  <p className="font-medium">{selectedRequest.breed}</p>
                </div>
              )}

              <div>
                <label className="text-gray-600">Quantity:</label>
                <p className="font-medium">{selectedRequest.qty} {selectedRequest.unit}</p>
              </div>

              <div>
                <label className="text-gray-600">Target Price:</label>
                <p className="font-medium">R{selectedRequest.target_price?.toLocaleString()}</p>
              </div>

              <div>
                <label className="text-gray-600">Status:</label>
                <p className="font-medium">{selectedRequest.status}</p>
              </div>

              {selectedRequest.weight_range && (
                <div>
                  <label className="text-gray-600">Weight Range:</label>
                  <p className="font-medium">
                    {selectedRequest.weight_range.min}-{selectedRequest.weight_range.max} {selectedRequest.weight_range.unit}
                  </p>
                </div>
              )}

              {selectedRequest.age_requirements && (
                <div>
                  <label className="text-gray-600">Age Requirements:</label>
                  <p className="font-medium">
                    {selectedRequest.age_requirements.min}-{selectedRequest.age_requirements.max} {selectedRequest.age_requirements.unit}
                  </p>
                </div>
              )}

              <div className="col-span-2">
                <label className="text-gray-600">Location:</label>
                <p className="font-medium">{selectedRequest.province}, {selectedRequest.country}</p>
              </div>

              {selectedRequest.vaccination_requirements?.length > 0 && (
                <div className="col-span-2">
                  <label className="text-gray-600">Vaccination Requirements:</label>
                  <p className="font-medium">{selectedRequest.vaccination_requirements.join(', ')}</p>
                </div>
              )}

              {selectedRequest.additional_requirements && (
                <div className="col-span-2">
                  <label className="text-gray-600">Additional Requirements:</label>
                  <p className="font-medium mt-1">{selectedRequest.additional_requirements}</p>
                </div>
              )}

              {selectedRequest.notes && (
                <div className="col-span-2">
                  <label className="text-gray-600">Notes:</label>
                  <p className="font-medium mt-1">{selectedRequest.notes}</p>
                </div>
              )}

              <div>
                <label className="text-gray-600">Offers Count:</label>
                <p className="font-medium">{selectedRequest.offers_count || 0}</p>
              </div>

              <div>
                <label className="text-gray-600">Moderation Score:</label>
                <p className="font-medium">{selectedRequest.moderation_score}</p>
              </div>
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
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 ml-auto"
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