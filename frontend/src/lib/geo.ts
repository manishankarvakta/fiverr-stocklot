export type LatLng = { lat: number; lng: number };

export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371; // Earth's radius in km
  const toRad = (x: number) => x * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat), la2 = toRad(b.lat);
  const h = Math.sin(dLat/2)**2 + Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Province centroids for South Africa
export const ZA_PROVINCES = [
  { code: 'GP', name: 'Gauteng', lat: -26.2708, lng: 28.1123 },
  { code: 'NW', name: 'North West', lat: -26.6639, lng: 25.2838 },
  { code: 'MP', name: 'Mpumalanga', lat: -25.5653, lng: 30.5271 },
  { code: 'LP', name: 'Limpopo', lat: -23.4013, lng: 29.4179 },
  { code: 'FS', name: 'Free State', lat: -28.4541, lng: 26.7968 },
  { code: 'KZN', name: 'KwaZulu-Natal', lat: -29.0000, lng: 31.0000 },
  { code: 'EC', name: 'Eastern Cape', lat: -32.2968, lng: 26.4194 },
  { code: 'WC', name: 'Western Cape', lat: -33.2278, lng: 21.8569 },
  { code: 'NC', name: 'Northern Cape', lat: -29.0467, lng: 21.8569 },
];

// Common Southern African countries
export const COUNTRIES = [
  { code: 'ZA', name: 'South Africa' },
  { code: 'BW', name: 'Botswana' },
  { code: 'NA', name: 'Namibia' },
  { code: 'ZW', name: 'Zimbabwe' },
  { code: 'MZ', name: 'Mozambique' },
  { code: 'SZ', name: 'Eswatini' },
  { code: 'LS', name: 'Lesotho' },
  { code: 'ZM', name: 'Zambia' },
  { code: 'MW', name: 'Malawi' },
];

// Point-in-polygon check (simple implementation)
export function pointInPolygon(point: LatLng, polygon: LatLng[]): boolean {
  if (polygon.length < 3) return false;
  
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    if (((polygon[i].lat > point.lat) !== (polygon[j].lat > point.lat)) &&
        (point.lng < (polygon[j].lng - polygon[i].lng) * (point.lat - polygon[i].lat) / (polygon[j].lat - polygon[i].lat) + polygon[i].lng)) {
      inside = !inside;
    }
  }
  return inside;
}

// Get province name by code
export function getProvinceName(code: string): string {
  return ZA_PROVINCES.find(p => p.code === code)?.name || code;
}

// Get country name by code  
export function getCountryName(code: string): string {
  return COUNTRIES.find(c => c.code === code)?.name || code;
}