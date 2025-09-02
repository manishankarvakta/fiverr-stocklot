'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  ShoppingCart, MapPin, Phone, Mail, User, 
  Shield, AlertTriangle, CheckCircle, Loader2,
  Package, CreditCard
} from 'lucide-react';
import LocationPicker from '../location/LocationPicker';
import { assessRisk, RISK_CATEGORIES, getRiskCategory } from '../../lib/risk/riskRules';

export default function GuestCheckout() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [shipTo, setShipTo] = useState(null);
  const [contact, setContact] = useState({
    email: '',
    phone: '',
    full_name: ''
  });
  const [quote, setQuote] = useState(null);
  const [risk, setRisk] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState('details'); // details, quote, payment

  useEffect(() => {
    // Load cart items from localStorage
    const cartData = localStorage.getItem('cart');
    if (cartData) {
      try {
        const cart = JSON.parse(cartData);
        setItems(cart);
      } catch (error) {
        console.error('Error parsing cart data:', error);
      }
    }
  }, []);

  const getQuote = async () => {
    if (!shipTo || !items.length) return;
    
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/checkout/guest/quote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, ship_to: shipTo })
      });

      const data = await response.json();
      
      if (response.ok) {
        setQuote(data);
        setRisk(data.risk);
        setStep('quote');
      } else {
        setError(data.detail || 'Failed to get quote');
      }
    } catch (error) {
      console.error('Quote error:', error);
      setError('Failed to get quote');
    } finally {
      setLoading(false);
    }
  };

  const createOrder = async () => {
    if (!quote || !contact.email) return;

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/checkout/guest/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact,
          ship_to: shipTo,
          items,
          quote
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Redirect to payment or return page
        window.location.href = data.paystack.authorization_url;
      } else {
        setError(data.detail || 'Failed to create order');
      }
    } catch (error) {
      console.error('Order creation error:', error);
      setError('Failed to create order');
    } finally {
      setLoading(false);
    }
  };

  const getRiskBadge = (riskData) => {
    if (!riskData) return null;
    
    const category = getRiskCategory(riskData.score);
    const riskInfo = RISK_CATEGORIES[category];
    
    return (
      <Badge className={riskInfo.color}>
        {riskInfo.label}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Guest Checkout</h1>
            <p className="text-gray-600">Complete your livestock purchase without creating an account</p>
            <div className="flex items-center justify-center space-x-2 mt-4">
              <Badge variant="outline" className="text-emerald-600">🔒 Secure Escrow</Badge>
              <Badge variant="outline" className="text-emerald-600">📱 No Account Needed</Badge>
              <Badge variant="outline" className="text-emerald-600">⚡ Quick Checkout</Badge>
            </div>
          </div>

          {error && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Main Checkout Form */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Step 1: Delivery & Contact Details */}
              <Card className={step === 'details' ? 'border-emerald-500 shadow-lg' : ''}>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      step === 'details' ? 'bg-emerald-600 text-white' : 
                      shipTo && contact.email ? 'bg-green-600 text-white' : 'bg-gray-200'
                    }`}>
                      {shipTo && contact.email ? <CheckCircle className="h-5 w-5" /> : '1'}
                    </div>
                    <span>Delivery & Contact Information</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Delivery Address */}
                  <div>
                    <Label className="text-base font-semibold mb-3 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Delivery Address
                    </Label>
                    <LocationPicker 
                      value={shipTo}
                      onChange={setShipTo}
                      placeholder="Select your delivery location"
                      className="w-full"
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      Your exact address is never shared with sellers until payment is confirmed
                    </p>
                  </div>

                  <Separator />

                  {/* Contact Information */}
                  <div>
                    <Label className="text-base font-semibold mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Contact Information
                    </Label>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="full_name">Full Name</Label>
                        <Input
                          id="full_name"
                          value={contact.full_name}
                          onChange={(e) => setContact(prev => ({ ...prev, full_name: e.target.value }))}
                          placeholder="John van der Merwe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={contact.email}
                          onChange={(e) => setContact(prev => ({ ...prev, email: e.target.value }))}
                          placeholder="john@example.com"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          value={contact.phone}
                          onChange={(e) => setContact(prev => ({ ...prev, phone: e.target.value }))}
                          placeholder="+27 12 345 6789"
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    onClick={getQuote}
                    disabled={!shipTo || !contact.email || loading}
                    className="w-full bg-emerald-600 hover:bg-emerald-700"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Getting Quote...
                      </>
                    ) : (
                      'Get Quote & Continue'
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Step 2: Order Review & Risk Assessment */}
              {quote && (
                <Card className={step === 'quote' ? 'border-emerald-500 shadow-lg' : ''}>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        2
                      </div>
                      <span>Order Review</span>
                      {risk && getRiskBadge(risk)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Risk Assessment Display */}
                    {risk && (
                      <div className={`p-4 rounded-lg border ${
                        risk.gate === 'BLOCK' ? 'bg-red-50 border-red-200' :
                        risk.gate === 'STEPUP' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-green-50 border-green-200'
                      }`}>
                        <div className="flex items-start space-x-3">
                          <Shield className={`h-5 w-5 mt-0.5 ${
                            risk.gate === 'BLOCK' ? 'text-red-600' :
                            risk.gate === 'STEPUP' ? 'text-yellow-600' :
                            'text-green-600'
                          }`} />
                          <div>
                            <h4 className={`font-semibold ${
                              risk.gate === 'BLOCK' ? 'text-red-900' :
                              risk.gate === 'STEPUP' ? 'text-yellow-900' :
                              'text-green-900'
                            }`}>
                              {risk.gate === 'BLOCK' ? 'KYC Verification Required' :
                               risk.gate === 'STEPUP' ? 'Additional Verification May Be Required' :
                               'Order Approved for Guest Checkout'}
                            </h4>
                            <div className="text-sm mt-1 space-y-1">
                              {risk.reasons.map((reason, index) => (
                                <div key={index} className="flex items-center space-x-2">
                                  <div className="w-1 h-1 bg-current rounded-full"></div>
                                  <span>{reason}</span>
                                </div>
                              ))}
                            </div>
                            {risk.gate === 'STEPUP' && (
                              <p className="text-xs mt-2 opacity-80">
                                You can complete this purchase now. Additional verification may be requested before delivery.
                              </p>
                            )}
                            {risk.gate === 'BLOCK' && (
                              <p className="text-xs mt-2 opacity-80">
                                These items require full account verification. Please create an account to continue.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Order Summary */}
                    <div className="space-y-4">
                      {quote.sellers.map((seller, index) => (
                        <div key={index} className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold">Seller {seller.seller_id.substring(0, 8)}...</h4>
                            <Badge variant="outline">
                              {seller.items.length} item{seller.items.length !== 1 ? 's' : ''}
                            </Badge>
                          </div>
                          
                          <div className="space-y-2">
                            {seller.items.map((item, itemIndex) => (
                              <div key={itemIndex} className="flex items-center justify-between text-sm">
                                <div>
                                  <span className="font-medium">{item.title}</span>
                                  <span className="text-gray-500 ml-2">× {item.qty}</span>
                                </div>
                                <span className="font-medium">R{Number(item.line_total).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                          
                          <Separator className="my-3" />
                          <div className="flex items-center justify-between text-sm">
                            <span>Delivery:</span>
                            <span>R{Number(seller.delivery).toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Payment Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span>Subtotal:</span>
                          <span>R{Number(quote.summary.subtotal).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Delivery:</span>
                          <span>R{Number(quote.summary.delivery_total).toFixed(2)}</span>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between text-lg font-semibold">
                          <span>Total:</span>
                          <span>R{Number(quote.summary.grand_total).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <Button 
                      onClick={createOrder}
                      disabled={loading || risk?.gate === 'BLOCK'}
                      className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creating Order...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-4 w-4 mr-2" />
                          Pay Securely with Escrow
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Cart Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <ShoppingCart className="h-5 w-5" />
                    <span>Cart Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {items.length > 0 ? (
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div>
                            <div className="font-medium">{item.title}</div>
                            <div className="text-gray-500">Qty: {item.qty}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">R{(item.price * item.qty).toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p>Your cart is empty</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Security & Trust */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Shield className="h-5 w-5" />
                    <span>Secure Checkout</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Escrow payment protection</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Seller details hidden until payment</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Automatic account creation</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Order tracking included</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-3 bg-gray-50 rounded-md">
                    <p className="text-xs text-gray-600">
                      By continuing, you agree to our Terms of Service and Privacy Policy. 
                      An account will be automatically created for order tracking.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}