'use client';

import { Badge } from '../ui/badge';
import { deliverabilityStatus } from '../../lib/deliverability';
import { useBuyerLocation } from '../../lib/locationStore';

export default function RangeBadge({ 
  serviceArea, 
  sellerCountry = 'ZA', 
  compact = true 
}) {
  const { loc } = useBuyerLocation();
  const status = deliverabilityStatus({ service_area: serviceArea, sellerCountry }, loc);

  if (status.crossBorder) {
    return (
      <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-300">
        {compact ? 'Cross-border (RFQ)' : 'Cross-border — use RFQ'}
      </Badge>
    );
  }
  
  if (status.allowed) {
    return (
      <Badge className="bg-emerald-600 hover:bg-emerald-600 text-white">
        {compact ? 'Delivers to you' : `Delivers to you${status.distanceKm ? ` (~${Math.round(status.distanceKm)}km)` : ''}`}
      </Badge>
    );
  }
  
  // Out of range
  return (
    <Badge variant="outline" className="border-amber-300 text-amber-700 bg-amber-50">
      {compact ? 'Out of range' : `Out of range${status.distanceKm ? ` (~${Math.round(status.distanceKm)} km)` : ''}`}
    </Badge>
  );
}