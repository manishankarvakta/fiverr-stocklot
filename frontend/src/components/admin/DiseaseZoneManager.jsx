'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Alert, AlertDescription } from '../ui/alert';
import { Shield, AlertTriangle, Globe, MapPin } from 'lucide-react';
import ServiceAreaEditor from '../geo/ServiceAreaEditor';

const SPECIES = ['Cattle', 'Sheep', 'Goats', 'Chickens', 'Ducks', 'Turkeys', 'Pigs', 'Ostrich', 'Fish'];

const DISEASE_ZONES = [
  {
    id: 1,
    name: 'FMD Control Zone - Limpopo',
    species: ['Cattle', 'Sheep', 'Goats'],
    rule: 'BLOCK',
    severity: 'HIGH',
    activeFrom: '2024-01-15',
    activeTo: '2024-12-31',
    affected_areas: ['Limpopo Province'],
    status: 'active'
  },
  {
    id: 2,
    name: 'Avian Flu Monitoring - Western Cape',
    species: ['Chickens', 'Ducks', 'Turkeys'],
    rule: 'REQUIRE_DOCS',
    severity: 'MEDIUM',
    activeFrom: '2024-03-01',
    activeTo: null,
    affected_areas: ['Western Cape farms near wetlands'],
    status: 'active',
    requiredDocs: ['VET_HEALTH', 'AVIAN_SCREENING']
  }
];

