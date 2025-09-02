'use client';

import { useBuyerLocation } from '../../lib/locationStore';
import { getProvinceName, getCountryName } from '../../lib/geo';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { MapPin } from 'lucide-react';
import LocationPicker from '../location/LocationPicker';

export default function DeliverableFilterBar({
  value, 
  onChange
}) {
  const { loc } = useBuyerLocation();

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-lg border bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <Switch 
          id="deliverableOnly" 
          checked={value} 
          onCheckedChange={onChange}
        />
        <Label htmlFor="deliverableOnly" className="text-sm font-medium">
          Only show sellers that deliver to me
        </Label>
      </div>
      
      <div className="flex items-center gap-3 text-xs text-slate-600">
        <MapPin className="h-4 w-4 text-emerald-600" />
        <span>
          Delivering to: <strong>
            {loc.province ? `${getProvinceName(loc.province)}, ` : ''}
            {loc.country ? getCountryName(loc.country) : 'Not set'}
          </strong>
        </span>
        <LocationPicker 
          triggerClassName="ml-1 text-emerald-600 hover:text-emerald-700" 
          buttonLabel="Change"
        />
      </div>
    </div>
  );
}