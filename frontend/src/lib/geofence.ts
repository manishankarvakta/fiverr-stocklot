import { LatLng, haversineKm, pointInPolygon } from './geo';

export type ServiceArea =
  | { mode: 'RADIUS'; origin: LatLng; radius_km: number }
  | { mode: 'PROVINCES'; provinces: string[] }
  | { mode: 'COUNTRIES'; countries: string[] }
  | { mode: 'POLYGON'; polygon: LatLng[] };

export type BuyerLoc = { 
  latlng?: LatLng; 
  province?: string; 
  country?: string; 
};

export type GeofenceResult = {
  allowed: boolean;
  reason?: string;
  distanceKm?: number;
  crossBorder?: boolean;
};

export function isWithinServiceArea(
  area: ServiceArea,
  buyer: BuyerLoc
): GeofenceResult {
  if (area.mode === 'RADIUS') {
    if (!buyer.latlng) {
      return { allowed: false, reason: 'NO_LOCATION' };
    }
    const d = haversineKm(area.origin, buyer.latlng);
    return d <= area.radius_km 
      ? { allowed: true, distanceKm: d } 
      : { allowed: false, reason: 'OUT_OF_RADIUS', distanceKm: d };
  }
  
  if (area.mode === 'PROVINCES') {
    if (!buyer.province) {
      return { allowed: false, reason: 'NO_PROVINCE' };
    }
    return area.provinces.includes(buyer.province)
      ? { allowed: true } 
      : { allowed: false, reason: 'PROVINCE_BLOCKED' };
  }
  
  if (area.mode === 'COUNTRIES') {
    if (!buyer.country) {
      return { allowed: false, reason: 'NO_COUNTRY' };
    }
    return area.countries.includes(buyer.country)
      ? { allowed: true } 
      : { allowed: false, reason: 'COUNTRY_BLOCKED' };
  }
  
  if (area.mode === 'POLYGON') {
    if (!buyer.latlng) {
      return { allowed: false, reason: 'NO_LOCATION' };
    }
    return pointInPolygon(buyer.latlng, area.polygon)
      ? { allowed: true }
      : { allowed: false, reason: 'OUT_OF_POLYGON' };
  }
  
  return { allowed: false, reason: 'UNSUPPORTED_MODE' };
}

// Policy checker that combines geofence with cross-border rules
export function checkDeliveryPolicy(
  serviceArea: ServiceArea,
  sellerCountry: string,
  buyer: BuyerLoc
): GeofenceResult & { crossBorder: boolean } {
  const crossBorder = !!(buyer.country && sellerCountry && buyer.country !== sellerCountry);
  
  if (crossBorder) {
    return { 
      allowed: false, 
      crossBorder: true, 
      reason: 'CROSS_BORDER' 
    };
  }
  
  const geofenceResult = isWithinServiceArea(serviceArea, buyer);
  return { 
    ...geofenceResult, 
    crossBorder: false 
  };
}

// Helper to get human-readable reason
export function getGeofenceReasonText(reason?: string): string {
  switch (reason) {
    case 'NO_LOCATION': return 'Location not available';
    case 'OUT_OF_RADIUS': return 'Outside delivery radius';
    case 'PROVINCE_BLOCKED': return 'Province not served';
    case 'COUNTRY_BLOCKED': return 'Country not served';
    case 'OUT_OF_POLYGON': return 'Outside service area';
    case 'CROSS_BORDER': return 'Cross-border delivery';
    case 'UNSUPPORTED_MODE': return 'Service area configuration error';
    default: return 'Not deliverable';
  }
}