export default function DiseaseZoneManager() {
  const [zones, setZones] = useState(DISEASE_ZONES);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newZone, setNewZone] = useState({
    name: '',
    species: ['Cattle'],
    rule: 'BLOCK',
    severity: 'HIGH',
    activeFrom: '',
    activeTo: '',
    requiredDocs: []
  });

  const [serviceArea, setServiceArea] = useState({
    mode: 'PROVINCES',
    provinces: ['LP'] // Limpopo
  });

  const handleCreateZone = () => {
    const zone = {
      ...newZone,
      id: zones.length + 1,
      status: 'active',
      affected_areas: serviceArea.mode === 'PROVINCES' ? serviceArea.provinces : ['Custom area']
    };
    
    setZones([...zones, zone]);
    setShowCreateForm(false);
    setNewZone({
      name: '',
      species: ['Cattle'],
      rule: 'BLOCK',
      severity: 'HIGH',
      activeFrom: '',
      activeTo: '',
      requiredDocs: []
    });
    
    alert('Disease zone created successfully!');
  };

  const handleDeactivateZone = (zoneId) => {
    setZones(zones.map(zone => 
      zone.id === zoneId ? { ...zone, status: 'inactive' } : zone
    ));
    alert('Disease zone deactivated.');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-emerald-900">Disease Zone Management</h2>
          <p className="text-emerald-700">Control livestock movement during disease outbreaks</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)}
          className="bg-red-600 hover:bg-red-700 text-white"
        >
          <Shield className="h-4 w-4 mr-2" />
          Create Disease Zone
        </Button>
      </div>

      {/* Active Disease Zones */}
      <div className="grid gap-4">
        {zones.map(zone => (
          <Card key={zone.id} className={`border-2 ${
            zone.status === 'active' ? 
            (zone.severity === 'HIGH' ? 'border-red-300 bg-red-50' : 
             zone.severity === 'MEDIUM' ? 'border-amber-300 bg-amber-50' : 
             'border-blue-300 bg-blue-50') : 
            'border-gray-300 bg-gray-50'
          }`}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{zone.name}</h3>
                    <Badge className={`${
                      zone.severity === 'HIGH' ? 'bg-red-600' :
                      zone.severity === 'MEDIUM' ? 'bg-amber-600' :
                      'bg-blue-600'
                    } text-white`}>
                      {zone.severity}
                    </Badge>
                    <Badge variant={zone.status === 'active' ? 'default' : 'secondary'}>
                      {zone.status}
                    </Badge>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <p className="text-gray-600">Affected Species</p>
                      <p className="font-medium">{zone.species.join(', ')}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Rule</p>
                      <p className="font-medium">
                        {zone.rule === 'BLOCK' ? (
                          <span className="text-red-700">Movement Blocked</span>
                        ) : (
                          <span className="text-amber-700">Extra Documents Required</span>
                        )}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600">Duration</p>
                      <p className="font-medium">
                        {zone.activeFrom} {zone.activeTo ? `to ${zone.activeTo}` : '(ongoing)'}
                      </p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <p className="text-gray-600 text-sm">Affected Areas</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {zone.affected_areas.map(area => (
                        <Badge key={area} variant="outline" className="text-xs">
                          <MapPin className="h-3 w-3 mr-1" />
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {zone.requiredDocs && zone.requiredDocs.length > 0 && (
                    <div>
                      <p className="text-gray-600 text-sm">Required Documents</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {zone.requiredDocs.map(doc => (
                          <Badge key={doc} className="text-xs bg-amber-100 text-amber-800">
                            {doc}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  {zone.status === 'active' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-300 text-red-700 hover:bg-red-50"
                      onClick={() => handleDeactivateZone(zone.id)}
                    >
                      Deactivate
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    Edit Zone
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Disease Zone Form */}
      {showCreateForm && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="flex items-center text-red-900">
              <AlertTriangle className="mr-2 h-5 w-5" />
              Create New Disease Control Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert className="bg-red-50 border-red-200">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Important:</strong> Disease zones will immediately restrict livestock movement 
                and trading in the specified areas. Ensure all details are accurate.
              </AlertDescription>
            </Alert>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <Label>Zone Name</Label>
                <Input 
                  value={newZone.name}
                  onChange={(e) => setNewZone({...newZone, name: e.target.value})}
                  placeholder="e.g., FMD Control Zone - Eastern Cape"
                />
              </div>
              <div>
                <Label>Control Rule</Label>
                <Select value={newZone.rule} onValueChange={(v) => setNewZone({...newZone, rule: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BLOCK">Block All Movement</SelectItem>
                    <SelectItem value="REQUIRE_DOCS">Require Extra Documents</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Severity Level</Label>
                <Select value={newZone.severity} onValueChange={(v) => setNewZone({...newZone, severity: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="HIGH">High Risk</SelectItem>
                    <SelectItem value="MEDIUM">Medium Risk</SelectItem>
                    <SelectItem value="LOW">Low Risk</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Affected Species</Label>
              <div className="grid grid-cols-3 md:grid-cols-5 gap-2 mt-2">
                {SPECIES.map(species => (
                  <label key={species} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      checked={newZone.species.includes(species)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewZone({...newZone, species: [...newZone.species, species]});
                        } else {
                          setNewZone({...newZone, species: newZone.species.filter(s => s !== species)});
                        }
                      }}
                    />
                    {species}
                  </label>
                ))}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>Active From</Label>
                <Input 
                  type="date"
                  value={newZone.activeFrom}
                  onChange={(e) => setNewZone({...newZone, activeFrom: e.target.value})}
                />
              </div>
              <div>
                <Label>Active Until (optional)</Label>
                <Input 
                  type="date"
                  value={newZone.activeTo}
                  onChange={(e) => setNewZone({...newZone, activeTo: e.target.value})}
                />
              </div>
            </div>

            {newZone.rule === 'REQUIRE_DOCS' && (
              <div>
                <Label>Required Documents</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {['VET_HEALTH', 'MOVEMENT_PERMIT', 'DISEASE_TEST', 'QUARANTINE_CERT', 'AVIAN_SCREENING'].map(doc => (
                    <button
                      key={doc}
                      type="button"
                      className={`px-3 py-1 rounded border text-xs ${
                        newZone.requiredDocs.includes(doc) 
                          ? 'bg-amber-600 text-white border-amber-600' 
                          : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => {
                        if (newZone.requiredDocs.includes(doc)) {
                          setNewZone({...newZone, requiredDocs: newZone.requiredDocs.filter(d => d !== doc)});
                        } else {
                          setNewZone({...newZone, requiredDocs: [...newZone.requiredDocs, doc]});
                        }
                      }}
                    >
                      {doc}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Affected Geographic Area</Label>
              <ServiceAreaEditor 
                value={serviceArea}
                onChange={setServiceArea}
                defaultCenter={{ lat: -28.6, lng: 24.7 }}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleCreateZone}
                className="bg-red-600 hover:bg-red-700 text-white"
                disabled={!newZone.name || !newZone.activeFrom}
              >
                Create Disease Zone
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowCreateForm(false)}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}