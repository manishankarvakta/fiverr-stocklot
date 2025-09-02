'use client';

import { useState } from 'react';
import { useBuyerLocation } from '../../lib/locationStore';
import { ZA_PROVINCES, COUNTRIES } from '../../lib/geo';
import { MapPin, Crosshair, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';

export default function LocationPicker({
  triggerClassName = '',
  buttonLabel = 'Set Location',
}) {
  const { loc, set, isStale } = useBuyerLocation();
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState(loc.country || 'ZA');
  const [province, setProvince] = useState(loc.province || '');
  const [lat, setLat] = useState(loc.latlng?.lat || '');
  const [lng, setLng] = useState(loc.latlng?.lng || '');
  const [working, setWorking] = useState(false);
  const [error, setError] = useState('');

  async function useGPS() {
    setError('');
    if (!('geolocation' in navigator)) {
      setError('Geolocation not supported by this device.');
      return;
    }
    
    setWorking(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        setLat(Number(latitude.toFixed(6)));
        setLng(Number(longitude.toFixed(6)));
        setWorking(false);
      },
      (err) => { 
        setError(`GPS Error: ${err.message}`); 
        setWorking(false); 
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 }
    );
  }

  function apply() {
    const updates = {
      country,
      province: country === 'ZA' ? province || loc.province : undefined,
      latlng: (typeof lat === 'number' && typeof lng === 'number') ? { lat, lng } : undefined,
    };
    
    set(updates);
    setOpen(false);
  }

  const displayLabel = () => {
    if (!loc.country) return buttonLabel;
    const provinceName = loc.province ? ZA_PROVINCES.find(p => p.code === loc.province)?.name : '';
    const countryName = COUNTRIES.find(c => c.code === loc.country)?.name || loc.country;
    return `${provinceName ? `${provinceName}, ` : ''}${countryName}`;
  };

  const needsRefresh = isStale();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          className={`text-xs ${triggerClassName} ${needsRefresh ? 'text-amber-600' : ''}`}
        >
          <MapPin className="h-4 w-4 mr-2" />
          {needsRefresh && <AlertCircle className="h-3 w-3 mr-1" />}
          Delivering to: {displayLabel()}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Set Your Delivery Location</DialogTitle>
        </DialogHeader>

        {needsRefresh && (
          <Alert className="bg-amber-50 border-amber-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Your location is outdated. Please update it for accurate delivery information.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <Label>Country</Label>
              <Select 
                value={country} 
                onValueChange={(v) => { 
                  setCountry(v); 
                  if (v !== 'ZA') setProvince(''); 
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.filter(c => c.code && c.code !== "").map(c => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>
                Province/State 
                {country === 'ZA' && <span className="text-slate-400 text-xs ml-1">(South Africa)</span>}
              </Label>
              <Select 
                value={province} 
                onValueChange={setProvince} 
                disabled={country !== 'ZA'}
              >
                <SelectTrigger>
                  <SelectValue 
                    placeholder={country === 'ZA' ? 'Select province' : 'N/A for this country'} 
                  />
                </SelectTrigger>
                <SelectContent>
                  {ZA_PROVINCES.filter(p => p.code && p.code !== "").map(p => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button 
                variant="outline" 
                className="w-full" 
                onClick={useGPS} 
                disabled={working}
              >
                <Crosshair className="h-4 w-4 mr-2" />
                {working ? 'Detecting…' : 'Use GPS'}
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Latitude (optional)</Label>
              <Input 
                type="number" 
                step="0.000001" 
                value={lat} 
                onChange={(e) => setLat(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g., -26.2041"
              />
            </div>
            <div>
              <Label>Longitude (optional)</Label>
              <Input 
                type="number" 
                step="0.000001" 
                value={lng} 
                onChange={(e) => setLng(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="e.g., 28.0473"
              />
            </div>
          </div>

          {error && (
            <Alert className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="bg-slate-50 p-3 rounded-lg">
            <p className="text-xs text-slate-600">
              <strong>Tip:</strong> Province/country is sufficient for most sellers. 
              GPS coordinates improve distance-based delivery quotes and provide more accurate results.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={apply}>
            Save Location
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}