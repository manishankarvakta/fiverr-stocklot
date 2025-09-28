// Mobile-Optimized Guest Checkout with Enhanced Payment Handling
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, ShoppingCart, CreditCard, Smartphone, CheckCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const MobileGuestCheckout = () => {
  const [formData, setFormData] = useState({
    email: '',
    fullName: '',
    phone: '',
    address: '',
    city: '',
    province: 'Western Cape',
    postalCode: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [cartItems, setCartItems] = useState([]);
  const [cartTotal, setCartTotal] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const isNative = Capacitor.isNativePlatform();
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    loadCartData();
  }, []);

  const loadCartData = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      if (savedCart) {
        const items = JSON.parse(savedCart);
        setCartItems(items);
        
        const total = items.reduce((sum, item) => sum + (item.price_per_unit * item.quantity), 0);
        setCartTotal(total);
      }
    } catch (error) {
      console.error('Error loading cart:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    const required = ['email', 'fullName', 'phone', 'address', 'city', 'postalCode'];
    const missing = required.filter(field => !formData[field]?.trim());
    
    if (missing.length > 0) {
      toast({
        title: "Missing Information",
        description: `Please fill in: ${missing.join(', ')}`,
        variant: "destructive"
      });
      return false;
    }
    
    if (!formData.email.includes('@')) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const createMobileOrder = async () => {
    if (!validateForm()) return;
    if (cartItems.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    // Haptic feedback on native devices
    if (isNative) {
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.log('Haptics not available:', error);
      }
    }
    
    try {
      // Build order payload for mobile
      const orderPayload = {
        contact: {
          email: formData.email,
          full_name: formData.fullName,
          phone: formData.phone
        },
        ship_to: {
          address: formData.address,
          city: formData.city,
          province: formData.province,
          postal_code: formData.postalCode
        },
        items: cartItems.map(item => ({
          listing_id: item.listing_id || item.id,
          qty: item.quantity,
          species: item.species || 'cattle',
          product_type: item.product_type || 'breeding',
          line_total: item.price_per_unit * item.quantity
        })),
        quote: {
          sellers: [{
            seller_id: cartItems[0]?.seller_id || 'mobile-seller',
            subtotal: cartTotal,
            delivery: 100,
            items: cartItems.map(item => ({
              listing_id: item.listing_id || item.id,
              title: item.title,
              unit: 'head',
              qty: item.quantity,
              price: item.price_per_unit,
              line_total: item.price_per_unit * item.quantity,
              species: item.species || 'cattle',
              product_type: item.product_type || 'breeding'
            }))
          }],
          summary: {
            subtotal: cartTotal,
            delivery_total: 100,
            buyer_processing_fee: cartTotal * 0.015, // 1.5%
            escrow_service_fee: 25,
            grand_total: cartTotal + 100 + (cartTotal * 0.015) + 25,
            currency: 'ZAR'
          }
        },
        platform: 'mobile'
      };
      
      console.log('📱 Creating mobile order:', orderPayload);
      
      const response = await fetch(`${API_BASE}/api/checkout/guest/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(orderPayload)
      });
      
      const orderData = await response.json();
      console.log('📱 Mobile order response:', orderData);
      
      if (response.ok && orderData.ok) {
        // SUCCESS: Order created
        console.log('✅ Mobile order created successfully');
        
        // MOBILE-SPECIFIC PAYMENT REDIRECT HANDLING
        const paymentUrl = extractPaymentUrl(orderData);
        
        if (paymentUrl) {
          console.log('💳 Mobile payment URL found:', paymentUrl);
          
          // Show success message
          toast({
            title: "📱 Mobile Order Created!",
            description: "Redirecting to mobile payment gateway...",
            duration: 2000,
          });
          
          // SUCCESS HAPTIC FEEDBACK
          if (isNative) {
            try {
              await Haptics.impact({ style: ImpactStyle.Medium });
            } catch (error) {
              console.log('Haptics not available:', error);
            }
          }
          
          // MOBILE PAYMENT REDIRECT
          setTimeout(async () => {
            if (isNative) {
              // Native app: Use Capacitor Browser for payment
              console.log('🚀 Opening mobile payment in native browser');
              try {
                await Browser.open({
                  url: paymentUrl,
                  windowName: '_system',
                  presentationStyle: 'popover'
                });
              } catch (error) {
                console.error('Native browser error, falling back:', error);
                window.location.href = paymentUrl;
              }
            } else {
              // Web app: Direct redirect
              console.log('🚀 Mobile web redirect to payment');
              window.location.href = paymentUrl;
            }
          }, 1000);
          
        } else {
          // No payment URL found
          console.log('⚠️ No payment URL found in mobile response');
          toast({
            title: "📱 Order Created",
            description: `Order ${orderData.order_group_id} created successfully`,
            duration: 3000,
          });
          
          // Navigate to order confirmation
          setTimeout(() => {
            navigate(`/orders/${orderData.order_group_id}`);
          }, 2000);
        }
        
        // Clear mobile cart
        localStorage.removeItem('cart');
        setCartItems([]);
        setCartTotal(0);
        
      } else {
        throw new Error(orderData.error || 'Mobile order creation failed');
      }
      
    } catch (error) {
      console.error('❌ Mobile order error:', error);
      
      // ERROR HAPTIC FEEDBACK
      if (isNative) {
        try {
          await Haptics.impact({ style: ImpactStyle.Heavy });
        } catch (hapticError) {
          console.log('Haptics not available:', hapticError);
        }
      }
      
      toast({
        title: "📱 Mobile Order Failed",
        description: error.message || "Failed to create order on mobile. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const extractPaymentUrl = (orderData) => {
    // Mobile-optimized payment URL extraction
    const possiblePaths = [
      'paystack.authorization_url',
      'authorization_url',
      'redirect_url',
      'payment_url'
    ];
    
    for (const path of possiblePaths) {
      const url = getNestedValue(orderData, path);
      if (url && isValidPaymentUrl(url)) {
        console.log(`📱 Found mobile payment URL at: ${path}`);
        return url;
      }
    }
    
    return null;
  };

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const isValidPaymentUrl = (url) => {
    return url && (
      url.includes('paystack.com') || 
      url.includes('checkout') ||
      url.includes('payment') ||
      url.startsWith('https://demo-checkout')
    );
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center">
        <Button variant="ghost" size="sm" onClick={goBack} className="mr-3">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="font-semibold text-lg">Mobile Checkout</h1>
        {isNative && (
          <Badge variant="outline" className="ml-auto bg-green-100 text-green-800">
            <Smartphone className="h-3 w-3 mr-1" />
            Native
          </Badge>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Mobile Cart Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <ShoppingCart className="h-5 w-5 mr-2" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cartItems.length > 0 ? (
              <div className="space-y-3">
                {cartItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center py-2 border-b last:border-b-0">
                    <div className="flex-1">
                      <div className="font-medium text-sm">{item.title}</div>
                      <div className="text-xs text-gray-600">{item.quantity} × R{item.price_per_unit.toLocaleString()}</div>
                    </div>
                    <div className="font-semibold">R{(item.price_per_unit * item.quantity).toLocaleString()}</div>
                  </div>
                ))}
                <div className="pt-2 border-t">
                  <div className="flex justify-between font-bold">
                    <span>Total</span>
                    <span>R{cartTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <ShoppingCart className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>No items in cart</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Mobile Contact Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="fullName">Full Name *</Label>
              <Input
                id="fullName"
                placeholder="Your full name"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+27 123 456 7890"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="mt-1"
              />
            </div>
          </CardContent>
        </Card>

        {/* Mobile Shipping Form */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                placeholder="123 Main Street"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="mt-1"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  placeholder="Cape Town"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="postalCode">Postal Code *</Label>
                <Input
                  id="postalCode"
                  placeholder="8000"
                  value={formData.postalCode}
                  onChange={(e) => handleInputChange('postalCode', e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="province">Province *</Label>
              <select
                id="province"
                value={formData.province}
                onChange={(e) => handleInputChange('province', e.target.value)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Western Cape">Western Cape</option>
                <option value="Eastern Cape">Eastern Cape</option>
                <option value="Northern Cape">Northern Cape</option>
                <option value="Free State">Free State</option>
                <option value="KwaZulu-Natal">KwaZulu-Natal</option>
                <option value="North West">North West</option>
                <option value="Gauteng">Gauteng</option>
                <option value="Mpumalanga">Mpumalanga</option>
                <option value="Limpopo">Limpopo</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Submit Button */}
        <Card>
          <CardContent className="pt-6">
            <Button
              onClick={createMobileOrder}
              disabled={isLoading || cartItems.length === 0}
              className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing Mobile Order...
                </div>
              ) : (
                <div className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  📱 Complete Mobile Order
                </div>
              )}
            </Button>
            
            {isNative && (
              <p className="text-xs text-center text-gray-600 mt-2">
                Payment will open in native browser for security
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MobileGuestCheckout;