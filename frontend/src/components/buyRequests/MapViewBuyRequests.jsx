import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { MapPin, List, Search, Filter, Target, DollarSign, Calendar, AlertCircle } from 'lucide-react';

const MapViewBuyRequests = ({
  canRespond = false,
  defaultCountry = 'ZA'
}) => {
  // Map and data state
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [mapboxLoaded, setMapboxLoaded] = useState(false);
  
  // Filters and data
  const [speciesOpts, setSpeciesOpts] = useState([]);
  const [species, setSpecies] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [sort, setSort] = useState('new');
  const [provinceChips, setProvinceChips] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // Map-specific filters
  const [searchRadius, setSearchRadius] = useState([50]); // km
  const [userLocation, setUserLocation] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  const ZA_PROVINCES = [
    { label: 'Gauteng', value: 'Gauteng' },
    { label: 'Western Cape', value: 'Western Cape' },
    { label: 'KwaZulu-Natal', value: 'KwaZulu-Natal' },
    { label: 'Eastern Cape', value: 'Eastern Cape' },
    { label: 'Free State', value: 'Free State' },
    { label: 'Limpopo', value: 'Limpopo' },
    { label: 'Mpumalanga', value: 'Mpumalanga' },
    { label: 'North West', value: 'North West' },
    { label: 'Northern Cape', value: 'Northern Cape' },
  ];

  // Initialize Mapbox
  useEffect(() => {
    const initMapbox = async () => {
      if (typeof window === 'undefined' || !process.env.REACT_APP_MAPBOX_ACCESS_TOKEN) return;
      
      try {
        // Load Mapbox CSS
        if (!document.querySelector('link[href*="mapbox-gl.css"]')) {
          const link = document.createElement('link');
          link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css';
          link.rel = 'stylesheet';
          document.head.appendChild(link);
        }

        // Load Mapbox JS
        if (!window.mapboxgl) {
          const script = document.createElement('script');
          script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js';
          script.onload = () => {
            window.mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
            setMapboxLoaded(true);
          };
          document.head.appendChild(script);
        } else {
          window.mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_ACCESS_TOKEN;
          setMapboxLoaded(true);
        }
      } catch (error) {
        console.error('Error loading Mapbox:', error);
      }
    };

    initMapbox();
  }, []);

  // Initialize map when Mapbox is loaded
  useEffect(() => {
    if (!mapboxLoaded || !mapRef.current || map) return;

    try {
      const newMap = new window.mapboxgl.Map({
        container: mapRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: [25.0, -29.0], // Center of South Africa
        zoom: 5
      });

      newMap.addControl(new window.mapboxgl.NavigationControl());
      
      newMap.on('load', () => {
        setMap(newMap);
      });

      return () => {
        if (newMap) {
          newMap.remove();
        }
      };
    } catch (error) {
      console.error('Error initializing map:', error);
    }
  }, [mapboxLoaded, map]);

  // Get user location
  useEffect(() => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lng: position.coords.longitude,
          lat: position.coords.latitude
        });
      },
      (error) => {
        console.warn('Could not get user location:', error);
      }
    );
  }, []);

  // Fetch species options
  useEffect(() => {
    const fetchSpecies = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/species`);
        const data = await res.json();
        const opts = (data?.species || data || []).map(s => ({
          value: s.code || s.id || s.name,
          label: s.name
        }));
        setSpeciesOpts(opts);
      } catch (error) {
        console.error('Error fetching species:', error);
      }
    };
    
    fetchSpecies();
  }, []);

  // Build query string for API calls
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (status === 'OPEN') params.set('status', 'OPEN');
    if (species) params.set('species', species);
    if (query.trim()) params.set('q', query.trim());
    if (provinceChips.length) params.set('provinces', provinceChips.join(','));
    params.set('country', defaultCountry);
    params.set('sort', sort);
    params.set('limit', '50');
    return params.toString();
  }, [status, species, query, provinceChips, sort, defaultCountry]);

  // Load buy requests
  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/buy-requests?${queryString}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load requests');
      
      const requestsWithCoords = data.items || [];
      setItems(requestsWithCoords);
      
      // Update map markers if in map view
      if (map && viewMode === 'map') {
        updateMapMarkers(requestsWithCoords);
      }
    } catch (error) {
      console.error('Error loading requests:', error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Load nearby requests when in map mode with user location
  const loadNearbyRequests = async () => {
    if (!userLocation || viewMode !== 'map') return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/mapping/nearby-requests?lng=${userLocation.lng}&lat=${userLocation.lat}&radius_km=${searchRadius[0]}`,
        {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        }
      );
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load nearby requests');
      
      setItems(data.requests || []);
      updateMapMarkers(data.requests || []);
    } catch (error) {
      console.error('Error loading nearby requests:', error);
      showToast(error.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Update map markers
  const updateMapMarkers = (requests) => {
    if (!map) return;

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    setMarkers([]);

    const newMarkers = [];

    requests.forEach(request => {
      const coords = request.location_data?.coordinates || request.coordinates;
      if (!coords) return;

      // Create marker element
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.cssText = `
        width: 30px;
        height: 30px;
        border-radius: 50%;
        background: linear-gradient(45deg, #10b981, #06d6a0);
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        cursor: pointer;
        position: relative;
      `;

      // Add price badge if available
      if (request.target_price) {
        const priceBadge = document.createElement('div');
        priceBadge.textContent = `R${request.target_price}`;
        priceBadge.style.cssText = `
          position: absolute;
          top: -8px;
          right: -8px;
          background: #fbbf24;
          color: white;
          font-size: 10px;
          padding: 2px 4px;
          border-radius: 8px;
          font-weight: bold;
          min-width: 20px;
          text-align: center;
        `;
        el.appendChild(priceBadge);
      }

      // Create popup content
      const popupContent = `
        <div class="max-w-xs">
          <div class="font-semibold text-sm mb-2">${request.species} • ${request.product_type}</div>
          <div class="text-xs space-y-1">
            <div><span class="font-medium">Quantity:</span> ${request.qty} ${request.unit}</div>
            <div><span class="font-medium">Location:</span> ${request.province}</div>
            ${request.target_price ? `<div><span class="font-medium">Target Price:</span> R${request.target_price}/${request.unit}</div>` : ''}
            ${request.distance_km ? `<div><span class="font-medium">Distance:</span> ${request.distance_km}km away</div>` : ''}
            <div class="text-gray-500"><span class="font-medium">Posted:</span> ${formatDate(request.created_at)}</div>
          </div>
          ${canRespond && request.status === 'OPEN' ? 
            `<button onclick="handleMarkerRespond('${request.id}')" class="mt-2 bg-emerald-600 text-white px-3 py-1 rounded text-xs hover:bg-emerald-700">
              Respond to Request
            </button>` : ''
          }
        </div>
      `;

      const popup = new window.mapboxgl.Popup({ offset: 25 })
        .setHTML(popupContent);

      const marker = new window.mapboxgl.Marker(el)
        .setLngLat([coords.longitude, coords.latitude])
        .setPopup(popup)
        .addTo(map);

      el.addEventListener('click', () => {
        setSelectedRequest(request);
      });

      newMarkers.push(marker);
    });

    setMarkers(newMarkers);

    // Fit map to markers if any
    if (newMarkers.length > 0) {
      const bounds = new window.mapboxgl.LngLatBounds();
      newMarkers.forEach(marker => bounds.extend(marker.getLngLat()));
      map.fitBounds(bounds, { padding: 50 });
    }
  };

  // Load requests when filters change
  useEffect(() => {
    if (viewMode === 'map' && userLocation) {
      loadNearbyRequests();
    } else {
      loadRequests();
    }
  }, [queryString, viewMode, userLocation, searchRadius]);

  // Handle view mode change
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    if (mode === 'map' && map && items.length > 0) {
      updateMapMarkers(items);
    }
  };

  // Utility functions
  const toggleProvince = (value) => {
    setProvinceChips(prev => 
      prev.includes(value) 
        ? prev.filter(x => x !== value) 
        : [...prev, value]
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatPrice = (price) => {
    if (!price) return null;
    return `R${Number(price).toFixed(2)}`;
  };

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-md z-50 ${
      type === 'error' ? 'bg-red-500' : 'bg-blue-500'
    } text-white`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 3000);
  };

  return (
    <div className="space-y-4">
      {/* View Mode Tabs */}
      <div className="flex items-center justify-between">
        <Tabs value={viewMode} onValueChange={handleViewModeChange} className="w-auto">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="list" className="flex items-center gap-2">
              <List className="h-4 w-4" />
              List View
            </TabsTrigger>
            <TabsTrigger value="map" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Map View
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {!mapboxLoaded && viewMode === 'map' && (
          <Badge variant="outline" className="text-xs">
            <AlertCircle className="h-3 w-3 mr-1" />
            Loading Map...
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-5">
        <div className="md:col-span-2">
          <Input 
            placeholder="Search notes, breed…" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)}
            className="pr-8"
          />
          <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400 pointer-events-none" />
        </div>
        <Select value={species} onValueChange={setSpecies}>
          <SelectTrigger>
            <SelectValue placeholder="All species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All species</SelectItem>
            {speciesOpts.map(o => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="ALL">All</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="new">Newest</SelectItem>
            <SelectItem value="expiring">Expiring soon</SelectItem>
            <SelectItem value="price_desc">Highest price</SelectItem>
            <SelectItem value="price_asc">Lowest price</SelectItem>
            {viewMode === 'map' && <SelectItem value="distance">Nearest</SelectItem>}
          </SelectContent>
        </Select>
      </div>

      {/* Map-specific filters */}
      {viewMode === 'map' && (
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Search Radius</span>
                  <span className="text-sm text-gray-600">{searchRadius[0]}km</span>
                </div>
                <Slider
                  value={searchRadius}
                  onValueChange={setSearchRadius}
                  max={500}
                  min={10}
                  step={10}
                  className="w-full"
                />
              </div>
              {userLocation && (
                <Badge variant="outline" className="text-xs">
                  <MapPin className="h-3 w-3 mr-1" />
                  Using your location
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Province filters (only in list view) */}
      {viewMode === 'list' && (
        <div className="flex flex-wrap gap-2">
          {ZA_PROVINCES.map(p => (
            <button
              key={p.value}
              onClick={() => toggleProvince(p.value)}
              className={`text-xs rounded-full px-3 py-1 border transition-colors ${
                provinceChips.includes(p.value) 
                  ? 'bg-emerald-600 text-white border-emerald-600' 
                  : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-300'
              }`}
            >
              {p.label}
            </button>
          ))}
          {provinceChips.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setProvinceChips([])}
              className="text-xs"
            >
              Clear
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      <Tabs value={viewMode} className="w-full">
        <TabsContent value="list">
          {/* List View */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading requests...</p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {items.map(r => (
                <Card key={r.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {r.species} • {r.product_type}
                      <Badge 
                        variant={r.status === 'OPEN' ? 'default' : 'secondary'}
                        className={r.status === 'OPEN' ? 'bg-green-100 text-green-800' : ''}
                      >
                        {r.status}
                      </Badge>
                      {r.ai_enhanced && (
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 text-xs">
                          AI Enhanced
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-semibold">Quantity:</span> {r.qty} {r.unit}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="font-semibold">Location:</span> {r.province || '—'}
                      </div>
                    </div>
                    
                    {r.breed && (
                      <div>
                        <span className="font-semibold">Breed:</span> {r.breed}
                      </div>
                    )}
                    
                    {r.target_price && (
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3 w-3" />
                        <span className="font-semibold">Target Price:</span> {formatPrice(r.target_price)} / {r.unit}
                      </div>
                    )}

                    {r.distance_km && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Target className="h-3 w-3" />
                        <span className="font-semibold">Distance:</span> {r.distance_km}km away
                      </div>
                    )}
                    
                    {r.expires_at && (
                      <div className="flex items-center gap-1 text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span className="font-semibold">Expires:</span> {formatDate(r.expires_at)}
                      </div>
                    )}

                    {r.notes && (
                      <div className="text-gray-600 bg-gray-50 p-2 rounded text-xs">
                        {r.notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-3">
                      <div className="text-xs text-gray-500">
                        Posted {formatDate(r.created_at)}
                      </div>
                      
                      {canRespond && r.status === 'OPEN' && (
                        <Button 
                          size="sm" 
                          onClick={() => setSelectedRequest(r)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          Respond
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {items.length === 0 && (
                <div className="col-span-2 text-center py-8 text-gray-500">
                  <p>No buy requests found matching your criteria.</p>
                  <p className="text-sm mt-2">Try adjusting your filters or check back later.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="map">
          {/* Map View */}
          <div className="relative">
            <div ref={mapRef} className="w-full h-96 rounded-lg border" />
            {loading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading requests...</p>
                </div>
              </div>
            )}
            {!mapboxLoaded && (
              <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
                <div className="text-center text-gray-500">
                  <MapPin className="h-8 w-8 mx-auto mb-2" />
                  <p>Loading map...</p>
                </div>
              </div>
            )}
          </div>
          
          {/* Map stats */}
          <div className="flex items-center justify-between text-sm text-gray-600 mt-2">
            <span>Showing {items.length} requests on map</span>
            {userLocation && (
              <span>Within {searchRadius[0]}km of your location</span>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MapViewBuyRequests;