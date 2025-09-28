'use client';

import { useState } from 'react';
import { MapPin, Crosshair, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '../ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { ZA_PROVINCES } from '../../lib/geo';

export default function CheckoutLocationPicker({ 
  value, 
  onChange, 
  placeholder = "Select your delivery location",
  className = "" 
}) {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState(value?.address || '');
  const [province, setProvince] = useState(value?.province || 'GP');
  const [lat, setLat] = useState(value?.lat || -26.2041);
  const [lng, setLng] = useState(value?.lng || 28.0473);
  const [working, setWorking] = useState(false);

  const handleUseGPS = async () => {
    setWorking(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLat(position.coords.latitude);
          setLng(position.coords.longitude);
          setAddress(`${position.coords.latitude.toFixed(4)}, ${position.coords.longitude.toFixed(4)}`);
          setWorking(false);
        },
        (error) => {
          console.error('GPS error:', error);
          setWorking(false);
        }
      );
    } else {
      setWorking(false);
    }
  };

  const handleApply = () => {
    const locationData = {
      address: address || `${getProvinceName(province)}, South Africa`,
      province,
      lat: parseFloat(lat),
      lng: parseFloat(lng)
    };
    
    console.log('🗺️ Setting delivery location:', locationData);
    onChange(locationData);
    setOpen(false);
  };

  const getProvinceName = (code) => {
    const prov = ZA_PROVINCES.find(p => p.code === code);
    return prov ? prov.name : 'Gauteng';
  };

  const displayText = () => {
    if (value?.address) {
      return value.address;
    }
    if (value?.province) {
      return `${getProvinceName(value.province)}, South Africa`;
    }
    return placeholder;
  };

  // Quick set common locations
  const quickLocations = [
    { name: 'Johannesburg, Gauteng', lat: -26.2041, lng: 28.0473, address: 'Johannesburg, Gauteng, South Africa', province: 'GP' },
    { name: 'Cape Town, Western Cape', lat: -33.9249, lng: 18.4241, address: 'Cape Town, Western Cape, South Africa', province: 'WC' },
    { name: 'Durban, KwaZulu-Natal', lat: -29.8587, lng: 31.0218, address: 'Durban, KwaZulu-Natal, South Africa', province: 'KZN' },
    { name: 'Pretoria, Gauteng', lat: -25.7479, lng: 28.2293, address: 'Pretoria, Gauteng, South Africa', province: 'GP' }
  ];

  return (
    <div className={className}>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-start text-left h-auto py-3 px-4"
          >
            <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
            <span className="truncate">{displayText()}</span>
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Set Delivery Location</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Quick Location Buttons */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Quick Select</Label>
              <div className="grid grid-cols-2 gap-2">
                {quickLocations.map((location, index) => (
                  <Button
                    key={index}
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setAddress(location.address);
                      setProvince(location.province);
                      setLat(location.lat);
                      setLng(location.lng);
                    }}
                    className="justify-start"
                  >
                    <MapPin className="h-3 w-3 mr-1" />
                    {location.name}
                  </Button>
                ))}
              </div>
            </div>

            {/* Manual Address Input */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                <Search className="h-4 w-4 inline mr-1" />
                Full Address
              </Label>
              <Input
                placeholder="e.g., 123 Farm Road, Johannesburg, Gauteng"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            {/* Province Selection */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Province</Label>
              <Select value={province} onValueChange={setProvince}>
                <SelectTrigger>
                  <SelectValue placeholder="Select province" />
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

            {/* GPS Coordinates */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-sm font-medium mb-2 block">Latitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(parseFloat(e.target.value) || -26.2041)}
                  placeholder="-26.2041"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Longitude</Label>
                <Input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(parseFloat(e.target.value) || 28.0473)}
                  placeholder="28.0473"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleUseGPS}
                  disabled={working}
                >
                  <Crosshair className="h-4 w-4 mr-1" />
                  {working ? 'Getting...' : 'Use GPS'}
                </Button>
              </div>
            </div>

            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600">
                📍 <strong>Tip:</strong> Select a quick location or enter your full address. 
                GPS coordinates help calculate accurate delivery costs.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApply}>
              Set Location
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}