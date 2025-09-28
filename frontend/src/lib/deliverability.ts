import { checkDeliveryPolicy } from './geofence';
import type { ServiceArea, BuyerLoc, GeofenceResult } from './geofence';

export type DeliverabilityStatus = GeofenceResult & {
  crossBorder: boolean;
};

export function deliverabilityStatus(
  listing: { service_area: ServiceArea; sellerCountry: string },
  buyer: BuyerLoc
): DeliverabilityStatus {
  return checkDeliveryPolicy(
    listing.service_area,
    listing.sellerCountry,
    buyer
  );
}

// Helper to determine what action buttons should be shown
export type ActionType = 'BUY_NOW' | 'REQUEST_QUOTE' | 'REQUEST_RFQ' | 'BLOCKED';

export function getListingActionType(
  listing: { 
    service_area: ServiceArea; 
    sellerCountry: string;
    listing_type?: string;
  },
  buyer: BuyerLoc
): ActionType {
  const status = deliverabilityStatus(listing, buyer);
  
  if (status.crossBorder) {
    return 'REQUEST_RFQ'; // Cross-border requires RFQ for import/export docs
  }
  
  if (status.allowed) {
    return 'BUY_NOW'; // Normal purchase flow
  }
  
  // Domestic but out of range - allow delivery quote request
  return 'REQUEST_QUOTE';
}

// Format delivery status for UI display
export function formatDeliveryStatus(status: DeliverabilityStatus): {
  text: string;
  color: 'green' | 'amber' | 'red';
  icon: string;
} {
  if (status.crossBorder) {
    return {
      text: 'Cross-border (RFQ required)',
      color: 'amber',
      icon: '🌍'
    };
  }
  
  if (status.allowed) {
    const distance = status.distanceKm ? ` (~${Math.round(status.distanceKm)}km)` : '';
    return {
      text: `Delivers to you${distance}`,
      color: 'green',
      icon: '✅'
    };
  }
  
  const distance = status.distanceKm ? ` (~${Math.round(status.distanceKm)}km away)` : '';
  return {
    text: `Out of range${distance}`,
    color: 'amber',
    icon: '⚠️'
  };
}

// Check if buyer location needs refresh
export function shouldRefreshLocation(
  lastUpdated?: number,
  currentLocation?: { lat: number; lng: number },
  newLocation?: { lat: number; lng: number }
): boolean {
  // If no timestamp, always refresh
  if (!lastUpdated) return true;
  
  // If older than 24 hours, refresh
  const STALE_TIME = 24 * 60 * 60 * 1000; // 24 hours
  if (Date.now() - lastUpdated > STALE_TIME) return true;
  
  // If location moved more than 100km, refresh
  if (currentLocation && newLocation) {
    const distance = Math.sqrt(
      Math.pow(newLocation.lat - currentLocation.lat, 2) + 
      Math.pow(newLocation.lng - currentLocation.lng, 2)
    ) * 111; // Rough km conversion
    
    return distance > 100;
  }
  
  return false;
}