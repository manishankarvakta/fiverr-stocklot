import os
import logging
import httpx
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime, timezone
import json
import math
from enum import Enum

logger = logging.getLogger(__name__)

class MapboxService:
    def __init__(self):
        self.access_token = os.environ.get('MAPBOX_ACCESS_TOKEN')
        self.base_url = "https://api.mapbox.com"
        
    async def geocode_location(
        self,
        location: str,
        country: str = "ZA"
    ) -> Dict[str, Any]:
        """Convert location string to coordinates using Mapbox Geocoding API"""
        
        try:
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/geocoding/v5/mapbox.places/{location}.json"
                params = {
                    "access_token": self.access_token,
                    "country": country,
                    "types": "place,locality,neighborhood,address",
                    "limit": 1
                }
                
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get("features"):
                    feature = data["features"][0]
                    coordinates = feature["geometry"]["coordinates"]
                    
                    return {
                        "success": True,
                        "longitude": coordinates[0],
                        "latitude": coordinates[1],
                        "place_name": feature.get("place_name"),
                        "formatted_address": feature.get("text"),
                        "context": feature.get("context", []),
                        "bbox": feature.get("bbox"),
                        "geocoded_at": datetime.now(timezone.utc).isoformat()
                    }
                
                return {
                    "success": False,
                    "error": "Location not found",
                    "geocoded_at": datetime.now(timezone.utc).isoformat()
                }
                
        except Exception as e:
            logger.error(f"Geocoding failed for {location}: {e}")
            return {
                "success": False,
                "error": str(e),
                "geocoded_at": datetime.now(timezone.utc).isoformat()
            }
    
    async def calculate_distance_matrix(
        self,
        origins: List[Tuple[float, float]],  # [(lng, lat), ...]
        destinations: List[Tuple[float, float]]
    ) -> Dict[str, Any]:
        """Calculate distance matrix between multiple points"""
        
        try:
            # Format coordinates for API
            origin_coords = ";".join([f"{lng},{lat}" for lng, lat in origins])
            dest_coords = ";".join([f"{lng},{lat}" for lng, lat in destinations])
            
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/directions-matrix/v1/mapbox/driving/{origin_coords};{dest_coords}"
                params = {
                    "access_token": self.access_token,
                    "sources": ";".join([str(i) for i in range(len(origins))]),
                    "destinations": ";".join([str(i + len(origins)) for i in range(len(destinations))])
                }
                
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                return {
                    "success": True,
                    "distances": data.get("distances", []),  # in meters
                    "durations": data.get("durations", []),  # in seconds
                    "sources": data.get("sources", []),
                    "destinations": data.get("destinations", []),
                    "calculated_at": datetime.now(timezone.utc).isoformat()
                }
                
        except Exception as e:
            logger.error(f"Distance matrix calculation failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "calculated_at": datetime.now(timezone.utc).isoformat()
            }
    
    async def calculate_delivery_distance(
        self,
        seller_location: Tuple[float, float],
        buyer_location: Tuple[float, float]
    ) -> Dict[str, Any]:
        """Calculate delivery distance and time between seller and buyer"""
        
        try:
            seller_lng, seller_lat = seller_location
            buyer_lng, buyer_lat = buyer_location
            
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/directions/v5/mapbox/driving/{seller_lng},{seller_lat};{buyer_lng},{buyer_lat}"
                params = {
                    "access_token": self.access_token,
                    "geometries": "geojson",
                    "overview": "simplified"
                }
                
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get("routes"):
                    route = data["routes"][0]
                    
                    return {
                        "success": True,
                        "distance_km": round(route["distance"] / 1000, 2),
                        "duration_minutes": round(route["duration"] / 60, 1),
                        "geometry": route["geometry"],
                        "estimated_cost": self._estimate_delivery_cost(route["distance"] / 1000),
                        "calculated_at": datetime.now(timezone.utc).isoformat()
                    }
                
                return {
                    "success": False,
                    "error": "No route found",
                    "calculated_at": datetime.now(timezone.utc).isoformat()
                }
                
        except Exception as e:
            logger.error(f"Delivery distance calculation failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "calculated_at": datetime.now(timezone.utc).isoformat()
            }
    
    def _estimate_delivery_cost(self, distance_km: float) -> Dict[str, float]:
        """Estimate delivery costs based on distance"""
        
        # Base livestock transportation rates (South African context)
        base_rate = 15.0  # R15 per km base rate
        fuel_surcharge = 2.5  # R2.50 per km fuel
        
        # Distance-based pricing tiers
        if distance_km <= 50:
            rate_per_km = base_rate + fuel_surcharge
        elif distance_km <= 200:
            rate_per_km = (base_rate * 0.9) + fuel_surcharge  # 10% discount for medium distance
        else:
            rate_per_km = (base_rate * 0.8) + fuel_surcharge  # 20% discount for long distance
        
        estimated_cost = distance_km * rate_per_km
        
        return {
            "estimated_cost": round(estimated_cost, 2),
            "rate_per_km": rate_per_km,
            "currency": "ZAR",
            "includes": ["fuel", "driver", "vehicle"]
        }
    
    async def find_nearby_requests(
        self,
        center_location: Tuple[float, float],
        radius_km: float,
        buy_requests: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """Find buy requests within specified radius"""
        
        try:
            center_lng, center_lat = center_location
            nearby_requests = []
            
            for request in buy_requests:
                # Get coordinates from request (assuming they're geocoded)
                req_coords = request.get('coordinates')
                if not req_coords:
                    continue
                    
                req_lng, req_lat = req_coords.get('longitude'), req_coords.get('latitude')
                if not req_lng or not req_lat:
                    continue
                
                # Calculate distance using haversine formula
                distance = self._haversine_distance(
                    center_lat, center_lng,
                    req_lat, req_lng
                )
                
                if distance <= radius_km:
                    request_copy = request.copy()
                    request_copy['distance_km'] = round(distance, 2)
                    nearby_requests.append(request_copy)
            
            # Sort by distance
            nearby_requests.sort(key=lambda x: x['distance_km'])
            
            return nearby_requests
            
        except Exception as e:
            logger.error(f"Nearby requests search failed: {e}")
            return []
    
    def _haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate haversine distance between two points in kilometers"""
        
        # Convert latitude and longitude from degrees to radians
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Radius of earth in kilometers
        r = 6371
        
        return c * r
    
    async def optimize_delivery_route(
        self,
        depot: Tuple[float, float],
        delivery_points: List[Tuple[float, float]],
        return_to_depot: bool = True
    ) -> Dict[str, Any]:
        """Optimize delivery route using Mapbox Optimization API"""
        
        try:
            # Format coordinates
            all_points = [depot] + delivery_points
            if return_to_depot:
                all_points.append(depot)
            
            coords_str = ";".join([f"{lng},{lat}" for lng, lat in all_points])
            
            async with httpx.AsyncClient() as client:
                url = f"{self.base_url}/optimized-trips/v1/mapbox/driving/{coords_str}"
                params = {
                    "access_token": self.access_token,
                    "source": "first",
                    "destination": "last" if return_to_depot else "any",
                    "roundtrip": return_to_depot,
                    "geometries": "geojson"
                }
                
                response = await client.get(url, params=params)
                response.raise_for_status()
                data = response.json()
                
                if data.get("trips"):
                    trip = data["trips"][0]
                    
                    return {
                        "success": True,
                        "total_distance_km": round(trip["distance"] / 1000, 2),
                        "total_duration_minutes": round(trip["duration"] / 60, 1),
                        "geometry": trip["geometry"],
                        "waypoint_order": [wp["waypoint_index"] for wp in trip["legs"]],
                        "estimated_cost": self._estimate_delivery_cost(trip["distance"] / 1000),
                        "optimized_at": datetime.now(timezone.utc).isoformat()
                    }
                
                return {
                    "success": False,
                    "error": "No optimized route found",
                    "optimized_at": datetime.now(timezone.utc).isoformat()
                }
                
        except Exception as e:
            logger.error(f"Route optimization failed: {e}")
            return {
                "success": False,
                "error": str(e),
                "optimized_at": datetime.now(timezone.utc).isoformat()
            }
    
    async def create_geofence(
        self,
        center: Tuple[float, float],
        radius_km: float,
        name: str = None
    ) -> Dict[str, Any]:
        """Create a geofence for notifications"""
        
        try:
            center_lng, center_lat = center
            
            # Create a circular geofence (simplified polygon)
            points = []
            num_points = 16  # 16-sided polygon approximation
            
            for i in range(num_points):
                angle = 2 * math.pi * i / num_points
                # Convert km to degrees (rough approximation)
                lat_offset = (radius_km / 111.32) * math.cos(angle)
                lng_offset = (radius_km / (111.32 * math.cos(math.radians(center_lat)))) * math.sin(angle)
                
                point_lat = center_lat + lat_offset
                point_lng = center_lng + lng_offset
                points.append([point_lng, point_lat])
            
            # Close the polygon
            points.append(points[0])
            
            geofence = {
                "type": "Feature",
                "properties": {
                    "name": name or f"Geofence {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                    "radius_km": radius_km,
                    "center": [center_lng, center_lat],
                    "created_at": datetime.now(timezone.utc).isoformat()
                },
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [points]
                }
            }
            
            return {
                "success": True,
                "geofence": geofence,
                "area_km2": round(math.pi * radius_km ** 2, 2)
            }
            
        except Exception as e:
            logger.error(f"Geofence creation failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    async def check_point_in_geofence(
        self,
        point: Tuple[float, float],
        geofence: Dict[str, Any]
    ) -> bool:
        """Check if a point is within a geofence"""
        
        try:
            point_lng, point_lat = point
            
            # Simple center + radius check (faster than polygon check)
            if geofence.get("properties", {}).get("center"):
                center = geofence["properties"]["center"]
                radius_km = geofence["properties"]["radius_km"]
                
                distance = self._haversine_distance(
                    point_lat, point_lng,
                    center[1], center[0]
                )
                
                return distance <= radius_km
            
            return False
            
        except Exception as e:
            logger.error(f"Geofence check failed: {e}")
            return False