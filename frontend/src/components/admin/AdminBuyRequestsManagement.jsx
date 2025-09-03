import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { 
  Search, Filter, Eye, Edit, Ban, CheckCircle, XCircle, 
  MessageSquare, Users, MapPin, Clock, Package, Shield,
  FileText, ImageIcon, AlertTriangle, Loader2, RefreshCw
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AdminBuyRequestsManagement = ({ user }) => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pending: 0,
    approved: 0,
    flagged: 0
  });

  useEffect(() => {
    loadBuyRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [requests, searchTerm, statusFilter]);

  const loadBuyRequests = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/buy-requests`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const requestsList = Array.isArray(data) ? data : data.buy_requests || [];
        setRequests(requestsList);
        
        // Calculate stats
        const newStats = {
          total: requestsList.length,
          active: requestsList.filter(r => r.status === 'open').length,
          pending: requestsList.filter(r => r.moderation_status === 'pending_review').length,
          approved: requestsList.filter(r => r.moderation_status === 'auto_pass').length,
          flagged: requestsList.filter(r => r.moderation_status === 'flagged').length
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error('Error loading buy requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterRequests = () => {
    let filtered = requests;

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(r => r.status === 'open');
      } else if (statusFilter === 'pending') {
        filtered = filtered.filter(r => r.moderation_status === 'pending_review');
      } else if (statusFilter === 'flagged') {
        filtered = filtered.filter(r => r.moderation_status === 'flagged');
      }
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(r => 
        r.species?.toLowerCase().includes(term) ||
        r.product_type?.toLowerCase().includes(term) ||
        r.breed?.toLowerCase().includes(term) ||
        r.province?.toLowerCase().includes(term) ||
        r.notes?.toLowerCase().includes(term)
      );
    }

    setFilteredRequests(filtered);
  };

  const handleAction = async (requestId, action) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BACKEND_URL}/api/admin/buy-requests/${requestId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        await loadBuyRequests(); // Refresh data
        
        // Show success message
        const toast = document.createElement('div');
        toast.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-md z-50';
        toast.textContent = `Request ${action}d successfully`;
        document.body.appendChild(toast);
        setTimeout(() => document.body.removeChild(toast), 3000);
      }
    } catch (error) {
      console.error(`Error ${action}ing request:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status, moderationStatus) => {
    if (moderationStatus === 'pending_review') {
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Review</Badge>;
    }
    if (moderationStatus === 'flagged') {
      return <Badge variant="destructive">Flagged</Badge>;
    }
    if (status === 'open') {
      return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">Active</Badge>;
    }
    if (status === 'closed') {
      return <Badge variant="secondary">Closed</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin mr-2" />
        <span>Loading buy requests...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Buy Requests Management</h2>
          <p className="text-gray-600">Manage and moderate livestock purchase requests</p>
        </div>
        <Button onClick={loadBuyRequests} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">Active</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-600">{stats.approved}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.flagged}</div>
            <div className="text-sm text-gray-600">Flagged</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-white p-4 rounded-lg border">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by species, breed, location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Requests</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="flagged">Flagged</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Buy Requests ({filteredRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredRequests.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p>No buy requests found matching your criteria</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3">Request Details</th>
                    <th className="text-left p-3">Enhanced Features</th>
                    <th className="text-left p-3">Location & Timing</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRequests.map((request) => (
                    <tr key={request.id} className="border-b hover:bg-gray-50">
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="font-medium">
                            {request.breed ? `${request.breed} ` : ''}{request.species}
                          </div>
                          <div className="text-sm text-gray-600">
                            {request.product_type} • {request.qty} {request.unit}
                          </div>
                          {request.target_price && (
                            <div className="text-sm font-medium text-emerald-600">
                              R{request.target_price}/unit
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {request.images && request.images.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <ImageIcon className="h-3 w-3 mr-1" />
                              {request.images.length} images
                            </Badge>
                          )}
                          {request.vet_certificates && request.vet_certificates.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <FileText className="h-3 w-3 mr-1" />
                              Vet certs
                            </Badge>
                          )}
                          {request.vaccination_requirements && request.vaccination_requirements.length > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Shield className="h-3 w-3 mr-1" />
                              Vaccines
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <MapPin className="h-3 w-3" />
                            {request.province}
                          </div>
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Clock className="h-3 w-3" />
                            Expires: {formatDate(request.expires_at)}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="space-y-2">
                          {getStatusBadge(request.status, request.moderation_status)}
                          <div className="text-xs text-gray-600">
                            Created: {formatDate(request.created_at)}
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowDetailModal(true);
                            }}
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          {request.moderation_status === 'pending_review' && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(request.id, 'approve')}
                                disabled={actionLoading}
                                className="text-green-600 hover:bg-green-50"
                              >
                                <CheckCircle className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(request.id, 'reject')}
                                disabled={actionLoading}
                                className="text-red-600 hover:bg-red-50"
                              >
                                <XCircle className="h-3 w-3" />
                              </Button>
                            </>
                          )}
                          {request.status === 'open' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(request.id, 'close')}
                              disabled={actionLoading}
                              className="text-orange-600 hover:bg-orange-50"
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {selectedRequest && (
        <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Buy Request Details</DialogTitle>
            </DialogHeader>
            
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="enhanced">Enhanced Details</TabsTrigger>
                <TabsTrigger value="moderation">Moderation</TabsTrigger>
                <TabsTrigger value="offers">Offers</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Basic Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Species:</span>
                        <span>{selectedRequest.species}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Product Type:</span>
                        <span>{selectedRequest.product_type}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Breed:</span>
                        <span>{selectedRequest.breed || 'Any'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Quantity:</span>
                        <span>{selectedRequest.qty} {selectedRequest.unit}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Target Price:</span>
                        <span>{selectedRequest.target_price ? `R${selectedRequest.target_price}/unit` : 'Open'}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Location & Timing</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Province:</span>
                        <span>{selectedRequest.province}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Country:</span>
                        <span>{selectedRequest.country}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Created:</span>
                        <span>{formatDate(selectedRequest.created_at)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Expires:</span>
                        <span>{formatDate(selectedRequest.expires_at)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {selectedRequest.notes && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-700">{selectedRequest.notes}</p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="enhanced" className="space-y-4">
                {/* Enhanced features content */}
                <div className="grid md:grid-cols-2 gap-4">
                  {selectedRequest.weight_range && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Weight Requirements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{selectedRequest.weight_range.min || 'No min'} - {selectedRequest.weight_range.max || 'No max'} {selectedRequest.weight_range.unit}</p>
                      </CardContent>
                    </Card>
                  )}

                  {selectedRequest.age_requirements && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Age Requirements</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p>{selectedRequest.age_requirements.min || 'No min'} - {selectedRequest.age_requirements.max || 'No max'} {selectedRequest.age_requirements.unit}</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                {selectedRequest.vaccination_requirements && selectedRequest.vaccination_requirements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Required Vaccinations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedRequest.vaccination_requirements.map((vaccine, index) => (
                          <Badge key={index} variant="outline">{vaccine}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedRequest.images && selectedRequest.images.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Reference Images</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {selectedRequest.images.map((image, index) => (
                          <img key={index} src={image} alt={`Reference ${index + 1}`} className="w-full h-24 object-cover rounded-lg" />
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="moderation" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Moderation Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Current Status:</span>
                      {getStatusBadge(selectedRequest.status, selectedRequest.moderation_status)}
                    </div>
                    
                    {selectedRequest.moderation_status === 'pending_review' && (
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleAction(selectedRequest.id, 'approve')}
                          disabled={actionLoading}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Approve Request
                        </Button>
                        <Button
                          onClick={() => handleAction(selectedRequest.id, 'reject')}
                          disabled={actionLoading}
                          variant="destructive"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Request
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="offers" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Offers Received</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <p>Offers management coming soon</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default AdminBuyRequestsManagement;