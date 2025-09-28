'use client';

import { useMemo } from 'react';
import { Truck, ShieldAlert, Globe2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { useBuyerLocation } from '../../lib/locationStore';
import { deliverabilityStatus, formatDeliveryStatus } from '../../lib/deliverability';

export default function GeofenceBanner({
  serviceArea,
  sellerCountry = 'ZA',
  onRequestDeliveryQuote,
  onRequestImportRFQ,
  className = '',
}) {
  const { loc } = useBuyerLocation();

  const status = useMemo(() => {
    return deliverabilityStatus({ service_area: serviceArea, sellerCountry }, loc);
  }, [serviceArea, sellerCountry, loc]);

  const formatted = formatDeliveryStatus(status);

  if (status.crossBorder) {
    return (
      <Alert className={`bg-blue-50 border-blue-200 ${className}`}>
        <Globe2 className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <strong>Cross-border delivery:</strong> This seller is in <strong>{sellerCountry}</strong>, 
            but you're in <strong>{loc.country}</strong>. Create an Import RFQ to get quotes 
            including export documentation and international freight.
          </div>
          <Button 
            variant="secondary" 
            className="whitespace-nowrap bg-blue-100 hover:bg-blue-200 text-blue-800"
            onClick={onRequestImportRFQ}
          >
            <Globe2 className="h-4 w-4 mr-2" />
            Request Import (RFQ)
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  if (status.allowed) {
    return (
      <Alert className={`bg-emerald-50 border-emerald-200 ${className}`}>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription className="flex items-center gap-2 text-sm">
          <span>
            <strong>✅ Delivers to you</strong>
            {status.distanceKm && ` (≈ ${Math.round(status.distanceKm)} km away)`}
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  // Out of range (domestic) - show delivery quote option
  return (
    <Alert className={`bg-amber-50 border-amber-200 ${className}`}>
      <ShieldAlert className="h-4 w-4" />
      <AlertDescription className="flex items-center justify-between gap-3">
        <div className="text-sm">
          <strong>Out of delivery range:</strong> This seller doesn't normally deliver to your area
          {status.distanceKm && ` (≈ ${Math.round(status.distanceKm)} km away)`}.
          You can request a custom delivery quote for this distance.
        </div>
        <Button 
          variant="outline" 
          className="whitespace-nowrap border-amber-300 text-amber-800 hover:bg-amber-100"
          onClick={() => onRequestDeliveryQuote(status.distanceKm)}
        >
          <Truck className="h-4 w-4 mr-2" />
          Request Quote
        </Button>
      </AlertDescription>
    </Alert>
  );
}