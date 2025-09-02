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
      joined_date: '2024-03-15',
      last_trip: '2025-08-29T14:30:00Z'
    },
    {
      id: 'trans_2',
      company_name: 'KZN Livestock Logistics',
      contact_person: 'Thabo Mthembu',
      phone: '+27 83 444 0156',
      email: 'operations@kznlivestock.co.za',
      location: 'Pietermaritzburg, KwaZulu-Natal',
      service_areas: ['KwaZulu-Natal', 'Eastern Cape', 'Mpumalanga'],
      vehicle_count: 8,
      capacity_per_load: '25 cattle / 100 sheep',
      specializations: ['cattle', 'poultry'],
      rating: 4.3,
      completed_trips: 892,
      status: 'active',
      verification_status: 'verified',
      insurance_expires: '2026-06-30',
      permits: ['Animal Transport Permit'],
      joined_date: '2024-06-20',
      last_trip: '2025-08-28T11:45:00Z'
    },
    {
      id: 'trans_3',
      company_name: 'Cape Animal Transport',
      contact_person: 'Maria van der Walt',
      phone: '+27 84 333 0189',
      email: 'maria@capetransport.co.za',
      location: 'Worcester, Western Cape',
      service_areas: ['Western Cape', 'Northern Cape'],
      vehicle_count: 12,
      capacity_per_load: '30 cattle / 120 sheep',
      specializations: ['cattle', 'sheep', 'ostrich'],
      rating: 4.9,
      completed_trips: 1589,
      status: 'pending',
      verification_status: 'pending_documents',
      insurance_expires: '2025-10-15',
      permits: ['Animal Transport Permit'],
      joined_date: '2025-08-25',
      last_trip: null
    },
    {
      id: 'trans_4',
      company_name: 'Limpopo Livestock Movers',
      contact_person: 'Peter Maluleke',
      phone: '+27 81 222 0167',
      email: 'peter@limpolivestock.co.za',
      location: 'Polokwane, Limpopo',
      service_areas: ['Limpopo', 'Mpumalanga', 'Gauteng'],
      vehicle_count: 6,
      capacity_per_load: '20 cattle / 80 sheep',
      specializations: ['cattle', 'goats'],
      rating: 3.8,
      completed_trips: 456,
      status: 'suspended',
      verification_status: 'verified',
      insurance_expires: '2025-11-30',
      permits: ['Animal Transport Permit'],
      joined_date: '2024-09-10',
      last_trip: '2025-08-15T09:20:00Z',
      suspension_reason: 'Customer complaints about animal welfare'
    }
  ];

  const mockAbattoirs = [
    {
      id: 'abatt_1',
      facility_name: 'Highveld Abattoir',
      owner_name: 'Highveld Meat Processing Ltd',
      contact_person: 'David Botha',
      phone: '+27 11 555 0234',
      email: 'operations@highveldmeat.co.za',
      address: '123 Industrial Road, Germiston, Gauteng',
      capacity_per_day: '500 cattle / 2000 sheep',
      specializations: ['cattle', 'sheep', 'goats'],
      halal_certified: true,
      haccp_certified: true,
      rating: 4.6,
      processed_animals: 185000,
      status: 'active',
      verification_status: 'verified',
      health_certificate_expires: '2026-03-15',
      certifications: ['HACCP', 'Halal', 'ISO 22000'],
      established_date: '2018-05-10',
      last_inspection: '2025-07-20T10:00:00Z'
    },
    {
      id: 'abatt_2',
      facility_name: 'Western Cape Premium Abattoir',
      owner_name: 'Cape Premium Meats',
      contact_person: 'Susan Williams',
      phone: '+27 21 444 0267',
      email: 'susan@capepremium.co.za',
      address: '456 Meat Street, Parow, Western Cape',
      capacity_per_day: '300 cattle / 1500 sheep',
      specializations: ['cattle', 'sheep', 'lamb'],
      halal_certified: false,
      haccp_certified: true,
      rating: 4.8,
      processed_animals: 95000,
      status: 'active',
      verification_status: 'verified',
      health_certificate_expires: '2025-12-10',
      certifications: ['HACCP', 'ISO 22000', 'Organic Certified'],
      established_date: '2020-02-28',
      last_inspection: '2025-08-15T14:30:00Z'
    },
    {
      id: 'abatt_3',
      facility_name: 'KZN Halal Processing',
      owner_name: 'Crescent Foods Ltd',
      contact_person: 'Ahmed Hassan',
      phone: '+27 31 333 0198',
      email: 'ahmed@crescentfoods.co.za',
      address: '789 Halal Avenue, Durban, KwaZulu-Natal',
      capacity_per_day: '200 cattle / 1000 sheep',
      specializations: ['cattle', 'sheep', 'goats', 'poultry'],
      halal_certified: true,
      haccp_certified: true,
      rating: 4.4,
      processed_animals: 67000,
      status: 'pending',
      verification_status: 'pending_inspection',
      health_certificate_expires: '2025-11-20',
      certifications: ['Halal', 'HACCP'],
      established_date: '2023-08-15',
      last_inspection: null
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
          <p className="text-gray-600">Manage transporters and abattoir partners</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => {fetchTransporters(); fetchAbattoirs();}}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button className="bg-green-600 hover:bg-green-700">
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
                <p className="text-2xl font-bold text-green-600">
                  {displayTransporters.filter(t => t.status === 'active').length}
                </p>
              </div>
              <Truck className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Abattoirs</p>
                <p className="text-2xl font-bold text-blue-600">
                  {displayAbattoirs.filter(a => a.status === 'active').length}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Approvals</p>
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
                <p className="text-sm text-gray-500">Total Fleet Size</p>
                <p className="text-2xl font-bold text-purple-600">
                  {displayTransporters.reduce((sum, t) => sum + t.vehicle_count, 0)}
                </p>
              </div>
              <Shield className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transporters" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transporters">Transporters</TabsTrigger>
          <TabsTrigger value="abattoirs">Abattoirs</TabsTrigger>
          <TabsTrigger value="pending">Pending Approvals</TabsTrigger>
        </TabsList>

        <TabsContent value="transporters">
          <Card>
            <CardHeader>
              <CardTitle>Transport Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Fleet</TableHead>
                    <TableHead>Specialization</TableHead>
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
                          <div className="font-medium">{transporter.company_name}</div>
                          <div className="text-sm text-gray-500">{transporter.contact_person}</div>
                          <div className="text-sm text-gray-500">{transporter.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{transporter.location}</div>
                          <div className="text-sm text-gray-500">
                            {transporter.service_areas.length} service areas
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-semibold">{transporter.vehicle_count} vehicles</div>
                          <div className="text-sm text-gray-500">{transporter.capacity_per_load}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {transporter.specializations.slice(0, 2).map((spec, index) => (
                            <Badge key={index} variant="outline" className="text-xs mr-1">
                              {spec}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className={`h-4 w-4 ${getRatingColor(transporter.rating)}`} />
                          <span className={`font-medium ${getRatingColor(transporter.rating)}`}>
                            {transporter.rating}
                          </span>
                          <span className="text-sm text-gray-500">
                            ({transporter.completed_trips})
                          </span>
                        </div>
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
                            onClick={() => {setSelectedProvider(transporter); setShowProviderDialog(true);}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {transporter.status === 'active' && (
                            <Button size="sm" variant="outline">
                              <Ban className="h-4 w-4" />
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
              <CardTitle>Abattoir Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Facility</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Capacity</TableHead>
                    <TableHead>Certifications</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayAbattoirs.map((abattoir) => (
                    <TableRow key={abattoir.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{abattoir.facility_name}</div>
                          <div className="text-sm text-gray-500">{abattoir.owner_name}</div>
                          <div className="text-sm text-gray-500">{abattoir.contact_person}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <MapPin className="h-4 w-4 inline mr-1" />
                          {abattoir.address.split(',').slice(-1)[0]}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{abattoir.capacity_per_day}</div>
                        <div className="text-sm text-gray-500">
                          {abattoir.processed_animals.toLocaleString()} processed
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {abattoir.certifications.slice(0, 2).map((cert, index) => (
                            <Badge key={index} variant="outline" className="text-xs mr-1">
                              {cert}
                            </Badge>
                          ))}
                          {abattoir.halal_certified && (
                            <Badge className="bg-green-100 text-green-800 text-xs">Halal</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Star className={`h-4 w-4 ${getRatingColor(abattoir.rating)}`} />
                          <span className={`font-medium ${getRatingColor(abattoir.rating)}`}>
                            {abattoir.rating}
                          </span>
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
                            onClick={() => {setSelectedProvider(abattoir); setShowProviderDialog(true);}}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline">
                            <Edit className="h-4 w-4" />
                          </Button>
                          {abattoir.status === 'active' && (
                            <Button size="sm" variant="outline">
                              <Ban className="h-4 w-4" />
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

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Approvals</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Provider</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Verification Status</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...displayTransporters, ...displayAbattoirs]
                    .filter(provider => provider.status === 'pending')
                    .map((provider) => (
                    <TableRow key={provider.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {provider.company_name || provider.facility_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {provider.owner_name || provider.contact_person}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {provider.vehicle_count ? 'Transporter' : 'Abattoir'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {provider.phone}
                          </div>
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {provider.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={
                          provider.verification_status === 'verified' ? 'bg-green-100 text-green-800' :
                          provider.verification_status === 'pending_documents' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-blue-100 text-blue-800'
                        }>
                          {provider.verification_status?.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(provider.joined_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700">
                            Approve
                          </Button>
                          <Button size="sm" variant="outline">
                            Reject
                          </Button>
                          <Button size="sm" variant="outline">
                            Request Info
                          </Button>
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

      {/* Provider Details Dialog */}
      <Dialog open={showProviderDialog} onOpenChange={setShowProviderDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedProvider?.company_name || selectedProvider?.facility_name} Details
            </DialogTitle>
            <DialogDescription>
              Comprehensive provider information and performance metrics
            </DialogDescription>
          </DialogHeader>
          
          {selectedProvider && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Company/Facility</Label>
                  <p className="text-sm">{selectedProvider.company_name || selectedProvider.facility_name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Contact Person</Label>
                  <p className="text-sm">{selectedProvider.contact_person}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm">{selectedProvider.phone}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Email</Label>
                  <p className="text-sm">{selectedProvider.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Badge className={getStatusColor(selectedProvider.status)}>
                    {selectedProvider.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Rating</Label>
                  <div className="flex items-center gap-1">
                    <Star className={`h-4 w-4 ${getRatingColor(selectedProvider.rating)}`} />
                    <span className={`font-medium ${getRatingColor(selectedProvider.rating)}`}>
                      {selectedProvider.rating}
                    </span>
                  </div>
                </div>
              </div>
              
              {selectedProvider.vehicle_count && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Vehicle Count</Label>
                      <p className="text-sm font-semibold">{selectedProvider.vehicle_count}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Capacity per Load</Label>
                      <p className="text-sm">{selectedProvider.capacity_per_load}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Completed Trips</Label>
                      <p className="text-sm font-semibold">{selectedProvider.completed_trips}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Insurance Expires</Label>
                      <p className="text-sm">{new Date(selectedProvider.insurance_expires).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div>
                    <Label className="text-sm font-medium">Service Areas</Label>
                    <div className="space-y-1 mt-1">
                      {selectedProvider.service_areas.map((area, index) => (
                        <Badge key={index} variant="outline" className="mr-2">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Permits</Label>
                    <div className="space-y-1 mt-1">
                      {selectedProvider.permits.map((permit, index) => (
                        <Badge key={index} className="mr-2 bg-blue-100 text-blue-800">
                          {permit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedProvider.capacity_per_day && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Daily Capacity</Label>
                      <p className="text-sm font-semibold">{selectedProvider.capacity_per_day}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Animals Processed</Label>
                      <p className="text-sm font-semibold">{selectedProvider.processed_animals?.toLocaleString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Health Certificate</Label>
                      <p className="text-sm">Expires: {new Date(selectedProvider.health_certificate_expires).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Inspection</Label>
                      <p className="text-sm">
                        {selectedProvider.last_inspection ? 
                          new Date(selectedProvider.last_inspection).toLocaleDateString() : 
                          'Pending'
                        }
                      </p>
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Certifications</Label>
                    <div className="space-y-1 mt-1">
                      {selectedProvider.certifications?.map((cert, index) => (
                        <Badge key={index} className="mr-2 bg-green-100 text-green-800">
                          {cert}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedProvider.suspension_reason && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Suspension Reason:</strong> {selectedProvider.suspension_reason}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProviderDialog(false)}>
              Close
            </Button>
            <Button variant="outline">
              Contact Provider
            </Button>
            {selectedProvider?.status === 'pending' && (
              <Button className="bg-green-600 hover:bg-green-700">
                Approve Provider
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}