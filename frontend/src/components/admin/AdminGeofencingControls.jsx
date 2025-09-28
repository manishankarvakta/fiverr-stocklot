import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Input, Label, Alert, AlertDescription, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '../ui';
import { 
  MapPin, AlertTriangle, Shield, Globe, RefreshCw, Plus, Eye, Edit, Trash2,
  Clock, Activity, Ban, CheckCircle
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminGeofencingControls() {
  const [diseaseZones, setDiseaseZones] = useState([]);
  const [restrictions, setRestrictions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showZoneDialog, setShowZoneDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    fetchDiseaseZones();
    fetchRestrictions();
  }, []);

  const fetchDiseaseZones = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/disease-zones`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDiseaseZones(data.zones || []);
      }
    } catch (error) {
      console.error('Error fetching disease zones:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRestrictions = async () => {
    try {
      const response = await fetch(`${API}/admin/movement-restrictions`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setRestrictions(data.restrictions || []);
      }
    } catch (error) {
      console.error('Error fetching restrictions:', error);
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-red-100 text-red-800';
      case 'monitoring': return 'bg-yellow-100 text-yellow-800';
      case 'cleared': return 'bg-green-100 text-green-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Mock data for demo
  const mockDiseaseZones = [
    {
      id: 'zone_1',
      name: 'KwaZulu-Natal FMD Outbreak Zone',
      disease_type: 'Foot and Mouth Disease',
      severity: 'critical',
      status: 'active',
      center_coordinates: { lat: -29.8587, lng: 31.0218 },
      radius_km: 50,
      affected_provinces: ['KwaZulu-Natal'],
      affected_districts: ['uMgungundlovu', 'Uthukela'],
      affected_species: ['cattle', 'goats', 'sheep'],
      created_at: '2025-08-20T10:30:00Z',
      created_by: 'Department of Agriculture',
      restrictions: ['movement_ban', 'market_suspension', 'quarantine'],
      estimated_affected_farms: 156,
      confirmed_cases: 23,
      last_case_reported: '2025-08-28T16:20:00Z'
    },
    {
      id: 'zone_2',
      name: 'Western Cape Avian Flu Monitoring Zone',
      disease_type: 'Avian Influenza H5N1',
      severity: 'high',
      status: 'monitoring',
      center_coordinates: { lat: -33.9249, lng: 18.4241 },
      radius_km: 25,
      affected_provinces: ['Western Cape'],
      affected_districts: ['City of Cape Town', 'Stellenbosch'],
      affected_species: ['chickens', 'ducks', 'geese'],
      created_at: '2025-08-25T14:15:00Z',
      created_by: 'Provincial Veterinary Services',
      restrictions: ['increased_surveillance', 'movement_permits'],
      estimated_affected_farms: 34,
      confirmed_cases: 3,
      last_case_reported: '2025-08-27T11:45:00Z'
    },
    {
      id: 'zone_3',
      name: 'Limpopo Lumpy Skin Disease Zone',
      disease_type: 'Lumpy Skin Disease',
      severity: 'medium',
      status: 'under_review',
      center_coordinates: { lat: -23.8962, lng: 29.4419 },
      radius_km: 35,
      affected_provinces: ['Limpopo'],
      affected_districts: ['Capricorn', 'Mopani'],
      affected_species: ['cattle'],
      created_at: '2025-08-15T09:00:00Z',
      created_by: 'Provincial Veterinary Services',
      restrictions: ['vaccination_required', 'movement_permits'],
      estimated_affected_farms: 89,
      confirmed_cases: 12,
      last_case_reported: '2025-08-26T13:30:00Z'
    },
    {
      id: 'zone_4',
      name: 'Eastern Cape Newcastle Disease - Cleared',
      disease_type: 'Newcastle Disease',
      severity: 'low',
      status: 'cleared',
      center_coordinates: { lat: -32.2968, lng: 26.4194 },
      radius_km: 20,
      affected_provinces: ['Eastern Cape'],
      affected_districts: ['Buffalo City'],
      affected_species: ['chickens'],
      created_at: '2025-07-10T12:00:00Z',
      cleared_at: '2025-08-15T10:00:00Z',
      created_by: 'Department of Agriculture',
      restrictions: [],
      estimated_affected_farms: 21,
      confirmed_cases: 7,
      last_case_reported: '2025-07-28T15:20:00Z'
    }
  ];

  const mockRestrictions = [
    {
      id: 'restr_1',
      zone_id: 'zone_1',
      zone_name: 'KwaZulu-Natal FMD Outbreak Zone',
      type: 'movement_ban',
      title: 'Complete Movement Ban',
      description: 'No movement of susceptible animals in or out of the zone',
      species: ['cattle', 'goats', 'sheep'],
      active: true,
      created_at: '2025-08-20T10:30:00Z',
      expires_at: '2025-09-20T10:30:00Z'
    },
    {
      id: 'restr_2',
      zone_id: 'zone_2',
      zone_name: 'Western Cape Avian Flu Monitoring Zone',
      type: 'movement_permits',
      title: 'Movement Permits Required',
      description: 'All poultry movement requires veterinary permits and health certificates',
      species: ['chickens', 'ducks', 'geese'],
      active: true,
      created_at: '2025-08-25T14:15:00Z',
      expires_at: '2025-09-25T14:15:00Z'
    },
    {
      id: 'restr_3',
      zone_id: 'zone_1',
      zone_name: 'KwaZulu-Natal FMD Outbreak Zone',
      type: 'market_suspension',
      title: 'Livestock Market Suspension',
      description: 'All livestock markets and auctions suspended within the zone',
      species: ['cattle', 'goats', 'sheep'],
      active: true,
      created_at: '2025-08-20T10:30:00Z',
      expires_at: '2025-09-20T10:30:00Z'
    }
  ];

  const displayZones = diseaseZones.length > 0 ? diseaseZones : mockDiseaseZones;
  const displayRestrictions = restrictions.length > 0 ? restrictions : mockRestrictions;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold">Disease Zone & Geofencing Controls</h2>
        </div>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="text-gray-500 mt-2">Loading disease zones...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Disease Zone & Geofencing Controls</h2>
          <p className="text-gray-600">Manage disease outbreak zones and movement restrictions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchDiseaseZones}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            className="bg-red-600 hover:bg-red-700"
            onClick={() => setShowCreateDialog(true)}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Disease Zone
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Zones</p>
                <p className="text-2xl font-bold text-red-600">
                  {displayZones.filter(z => z.status === 'active').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Under Monitoring</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {displayZones.filter(z => z.status === 'monitoring').length}
                </p>
              </div>
              <Activity className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active Restrictions</p>
                <p className="text-2xl font-bold text-orange-600">
                  {displayRestrictions.filter(r => r.active).length}
                </p>
              </div>
              <Ban className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Affected Farms</p>
                <p className="text-2xl font-bold text-blue-600">
                  {displayZones.reduce((sum, z) => sum + z.estimated_affected_farms, 0)}
                </p>
              </div>
              <Shield className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Active Zones Alert */}
      {displayZones.filter(z => z.status === 'active').length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Active Disease Zones:</strong> {displayZones.filter(z => z.status === 'active').length} zones are currently active with movement restrictions in place.
          </AlertDescription>
        </Alert>
      )}

      {/* Disease Zones Table */}
      <Card>
        <CardHeader>
          <CardTitle>Disease Zones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone Name</TableHead>
                <TableHead>Disease Type</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Affected Areas</TableHead>
                <TableHead>Confirmed Cases</TableHead>
                <TableHead>Last Case</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayZones.map((zone) => (
                <TableRow key={zone.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{zone.name}</div>
                      <div className="text-sm text-gray-500">
                        {zone.radius_km}km radius
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{zone.disease_type}</TableCell>
                  <TableCell>
                    <Badge className={getSeverityColor(zone.severity)}>
                      {zone.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(zone.status)}>
                      {zone.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium">
                        {zone.affected_provinces.join(', ')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {zone.estimated_affected_farms} farms
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold">{zone.confirmed_cases}</TableCell>
                  <TableCell>
                    {new Date(zone.last_case_reported).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {setSelectedZone(zone); setShowZoneDialog(true);}}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {zone.status === 'active' && (
                        <Button size="sm" className="bg-green-600 hover:bg-green-700">
                          Clear Zone
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

      {/* Movement Restrictions */}  
      <Card>
        <CardHeader>
          <CardTitle>Active Movement Restrictions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Zone</TableHead>
                <TableHead>Restriction Type</TableHead>
                <TableHead>Species</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRestrictions.filter(r => r.active).map((restriction) => (
                <TableRow key={restriction.id}>
                  <TableCell>
                    <div className="font-medium">{restriction.zone_name}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{restriction.type.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {restriction.species.map((species, index) => (
                        <Badge key={index} variant="outline" className="text-xs mr-1">
                          {species}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-xs">
                      <div className="font-medium">{restriction.title}</div>
                      <div className="text-sm text-gray-500">{restriction.description}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(restriction.expires_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
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

      {/* Zone Details Dialog */}
      <Dialog open={showZoneDialog} onOpenChange={setShowZoneDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Disease Zone Details</DialogTitle>
            <DialogDescription>
              Comprehensive information about the disease outbreak zone
            </DialogDescription>
          </DialogHeader>
          
          {selectedZone && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Zone Name</Label>
                  <p className="text-sm">{selectedZone.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Disease Type</Label>
                  <p className="text-sm">{selectedZone.disease_type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Severity Level</Label>
                  <Badge className={getSeverityColor(selectedZone.severity)}>
                    {selectedZone.severity}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Current Status</Label>
                  <Badge className={getStatusColor(selectedZone.status)}>
                    {selectedZone.status.replace('_', ' ')}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Radius</Label>
                  <p className="text-sm">{selectedZone.radius_km} kilometers</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Confirmed Cases</Label>
                  <p className="text-sm font-semibold text-red-600">{selectedZone.confirmed_cases}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Estimated Affected Farms</Label>
                  <p className="text-sm">{selectedZone.estimated_affected_farms}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Case Reported</Label>
                  <p className="text-sm">{new Date(selectedZone.last_case_reported).toLocaleString()}</p>
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Affected Provinces</Label>
                <div className="space-y-1 mt-1">
                  {selectedZone.affected_provinces.map((province, index) => (
                    <Badge key={index} variant="outline" className="mr-2">
                      {province}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Affected Districts</Label>
                <div className="space-y-1 mt-1">
                  {selectedZone.affected_districts.map((district, index) => (
                    <Badge key={index} variant="outline" className="mr-2">
                      {district}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Affected Species</Label>
                <div className="space-y-1 mt-1">
                  {selectedZone.affected_species.map((species, index) => (
                    <Badge key={index} variant="outline" className="mr-2">
                      {species}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Active Restrictions</Label>
                <div className="space-y-1 mt-1">
                  {selectedZone.restrictions.map((restriction, index) => (
                    <Badge key={index} className="mr-2 bg-red-100 text-red-800">
                      {restriction.replace('_', ' ')}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <Label className="text-sm font-medium">Created By</Label>
                <p className="text-sm">{selectedZone.created_by}</p>
                <p className="text-xs text-gray-500">{new Date(selectedZone.created_at).toLocaleString()}</p>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowZoneDialog(false)}>
              Close
            </Button>
            <Button variant="outline">
              View on Map
            </Button>
            {selectedZone?.status === 'active' && (
              <Button className="bg-green-600 hover:bg-green-700">
                Clear Zone
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Zone Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Disease Zone</DialogTitle>
            <DialogDescription>
              Define a new disease outbreak zone with appropriate restrictions
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Zone Name</Label>
                <Input placeholder="e.g., Gauteng ASF Outbreak Zone" />
              </div>
              <div>
                <Label>Disease Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select disease" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fmd">Foot and Mouth Disease</SelectItem>
                    <SelectItem value="asf">African Swine Fever</SelectItem>
                    <SelectItem value="avian_flu">Avian Influenza</SelectItem>
                    <SelectItem value="lumpy_skin">Lumpy Skin Disease</SelectItem>
                    <SelectItem value="newcastle">Newcastle Disease</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity Level</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Radius (km)</Label>
                <Input type="number" placeholder="50" />
              </div>
            </div>
            
            <div>
              <Label>Center Coordinates</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Latitude (e.g., -26.2041)" />
                <Input placeholder="Longitude (e.g., 28.0473)" />
              </div>
            </div>

            <div>
              <Label>Affected Species</Label>
              <Textarea placeholder="List affected species (cattle, goats, sheep, etc.)" />
            </div>

            <div>
              <Label>Initial Restrictions</Label>
              <Textarea placeholder="Describe movement restrictions and control measures" />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-red-600 hover:bg-red-700">
              Create Disease Zone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}