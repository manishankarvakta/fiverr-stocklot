import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Input, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Textarea
} from '../ui';
import { 
  Building, Search, Filter, Download, Plus, Eye, Check, X, 
  Users, MapPin, FileText, Calendar
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminOrganizationsManagement() {
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/organizations`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrganizations(Array.isArray(data) ? data : data.organizations || []);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  const handleKYCAction = async (orgId, action, reason = '') => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API}/admin/organizations/${orgId}/kyc/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });
      
      if (response.ok) {
        fetchOrganizations();
        setShowDialog(false);
      }
    } catch (error) {
      console.error(`Error ${action}ing KYC:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    if (!org) return false;
    
    const matchesSearch = !searchTerm || 
      org.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      org.registration_number?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesType = filterType === 'all' || org.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getKYCBadge = (status) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
      default:
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending KYC</Badge>;
    }
  };

  const getTypeBadge = (type) => {
    const colors = {
      farm: 'bg-green-100 text-green-800',
      cooperative: 'bg-blue-100 text-blue-800',
      abattoir: 'bg-red-100 text-red-800',
      transporter: 'bg-purple-100 text-purple-800',
      exporter: 'bg-orange-100 text-orange-800'
    };
    
    return (
      <Badge className={colors[type] || 'bg-gray-100 text-gray-800'}>
        {type || 'Unknown'}
      </Badge>
    );
  };

  const getOrgStats = () => {
    return {
      total: organizations.length,
      pending: organizations.filter(o => !o.kyc_status || o.kyc_status === 'pending').length,
      verified: organizations.filter(o => o.kyc_status === 'verified').length,
      rejected: organizations.filter(o => o.kyc_status === 'rejected').length,
      farms: organizations.filter(o => o.type === 'farm').length,
      cooperatives: organizations.filter(o => o.type === 'cooperative').length
    };
  };

  const stats = getOrgStats();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Organizations & KYC Management</h2>
          <p className="text-gray-600">
            {stats.total} organizations • {stats.pending} pending KYC verification
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchOrganizations}>
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Organization
          </Button>
        </div>
      </div>

      {/* Organization Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-500">Total Organizations</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
            <div className="text-sm text-gray-500">Pending KYC</div>
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
            <div className="text-2xl font-bold text-green-600">{stats.farms}</div>
            <div className="text-sm text-gray-500">Farms</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{stats.cooperatives}</div>
            <div className="text-sm text-gray-500">Cooperatives</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search organizations by name or registration..."
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
            <SelectItem value="farm">Farms</SelectItem>
            <SelectItem value="cooperative">Cooperatives</SelectItem>
            <SelectItem value="abattoir">Abattoirs</SelectItem>
            <SelectItem value="transporter">Transporters</SelectItem>
            <SelectItem value="exporter">Exporters</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            Organizations ({filteredOrganizations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading organizations...</p>
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="text-center py-8">
              <Building className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No organizations found</h3>
              <p className="text-gray-500">No organizations match your search criteria</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{org.name || 'Unnamed Organization'}</div>
                        <div className="text-sm text-gray-500">
                          Reg: {org.registration_number || 'Not provided'}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTypeBadge(org.type)}
                    </TableCell>
                    <TableCell>
                      {getKYCBadge(org.kyc_status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        {org.member_count || 0}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {org.city && org.province ? `${org.city}, ${org.province}` : 'Not specified'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedOrg(org);
                            setShowDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(!org.kyc_status || org.kyc_status === 'pending') && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                              onClick={() => handleKYCAction(org.id, 'verify')}
                              disabled={actionLoading}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedOrg(org);
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

      {/* Organization Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Organization KYC Review</DialogTitle>
            <DialogDescription>
              Review and verify organization details
            </DialogDescription>
          </DialogHeader>
          {selectedOrg && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Organization Name</label>
                  <p className="text-sm text-gray-900">{selectedOrg.name}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Type</label>
                  <div className="mt-1">
                    {getTypeBadge(selectedOrg.type)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Registration Number</label>
                  <p className="text-sm text-gray-900 font-mono">
                    {selectedOrg.registration_number || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">KYC Status</label>
                  <div className="mt-1">
                    {getKYCBadge(selectedOrg.kyc_status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <p className="text-sm text-gray-900">
                    {selectedOrg.city && selectedOrg.province 
                      ? `${selectedOrg.city}, ${selectedOrg.province}`
                      : 'Not specified'
                    }
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Members</label>
                  <p className="text-sm text-gray-900">{selectedOrg.member_count || 0} members</p>
                </div>
              </div>
              
              {selectedOrg.description && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Description</label>
                  <p className="text-sm text-gray-900 p-3 bg-gray-50 rounded">
                    {selectedOrg.description}
                  </p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
            {selectedOrg && (!selectedOrg.kyc_status || selectedOrg.kyc_status === 'pending') && (
              <>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleKYCAction(selectedOrg.id, 'verify')}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Verify KYC
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleKYCAction(selectedOrg.id, 'reject', 'KYC verification failed')}
                  disabled={actionLoading}
                >
                  <X className="h-4 w-4 mr-2" />
                  Reject KYC
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}