import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { Truck, Calculator, MapPin, Clock, DollarSign, Info } from 'lucide-react';

const DeliveryRateForm = () => {
  const [form, setForm] = useState({
    base_fee_cents: 0,
    per_km_cents: 0,
    min_km: 0,
    max_km: 200,
    province_whitelist: null
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [previewDistance, setPreviewDistance] = useState(50); // km for preview calculation

  // Load current delivery rate configuration
  useEffect(() => {
    loadCurrentRate();
  }, []);

  const loadCurrentRate = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/seller/delivery-rate`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setForm(data);
      } else {
        setMessage({ type: 'error', text: 'Failed to load current delivery rates' });
      }
    } catch (error) {
      console.error('Error loading delivery rate:', error);
      setMessage({ type: 'error', text: 'Error loading delivery rates' });
    } finally {
      setLoading(false);
    }
  };

  const saveDeliveryRate = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/seller/delivery-rate`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(form)
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMessage({ type: 'success', text: 'Delivery rates saved successfully!' });
      } else {
        const errorData = await response.json();
        setMessage({ type: 'error', text: errorData.detail || 'Failed to save delivery rates' });
      }
    } catch (error) {
      console.error('Error saving delivery rate:', error);
      setMessage({ type: 'error', text: 'Error saving delivery rates' });
    } finally {
      setSaving(false);
    }
  };

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  // Calculate preview delivery fee
  const calculatePreviewFee = () => {
    const baseFee = form.base_fee_cents / 100;
    const perKmRate = form.per_km_cents / 100;
    const chargeableKm = Math.max(0, previewDistance - form.min_km);
    const totalFee = baseFee + (chargeableKm * perKmRate);
    return totalFee;
  };

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(cents / 100);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Truck className="h-8 w-8 animate-bounce mx-auto mb-2 text-green-600" />
            <p>Loading delivery rate settings...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-green-600" />
            Delivery Rate Configuration
          </CardTitle>
          <p className="text-sm text-gray-600">
            Set your delivery rates to offer buyers convenient livestock transport services.
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {message && (
            <Alert className={message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
              <AlertDescription className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>
                {message.text}
              </AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Base Fee */}
            <div className="space-y-2">
              <Label htmlFor="baseFee" className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Base Call-out Fee (R)
              </Label>
              <Input
                id="baseFee"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.base_fee_cents / 100}
                onChange={(e) => updateForm('base_fee_cents', Math.round(Number(e.target.value) * 100))}
              />
              <p className="text-xs text-gray-500">
                Fixed fee charged for any delivery, regardless of distance
              </p>
            </div>

            {/* Per-km Rate */}
            <div className="space-y-2">
              <Label htmlFor="perKmRate" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Per-kilometer Rate (R/km)
              </Label>
              <Input
                id="perKmRate"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.per_km_cents / 100}
                onChange={(e) => updateForm('per_km_cents', Math.round(Number(e.target.value) * 100))}
              />
              <p className="text-xs text-gray-500">
                Rate charged per kilometer beyond the minimum distance
              </p>
            </div>

            {/* Minimum Distance */}
            <div className="space-y-2">
              <Label htmlFor="minKm" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Minimum Distance (km)
              </Label>
              <Input
                id="minKm"
                type="number"
                min="0"
                placeholder="0"
                value={form.min_km}
                onChange={(e) => updateForm('min_km', Number(e.target.value))}
              />
              <p className="text-xs text-gray-500">
                Free delivery within this distance (no per-km charge)
              </p>
            </div>

            {/* Maximum Distance */}
            <div className="space-y-2">
              <Label htmlFor="maxKm" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Maximum Distance (km)
              </Label>
              <Input
                id="maxKm"
                type="number"
                min="1"
                placeholder="200"
                value={form.max_km || ''}
                onChange={(e) => updateForm('max_km', e.target.value ? Number(e.target.value) : null)}
              />
              <p className="text-xs text-gray-500">
                Maximum delivery distance (leave empty for unlimited)
              </p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button 
              onClick={saveDeliveryRate}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? 'Saving...' : 'Save Delivery Rates'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preview Calculator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-blue-600" />
            Delivery Fee Preview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="previewDistance">Distance (km):</Label>
              <Input
                id="previewDistance"
                type="number"
                min="1"
                value={previewDistance}
                onChange={(e) => setPreviewDistance(Number(e.target.value))}
                className="w-32"
              />
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Base fee:</span>
                <span>{formatCurrency(form.base_fee_cents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Distance: {previewDistance}km</span>
                <span>-</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Free distance: {form.min_km}km</span>
                <span>-</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Chargeable distance: {Math.max(0, previewDistance - form.min_km)}km</span>
                <span>{formatCurrency(Math.max(0, previewDistance - form.min_km) * form.per_km_cents)}</span>
              </div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between font-semibold">
                <span>Total delivery fee:</span>
                <span className="text-green-600">{formatCurrency(calculatePreviewFee() * 100)}</span>
              </div>
            </div>

            {previewDistance > (form.max_km || Infinity) && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Info className="h-4 w-4" />
                <AlertDescription className="text-yellow-800">
                  This distance exceeds your maximum delivery range of {form.max_km}km. 
                  Delivery would not be available.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Current Settings Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Settings Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-between">
                <span>Base Fee</span>
                <span>{formatCurrency(form.base_fee_cents)}</span>
              </Badge>
              <Badge variant="outline" className="w-full justify-between">
                <span>Per-km Rate</span>
                <span>{formatCurrency(form.per_km_cents)}/km</span>
              </Badge>
            </div>
            <div className="space-y-2">
              <Badge variant="outline" className="w-full justify-between">
                <span>Free Distance</span>
                <span>{form.min_km}km</span>
              </Badge>
              <Badge variant="outline" className="w-full justify-between">
                <span>Max Distance</span>
                <span>{form.max_km ? `${form.max_km}km` : 'Unlimited'}</span>
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryRateForm;