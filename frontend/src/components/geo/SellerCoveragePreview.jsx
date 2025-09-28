'use client';

import { useState } from 'react';
import { MapPin, Crosshair, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { isWithinServiceArea } from '../../lib/geofence';
import { haversineKm, ZA_PROVINCES } from '../../lib/geo';

export default function SellerCoveragePreview({
  serviceArea,
  sellerCountry = 'ZA',
}) {
  const [testAddress, setTestAddress] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [province, setProvince] = useState('GP');
  const [testResult, setTestResult] = useState(null);
  const [busy, setBusy] = useState(false);

  function useGPS() {
    if (!('geolocation' in navigator)) {
      alert('Geolocation not supported');
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(Number(pos.coords.latitude.toFixed(6)));
        setLng(Number(pos.coords.longitude.toFixed(6)));
        setBusy(false);
      },
      (err) => { 
        alert(`GPS Error: ${err.message}`); 
        setBusy(false); 
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }

  function testCoverage() {
    const buyer = {
      latlng: (typeof lat === 'number' && typeof lng === 'number') ? { lat, lng } : undefined,
      province,
      country: sellerCountry,
    };
    
    const result = isWithinServiceArea(serviceArea, buyer);
    
    let distance = undefined;
    if (serviceArea.mode === 'RADIUS' && buyer.latlng) {
      distance = Math.round(haversineKm(serviceArea.origin, buyer.latlng));
    }
    
    setTestResult({ 
      allowed: result.allowed, 
      reason: result.reason, 
      distance 
    });
  }

  function testProvinceCapital() {
    const provinceCentroid = ZA_PROVINCES.find(p => p.code === province);
    if (provinceCentroid) {
      setLat(provinceCentroid.lat);
      setLng(provinceCentroid.lng);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Coverage Testing Tool</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Test Address (optional)</Label>
            <Input
              value={testAddress}
              onChange={(e) => setTestAddress(e.target.value)}
              placeholder="e.g., 123 Main St, Pretoria"
            />
            <p className="text-xs text-slate-500 mt-1">
              Manual geocoding not available in demo
            </p>
          </div>
          
          <div>
            <Label>Quick Province Test</Label>
            <div className="flex gap-2">
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ZA_PROVINCES.map(p => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="outline" 
                size="sm"
                onClick={testProvinceCapital}
              >
                Use Capital
              </Button>
            </div>
          </div>

          <div className="flex items-end">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={useGPS} 
              disabled={busy}
            >
              <Crosshair className="h-4 w-4 mr-2" />
              {busy ? 'Getting GPS...' : 'Use My GPS'}
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Latitude</Label>
            <Input 
              type="number" 
              step="0.000001" 
              value={lat} 
              onChange={(e) => setLat(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g., -26.2041"
            />
          </div>
          <div>
            <Label>Longitude</Label>
            <Input 
              type="number" 
              step="0.000001" 
              value={lng} 
              onChange={(e) => setLng(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder="e.g., 28.0473"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={testCoverage} disabled={busy} className="w-full">
              Test Coverage
            </Button>
          </div>
        </div>

        {/* Test Results */}
        {testResult && (
          <div className="mt-4">
            {testResult.allowed ? (
              <div className="rounded-md border bg-emerald-50 border-emerald-200 p-4 flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-900">✅ Within Delivery Area</p>
                  <p className="text-sm text-emerald-700">
                    This location is covered by your service area
                    {testResult.distance && ` (≈ ${testResult.distance} km from your origin)`}.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-md border bg-amber-50 border-amber-200 p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-semibold text-amber-900">⚠️ Outside Delivery Area</p>
                  <p className="text-sm text-amber-700">
                    This location is not covered by your current service area
                    {testResult.distance && ` (≈ ${testResult.distance} km from your origin)`}.
                    {testResult.reason && (
                      <span className="block mt-1">
                        Reason: {testResult.reason.replace('_', ' ').toLowerCase()}
                      </span>
                    )}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Service Area Summary */}
        <div className="bg-slate-50 p-4 rounded-lg">
          <h4 className="font-semibold text-slate-900 mb-2">Your Current Service Area:</h4>
          <div className="text-sm text-slate-700">
            {serviceArea.mode === 'RADIUS' && (
              <p>
                <strong>Radius:</strong> {serviceArea.radius_km} km from ({serviceArea.origin.lat.toFixed(4)}, {serviceArea.origin.lng.toFixed(4)})
              </p>
            )}
            {serviceArea.mode === 'PROVINCES' && (
              <p>
                <strong>Provinces:</strong> {serviceArea.provinces.join(', ')}
              </p>
            )}
            {serviceArea.mode === 'COUNTRIES' && (
              <p>
                <strong>Countries:</strong> {serviceArea.countries.join(', ')}
              </p>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            variant="outline"
            onClick={() => setTestResult(null)}
          >
            Clear Results
          </Button>
          <Button 
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
            onClick={() => alert('This will expand your service area to include more regions. Feature coming soon!')}
          >
            Expand Service Area
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}