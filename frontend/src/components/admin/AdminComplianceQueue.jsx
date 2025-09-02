import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Input, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Textarea
} from '../ui';
import { 
  Shield, Search, Filter, Download, Eye, Check, X, FileText,
  AlertTriangle, Calendar, User, Building
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminComplianceQueue() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/documents`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAction = async (docId, action, reason = '') => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API}/admin/documents/${docId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        fetchDocuments();
        setShowDialog(false);
        setRejectionReason('');
      }
    } catch (error) {
      console.error(`Error ${action}ing document:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (!doc) return false;
    
    const matchesSearch = !searchTerm || 
      doc.document_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.owner_id?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = filterType === 'all' || doc.document_type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'expired':
        return <Badge className="bg-red-100 text-red-800">Expired</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending Review</Badge>;
    }
  };

  const getDocumentTypeBadge = (type) => {
    const colors = {
      'user_kyc': 'bg-blue-100 text-blue-800',
      'org_kyc': 'bg-purple-100 text-purple-800',
      'vet_certificate': 'bg-green-100 text-green-800',
      'transport_permit': 'bg-orange-100 text-orange-800',
      'export_permit': 'bg-red-100 text-red-800',
      'halal_certificate': 'bg-indigo-100 text-indigo-800'
    };
    
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
      </Badge>
    );
  };

  const getDocStats = () => {
    return {
      total: documents.length,
      pending: documents.filter(d => !d.status || d.status === 'pending').length,
      verified: documents.filter(d => d.status === 'verified').length,
      rejected: documents.filter(d => d.status === 'rejected').length,
      expired: documents.filter(d => d.status === 'expired').length,
      userKyc: documents.filter(d => d.document_type === 'user_kyc').length,
      vetCerts: documents.filter(d => d.document_type === 'vet_certificate').length
    };
  };

  const stats = getDocStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Compliance & Document Verification</h2>
          <p className="text-gray-600">
            {stats.total} documents • {stats.pending} pending verification
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchDocuments}>
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Document Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Documents</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.verified}</div>
            <div className="text-sm text-gray-500">Verified</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-500">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.userKyc}</div>
            <div className="text-sm text-gray-500">User KYC</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{stats.vetCerts}</div>
            <div className="text-sm text-gray-500">Vet Certificates</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search documents by type or owner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="user_kyc">User KYC</SelectItem>
            <SelectItem value="org_kyc">Organization KYC</SelectItem>
            <SelectItem value="vet_certificate">Vet Certificates</SelectItem>
            <SelectItem value="transport_permit">Transport Permits</SelectItem>
            <SelectItem value="export_permit">Export Permits</SelectItem>
            <SelectItem value="halal_certificate">Halal Certificates</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Documents ({filteredDocuments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading documents...</p>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No documents found</h3>
              <p className="text-gray-500">No documents match your search criteria</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDocuments.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Document #{doc.id?.slice(0, 8)}...
                        </div>
                        <div className="text-sm text-gray-500">
                          {doc.filename || 'No filename'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getDocumentTypeBadge(doc.document_type)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {doc.owner_type === 'user' ? (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-400" />
                            User
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Building className="h-4 w-4 text-gray-400" />
                            Organization
                          </div>
                        )}
                        <div className="text-xs text-gray-400">
                          ID: {doc.owner_id?.slice(0, 8)}...
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(doc.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {doc.created_at 
                          ? new Date(doc.created_at).toLocaleDateString()
                          : 'Unknown'
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        {doc.created_at 
                          ? new Date(doc.created_at).toLocaleTimeString()
                          : ''
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setShowDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(!doc.status || doc.status === 'pending') && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleDocumentAction(doc.id, 'verify')}
                              disabled={actionLoading}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedDoc(doc);
                                setShowDialog(true);
                              }}
                              disabled={actionLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
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

      {/* Document Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Document Verification</DialogTitle>
            <DialogDescription>
              Review and verify compliance document
            </DialogDescription>
          </DialogHeader>
          {selectedDoc && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Document ID</label>
                  <p className="text-sm text-gray-900 font-mono">#{selectedDoc.id}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <div className="mt-1">
                    {getDocumentTypeBadge(selectedDoc.document_type)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Owner</label>
                  <p className="text-sm text-gray-900">
                    {selectedDoc.owner_type} ({selectedDoc.owner_id?.slice(0, 8)}...)
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedDoc.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Submitted</label>
                  <p className="text-sm text-gray-900">
                    {selectedDoc.created_at 
                      ? new Date(selectedDoc.created_at).toLocaleString()
                      : 'Unknown'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Expires</label>
                  <p className="text-sm text-gray-900">
                    {selectedDoc.expires_at 
                      ? new Date(selectedDoc.expires_at).toLocaleDateString()
                      : 'No expiry'
                    }
                  </p>
                </div>
              </div>
              
              {selectedDoc.filename && (
                <div>
                  <label className="text-sm font-medium text-gray-700">File</label>
                  <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded">
                    {selectedDoc.filename}
                  </p>
                </div>
              )}

              {(!selectedDoc.status || selectedDoc.status === 'pending') && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Rejection Reason (optional)</label>
                  <Textarea
                    placeholder="Enter reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
            {selectedDoc && (!selectedDoc.status || selectedDoc.status === 'pending') && (
              <>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleDocumentAction(selectedDoc.id, 'verify')}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Verify Document
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleDocumentAction(selectedDoc.id, 'reject', rejectionReason)}
                  disabled={actionLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject Document
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}