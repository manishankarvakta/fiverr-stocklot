import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';
import { Users, Clock, Check, X, Eye, MessageSquare, Shield, Star, Calendar, Filter, Search, FileText, UserPlus, Truck, Building, CheckCircle, XCircle } from 'lucide-react';
import adminApi from '../../api/adminClient';

const RolesQueue = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: 'PENDING',
    role: '',
    search: ''
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [filters]);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.role) params.append('role', filters.role);
      if (filters.search) params.append('q', filters.search);

      const response = await adminApi.get(`/admin/roles/requests?${params}`);
      setRequests(response.data.rows || []);
    } catch (error) {
      console.error('Error loading role requests:', error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id, action) => {
    setActionLoading(true);
    try {
      const reason = action === 'reject' ? prompt('Please provide a reason for rejection:') : undefined;
      if (action === 'reject' && !reason) return;

      const endpoint = `/admin/roles/requests/${id}/${action}`;
      const body = action === 'reject' ? { reason } : { note: 'Approved by admin' };

      await adminApi.post(endpoint, body);
      
      // Show success message
      const actionText = action === 'approve' ? 'approved' : 'rejected';
      alert(`Role request ${actionText} successfully!`);
      
      // Reload requests
      await loadRequests();
      setShowDetail(false);
      setSelectedRequest(null);
      
    } catch (error) {
      console.error(`Error ${action}ing role request:`, error);
      alert(`Failed to ${action} role request. Please try again.`);
    } finally {
      setActionLoading(false);
    }
  };

  const openDetailModal = (request) => {
    setSelectedRequest(request);
    setShowDetail(true);
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'exporter': return <Truck className="h-4 w-4" />;
      case 'transporter': return <Truck className="h-4 w-4" />;
      case 'abattoir': return <Building className="h-4 w-4" />;
      default: return <UserPlus className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getKYCLevelColor = (level) => {
    if (level >= 2) return 'bg-green-100 text-green-800';
    if (level >= 1) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Role Upgrade Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Select value={filters.status} onValueChange={(value) => setFilters({...filters, status: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-items">All Status</SelectItem>
                <SelectItem value="PENDING">Pending</SelectItem>
                <SelectItem value="APPROVED">Approved</SelectItem>
                <SelectItem value="REJECTED">Rejected</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filters.role} onValueChange={(value) => setFilters({...filters, role: value})}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-items">All Roles</SelectItem>
                <SelectItem value="exporter">Exporter</SelectItem>
                <SelectItem value="transporter">Transporter</SelectItem>
                <SelectItem value="abattoir">Abattoir</SelectItem>
              </SelectContent>
            </Select>

            <Input
              placeholder="Search users..."
              value={filters.search}
              onChange={(e) => setFilters({...filters, search: e.target.value})}
              className="max-w-xs"
            />
          </div>

          {/* Requests Table */}
          {loading ? (
            <div className="text-center py-8">Loading role requests...</div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">User / Organization</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Role</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">KYC Level</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Status</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Date</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{request.user_name}</div>
                          {request.org_name && (
                            <div className="text-sm text-gray-500">{request.org_name}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(request.requested_role)}
                          <span className="capitalize font-medium">{request.requested_role}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge className={`${getKYCLevelColor(request.kyc_level)}`}>
                          Level {request.kyc_level}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <Badge className={getStatusColor(request.status)}>
                          {request.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-4 text-center text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetailModal(request)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {request.status === 'PENDING' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleAction(request.id, 'approve')}
                                disabled={actionLoading}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleAction(request.id, 'reject')}
                                disabled={actionLoading}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {requests.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  No role requests found
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      {showDetail && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Role Request Details</h2>
                <Button variant="outline" onClick={() => setShowDetail(false)}>
                  ✕
                </Button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                    <p className="text-sm text-gray-900">{selectedRequest.user_name}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                    <p className="text-sm text-gray-900">{selectedRequest.org_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Requested Role</label>
                    <div className="flex items-center gap-2">
                      {getRoleIcon(selectedRequest.requested_role)}
                      <span className="capitalize font-medium">{selectedRequest.requested_role}</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">KYC Level</label>
                    <Badge className={getKYCLevelColor(selectedRequest.kyc_level)}>
                      Level {selectedRequest.kyc_level}
                    </Badge>
                  </div>
                </div>

                {selectedRequest.business_license && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Business License</label>
                    <a 
                      href={selectedRequest.business_license} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Document
                    </a>
                  </div>
                )}

                {selectedRequest.attachments && selectedRequest.attachments.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Documents</label>
                    <div className="space-y-2">
                      {selectedRequest.attachments.map((doc, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="text-sm font-medium">{doc.type}:</span>
                          <a 
                            href={doc.url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline text-sm"
                          >
                            View Document
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Request Date</label>
                  <p className="text-sm text-gray-900">{new Date(selectedRequest.created_at).toLocaleString()}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {selectedRequest.status}
                  </Badge>
                </div>
              </div>

              {selectedRequest.status === 'PENDING' && (
                <div className="flex gap-3 mt-6 pt-4 border-t">
                  <Button
                    className="flex-1 bg-green-600 hover:bg-green-700"
                    onClick={() => handleAction(selectedRequest.id, 'approve')}
                    disabled={actionLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Request
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => handleAction(selectedRequest.id, 'reject')}
                    disabled={actionLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Request
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesQueue;