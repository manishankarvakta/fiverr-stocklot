import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Alert, AlertDescription
} from '@/components/ui';
import { 
  Building2, Plus, CheckCircle, XCircle, Clock, Eye, Edit, Trash2, Shield,
  FileText, MapPin, Phone, Mail, Users, Star
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || 'https://easy-signin-1.preview.emergentagent.com/api';

export default function AdminOrganizationsManagement() {
  const [organizations, setOrganizations] = useState([]);
  const [showAddOrganization, setShowAddOrganization] = useState(false);
  const [showEditOrganization, setShowEditOrganization] = useState(false);
  const [showKycDialog, setShowKycDialog] = useState(false);
  const [selectedOrganization, setSelectedOrganization] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newOrganization, setNewOrganization] = useState({
    name: '',
    registration_number: '',
    tax_number: '',
    type: 'company',
    email: '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'South Africa',
    industry: 'agriculture',
    description: '',
    website: '',
    kyc_status: 'pending',
    kyc_documents: []
  });

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      const response = await fetch(`${API}/admin/organizations`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
    }
  };

  const handleAddOrganization = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newOrganization)
      });

      if (response.ok) {
        setShowAddOrganization(false);
        setNewOrganization({
          name: '', registration_number: '', tax_number: '', type: 'company',
          email: '', phone: '', address: '', city: '', province: '', postal_code: '',
          country: 'South Africa', industry: 'agriculture', description: '',
          website: '', kyc_status: 'pending', kyc_documents: []
        });
        fetchOrganizations();
        alert('Organization added successfully!');
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to add organization');
      }
    } catch (error) {
      console.error('Error adding organization:', error);
      alert('Failed to add organization: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditOrganization = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/organizations/${selectedOrganization.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(selectedOrganization)
      });

      if (response.ok) {
        setShowEditOrganization(false);
        setSelectedOrganization(null);
        fetchOrganizations();
        alert('Organization updated successfully!');
      } else {
        throw new Error('Failed to update organization');
      }
    } catch (error) {
      console.error('Error updating organization:', error);
      alert('Failed to update organization');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrganization = async (organizationId) => {
    if (window.confirm('Are you sure you want to delete this organization?')) {
      try {
        const response = await fetch(`${API}/admin/organizations/${organizationId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
          fetchOrganizations();
          alert('Organization deleted successfully!');
        } else {
          throw new Error('Failed to delete organization');
        }
      } catch (error) {
        console.error('Error deleting organization:', error);
        alert('Failed to delete organization');
      }
    }
  };

  const handleKycReview = async (organizationId, action, notes = '') => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/organizations/${organizationId}/kyc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          action: action, // 'approve', 'reject', 'request_documents'
          notes: notes 
        })
      });

      if (response.ok) {
        fetchOrganizations();
        setShowKycDialog(false);
        setSelectedOrganization(null);
        alert(`KYC ${action}ed successfully!`);
      } else {
        throw new Error(`Failed to ${action} KYC`);
      }
    } catch (error) {
      console.error(`Error ${action}ing KYC:`, error);
      alert(`Failed to ${action} KYC`);
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (organization) => {
    setSelectedOrganization({ ...organization });
    setShowEditOrganization(true);
  };

  const openKycDialog = (organization) => {
    setSelectedOrganization({ ...organization });
    setShowKycDialog(true);
  };

  const getKycStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getKycStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'under_review': return <Eye className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const organizationTypes = [
    { value: 'company', label: 'Company' },
    { value: 'cooperative', label: 'Cooperative' },
    { value: 'ngo', label: 'NGO' },
    { value: 'government', label: 'Government Entity' },
    { value: 'partnership', label: 'Partnership' },
    { value: 'trust', label: 'Trust' }
  ];

  const pendingKycCount = organizations.filter(o => o.kyc_status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Organizations KYC</h1>
          {pendingKycCount > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 mt-2">
              {pendingKycCount} Pending KYC Review
            </Badge>
          )}
        </div>
        <Button onClick={() => setShowAddOrganization(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Organization
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Organizations</p>
                <p className="text-2xl font-bold">{organizations.length}</p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">KYC Approved</p>
                <p className="text-2xl font-bold text-green-600">
                  {organizations.filter(o => o.kyc_status === 'approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-600">{pendingKycCount}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">KYC Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {organizations.filter(o => o.kyc_status === 'rejected').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations ({organizations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>KYC Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((organization) => (
                <TableRow key={organization.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Building2 className="h-8 w-8 text-blue-500" />
                      </div>
                      <div>
                        <div className="font-medium">{organization.name}</div>
                        <div className="text-sm text-gray-500">
                          Reg: {organization.registration_number || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {organizationTypes.find(t => t.value === organization.type)?.label || organization.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="flex items-center text-sm">
                        <Mail className="h-3 w-3 mr-1" />
                        {organization.email}
                      </div>
                      {organization.phone && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Phone className="h-3 w-3 mr-1" />
                          {organization.phone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center text-sm">
                      <MapPin className="h-3 w-3 mr-1" />
                      <div>
                        {organization.city && <div>{organization.city}</div>}
                        <div className="text-gray-500">{organization.province}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getKycStatusColor(organization.kyc_status)}>
                      <div className="flex items-center gap-1">
                        {getKycStatusIcon(organization.kyc_status)}
                        {organization.kyc_status || 'pending'}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openEditDialog(organization)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {organization.kyc_status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => openKycDialog(organization)}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Shield className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteOrganization(organization.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Organization Dialog */}
      <Dialog open={showAddOrganization} onOpenChange={setShowAddOrganization}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add New Organization</DialogTitle>
            <DialogDescription>
              Register a new organization for KYC verification
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 max-h-96 overflow-y-auto">
            <div>
              <Label>Organization Name *</Label>
              <Input
                value={newOrganization.name}
                onChange={(e) => setNewOrganization({...newOrganization, name: e.target.value})}
                placeholder="ABC Farming Co."
              />
            </div>
            <div>
              <Label>Registration Number</Label>
              <Input
                value={newOrganization.registration_number}
                onChange={(e) => setNewOrganization({...newOrganization, registration_number: e.target.value})}
                placeholder="2021/123456/07"
              />
            </div>
            <div>
              <Label>Tax Number</Label>
              <Input
                value={newOrganization.tax_number}
                onChange={(e) => setNewOrganization({...newOrganization, tax_number: e.target.value})}
                placeholder="9123456789"
              />
            </div>
            <div>
              <Label>Organization Type</Label>
              <Select value={newOrganization.type} onValueChange={(value) => setNewOrganization({...newOrganization, type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {organizationTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Email *</Label>
              <Input
                type="email"
                value={newOrganization.email}
                onChange={(e) => setNewOrganization({...newOrganization, email: e.target.value})}
                placeholder="contact@abcfarming.co.za"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={newOrganization.phone}
                onChange={(e) => setNewOrganization({...newOrganization, phone: e.target.value})}
                placeholder="+27 11 123 4567"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Input
                value={newOrganization.address}
                onChange={(e) => setNewOrganization({...newOrganization, address: e.target.value})}
                placeholder="123 Farm Road"
              />
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={newOrganization.city}
                onChange={(e) => setNewOrganization({...newOrganization, city: e.target.value})}
                placeholder="Johannesburg"
              />
            </div>
            <div>
              <Label>Province</Label>
              <Select value={newOrganization.province} onValueChange={(value) => setNewOrganization({...newOrganization, province: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Gauteng">Gauteng</SelectItem>
                  <SelectItem value="Western Cape">Western Cape</SelectItem>
                  <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                  <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                  <SelectItem value="Free State">Free State</SelectItem>
                  <SelectItem value="Limpopo">Limpopo</SelectItem>
                  <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
                  <SelectItem value="Northern Cape">Northern Cape</SelectItem>
                  <SelectItem value="North West">North West</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Website</Label>
              <Input
                value={newOrganization.website}
                onChange={(e) => setNewOrganization({...newOrganization, website: e.target.value})}
                placeholder="https://abcfarming.co.za"
              />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea
                value={newOrganization.description}
                onChange={(e) => setNewOrganization({...newOrganization, description: e.target.value})}
                placeholder="Brief description of the organization"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddOrganization(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddOrganization} 
              disabled={loading || !newOrganization.name || !newOrganization.email}
            >
              {loading ? 'Adding...' : 'Add Organization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* KYC Review Dialog */}
      <Dialog open={showKycDialog} onOpenChange={setShowKycDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>KYC Review</DialogTitle>
            <DialogDescription>
              Review and approve/reject KYC documentation
            </DialogDescription>
          </DialogHeader>

          {selectedOrganization && (
            <div className="space-y-4">
              <Alert>
                <Building2 className="h-4 w-4" />
                <AlertDescription>
                  <strong>{selectedOrganization.name}</strong>
                  <br />
                  Registration: {selectedOrganization.registration_number || 'N/A'}
                  <br />
                  Tax Number: {selectedOrganization.tax_number || 'N/A'}
                </AlertDescription>
              </Alert>

              <div className="bg-gray-50 p-4 rounded">
                <h4 className="font-medium mb-2">Organization Details:</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Type:</strong> {selectedOrganization.type}</div>
                  <div><strong>Industry:</strong> {selectedOrganization.industry}</div>
                  <div><strong>Email:</strong> {selectedOrganization.email}</div>
                  <div><strong>Phone:</strong> {selectedOrganization.phone}</div>
                  <div><strong>Location:</strong> {selectedOrganization.city}, {selectedOrganization.province}</div>
                  <div><strong>Website:</strong> {selectedOrganization.website || 'N/A'}</div>
                </div>
              </div>

              <div>
                <Label>Review Notes</Label>
                <Textarea
                  placeholder="Add notes about the KYC review..."
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKycDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => handleKycReview(selectedOrganization?.id, 'reject')}
              disabled={loading}
            >
              Reject KYC
            </Button>
            <Button
              onClick={() => handleKycReview(selectedOrganization?.id, 'approve')}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? 'Processing...' : 'Approve KYC'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}