import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../ui';
import { Truck, Shield, CreditCard, CheckCircle } from 'lucide-react';
import { IfFlag } from '../../providers/FeatureFlagsProvider';
import api from '../../api/client';

const CheckoutOptions = ({ orderId, orderDetails, onUpdate }) => {
  const [transportQuotes, setTransportQuotes] = useState([]);
  const [selectedTransport, setSelectedTransport] = useState(null);
  const [insuranceQuotes, setInsuranceQuotes] = useState([]);
  const [selectedInsurance, setSelectedInsurance] = useState(null);
  const [financeApplication, setFinanceApplication] = useState(null);
  const [loading, setLoading] = useState({});

  // Auto-request transport quotes when component mounts and order details are available
  useEffect(() => {
    if (orderDetails && orderId && !transportQuotes.length && !loading.transport) {
      console.log('🚛 Auto-requesting transport quotes for checkout');
      requestTransportQuotes();
    }
  }, [orderDetails, orderId]);

  const requestTransportQuotes = async () => {
    setLoading({ ...loading, transport: true });
    try {
      // Use the new enhanced transport API format
      const response = await api.post('/transport/quotes', {
        pickup_lat: orderDetails.pickup_lat || -25.7479, // Default Pretoria
        pickup_lng: orderDetails.pickup_lng || 28.2293,
        delivery_lat: orderDetails.delivery_lat || -26.2041, // Default Johannesburg  
        delivery_lng: orderDetails.delivery_lng || 28.0473,
        livestock: [{
          species: mapSpecies(orderDetails.livestock_type || 'cattle'),
          quantity: orderDetails.quantity || 1,
          avg_weight: orderDetails.avg_weight || 500
        }],
        urgency: 'standard',
        order_id: orderId
      });
      
      // New API returns quotes directly
      if (response.data.quotes) {
        setTransportQuotes(response.data.quotes);
      } else {
        setTransportQuotes([]);
      }
      
    } catch (error) {
      console.error('Error requesting transport quotes:', error);
      alert(extractErrorMessage(error));
    } finally {
      setLoading({ ...loading, transport: false });
    }
  };

  const mapSpecies = (listingType) => {
    const mapping = {
      'cattle': 'cattle',
      'beef': 'cattle', 
      'dairy': 'cattle',
      'goat': 'goats',
      'goats': 'goats',
      'sheep': 'sheep',
      'pig': 'pigs',
      'pigs': 'pigs',
      'poultry': 'poultry',
      'chicken': 'poultry',
      'chickens': 'poultry'
    };
    return mapping[listingType?.toLowerCase()] || 'cattle';
  };

  const extractErrorMessage = (error) => {
    if (error.response?.data) {
      const data = error.response.data;
      
      // Handle Pydantic validation errors
      if (data.detail && Array.isArray(data.detail)) {
        return data.detail.map(err => err.msg || 'Validation error').join(', ');
      }
      
      if (typeof data.detail === 'string') return data.detail;
      if (data.message) return data.message;
      if (data.error) return data.error;
    }
    
    return error.message || 'An error occurred';
  };

  const bookTransport = async (quoteId) => {
    try {
      const response = await api.post('/transport/book', {
        quote_id: quoteId,
        order_id: orderId
      });
      
      setSelectedTransport(transportQuotes.find(q => q.id === quoteId));
      alert('Transport booked successfully!');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error booking transport:', error);
      alert(extractErrorMessage(error));
    }
  };

  const requestInsuranceQuotes = async () => {
    setLoading({ ...loading, insurance: true });
    try {
      const response = await api.post('/insurance/quotes', {
        order_id: orderId,
        sum_insured_cents: orderDetails.total_cents,
        route: {
          from: { lat: orderDetails.pickup_lat, lng: orderDetails.pickup_lng },
          to: { lat: orderDetails.delivery_lat, lng: orderDetails.delivery_lng },
          distance_km: orderDetails.distance_km || 100
        },
        animals: orderDetails.animals
      });
      
      const requestId = response.data.request_id;
      
      // Poll for quotes
      setTimeout(async () => {
        try {
          const quotesResponse = await api.get(`/insurance/quotes/${requestId}`);
          setInsuranceQuotes(quotesResponse.data.quotes || []);
        } catch (error) {
          console.error('Error getting insurance quotes:', error);
        }
      }, 2000);
      
    } catch (error) {
      console.error('Error requesting insurance quotes:', error);
      alert(error.response?.data?.detail || 'Failed to request insurance quotes');
    } finally {
      setLoading({ ...loading, insurance: false });
    }
  };

  const buyInsurance = async (quoteId) => {
    try {
      await api.post('/insurance/buy', {
        quote_id: quoteId
      });
      
      setSelectedInsurance(insuranceQuotes.find(q => q.id === quoteId));
      alert('Insurance purchased successfully!');
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error buying insurance:', error);
      alert(error.response?.data?.detail || 'Failed to purchase insurance');
    }
  };

  const applyForFinancing = async () => {
    setLoading({ ...loading, finance: true });
    try {
      const response = await api.post('/financing/apply', {
        order_id: orderId,
        amount_cents: orderDetails.total_cents
      });
      
      setFinanceApplication(response.data);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error applying for financing:', error);
      alert(error.response?.data?.detail || 'Failed to apply for financing');
    } finally {
      setLoading({ ...loading, finance: false });
    }
  };

  return (
    <div className="space-y-6">
      {/* Transport Options */}
      <IfFlag flag="ff.transport">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Transport Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedTransport ? (
              <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div className="flex-1">
                  <div className="font-medium">{selectedTransport.provider}</div>
                  <div className="text-sm text-gray-600">
                    R{selectedTransport.price_formatted} • ETA: {selectedTransport.eta_hours}h
                  </div>
                </div>
                <Badge className="bg-green-100 text-green-800">Booked</Badge>
              </div>
            ) : transportQuotes.length > 0 ? (
              <div className="space-y-3">
                {transportQuotes.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{quote.provider}</div>
                      <div className="text-sm text-gray-600">
                        {quote.price_formatted} • ETA: {quote.eta_hours}h
                      </div>
                      {quote.meta?.description && (
                        <div className="text-xs text-gray-500">{quote.meta.description}</div>
                      )}
                    </div>
                    <Button 
                      onClick={() => bookTransport(quote.id)}
                      size="sm"
                    >
                      Book
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="text-gray-600">Get transport quotes for your livestock</div>
                <Button 
                  onClick={requestTransportQuotes}
                  disabled={loading.transport}
                  variant="outline"
                >
                  {loading.transport ? 'Getting Quotes...' : 'Get Transport Quotes'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </IfFlag>

      {/* Insurance Options */}  
      <IfFlag flag="ff.insurance">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Insurance Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedInsurance ? (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <div className="font-medium">{selectedInsurance.provider}</div>
                  <div className="text-sm text-gray-600">
                    Premium: {selectedInsurance.premium_formatted}
                  </div>
                </div>
                <Badge className="bg-blue-100 text-blue-800">Active</Badge>
              </div>
            ) : insuranceQuotes.length > 0 ? (
              <div className="space-y-3">
                {insuranceQuotes.map((quote) => (
                  <div key={quote.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{quote.provider}</div>
                      <div className="text-sm text-gray-600">
                        Premium: {quote.premium_formatted}
                      </div>
                      <div className="text-xs text-gray-500">
                        Mortality-in-transit coverage
                      </div>
                    </div>
                    <Button 
                      onClick={() => buyInsurance(quote.id)}
                      size="sm"
                    >
                      Add Coverage
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="text-gray-600">Protect your livestock during transport</div>
                <Button 
                  onClick={requestInsuranceQuotes}
                  disabled={loading.insurance}
                  variant="outline"
                >
                  {loading.insurance ? 'Getting Quotes...' : 'Get Insurance Quotes'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </IfFlag>

      {/* Financing Options */}
      <IfFlag flag="ff.finance">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Financing Options
            </CardTitle>
          </CardHeader>
          <CardContent>
            {financeApplication ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium">Financing Application</div>
                    <div className="text-sm text-gray-600">
                      Amount: R{(orderDetails.total_cents / 100).toFixed(2)}
                    </div>
                  </div>
                  <Badge 
                    className={
                      financeApplication.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      financeApplication.status === 'DECLINED' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {financeApplication.status}
                  </Badge>
                </div>
                {financeApplication.status === 'APPROVED' && (
                  <div className="text-sm text-green-600 bg-green-50 p-3 rounded">
                    ✅ Financing approved! You can complete your purchase now.
                  </div>
                )}
                {financeApplication.status === 'DECLINED' && (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
                    ❌ Financing application was declined. Please try a different payment method.
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center space-y-3">
                <div className="text-gray-600">Buy now, pay later with financing</div>
                <Button 
                  onClick={applyForFinancing}
                  disabled={loading.finance}
                  variant="outline"
                >
                  {loading.finance ? 'Applying...' : 'Apply for Financing'}
                </Button>
                <div className="text-xs text-gray-500">
                  Quick approval • Competitive rates
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </IfFlag>
    </div>
  );
};

export default CheckoutOptions;