import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';
import { FileText, Search, Eye, Check, X, Download, AlertTriangle, Clock, Filter, User, Calendar } from 'lucide-react';

const AdminComplianceQueue = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    type: '',
    search: ''
  });
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadDocuments();
  }, [filters]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.search) params.append('q', filters.search);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/compliance/documents?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : data.documents || []);
      } else {
        console.error('Failed to load documents:', response.status);
        alert('Failed to load compliance documents. Please check your permissions.');
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      alert('Error loading documents: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAction = async (documentId, action) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/compliance/documents/${documentId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          admin_notes: `${action} by admin`,
          reason: action === 'reject' ? 'Compliance review failed' : 'Document approved'
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success || result.message) {
          alert(`Document ${action} successful!`);
          loadDocuments(); // Refresh list
        } else {
          alert(`Failed to ${action} document: ` + (result.message || 'Unknown error'));
        }
      } else {
        const error = await response.json();
        alert(`Failed to ${action} document: ` + (error.detail || 'Server error'));
      }
    } catch (error) {
      console.error(`Error ${action} document:`, error);
      alert(`Error ${action} document: ` + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const downloadDocument = async (documentId, filename) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/compliance/documents/${documentId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `document-${documentId}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert('Failed to download document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error downloading document: ' + error.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending Review</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'expired': return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />Expired</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    const typeColors = {
      'kyc': 'bg-blue-100 text-blue-800',
      'veterinary': 'bg-green-100 text-green-800',
      'business_license': 'bg-purple-100 text-purple-800',
      'tax_clearance': 'bg-orange-100 text-orange-800',
      'insurance': 'bg-yellow-100 text-yellow-800'
    };
    return <Badge className={typeColors[type] || 'bg-gray-100 text-gray-800'}>{type?.replace('_', ' ').toUpperCase()}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Document Compliance</h2>
          <p className="text-gray-600">Review and verify compliance documentation</p>
        </div>
        <Button onClick={loadDocuments} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          <FileText className="h-4 w-4 mr-2" />
          {loading ? 'Loading...' : 'Refresh Documents'}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-blue-600">{documents.length}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{documents.filter(d => d.status === 'pending').length}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{documents.filter(d => d.status === 'approved').length}</p>
              </div>
              <Check className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Needs Attention</p>
                <p className="text-2xl font-bold text-red-600">{documents.filter(d => d.status === 'rejected' || d.status === 'expired').length}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
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
              <label className="text-sm font-medium mb-2 block">Search Documents</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by filename or submitter..."
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
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Document Type</label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-default">All Types</SelectItem>
                  <SelectItem value="kyc">KYC Documents</SelectItem>
                  <SelectItem value="veterinary">Veterinary Certificates</SelectItem>
                  <SelectItem value="business_license">Business Licenses</SelectItem>
                  <SelectItem value="tax_clearance">Tax Clearance</SelectItem>
                  <SelectItem value="insurance">Insurance Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
      <Card>
        <CardHeader>
          <CardTitle>Compliance Documents ({documents.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p>Loading documents...</p>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No compliance documents found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map(document => (
                <div key={document.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{document.filename || document.title}</h3>
                          <p className="text-sm text-gray-600">Submitted by: {document.submitter_name || document.user_name || 'Unknown'}</p>
                        </div>
                        {getStatusBadge(document.status)}
                        {getTypeBadge(document.type)}
                      </div>
                      <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <p className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          Submitted: {document.created_at ? new Date(document.created_at).toLocaleDateString() : 'Unknown'}
                        </p>
                        <p>
                          Size: {document.file_size ? `${(document.file_size / 1024).toFixed(1)}KB` : 'Unknown'}
                        </p>
                        <p>
                          Expires: {document.expires_at ? new Date(document.expires_at).toLocaleDateString() : 'No expiry'}
                        </p>
                        <p>
                          Reviews: {document.review_count || 0}
                        </p>
                      </div>
                      {document.admin_notes && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded text-sm">
                          <strong>Admin Notes:</strong> {document.admin_notes}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadDocument(document.id, document.filename)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedDocument(document);
                          setShowDetail(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {document.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleDocumentAction(document.id, 'approve')}
                            disabled={actionLoading}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDocumentAction(document.id, 'reject')}
                            disabled={actionLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
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

export default AdminComplianceQueue;