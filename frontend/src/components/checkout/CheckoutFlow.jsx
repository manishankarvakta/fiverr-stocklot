import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { 
  ShoppingCart, Clock, CreditCard, Shield, Truck, MapPin, 
  DollarSign, AlertCircle, CheckCircle, RefreshCw, Lock,
  FileText, MessageSquare, Phone, Info
} from 'lucide-react';
import FeeBreakdown from './FeeBreakdown';
import CheckoutOptions from './CheckoutOptions';

const CheckoutFlow = ({ orderGroupId, onComplete, onCancel }) => {
  const [orderGroup, setOrderGroup] = useState(null);
  const [checkoutPreview, setCheckoutPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [error, setError] = useState(null);

  // Load order group data
  useEffect(() => {
    if (orderGroupId) {
      loadOrderGroup();
    }
  }, [orderGroupId]);

  // Timer for price lock countdown
  useEffect(() => {
    if (orderGroup && orderGroup.price_lock_expires_at) {
      const updateTimer = () => {
        const expiry = new Date(orderGroup.price_lock_expires_at);
        const now = new Date();
        const remaining = Math.max(0, expiry - now);
        setTimeRemaining(remaining);
        
        if (remaining <= 0) {
          handleLockExpired();
        }
      };
      
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      
      return () => clearInterval(interval);
    }
  }, [orderGroup]);

  const loadOrderGroup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/orders/${orderGroupId}`,
        {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        }
      );

      if (!res.ok) {
        throw new Error('Order not found');
      }

      const data = await res.json();
      setOrderGroup(data);
      
      // Load checkout preview for fee breakdown
      await loadCheckoutPreview(data);
      
    } catch (error) {
      console.error('Error loading order:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadCheckoutPreview = async (orderData) => {
    try {
      // Convert orderData to cart format for preview API
      const cartData = {
        cart: [
          {
            seller_id: "seller-" + orderGroupId,
            merch_subtotal_minor: Math.round((orderData.totals?.merchandise_total || 0) * 100),
            delivery_minor: Math.round((orderData.totals?.delivery_cost || 0) * 100),
            abattoir_minor: Math.round((orderData.totals?.abattoir_cost || 0) * 100),
            species: "cattle", // Default for now
            export: false
          }
        ],
        currency: "ZAR"
      };

      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/checkout/preview`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(cartData)
        }
      );

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setCheckoutPreview(data.preview);
        }
      }
    } catch (error) {
      console.error('Error loading checkout preview:', error);
      // Don't fail the entire checkout if preview fails
    }
  };

  const handleLockExpired = () => {
    setError('LOCK_EXPIRED');
  };

  const refreshPriceLock = async () => {
    setProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/orders/${orderGroupId}/refresh-lock`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        }
      );

      if (!res.ok) {
        throw new Error('Failed to refresh price lock');
      }

      const data = await res.json();
      setOrderGroup(prev => ({
        ...prev,
        price_lock_expires_at: data.price_lock_expires_at,
        totals: data.totals
      }));
      setError(null);
      showToast('Price lock refreshed successfully!', 'success');
    } catch (error) {
      console.error('Error refreshing lock:', error);
      setError('Failed to refresh price lock');
    } finally {
      setProcessing(false);
    }
  };

  const initializePayment = async () => {
    setProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/payments/paystack/init`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ order_group_id: orderGroupId })
        }
      );

      if (!res.ok) {
        throw new Error('Failed to initialize payment');
      }

      const data = await res.json();
      
      // Redirect to Paystack
      window.location.href = data.authorization_url;
    } catch (error) {
      console.error('Error initializing payment:', error);
      showToast('Payment initialization failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const cancelOrder = async () => {
    if (!confirm('Are you sure you want to cancel this order?')) return;
    
    setProcessing(true);
    
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/api/orders/${orderGroupId}/cancel`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ reason: 'User cancelled during checkout' })
        }
      );

      if (!res.ok) {
        throw new Error('Failed to cancel order');
      }

      showToast('Order cancelled successfully', 'success');
      if (onCancel) onCancel();
    } catch (error) {
      console.error('Error cancelling order:', error);
      showToast('Failed to cancel order', 'error');
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (milliseconds) => {
    const minutes = Math.floor(milliseconds / (1000 * 60));
    const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
    setTimeout(() => document.body.removeChild(toast), 4000);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">
              {error === 'LOCK_EXPIRED' ? 'Price Lock Expired' : 'Checkout Error'}
            </h3>
            <p className="text-gray-500 mb-4">
              {error === 'LOCK_EXPIRED' 
                ? 'Your price lock has expired. Re-lock to continue with checkout.'
                : error
              }
            </p>
            <div className="flex gap-2 justify-center">
              {error === 'LOCK_EXPIRED' && (
                <Button 
                  onClick={refreshPriceLock} 
                  disabled={processing}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
                  Re-lock Price
                </Button>
              )}
              <Button variant="outline" onClick={onCancel}>
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!orderGroup) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Order Not Found</h3>
            <p className="text-gray-500">This order could not be found or has expired.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const totals = orderGroup.totals || {};
  const isLockExpiring = timeRemaining < 300000; // Less than 5 minutes

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-2xl font-bold mb-2">Complete Your Purchase</h1>
        <p className="text-gray-600">Review your order details and proceed with secure payment</p>
      </div>

      {/* Price Lock Timer */}
      <Card className={`border-2 ${isLockExpiring ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isLockExpiring ? 'bg-red-100' : 'bg-green-100'}`}>
                <Lock className={`h-5 w-5 ${isLockExpiring ? 'text-red-600' : 'text-green-600'}`} />
              </div>
              <div>
                <div className="font-semibold">
                  {isLockExpiring ? 'Price Lock Expiring Soon!' : 'Price Locked'}
                </div>
                <div className="text-sm text-gray-600">
                  Time remaining: <span className="font-mono font-bold">{formatTime(timeRemaining)}</span>
                </div>
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={refreshPriceLock}
              disabled={processing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${processing ? 'animate-spin' : ''}`} />
              Extend Lock
            </Button>
          </div>
          {isLockExpiring && (
            <div className="mt-3 p-2 bg-red-100 rounded text-sm text-red-700">
              <AlertCircle className="h-4 w-4 inline mr-2" />
              Complete payment soon or your locked price may change.
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seller Order Lines */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" />
                Order Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* This would loop through seller orders in a real implementation */}
              <div className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold">Premium Livestock Supplier</h4>
                    <div className="text-sm text-gray-600">Verified Seller • 4.8★ (127 reviews)</div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">In Stock</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Angus Cattle • Live Animals</span>
                    <span className="font-medium">{formatPrice(totals.unit_price || 0)} × {totals.qty || 0}</span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Premium grade, vaccination certificates included
                  </div>
                </div>

                <Separator className="my-3" />

                <div className="flex justify-between font-semibold">
                  <span>Merchandise Total</span>
                  <span>{formatPrice(totals.merchandise_total || 0)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                Delivery Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 mt-1" />
                  <div>
                    <div className="font-medium">Delivery Address</div>
                    <div className="text-sm text-gray-600">
                      123 Farm Road, Pretoria, Gauteng, 0001
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-gray-500" />
                  <div>
                    <div className="font-medium">Estimated Delivery</div>
                    <div className="text-sm text-gray-600">
                      {orderGroup.delivery_mode === 'seller' ? '2-3 business days' : 'Quote requested'}
                    </div>
                  </div>
                </div>

                {totals.delivery_cost > 0 && (
                  <div className="flex justify-between pt-2 border-t">
                    <span>Delivery Cost</span>
                    <span className="font-medium">{formatPrice(totals.delivery_cost)}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Escrow Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Secure Escrow Protection
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Payment Protection</div>
                    <div className="text-gray-600">Your payment is held securely until delivery is confirmed</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Quality Guarantee</div>
                    <div className="text-gray-600">Animals must match specifications or get your money back</div>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                  <div>
                    <div className="font-medium">Dispute Resolution</div>
                    <div className="text-gray-600">Independent mediation if issues arise</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment Summary with Fee Breakdown */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {checkoutPreview && checkoutPreview.per_seller?.length > 0 ? (
                <FeeBreakdown
                  currency={checkoutPreview.currency || 'ZAR'}
                  subtotalCents={checkoutPreview.per_seller[0].lines.merch_subtotal_minor + 
                                checkoutPreview.per_seller[0].lines.delivery_minor + 
                                checkoutPreview.per_seller[0].lines.abattoir_minor}
                  processingFeeCents={checkoutPreview.per_seller[0].lines.buyer_processing_fee_minor}
                  escrowFeeCents={checkoutPreview.per_seller[0].lines.escrow_service_fee_minor}
                  grandTotalCents={checkoutPreview.per_seller[0].totals.buyer_total_minor}
                />
              ) : (
                // Fallback to original display if preview not available
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Merchandise</span>
                    <span>{formatPrice(totals.merchandise_total || 0)}</span>
                  </div>
                  
                  {totals.delivery_cost > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery</span>
                      <span>{formatPrice(totals.delivery_cost)}</span>
                    </div>
                  )}
                  
                  {totals.abattoir_cost > 0 && (
                    <div className="flex justify-between">
                      <span>Abattoir Processing</span>
                      <span>{formatPrice(totals.abattoir_cost)}</span>
                    </div>
                  )}
                  
                  {/* CRITICAL FIX: Added missing 1.5% buyer processing fee */}
                  <div className="flex justify-between">
                    <span>Processing Fee (1.5%)</span>
                    <span>{formatPrice((totals.merchandise_total || 0) * 0.015)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Escrow Service Fee</span>
                    <span>{formatPrice(25.00)}</span>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatPrice((totals.merchandise_total || 0) + (totals.delivery_cost || 0) + (totals.abattoir_cost || 0) + ((totals.merchandise_total || 0) * 0.015) + 25.00)}</span>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-500 mt-4">
                Prices locked until {new Date(orderGroup.price_lock_expires_at).toLocaleTimeString()}
              </div>
            </CardContent>
          </Card>

          {/* Payment Actions */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* StockLot Differentiator Features - Checkout Options */}
              <CheckoutOptions 
                orderId={orderGroupId}
                orderDetails={orderGroup}
                onUpdate={(options) => {
                  console.log('Checkout options updated:', options);
                  // Could update order with transport/insurance/finance options
                }}
              />
              
              <Button
                onClick={initializePayment}
                disabled={processing || timeRemaining <= 0}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Pay with Paystack
                  </>
                )}
              </Button>

              <div className="text-center text-xs text-gray-500">
                <Shield className="h-4 w-4 inline mr-1" />
                Secured by 256-bit SSL encryption
              </div>

              <Separator />

              <Button
                variant="outline"
                onClick={cancelOrder}
                disabled={processing}
                className="w-full"
              >
                Cancel Order
              </Button>
            </CardContent>
          </Card>

          {/* Support Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span>Live chat support available</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-gray-500" />
                <span>Call us: 0800 123 456</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span>Terms & Conditions</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CheckoutFlow;