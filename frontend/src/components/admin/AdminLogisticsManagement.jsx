import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Input, Label, Alert, AlertDescription, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tabs, TabsContent, TabsList, TabsTrigger
} from '../ui';
import { 
  Truck, Building2, MapPin, Phone, Mail, Star, CheckCircle, Clock,
  AlertTriangle, RefreshCw, Plus, Eye, Edit, Ban, Shield
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminLogisticsManagement() {
  const [transporters, setTransporters] = useState([]);
  const [abattoirs, setAbattoirs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showProviderDialog, setShowProviderDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [providerType, setProviderType] = useState('transporter');
  const [newProvider, setNewProvider] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    email: '',
    location: '',
    service_areas: [],
    specializations: [],
    description: ''
  });

  useEffect(() => {
    fetchTransporters();
    fetchAbattoirs();
  }, []);

  const fetchTransporters = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/transporters`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTransporters(data.transporters || []);
      }
    } catch (error) {
      console.error('Error fetching transporters:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAbattoirs = async () => {
    try {
      const response = await fetch(`${API}/admin/abattoirs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAbattoirs(data.abattoirs || []);
      }
    } catch (error) {
      console.error('Error fetching abattoirs:', error);
    }
  };

  const handleCreateProvider = async () => {
    if (!newProvider.company_name || !newProvider.contact_person || !newProvider.phone) {
      alert('Please fill in all required fields');
      return;
    }

    setCreateLoading(true);
    try {
      const endpoint = providerType === 'transporter' ? 'transporters' : 'abattoirs';
      const response = await fetch(`${API}/admin/${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...newProvider,
          type: providerType,
          service_areas: newProvider.service_areas.filter(area => area.trim()),
          specializations: newProvider.specializations.filter(spec => spec.trim())
        })
      });

      if (response.ok) {
        const provider = await response.json();
        if (providerType === 'transporter') {
          setTransporters([...transporters, provider]);
        } else {
          setAbattoirs([...abattoirs, provider]);
        }
        setShowCreateDialog(false);
        setNewProvider({
          company_name: '',
          contact_person: '',
          phone: '',
          email: '',
          location: '',
          service_areas: [],
          specializations: [],
          description: ''
        });
        alert(`${providerType === 'transporter' ? 'Transporter' : 'Abattoir'} added successfully!`);
      } else {
        const error = await response.json();
        alert(`Error adding provider: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating provider:', error);
      alert('Error adding provider. Please try again.');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleUpdateStatus = async (providerId, newStatus, type) => {
    try {
      const endpoint = type === 'transporter' ? 'transporters' : 'abattoirs';
      const response = await fetch(`${API}/admin/${endpoint}/${providerId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        if (type === 'transporter') {
          setTransporters(transporters.map(t => 
            t.id === providerId ? {...t, status: newStatus} : t
          ));
        } else {
          setAbattoirs(abattoirs.map(a => 
            a.id === providerId ? {...a, status: newStatus} : a
          ));
        }
        alert('Provider status updated successfully!');
      } else {
        alert('Error updating provider status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Error updating status. Please try again.');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600';
    if (rating >= 4.0) return 'text-blue-600';
    if (rating >= 3.5) return 'text-yellow-600';
    return 'text-red-600';
  };

  // Mock data for demo
  const mockTransporters = [
    {
      id: 'trans_1',
      company_name: 'SA Livestock Transport',
      contact_person: 'Johan Smit',
      phone: '+27 82 555 0123',
      email: 'johan@salivetransport.co.za',
      location: 'Bloemfontein, Free State',
      service_areas: ['Free State', 'Northern Cape', 'Gauteng'],
      vehicle_count: 15,
      capacity_per_load: '40 cattle / 150 sheep',
      specializations: ['cattle', 'sheep', 'goats'],
      rating: 4.7,
      completed_trips: 1247,
      status: 'active',
      verification_status: 'verified',
      insurance_expires: '2025-12-31',
      permits: ['Animal Transport Permit', 'Cross-Border Permit'],
      created_at: '2024-08-15T10:30:00Z'
    },
    {
      id: 'trans_2',
      company_name: 'Karoo Livestock Logistics',
      contact_person: 'Maria van der Merwe',
      phone: '+27 83 444 0987',
      email: 'maria@karoolifestock.co.za',
      location: 'Kimberley, Northern Cape',
      service_areas: ['Northern Cape', 'Western Cape'],
      vehicle_count: 8,
      capacity_per_load: '25 cattle / 100 sheep',
      specializations: ['cattle', 'sheep'],
      rating: 4.3,
      completed_trips: 892,
      status: 'active',
      verification_status: 'verified',
      insurance_expires: '2025-09-15',
      permits: ['Animal Transport Permit'],
      created_at: '2024-07-22T14:15:00Z'
    },
    {
      id: 'trans_3',
      company_name: 'Limpopo Animal Movers',
      contact_person: 'Thabo Mthembu',
      phone: '+27 84 333 0876',
      email: 'thabo@limpopoanimals.co.za',
      location: 'Polokwane, Limpopo',
      service_areas: ['Limpopo', 'Mpumalanga', 'Gauteng'],
      vehicle_count: 12,
      capacity_per_load: '35 cattle / 120 sheep',
      specializations: ['cattle', 'sheep', 'goats', 'pigs'],
      rating: 4.1,
      completed_trips: 654,
      status: 'pending',
      verification_status: 'pending',
      insurance_expires: '2025-11-30',
      permits: ['Animal Transport Permit'],
      created_at: '2024-08-01T09:45:00Z'
    }
  ];

  const mockAbattoirs = [
    {
      id: 'abattoir_1',
      company_name: 'Highveld Premium Abattoir',
      contact_person: 'David Johnson',
      phone: '+27 82 777 0123',
      email: 'david@highveldabattoir.co.za',
      location: 'Johannesburg, Gauteng',
      service_areas: ['Gauteng', 'North West', 'Free State'],
      daily_capacity: '200 cattle / 500 sheep',
      specializations: ['cattle', 'sheep', 'goats'],
      certifications: ['HACCP', 'ISO 22000', 'Halal', 'Export Grade'],
      rating: 4.8,
      processed_animals: 45623,
      status: 'active',
      verification_status: 'verified',
      license_expires: '2025-12-31',
      created_at: '2023-05-10T08:00:00Z'
    },
    {
      id: 'abattoir_2',
      company_name: 'Cape Town Meat Processing',
      contact_person: 'Sarah Williams',
      phone: '+27 83 888 0987',
      email: 'sarah@ctmeatprocessing.co.za',
      location: 'Cape Town, Western Cape',
      service_areas: ['Western Cape', 'Northern Cape'],
      daily_capacity: '150 cattle / 400 sheep',
      specializations: ['cattle', 'sheep', 'pigs'],
      certifications: ['HACCP', 'Halal'],
      rating: 4.5,
      processed_animals: 32145,
      status: 'active',
      verification_status: 'verified',
      license_expires: '2025-10-15',
      created_at: '2023-07-15T12:30:00Z'
    },
    {
      id: 'abattoir_3',
      company_name: 'Durban Livestock Processing',
      contact_person: 'Raj Patel',
      phone: '+27 84 999 0876',
      email: 'raj@durbanprocessing.co.za',
      location: 'Durban, KwaZulu-Natal',
      service_areas: ['KwaZulu-Natal', 'Eastern Cape'],
      daily_capacity: '100 cattle / 300 sheep',
      specializations: ['cattle', 'sheep', 'goats'],
      certifications: ['HACCP', 'Halal'],
      rating: 4.2,
      processed_animals: 28934,
      status: 'suspended',
      verification_status: 'verified',
      license_expires: '2025-08-30',
      created_at: '2023-09-20T16:20:00Z'
    }
  ];

  const displayTransporters = transporters.length > 0 ? transporters : mockTransporters;
  const displayAbattoirs = abattoirs.length > 0 ? abattoirs : mockAbattoirs;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Logistics Management</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading logistics providers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Logistics Management</h2>
          <p className="text-gray-600">Manage transport and processing providers</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { fetchTransporters(); fetchAbattoirs(); }}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Provider
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Transporters</p>
                <p className="text-2xl font-bold text-blue-600">
                  {displayTransporters.filter(t => t.status === 'active').length}
                </p>
              </div>
              <Truck className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Abattoirs</p>
                <p className="text-2xl font-bold text-green-600">
                  {displayAbattoirs.filter(a => a.status === 'active').length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Verification</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {[...displayTransporters, ...displayAbattoirs].filter(p => p.status === 'pending').length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average Rating</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {[...displayTransporters, ...displayAbattoirs].length > 0
                    ? (
                        [...displayTransporters, ...displayAbattoirs].reduce((sum, p) => sum + (p.rating || 0), 0) / 
                        [...displayTransporters, ...displayAbattoirs].length
                      ).toFixed(1)
                    : '0.0'
                  }
                </p>
              </div>
              <Star className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transporters" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transporters">Transporters ({displayTransporters.length})</TabsTrigger>
          <TabsTrigger value="abattoirs">Abattoirs ({displayAbattoirs.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="transporters">
          <Card>
            <CardHeader>
              <CardTitle>Livestock Transporters</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Service Areas</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayTransporters.map((transporter) => (
                    <TableRow key={transporter.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transporter.company_name}</p>
                          <p className="text-sm text-gray-500">{transporter.location}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{transporter.contact_person}</p>
                          <p className="text-sm text-gray-500">{transporter.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {transporter.service_areas.slice(0, 2).map((area, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                          {transporter.service_areas.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{transporter.service_areas.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{transporter.capacity_per_load}</p>
                        <p className="text-xs text-gray-500">{transporter.vehicle_count} vehicles</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className={`h-4 w-4 ${getRatingColor(transporter.rating)}`} />
                          <span className={getRatingColor(transporter.rating)}>
                            {transporter.rating}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500">{transporter.completed_trips} trips</p>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(transporter.status)}>
                          {transporter.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {setSelectedProvider({...transporter, type: 'transporter'}); setShowProviderDialog(true);}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {transporter.status === 'active' ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateStatus(transporter.id, 'suspended', 'transporter')}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateStatus(transporter.id, 'active', 'transporter')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="abattoirs">
          <Card>
            <CardHeader>
              <CardTitle>Processing Facilities (Abattoirs)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facility</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Service Areas</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Certifications</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayAbattoirs.map((abattoir) => (
                    <TableRow key={abattoir.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{abattoir.company_name}</p>
                          <p className="text-sm text-gray-500">{abattoir.location}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{abattoir.contact_person}</p>
                          <p className="text-sm text-gray-500">{abattoir.phone}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {abattoir.service_areas.slice(0, 2).map((area, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {area}
                            </Badge>
                          ))}
                          {abattoir.service_areas.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{abattoir.service_areas.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{abattoir.daily_capacity}</p>
                        <p className="text-xs text-gray-500">{abattoir.processed_animals} processed</p>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {abattoir.certifications.slice(0, 2).map((cert, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                          {abattoir.certifications.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{abattoir.certifications.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(abattoir.status)}>
                          {abattoir.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {setSelectedProvider({...abattoir, type: 'abattoir'}); setShowProviderDialog(true);}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {abattoir.status === 'active' ? (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateStatus(abattoir.id, 'suspended', 'abattoir')}
                            >
                              <Ban className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleUpdateStatus(abattoir.id, 'active', 'abattoir')}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Provider Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Logistics Provider</DialogTitle>
            <DialogDescription>
              Add a new transporter or processing facility to the platform
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="provider-type">Provider Type *</Label>
              <Select value={providerType} onValueChange={setProviderType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select provider type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="transporter">Livestock Transporter</SelectItem>
                  <SelectItem value="abattoir">Processing Facility (Abattoir)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  value={newProvider.company_name}
                  onChange={(e) => setNewProvider({...newProvider, company_name: e.target.value})}
                  placeholder="Company Name"
                />
              </div>
              
              <div>
                <Label htmlFor="contact_person">Contact Person *</Label>
                <Input
                  id="contact_person"
                  value={newProvider.contact_person}
                  onChange={(e) => setNewProvider({...newProvider, contact_person: e.target.value})}
                  placeholder="Contact Person Name"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={newProvider.phone}
                  onChange={(e) => setNewProvider({...newProvider, phone: e.target.value})}
                  placeholder="+27 82 555 0123"
                />
              </div>
              
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={newProvider.email}
                  onChange={(e) => setNewProvider({...newProvider, email: e.target.value})}
                  placeholder="contact@company.co.za"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={newProvider.location}
                onChange={(e) => setNewProvider({...newProvider, location: e.target.value})}
                placeholder="City, Province"
              />
            </div>
            
            <div>
              <Label htmlFor="service_areas">Service Areas (comma separated)</Label>
              <Input
                id="service_areas"
                value={newProvider.service_areas.join(', ')}
                onChange={(e) => setNewProvider({
                  ...newProvider, 
                  service_areas: e.target.value.split(',').map(area => area.trim()).filter(area => area)
                })}
                placeholder="Gauteng, Free State, Northern Cape"
              />
            </div>
            
            <div>
              <Label htmlFor="specializations">Specializations (comma separated)</Label>
              <Input
                id="specializations"
                value={newProvider.specializations.join(', ')}
                onChange={(e) => setNewProvider({
                  ...newProvider, 
                  specializations: e.target.value.split(',').map(spec => spec.trim()).filter(spec => spec)
                })}
                placeholder="Cattle, Sheep, Goats"
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newProvider.description}
                onChange={(e) => setNewProvider({...newProvider, description: e.target.value})}
                placeholder="Brief description of services offered"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleCreateProvider}
              disabled={createLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {createLoading ? 'Adding...' : `Add ${providerType === 'transporter' ? 'Transporter' : 'Abattoir'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Provider Details Dialog */}
      <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProvider?.type === 'transporter' ? 'Transporter' : 'Abattoir'} Details
            </DialogTitle>
            <DialogDescription>
              View detailed information about this logistics provider
            </DialogDescription>
          </DialogHeader>
          
          {selectedProvider && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Company Name</Label>
                  <p className="text-sm">{selectedProvider.company_name}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedProvider.status)}>
                    {selectedProvider.status}
                  </Badge>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Contact Person</Label>
                  <p className="text-sm">{selectedProvider.contact_person}</p>
                </div>
                
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm">{selectedProvider.phone}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Location</Label>
                <p className="text-sm">{selectedProvider.location}</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Service Areas</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedProvider.service_areas.map((area, index) => (
                    <Badge key={index} variant="outline">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Specializations</Label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {selectedProvider.specializations.map((spec, index) => (
                    <Badge key={index} variant="outline">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {selectedProvider.type === 'transporter' && (
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Vehicle Count</Label>
                    <p className="text-sm">{selectedProvider.vehicle_count}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Capacity</Label>
                    <p className="text-sm">{selectedProvider.capacity_per_load}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Completed Trips</Label>
                    <p className="text-sm">{selectedProvider.completed_trips}</p>
                  </div>
                </div>
              )}
              
              {selectedProvider.type === 'abattoir' && (
                <div>
                  <Label className="text-sm font-medium">Certifications</Label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedProvider.certifications.map((cert, index) => (
                      <Badge key={index} variant="outline">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProviderDialog(false)}>
              Close
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Edit Provider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}