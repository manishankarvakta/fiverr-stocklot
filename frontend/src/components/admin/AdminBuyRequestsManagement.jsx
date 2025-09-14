import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';
import { MessageSquare, Search, Eye, Check, X, AlertTriangle, Clock, Filter, MapPin, DollarSign } from 'lucide-react';

const AdminBuyRequestsManagement = () => {
  const [buyRequests, setBuyRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadBuyRequests();
  }, [filters]);

  const loadBuyRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('q', filters.search);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/buy-requests?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBuyRequests(Array.isArray(data) ? data : data.buy_requests || []);
      } else {
        console.error('Failed to load buy requests:', response.status);
        alert('Failed to load buy requests. Please check your permissions.');
      }
    } catch (error) {
      console.error('Error loading buy requests:', error);
      alert('Error loading buy requests: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAction = async (requestId, action) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/buy-requests/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          admin_notes: `${action} by admin`,
          reason: action === 'reject' ? 'Admin moderation' : undefined
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success || result.message) {
          alert(`Buy request ${action} successful!`);
          loadBuyRequests(); // Refresh list
        } else {
          alert(`Failed to ${action} buy request: ` + (result.message || 'Unknown error'));
        }
      } else {
        const error = await response.json();
        alert(`Failed to ${action} buy request: ` + (error.detail || 'Server error'));
      }
    } catch (error) {
      console.error(`Error ${action} buy request:`, error);
      alert(`Error ${action} buy request: ` + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Active</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'flagged': return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />Flagged</Badge>;
      case 'fulfilled': return <Badge className="bg-blue-100 text-blue-800"><Check className="h-3 w-3 mr-1" />Fulfilled</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Buy Requests</h2>
          <p className="text-gray-600">Manage and moderate buyer livestock requests</p>
        </div>
        <Button onClick={loadBuyRequests} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          <MessageSquare className="h-4 w-4 mr-2" />
          {loading ? 'Loading...' : 'Refresh Requests'}
        </Button>
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
              <label className="text-sm font-medium mb-2 block">Search Requests</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title or description..."
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
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="fulfilled">Fulfilled</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-default">All Categories</SelectItem>
                  <SelectItem value="cattle">Cattle</SelectItem>
                  <SelectItem value="poultry">Poultry</SelectItem>
                  <SelectItem value="sheep">Sheep</SelectItem>
                  <SelectItem value="goats">Goats</SelectItem>
                  <SelectItem value="pigs">Pigs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Buy Requests List */}
      <Card>
        <CardHeader>
          <CardTitle>Buy Requests ({buyRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p>Loading buy requests...</p>
              </div>
            </div>
          ) : buyRequests.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No buy requests found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {buyRequests.map(request => (
                <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{request.title}</h3>
                          <p className="text-sm text-gray-600">{request.description?.substring(0, 100)}...</p>
                        </div>
                        {getStatusBadge(request.status)}
                        <Badge variant="outline">{request.species_name || 'Unknown Species'}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <p className="flex items-center">
                          <DollarSign className="h-3 w-3 mr-1" />
                          Budget: R{request.budget_min ? (request.budget_min / 100).toLocaleString() : 'N/A'} - R{request.budget_max ? (request.budget_max / 100).toLocaleString() : 'N/A'}
                        </p>
                        <p>Quantity: {request.quantity || 'N/A'}</p>
                        <p>Buyer: {request.buyer_name || request.buyer_email || 'Unknown'}</p>
                        <p>Created: {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Unknown'}</p>
                        <p>Expires: {request.expires_at ? new Date(request.expires_at).toLocaleDateString() : 'No expiry'}</p>
                        <p>Responses: {request.response_count || 0}</p>
                      </div>
                      {request.location && (
                        <div className="mt-2 flex items-center text-sm text-gray-600">
                          <MapPin className="h-3 w-3 mr-1" />
                          {request.location}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowDetail(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {request.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleRequestAction(request.id, 'approve')}
                            disabled={actionLoading}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleRequestAction(request.id, 'reject')}
                            disabled={actionLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {request.status === 'flagged' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleRequestAction(request.id, 'unflag')}
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

export default AdminBuyRequestsManagement;