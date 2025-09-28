import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Checkbox } from '../ui/checkbox';
import { 
  ShoppingCart, AlertCircle, CheckCircle, MapPin, DollarSign, 
  Truck, Shield, Clock, User, Star, Info, CreditCard
} from 'lucide-react';

const AcceptOfferModal = ({ 
  isOpen, 
  onClose, 
  buyRequest, 
  offer, 
  onAccept 
}) => {
  const [formData, setFormData] = useState({
    qty: offer?.qty || 0,
    address_id: '',
    delivery_mode: 'seller',
    abattoir_id: '',
    accept_terms: false
  });
  
  const [addresses, setAddresses] = useState([]);
  const [abattoirs, setAbattoirs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totals, setTotals] = useState(null);
  const [error, setError] = useState(null);

  // Load user addresses and abattoirs
  useEffect(() => {
    if (isOpen) {
      loadAddresses();
      loadAbattoirs();
      calculateTotals();
    }
  }, [isOpen, formData.qty, formData.delivery_mode, formData.abattoir_id]);

  const loadAddresses = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/user/addresses`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        setAddresses(data.addresses || []);
        
        // Select default address
        const defaultAddr = data.addresses?.find(addr => addr.is_default) || data.addresses?.[0];
        if (defaultAddr && !formData.address_id) {
          setFormData(prev => ({ ...prev, address_id: defaultAddr.id }));
        }
      }
    } catch (error) {
      console.error('Error loading addresses:', error);
    }
  };

  const loadAbattoirs = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/abattoirs/nearby`, {
        headers: {
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });

      if (res.ok) {
        const data = await res.json();
        setAbattoirs(data.abattoirs || []);
      }
    } catch (error) {
      console.error('Error loading abattoirs:', error);
    }
  };

  const calculateTotals = () => {
    if (!offer || !formData.qty) return;

    // Basic calculation (in production, this would be server-side)
    const merchandiseTotal = offer.offer_price * formData.qty;
    const deliveryCost = formData.delivery_mode === 'seller' ? Math.max(50, formData.qty * 2) : 0;
    const abattoirCost = formData.abattoir_id ? formData.qty * 15 : 0;
    const platformFee = merchandiseTotal * 0.025;
    const vat = platformFee * 0.15;
    const grandTotal = merchandiseTotal + deliveryCost + abattoirCost + platformFee + vat;

    setTotals({
      merchandise_total: merchandiseTotal,
      delivery_cost: deliveryCost,
      abattoir_cost: abattoirCost,
      platform_fee: platformFee,
      vat: vat,
      grand_total: grandTotal
    });
  };

  const handleAccept = async () => {
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (!formData.address_id) {
        throw new Error('Please select a delivery address');
      }
      if (!formData.accept_terms) {
        throw new Error('Please accept the terms and conditions');
      }
      if (formData.qty <= 0 || formData.qty > offer.qty) {
        throw new Error('Invalid quantity selected');
      }

      const token = localStorage.getItem('token');
      const idempotencyKey = `accept-${offer.id}-${Date.now()}`;
      
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/buy-requests/${buyRequest.id}/offers/${offer.id}/accept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Idempotency-Key': idempotencyKey,
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            qty: formData.qty,
            address_id: formData.address_id,
            delivery_mode: formData.delivery_mode,
            abattoir_id: formData.abattoir_id || null
          })
        }
      );

      const result = await res.json();

      if (!res.ok) {
        // Handle specific error codes
        const errorDetail = result.detail;
        if (typeof errorDetail === 'object' && errorDetail.error_code) {
          handleSpecificError(errorDetail.error_code, errorDetail.message);
          return;
        }
        throw new Error(result.detail || 'Failed to accept offer');
      }

      // Success - show toast and redirect to checkout
      showToast('Offer accepted! Price locked for 15:00. Redirecting to checkout…', 'success');
      
      // Call parent callback with order info
      if (onAccept) {
        onAccept({
          order_group_id: result.order_group_id,
          price_lock_expires_at: result.price_lock_expires_at,
          totals: result.totals
        });
      }

      onClose();

    } catch (error) {
      console.error('Error accepting offer:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecificError = (errorCode, message) => {
    switch (errorCode) {
      case 'OFFER_EXPIRED':
        setError('This offer is no longer available. Ask the seller to resend.');
        break;
      case 'OUT_OF_RANGE':
        setError('This seller doesn\'t deliver to your location. Request a delivery quote?');
        break;
      case 'DISEASE_BLOCK':
        setError('Live-animal trade is restricted in your area right now.');
        break;
      case 'KYC_REQUIRED':
        setError('Verification required for this category. It protects buyers and sellers.');
        // In production, open KYC modal here
        break;
      case 'QTY_CHANGED':
        setError('Availability changed. Recalculate & re-lock?');
        break;
      default:
        setError(message || 'An error occurred while accepting the offer');
    }
  };

  const formatPrice = (price) => {
    return `R${Number(price).toFixed(2)}`;
  };

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-md z-50 max-w-sm ${
      type === 'error' ? 'bg-red-500' : 
      type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    } text-white`;
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-sm">${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 5000);
  };

  if (!isOpen || !offer || !buyRequest) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Accept Offer & Checkout
          </DialogTitle>
        </DialogHeader>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Form */}
          <div className="lg:col-span-2 space-y-6">
            {/* Seller Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5" />
                  Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Premium Livestock Supplier</div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Star className="h-4 w-4 text-yellow-500" />
                      4.8 rating (127 reviews)
                      <Badge className="bg-green-100 text-green-800 ml-2">Verified</Badge>
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Professional livestock supplier with 10+ years experience. Specializes in premium grade cattle and sheep.
                </p>
              </CardContent>
            </Card>

            {/* Offer Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Offer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Species & Type</Label>
                    <div className="text-lg font-semibold">
                      {buyRequest.species} • {buyRequest.product_type}
                    </div>
                    {buyRequest.breed && (
                      <div className="text-sm text-gray-600">Breed: {buyRequest.breed}</div>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Offered Price</Label>
                    <div className="text-lg font-semibold text-green-600">
                      {formatPrice(offer.offer_price)} per {buyRequest.unit}
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-medium">Quantity Available</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <Input
                      type="number"
                      min="1"
                      max={offer.qty}
                      value={formData.qty}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        qty: parseInt(e.target.value) || 0 
                      }))}
                      className="w-24"
                    />
                    <span className="text-sm text-gray-600">
                      of {offer.qty} {buyRequest.unit} available
                    </span>
                  </div>
                </div>

                {offer.message && (
                  <div>
                    <Label className="text-sm font-medium">Seller's Message</Label>
                    <div className="mt-1 p-3 bg-blue-50 rounded text-sm">
                      {offer.message}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Delivery Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Truck className="h-5 w-5" />
                  Delivery Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Delivery Address</Label>
                  <Select 
                    value={formData.address_id} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, address_id: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select delivery address" />
                    </SelectTrigger>
                    <SelectContent>
                      {addresses.map(address => (
                        <SelectItem key={address.id} value={address.id}>
                          {address.name} - {address.city}, {address.province}
                          {address.is_default && ' (Default)'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Delivery Method</Label>
                  <Select 
                    value={formData.delivery_mode} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, delivery_mode: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="seller">Seller Delivery</SelectItem>
                      <SelectItem value="rfq">Request Quote</SelectItem>
                      <SelectItem value="pickup">Self Pickup</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {buyRequest.product_type?.toLowerCase() === 'live' && (
                  <div>
                    <Label className="text-sm font-medium">Processing (Optional)</Label>
                    <Select 
                      value={formData.abattoir_id} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, abattoir_id: value }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="No processing required" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all-default">No processing</SelectItem>
                        {abattoirs.map(abattoir => (
                          <SelectItem key={abattoir.id} value={abattoir.id}>
                            {abattoir.name} - {abattoir.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Terms & Conditions */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <Checkbox
                    id="accept-terms"
                    checked={formData.accept_terms}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, accept_terms: checked }))}
                  />
                  <div className="text-sm">
                    <label htmlFor="accept-terms" className="cursor-pointer">
                      I accept the <a href="#" className="text-blue-600 hover:underline">Terms & Conditions</a> and 
                      <a href="#" className="text-blue-600 hover:underline ml-1">Escrow Agreement</a>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Summary */}
          <div className="space-y-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {totals && (
                  <>
                    <div className="flex justify-between">
                      <span>Merchandise ({formData.qty} {buyRequest.unit})</span>
                      <span>{formatPrice(totals.merchandise_total)}</span>
                    </div>
                    
                    {totals.delivery_cost > 0 && (
                      <div className="flex justify-between">
                        <span>Delivery</span>
                        <span>{formatPrice(totals.delivery_cost)}</span>
                      </div>
                    )}
                    
                    {totals.abattoir_cost > 0 && (
                      <div className="flex justify-between">
                        <span>Processing</span>
                        <span>{formatPrice(totals.abattoir_cost)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span>Platform Fee</span>
                      <span>{formatPrice(totals.platform_fee)}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>VAT</span>
                      <span>{formatPrice(totals.vat)}</span>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span>{formatPrice(totals.grand_total)}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Escrow Protection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4" />
                  Buyer Protection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Payment held in secure escrow</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Money back guarantee</span>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
                  <span>Quality inspection support</span>
                </div>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-red-800">Error</div>
                      <div className="text-sm text-red-700">{error}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleAccept}
                disabled={loading || !formData.accept_terms || formData.qty <= 0}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Accept & Checkout
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={onClose}
                disabled={loading}
                className="w-full"
              >
                Cancel
              </Button>
            </div>

            <div className="text-center text-xs text-gray-500">
              <Clock className="h-3 w-3 inline mr-1" />
              Price will be locked for 15 minutes after acceptance
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AcceptOfferModal;