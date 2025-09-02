import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { Loader2 } from 'lucide-react';

const CreateBuyRequestForm = ({
  defaultCountry = 'ZA',
  provinces = ['Gauteng','Western Cape','KwaZulu-Natal','Eastern Cape','Free State','Limpopo','Mpumalanga','North West','Northern Cape'],
  onCreated
}) => {
  const [species, setSpecies] = useState('');
  const [productType, setProductType] = useState('');
  const [breed, setBreed] = useState('');
  const [qty, setQty] = useState('100');
  const [unit, setUnit] = useState('head');
  const [targetPrice, setTargetPrice] = useState('');
  const [province, setProvince] = useState('');
  const [country] = useState(defaultCountry);
  const [expiresAt, setExpiresAt] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  // Dynamic options from catalog
  const [speciesOpts, setSpeciesOpts] = useState([]);
  const [ptypeOpts, setPtypeOpts] = useState([]);
  const [breedOpts, setBreedOpts] = useState([]);
  const [unitOpts, setUnitOpts] = useState([
    { value: 'head', label: 'Head' },
    { value: 'dozen', label: 'Dozen (eggs)' },
    { value: 'kg', label: 'kg (meat/fish)' }
  ]);

  // Set default expiry date (14 days from now)
  useEffect(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 14);
    setExpiresAt(defaultDate.toISOString().split('T')[0]);
  }, []);

  // Fetch species on mount
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

  // Fetch product types when species changes
  useEffect(() => {
    if (!species) { 
      setPtypeOpts([]); 
      setProductType(''); 
      return; 
    }
    
    const fetchProductTypes = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/product-types?species=${encodeURIComponent(species)}`);
        const data = await res.json();
        const opts = (data?.product_types || data || []).map(p => ({ 
          value: p.code || p.id || p.name, 
          label: p.name 
        }));
        setPtypeOpts(opts);
        
        // Update units based on product type
        if (data?.units_for_product_type) {
          setUnitOpts(data.units_for_product_type.map(u => ({ value: u.value, label: u.label })));
        }
      } catch (error) {
        console.error('Error fetching product types:', error);
      }
    };
    
    fetchProductTypes();
  }, [species]);

  // Fetch breeds when species changes
  useEffect(() => {
    if (!species) { 
      setBreedOpts([]); 
      setBreed(''); 
      return; 
    }
    
    const fetchBreeds = async () => {
      try {
        const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/species/${encodeURIComponent(species)}/breeds`);
        const data = await res.json();
        const opts = (data?.breeds || data || []).map(b => ({ 
          value: b.code || b.id || b.name, 
          label: b.name 
        }));
        setBreedOpts(opts);
      } catch (error) {
        console.error('Error fetching breeds:', error);
      }
    };
    
    fetchBreeds();
  }, [species]);

  // Update default unit based on product type
  useEffect(() => {
    if (!productType) return;
    if (/EGG/i.test(productType)) setUnit('dozen');
    else if (/MEAT|FISH/i.test(productType)) setUnit('kg');
    else setUnit('head');
  }, [productType]);

  const isValid = useMemo(() => {
    return species && productType && qty && unit && province && expiresAt;
  }, [species, productType, qty, unit, province, expiresAt]);

  const handleSubmit = async () => {
    if (!isValid) return;
    
    setLoading(true);
    try {
      const payload = {
        species,
        product_type: productType,
        breed: breed || null,
        qty: Number(qty),
        unit,
        target_price: targetPrice ? Number(targetPrice) : null,
        province,
        country,
        expires_at: new Date(expiresAt).toISOString(),
        notes: notes || null
      };

      const token = localStorage.getItem('token');
      
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/buy-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to create request');
      }

      // Show success message
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-md z-50';
      toast.textContent = 'Buy Request posted successfully! Sellers in your area will be notified.';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);

      // Reset form
      setQty('100');
      setTargetPrice('');
      setNotes('');
      
      if (onCreated) {
        onCreated(result.id);
      }
      
    } catch (error) {
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-md z-50';
      toast.textContent = error.message;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Buy Request</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {/* Species, Product Type, Breed */}
        <div className="grid md:grid-cols-3 gap-3">
          <div>
            <Label>Species *</Label>
            <Select value={species} onValueChange={setSpecies}>
              <SelectTrigger>
                <SelectValue placeholder="Select species" />
              </SelectTrigger>
              <SelectContent>
                {speciesOpts.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Product Type *</Label>
            <Select value={productType} onValueChange={setProductType} disabled={!species}>
              <SelectTrigger>
                <SelectValue placeholder="Live, Day-old, Eggs…" />
              </SelectTrigger>
              <SelectContent>
                {ptypeOpts.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Breed (optional)</Label>
            <Select value={breed} onValueChange={setBreed} disabled={!species || breedOpts.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={breedOpts.length ? 'Select breed' : 'No breeds'} />
              </SelectTrigger>
              <SelectContent>
                {breedOpts.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Quantity, Unit, Target Price, Expires */}
        <div className="grid md:grid-cols-4 gap-3">
          <div>
            <Label>Quantity *</Label>
            <Input 
              type="number" 
              value={qty} 
              onChange={(e) => setQty(e.target.value)}
              min="1"
            />
          </div>
          <div>
            <Label>Unit *</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {unitOpts.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Target Price (per unit)</Label>
            <Input 
              type="number" 
              placeholder="e.g. 1800" 
              value={targetPrice} 
              onChange={(e) => setTargetPrice(e.target.value)}
              min="0"
              step="0.01"
            />
          </div>
          <div>
            <Label>Expires *</Label>
            <Input 
              type="date" 
              value={expiresAt} 
              onChange={(e) => setExpiresAt(e.target.value)} 
            />
          </div>
        </div>

        {/* Province, Country */}
        <div className="grid md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Label>Province *</Label>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger>
                <SelectValue placeholder="Select province" />
              </SelectTrigger>
              <SelectContent>
                {provinces.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Country</Label>
            <Input value={country} disabled />
          </div>
        </div>

        {/* Notes */}
        <div>
          <Label>Notes (optional)</Label>
          <Textarea 
            rows={4} 
            placeholder="Any specifications (weight range, sex, vaccination requirements)…" 
            value={notes} 
            onChange={(e) => setNotes(e.target.value)} 
          />
        </div>
      </CardContent>
      <CardFooter>
        <Button onClick={handleSubmit} disabled={!isValid || loading}>
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Posting…
            </>
          ) : (
            'Post Buy Request'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CreateBuyRequestForm;