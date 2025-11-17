import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Alert, AlertDescription, Separator
} from '../ui';
import { 
  ShoppingCart, Plus, Minus, Trash2, CreditCard, Truck, 
  MapPin, User, Phone, Mail, Check, AlertTriangle
} from 'lucide-react';
import { useRateLimitedRequest, RateLimitedButton, RateLimitErrorHandler } from '@/hooks/useRateLimiting';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function ShoppingCartModal({ isOpen, onClose, onCartUpdate }) {
  const [cart, setCart] = useState({ items: [], total: 0, item_count: 0 });
  const [loading, setLoading] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [shippingAddress, setShippingAddress] = useState({
    full_name: '',
    phone: '',
    address_line_1: '',
    address_line_2: '',
    city: '',
    province: '',
    postal_code: '',
    country: 'South Africa'
  });

  // Rate limited checkout functionality
  const {
    makeRequest: makeCheckoutRequest,
    isLoading: isCheckoutLoading,
    error: checkoutError,
    clearLimits: clearCheckoutLimits
  } = useRateLimitedRequest('checkout', { maxRequests: 3, windowMs: 300000 }); // 3 per 5 minutes

  useEffect(() => {
    if (isOpen) {
      fetchCart();
    }
  }, [isOpen]);

  const fetchCart = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Authenticated user - fetch from backend
        const response = await fetch(`${API}/cart`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCart(data);
          onCartUpdate?.(data.item_count);
        }
      } else {
        // Guest user - load from localStorage
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        const cartData = {
          items: guestCart,
          total: guestCart.reduce((sum, item) => sum + (item.price * item.qty), 0),
          item_count: guestCart.reduce((sum, item) => sum + item.qty, 0)
        };
        setCart(cartData);
        onCartUpdate?.(cartData.item_count);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (token) {
        // Authenticated user - remove from backend
        const response = await fetch(`${API}/cart/item/${itemId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          await fetchCart();
        }
      } else {
        // Guest user - remove from localStorage
        const guestCart = JSON.parse(localStorage.getItem('guest_cart') || '[]');
        const updatedCart = guestCart.filter(item => item.listing_id !== itemId);
        localStorage.setItem('guest_cart', JSON.stringify(updatedCart));
        await fetchCart(); // Refresh cart display
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
    }
  };

  const proceedToCheckout = () => {
    setShowCheckout(true);
  };

  const completeCheckout = async () => {
    console.log('🛒 SECURE BACKEND CHECKOUT: Starting checkout...');
    
    try {
      // Basic validation
      if (!shippingAddress.full_name || !shippingAddress.address_line_1) {
        alert('Please fill in at least your name and address to continue.');
        return;
      }
      
      console.log('🛒 Creating secure order through backend:', cart.total);
      
      // Confirm payment
      const confirmPayment = confirm(`
🛒 PROCEED TO SECURE PAYMENT

Order Summary:
• Items: ${cart.items.length} livestock items
• Total: R${cart.total}
• Delivery: ${shippingAddress.address_line_1}, ${shippingAddress.city}

Click OK to proceed to payment gateway.
      `);
      
      if (!confirmPayment) {
        console.log('🛒 Payment cancelled by user');
        return;
      }
      
      // Create secure payment through our backend
      const paymentData = {
        amount: cart.total,
        email: shippingAddress.email || 'customer@stocklot.co.za',
        reference: 'STOCKLOT_CART_' + Date.now(),
        metadata: {
          cart_items: cart.items.length,
          total_amount: cart.total,
          shipping_address: JSON.stringify(shippingAddress),
          order_type: 'cart_checkout'
        }
      };
      
      console.log('🛒 Using secure backend payment endpoint...');
      
      // Call our secure backend payment endpoint
      const response = await fetch(`${API}/payment/create-paystack`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'guest'}`
        },
        body: JSON.stringify(paymentData)
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Secure backend payment response:', result);
        
        if (result.success && result.payment_url) {
          console.log('🛒 Redirecting to secure payment:', result.payment_url);
          // Redirect to securely initialized Paystack payment
          window.location.href = result.payment_url;
          return;
        } else {
          throw new Error('Failed to get payment URL from secure backend');
        }
      } else {
        const errorData = await response.json();
        console.error('🚨 Backend payment error:', errorData);
        throw new Error(`Payment error: ${errorData.detail || errorData.message || 'Payment initialization failed'}`);
      }
      
    } catch (error) {
      console.error('🚨 Payment gateway error:', error);
      
      // Enhanced error handling with user options
      const retryConfirm = confirm(`
❌ Payment Gateway Error

${error.message}

Would you like to:
• OK = Try again
• Cancel = Save order for later
      `);
      
      if (retryConfirm) {
        // Retry payment
        setTimeout(() => completeCheckout(), 2000);
      } else {
        // Save order for later
        alert(`📋 Order Saved

Items: ${cart.items.length} livestock items
Total: R${cart.total}

Your cart has been saved. Please try payment again later.`);
      }
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(price);
  };

  if (showCheckout) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <CreditCard className="h-5 w-5 mr-2 text-emerald-600" />
              Checkout
            </DialogTitle>
            <DialogDescription>
              Complete your order information
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h3 className="font-medium text-emerald-900 mb-2">Order Summary</h3>
              <div className="space-y-2">
                {cart.items?.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>{item.listing.title} x{item.quantity}</span>
                    <span>{formatPrice(item.item_total + item.shipping_cost)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>Total</span>
                  <span className="text-emerald-600">{formatPrice(cart.total)}</span>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Shipping Address
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={shippingAddress.full_name}
                    onChange={(e) => setShippingAddress({...shippingAddress, full_name: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={shippingAddress.phone}
                    onChange={(e) => setShippingAddress({...shippingAddress, phone: e.target.value})}
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="address_line_1">Address Line 1 *</Label>
                <Input
                  id="address_line_1"
                  value={shippingAddress.address_line_1}
                  onChange={(e) => setShippingAddress({...shippingAddress, address_line_1: e.target.value})}
                  required
                />
              </div>

              <div>
                <Label htmlFor="address_line_2">Address Line 2 (Optional)</Label>
                <Input
                  id="address_line_2"
                  value={shippingAddress.address_line_2}
                  onChange={(e) => setShippingAddress({...shippingAddress, address_line_2: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) => setShippingAddress({...shippingAddress, city: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="province">Province *</Label>
                  <Select 
                    value={shippingAddress.province} 
                    onValueChange={(value) => setShippingAddress({...shippingAddress, province: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select province" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Eastern Cape">Eastern Cape</SelectItem>
                      <SelectItem value="Free State">Free State</SelectItem>
                      <SelectItem value="Gauteng">Gauteng</SelectItem>
                      <SelectItem value="KwaZulu-Natal">KwaZulu-Natal</SelectItem>
                      <SelectItem value="Limpopo">Limpopo</SelectItem>
                      <SelectItem value="Mpumalanga">Mpumalanga</SelectItem>
                      <SelectItem value="Northern Cape">Northern Cape</SelectItem>
                      <SelectItem value="North West">North West</SelectItem>
                      <SelectItem value="Western Cape">Western Cape</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="postal_code">Postal Code *</Label>
                  <Input
                    id="postal_code"
                    value={shippingAddress.postal_code}
                    onChange={(e) => setShippingAddress({...shippingAddress, postal_code: e.target.value})}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900 flex items-center">
                <CreditCard className="h-4 w-4 mr-2" />
                Payment Method
              </h3>
              <Alert className="bg-blue-50 border-blue-200">
                <AlertTriangle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-700">
                  Payment will be processed securely through our escrow system. Your money is protected until delivery is confirmed.
                </AlertDescription>
              </Alert>
            </div>
          </div>

          <DialogFooter>
            {/* Rate Limit Error Display */}
            <RateLimitErrorHandler 
              error={checkoutError}
              onRetry={() => window.location.reload()}
              onClear={clearCheckoutLimits}
            />
            
            <Button variant="outline" onClick={() => setShowCheckout(false)} disabled={isCheckoutLoading}>
              Back to Cart
            </Button>
            <RateLimitedButton
              rateLimitKey="checkout_complete"
              maxRequests={3}
              windowMs={300000}
              onClick={completeCheckout} 
              disabled={false}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-md cursor-pointer"
              style={{ opacity: 1, pointerEvents: 'auto' }}
            >
              <Check className="h-4 w-4 mr-2" />
              Complete Order {formatPrice(cart.total)}
            </RateLimitedButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <ShoppingCart className="h-5 w-5 mr-2 text-emerald-600" />
            Shopping Cart ({cart.item_count} items)
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading cart...</p>
            </div>
          ) : cart.items?.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Your cart is empty</p>
              <Button onClick={onClose} className="mt-4">
                Continue Shopping
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.items?.map((item) => (
                <Card key={item.id} className="border-emerald-100">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900">{item.listing.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Seller: {item.listing.user_name || 'StockLot Seller'}
                        </p>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className="text-sm text-gray-600">
                            Qty: {item.quantity}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatPrice(item.price)} each
                          </span>
                          {item.shipping_cost > 0 && (
                            <span className="text-sm text-emerald-600 flex items-center">
                              <Truck className="h-3 w-3 mr-1" />
                              Shipping: {formatPrice(item.shipping_cost)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-emerald-600">
                          {formatPrice(item.item_total + item.shipping_cost)}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeFromCart(item.id)}
                          className="mt-2 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {/* Cart Total */}
              <Card className="bg-emerald-50 border-emerald-200">
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-medium text-emerald-900">Total</span>
                    <span className="text-xl font-bold text-emerald-600">
                      {formatPrice(cart.total)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Continue Shopping
          </Button>
          {cart.items?.length > 0 && (
            <Button 
              onClick={proceedToCheckout}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Checkout {formatPrice(cart.total)}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}