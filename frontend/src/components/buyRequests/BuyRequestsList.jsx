import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import RespondToBuyRequestModal from './RespondToBuyRequestModal';

const BuyRequestsList = ({
  canRespond = false,   // set true in seller contexts to show Respond button
  defaultCountry = 'ZA'
}) => {
  const [speciesOpts, setSpeciesOpts] = useState([]);
  const [species, setSpecies] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [sort, setSort] = useState('new');
  const [provinceChips, setProvinceChips] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalReq, setModalReq] = useState(null);

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

  const loadRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/buy-requests?${queryString}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load requests');
      setItems(data.items || []);
    } catch (error) {
      console.error('Error loading requests:', error);
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-md z-50';
      toast.textContent = error.message;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [queryString]);

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

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="grid gap-3 md:grid-cols-5">
        <div className="md:col-span-2">
          <Input 
            placeholder="Search notes, breed…" 
            value={query} 
            onChange={(e) => setQuery(e.target.value)} 
          />
        </div>
        <Select value={species} onValueChange={setSpecies}>
          <SelectTrigger>
            <SelectValue placeholder="All species" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All species</SelectItem>
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
          </SelectContent>
        </Select>
      </div>

      {/* Province chips */}
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

      {/* Results */}
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
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="font-semibold">Quantity:</span> {r.qty} {r.unit}
                  </div>
                  <div>
                    <span className="font-semibold">Location:</span> {r.province || '—'}
                  </div>
                </div>
                
                {r.breed && (
                  <div>
                    <span className="font-semibold">Breed:</span> {r.breed}
                  </div>
                )}
                
                {r.target_price && (
                  <div>
                    <span className="font-semibold">Target Price:</span> {formatPrice(r.target_price)} / {r.unit}
                  </div>
                )}
                
                {r.expires_at && (
                  <div className="text-gray-500">
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
                      onClick={() => setModalReq(r)}
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

      {/* Respond modal (visible for sellers) */}
      {modalReq && (
        <RespondToBuyRequestModal
          requestId={modalReq.id}
          species={modalReq.species}
          open={!!modalReq}
          onOpenChange={(v) => !v && setModalReq(null)}
          onSent={() => {
            setModalReq(null);
            loadRequests(); // Refresh the list
          }}
        />
      )}
    </div>
  );
};

export default BuyRequestsList;