import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Truck, DollarSign, MapPin, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { 
  useGetShippingRatesQuery, 
  useUpdateShippingRatesMutation 
} from '../../store/api/seller.api';

const SellerShippingRates = () => {
  const { user } = useAuth();
  const [message, setMessage] = useState(null);
  const [rateData, setRateData] = useState({
    base_fee_cents: 0,
    per_km_cents: 0,
    min_km: 0,
    max_km: 200,
    province_whitelist: null,
    is_active: true
  });

  const [displayValues, setDisplayValues] = useState({
    base_fee_rands: 0,
    per_km_rands: 0
  });

  const hasSellerRole = user && (user.roles?.includes('seller') || user.roles?.includes('both'));
  
  const { data: shippingData, isLoading: loading, error } = useGetShippingRatesQuery(undefined, {
    skip: !hasSellerRole,
  });
  
  const [updateShippingRates, { isLoading: saving }] = useUpdateShippingRatesMutation();

  useEffect(() => {
    if (shippingData) {
      setRateData(shippingData);
    }
  }, [shippingData]);

  useEffect(() => {
    // Update display values when rate data changes
    setDisplayValues({
      base_fee_rands: rateData.base_fee_cents / 100,
      per_km_rands: rateData.per_km_cents / 100
    });
  }, [rateData]);

  const handleCurrencyChange = (field, value) => {
    const numValue = parseFloat(value) || 0;
    const centsValue = Math.round(numValue * 100);
    
    if (field === 'base_fee_rands') {
      setDisplayValues(prev => ({ ...prev, base_fee_rands: numValue }));
      setRateData(prev => ({ ...prev, base_fee_cents: centsValue }));
    } else if (field === 'per_km_rands') {
      setDisplayValues(prev => ({ ...prev, per_km_rands: numValue }));
      setRateData(prev => ({ ...prev, per_km_cents: centsValue }));
    }
  };

  const handleSave = async () => {
    setMessage(null);

    try {
      const result = await updateShippingRates(rateData).unwrap();
      setMessage({ type: 'success', text: result.message || 'Delivery rates updated successfully!' });
    } catch (error) {
      console.error('Error saving delivery rate:', error);
      setMessage({ 
        type: 'error', 
        text: error?.data?.detail || error?.message || 'Failed to update delivery rates' 
      });
    }
  };

  const formatCurrency = (cents) => {
    return `R${(cents / 100).toFixed(2)}`;
  };

  const handleInputChange = (field, value) => {
    setRateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!user || !user.roles?.includes('seller')) {
    return (
      <div className="text-center p-8">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Access Denied</h2>
        <p className="text-gray-600">Only sellers can manage delivery rates.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading delivery rate settings...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-emerald-900 mb-2">Delivery Rate Management</h1>
        <p className="text-emerald-700">Configure your delivery rates and service areas</p>
      </div>

      {message && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? (
              <CheckCircle className="h-5 w-5" />
            ) : (
              <AlertCircle className="h-5 w-5" />
            )}
            {message.text}
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Configuration */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-600" />
                Pricing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-emerald-800">Base Call-out Fee (Rands)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={displayValues.base_fee_rands}
                    onChange={(e) => handleCurrencyChange('base_fee_rands', e.target.value)}
                    placeholder="e.g., 200.00"
                    className="border-emerald-200"
                  />
                  <p className="text-xs text-emerald-600 mt-1">
                    Amount: {formatCurrency(rateData.base_fee_cents)}
                  </p>
                </div>

                <div>
                  <Label className="text-emerald-800">Per Kilometer Rate (Rands)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={displayValues.per_km_rands}
                    onChange={(e) => handleCurrencyChange('per_km_rands', e.target.value)}
                    placeholder="e.g., 12.00"
                    className="border-emerald-200"
                  />
                  <p className="text-xs text-emerald-600 mt-1">
                    Rate per km: {formatCurrency(rateData.per_km_cents)}
                  </p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-emerald-800">Free Delivery Within (km)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={rateData.min_km}
                    onChange={(e) => handleInputChange('min_km', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 10"
                    className="border-emerald-200"
                  />
                  <p className="text-xs text-emerald-600 mt-1">Free delivery radius</p>
                </div>

                <div>
                  <Label className="text-emerald-800">Maximum Delivery Distance (km)</Label>
                  <Input
                    type="number"
                    min="1"
                    value={rateData.max_km}
                    onChange={(e) => handleInputChange('max_km', parseInt(e.target.value) || 200)}
                    placeholder="e.g., 200"
                    className="border-emerald-200"
                  />
                  <p className="text-xs text-emerald-600 mt-1">Maximum service radius</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="active-delivery"
                  checked={rateData.is_active}
                  onCheckedChange={(checked) => handleInputChange('is_active', checked)}
                />
                <Label htmlFor="active-delivery" className="text-emerald-800">
                  Delivery Service Active
                </Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-emerald-600" />
                Service Areas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="text-emerald-800">Provinces Served (Optional)</Label>
                <Input
                  value={rateData.province_whitelist ? rateData.province_whitelist.join(', ') : ''}
                  onChange={(e) => {
                    const provinces = e.target.value ? e.target.value.split(',').map(p => p.trim()) : null;
                    handleInputChange('province_whitelist', provinces);
                  }}
                  placeholder="e.g., Gauteng, Western Cape, Limpopo (leave empty for all provinces)"
                  className="border-emerald-200"
                />
                <p className="text-xs text-emerald-600 mt-1">
                  Leave empty to serve all provinces. Separate multiple provinces with commas.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Summary */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5 text-emerald-600" />
                Rate Preview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Base call-out fee:</span>
                  <span className="font-medium">{formatCurrency(rateData.base_fee_cents)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Per kilometer:</span>
                  <span className="font-medium">{formatCurrency(rateData.per_km_cents)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Free delivery radius:</span>
                  <span className="font-medium">{rateData.min_km} km</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Maximum distance:</span>
                  <span className="font-medium">{rateData.max_km} km</span>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium text-emerald-800 mb-2">Example Calculations:</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">5 km delivery:</span>
                    <span className="font-medium">
                      {rateData.min_km >= 5 ? 'FREE' : formatCurrency(rateData.base_fee_cents + (Math.max(0, 5 - rateData.min_km) * rateData.per_km_cents))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">25 km delivery:</span>
                    <span className="font-medium">
                      {formatCurrency(rateData.base_fee_cents + (Math.max(0, 25 - rateData.min_km) * rateData.per_km_cents))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">50 km delivery:</span>
                    <span className="font-medium">
                      {formatCurrency(rateData.base_fee_cents + (Math.max(0, 50 - rateData.min_km) * rateData.per_km_cents))}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Saving...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Save Delivery Rates
                  </div>
                )}
              </Button>
            </CardContent>
          </Card>

          <Card className="border-yellow-200 bg-yellow-50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="text-sm text-yellow-800">
                  <p className="font-medium mb-1">Important Notes:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Rates are used for automatic delivery quotes</li>
                    <li>• Customers see quotes before confirming orders</li>
                    <li>• Free delivery applies within minimum radius</li>
                    <li>• Beyond max distance = no delivery offered</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SellerShippingRates;