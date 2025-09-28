'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { 
  Building2, Users, Package, Shield, CheckCircle, AlertCircle, 
  XCircle, Eye, Search, Filter, Crown, UserCheck, Plus, Ban, 
  Globe, Phone, Mail, Calendar, TrendingUp, DollarSign
} from 'lucide-react';

const ORGANIZATION_TYPES = {
  'FARM': { label: 'Farm', color: 'bg-green-100 text-green-800' },
  'COMPANY': { label: 'Company', color: 'bg-blue-100 text-blue-800' },
  'COOP': { label: 'Cooperative', color: 'bg-purple-100 text-purple-800' },
  'ABATTOIR': { label: 'Abattoir', color: 'bg-red-100 text-red-800' },
  'TRANSPORTER': { label: 'Transporter', color: 'bg-yellow-100 text-yellow-800' },
  'EXPORTER': { label: 'Exporter', color: 'bg-indigo-100 text-indigo-800' }
};

const KYC_STATUS_COLORS = {
  'PENDING': 'bg-yellow-100 text-yellow-800',
  'VERIFIED': 'bg-green-100 text-green-800',
  'REJECTED': 'bg-red-100 text-red-800'
};

const getRoleIcon = (role) => {
  switch (role) {
    case 'OWNER': return <Crown className="h-3 w-3" />;
    case 'ADMIN': return <Shield className="h-3 w-3" />;
    case 'MANAGER': return <UserCheck className="h-3 w-3" />;
    default: return <Users className="h-3 w-3" />;
  }
};

export default function OrganizationManagement() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [kycFilter, setKycFilter] = useState('all');
  const [showKycDialog, setShowKycDialog] = useState(false);
  const [kycForm, setKycForm] = useState({ status: 'VERIFIED', level: 1, notes: '' });
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/organizations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setOrganizations(data);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizationDetails = async (orgId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/organizations/${orgId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setSelectedOrg(data);
      }
    } catch (error) {
      console.error('Error fetching organization details:', error);
    }
  };

  const handleVerifyKyc = async () => {
    if (!selectedOrg) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/organizations/${selectedOrg.organization.id}/verify-kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(kycForm)
      });

      if (response.ok) {
        setShowKycDialog(false);
        fetchOrganizationDetails(selectedOrg.organization.id);
        fetchOrganizations();
        alert('KYC status updated successfully');
      }
    } catch (error) {
      console.error('Error updating KYC:', error);
      alert('Failed to update KYC status');
    }
  };

  const handleSuspendOrganization = async (orgId) => {
    if (!confirm('Are you sure you want to suspend this organization?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/organizations/${orgId}/suspend`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        fetchOrganizations();
        if (selectedOrg && selectedOrg.organization.id === orgId) {
          fetchOrganizationDetails(orgId);
        }
        alert('Organization suspended successfully');
      }
    } catch (error) {
      console.error('Error suspending organization:', error);
      alert('Failed to suspend organization');
    }
  };

  const filteredOrganizations = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.handle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         org.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = typeFilter === 'all' || org.kind === typeFilter;
    const matchesKyc = kycFilter === 'all' || org.kyc_status === kycFilter;
    
    return matchesSearch && matchesType && matchesKyc;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{organizations.length}</p>
                <p className="text-sm text-gray-600">Total Organizations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.filter(o => o.kyc_status === 'VERIFIED').length}
                </p>
                <p className="text-sm text-gray-600">Verified</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.filter(o => o.kyc_status === 'PENDING').length}
                </p>
                <p className="text-sm text-gray-600">Pending KYC</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {organizations.reduce((sum, o) => sum + (o.listing_count || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Total Listings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Organizations List */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Organizations</CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {Object.entries(ORGANIZATION_TYPES).map(([key, type]) => (
                        <SelectItem key={key} value={key}>{type.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={kycFilter} onValueChange={setKycFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All KYC</SelectItem>
                      <SelectItem value="VERIFIED">Verified</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {filteredOrganizations.map((org) => (
                  <div
                    key={org.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 ${
                      selectedOrg?.organization.id === org.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                    }`}
                    onClick={() => fetchOrganizationDetails(org.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                          <Building2 className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-gray-900">{org.name}</h3>
                            <Badge className={ORGANIZATION_TYPES[org.kind]?.color}>
                              {ORGANIZATION_TYPES[org.kind]?.label}
                            </Badge>
                            <Badge className={KYC_STATUS_COLORS[org.kyc_status] || 'bg-gray-100 text-gray-800'}>
                              {org.kyc_status || 'PENDING'}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            {org.handle && <span>@{org.handle}</span>}
                            {org.email && <span>📧 {org.email}</span>}
                            <span>{org.member_count} member{org.member_count !== 1 ? 's' : ''}</span>
                            <span>{org.listing_count} listing{org.listing_count !== 1 ? 's' : ''}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {filteredOrganizations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No organizations found</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Organization Details */}
        <div className="space-y-4">
          {selectedOrg ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <Building2 className="h-5 w-5" />
                    <span>Organization Details</span>
                  </CardTitle>
                  <div className="flex space-x-2">
                    <Dialog open={showKycDialog} onOpenChange={setShowKycDialog}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline">
                          <Shield className="h-4 w-4 mr-2" />
                          Update KYC
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Update KYC Status</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <Select value={kycForm.status} onValueChange={(value) => setKycForm({...kycForm, status: value})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="VERIFIED">Verified</SelectItem>
                              <SelectItem value="PENDING">Pending</SelectItem>
                              <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={kycForm.level.toString()} onValueChange={(value) => setKycForm({...kycForm, level: parseInt(value)})}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Level 1 (Basic)</SelectItem>
                              <SelectItem value="2">Level 2 (Enhanced)</SelectItem>
                              <SelectItem value="3">Level 3 (Premium)</SelectItem>
                            </SelectContent>
                          </Select>
                          <Textarea
                            placeholder="Notes..."
                            value={kycForm.notes}
                            onChange={(e) => setKycForm({...kycForm, notes: e.target.value})}
                          />
                          <Button onClick={handleVerifyKyc} className="w-full">
                            Update KYC Status
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleSuspendOrganization(selectedOrg.organization.id)}
                    >
                      <Ban className="h-4 w-4 mr-2" />
                      Suspend
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid grid-cols-3 w-full">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                    <TabsTrigger value="listings">Listings</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-4 mt-4">
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-semibold text-gray-900">{selectedOrg.organization.name}</h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={ORGANIZATION_TYPES[selectedOrg.organization.kind]?.color}>
                            {ORGANIZATION_TYPES[selectedOrg.organization.kind]?.label}
                          </Badge>
                          <Badge className={KYC_STATUS_COLORS[selectedOrg.kyc?.status] || 'bg-gray-100 text-gray-800'}>
                            {selectedOrg.kyc?.status || 'PENDING'}
                          </Badge>
                        </div>
                      </div>

                      <div className="space-y-2 text-sm">
                        {selectedOrg.organization.handle && (
                          <div className="flex items-center space-x-2">
                            <Globe className="h-4 w-4 text-gray-400" />
                            <span>@{selectedOrg.organization.handle}</span>
                          </div>
                        )}
                        {selectedOrg.organization.email && (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{selectedOrg.organization.email}</span>
                          </div>
                        )}
                        {selectedOrg.organization.phone && (
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{selectedOrg.organization.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Created {new Date(selectedOrg.organization.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mt-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <Users className="h-4 w-4 text-blue-500" />
                            <span className="text-sm font-medium">Members</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{selectedOrg.member_count}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-center space-x-2 mb-1">
                            <Package className="h-4 w-4 text-green-500" />
                            <span className="text-sm font-medium">Listings</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{selectedOrg.listing_count}</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="members" className="space-y-3 mt-4">
                    {selectedOrg.members.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-sm">{member.full_name}</span>
                            <Badge variant="outline" className="text-xs">
                              {getRoleIcon(member.role)}
                              <span className="ml-1">{member.role}</span>
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">{member.email}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(member.joined_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </TabsContent>

                  <TabsContent value="listings" className="space-y-3 mt-4">
                    {selectedOrg.listings.slice(0, 5).map((listing, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <h5 className="font-medium text-sm">{listing.title}</h5>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-600">R{listing.price_per_unit}</span>
                          <Badge variant="outline" className="text-xs">
                            {listing.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {selectedOrg.listings.length === 0 && (
                      <p className="text-center text-gray-500 py-4 text-sm">No listings</p>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center text-gray-500">
                <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select an organization to view details</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}