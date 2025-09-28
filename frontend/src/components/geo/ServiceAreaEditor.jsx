'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, Marker, Circle, FeatureGroup } from 'react-leaflet';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

// Service Area Editor Component
export default function ServiceAreaEditor({ 
  value, 
  onChange, 
  defaultCenter = { lat: -26.2041, lng: 28.0473 }, 
  readOnly = false 
}) {
  const [mode, setMode] = useState(value?.mode || 'RADIUS');
  const [origin, setOrigin] = useState(
    value?.mode === 'RADIUS' ? value.origin : defaultCenter
  );
  const [radiusKm, setRadiusKm] = useState(
    value?.mode === 'RADIUS' ? value.radius_km : 100
  );

  useEffect(() => {
    if (mode === 'RADIUS') {
      onChange({ mode, origin, radius_km: radiusKm });
    }
    if (mode === 'POLYGON') {
      const poly = value?.polygon || [];
      onChange({ mode, polygon: poly });
    }
  }, [mode, origin, radiusKm, onChange]);

  const center = useMemo(() => [origin.lat, origin.lng], [origin]);

  const handleDrag = (e) => {
    const { lat, lng } = e.target.getLatLng();
    const newOrigin = { lat, lng };
    setOrigin(newOrigin);
    if (mode === 'RADIUS') {
      onChange({ mode: 'RADIUS', origin: newOrigin, radius_km: radiusKm });
    }
  };

  // For this demo, we'll create a simplified version without leaflet-draw
  // since it requires additional setup. In production, you'd add full drawing tools.

  return (
    <Card>
      <CardHeader>
        <CardTitle>Service Area Configuration</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Coverage Mode</Label>
            <Select value={mode} onValueChange={setMode} disabled={readOnly}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RADIUS">Radius Coverage</SelectItem>
                <SelectItem value="PROVINCES">Province Based</SelectItem>
                <SelectItem value="COUNTRIES">Country Based</SelectItem>
                <SelectItem value="POLYGON">Custom Area (Pro)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {mode === 'RADIUS' && (
            <>
              <div>
                <Label>Delivery Radius (km)</Label>
                <Input 
                  type="number" 
                  min={1} 
                  step="1" 
                  value={radiusKm}
                  onChange={(e) => {
                    const v = Number(e.target.value || 0);
                    setRadiusKm(v);
                    onChange({ mode: 'RADIUS', origin, radius_km: v });
                  }}
                  disabled={readOnly}
                />
              </div>
              <div className="flex items-end">
                <Badge variant="outline" className="text-xs">
                  Origin: {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
                </Badge>
              </div>
            </>
          )}
        </div>

        {mode === 'RADIUS' && (
          <div className="h-[400px] rounded-md overflow-hidden border">
            <MapContainer
              center={center}
              zoom={8}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={true}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <Marker 
                position={center} 
                draggable={!readOnly} 
                eventHandlers={{ dragend: handleDrag }}
              />
              
              <Circle 
                center={center} 
                radius={radiusKm * 1000} 
                pathOptions={{ 
                  color: '#059669', 
                  fillColor: '#10b981', 
                  fillOpacity: 0.2 
                }} 
              />
            </MapContainer>
          </div>
        )}

        {mode === 'PROVINCES' && (
          <div className="p-4 border rounded-lg bg-emerald-50">
            <p className="text-sm text-emerald-700 mb-2">
              <strong>Province-based delivery:</strong> Select which South African provinces you deliver to.
            </p>
            <div className="text-xs text-emerald-600">
              Configure provinces in your seller settings.
            </div>
          </div>
        )}

        {mode === 'COUNTRIES' && (
          <div className="p-4 border rounded-lg bg-blue-50">
            <p className="text-sm text-blue-700 mb-2">
              <strong>International delivery:</strong> Select which countries you can export to.
            </p>
            <div className="text-xs text-blue-600">
              Note: International deliveries require RFQ process for documentation.
            </div>
          </div>
        )}

        {mode === 'POLYGON' && (
          <div className="p-4 border rounded-lg bg-purple-50">
            <p className="text-sm text-purple-700 mb-2">
              <strong>Custom area:</strong> Draw precise delivery boundaries on the map.
            </p>
            <div className="text-xs text-purple-600">
              Pro feature: Custom polygon drawing tool (requires map integration).
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              if (mode === 'RADIUS') {
                setOrigin(defaultCenter);
                setRadiusKm(100);
                onChange({ mode: 'RADIUS', origin: defaultCenter, radius_km: 100 });
              }
            }} 
            disabled={readOnly}
          >
            Reset to Default
          </Button>
          <Button 
            type="button"
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => alert('Service area saved! This will be applied to all your new listings.')}
          >
            Save Service Area
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}