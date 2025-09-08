import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Badge,
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Alert, AlertDescription, Separator
} from '../components/ui';
import { 
  ShoppingCart, Plus, Minus, Trash2, CreditCard, Truck, 
  MapPin, User, Phone, Mail, Check, AlertTriangle, ArrowLeft, Package
} from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Import useAuth hook from App.js
function useAuth() {
  // Since we can't directly import from App.js, we'll implement basic auth detection
  const token = localStorage.getItem('token');
  const userData = localStorage.getItem('user');
  return {
    user: token && userData ? JSON.parse(userData) : null,
    isAuthenticated: !!token
  };
}

export default function CartPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [cart, setCart] = useState({ items: [], total: 0, item_count: 0 });
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [guestCart, setGuestCart] = useState([]);
  const [isGuest, setIsGuest] = useState(!isAuthenticated);
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

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setLoading(true);
    try {
      if (isAuthenticated && user) {
        // Authenticated user - fetch from backend
        const response = await fetch(`${API}/cart`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setCart(data);
          setIsGuest(false);
        } else if (response.status === 401) {
          // Token invalid, treat as guest
          loadGuestCart();
        }
      } else {
        // Guest user - load from localStorage
        loadGuestCart();
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
      loadGuestCart();
    } finally {
      setLoading(false);
    }
  };

  const loadGuestCart = () => {
    const guestCartData = JSON.parse(localStorage.getItem('guest_cart') || '[]');
    setGuestCart(guestCartData);
    setIsGuest(true);
    
    // Calculate guest cart totals
    const total = guestCartData.reduce((sum, item) => sum + (item.price * item.qty), 0);
    setCart({
      items: guestCartData,
      total: total,
      item_count: guestCartData.reduce((sum, item) => sum + item.qty, 0)
    });
  };

  const updateQuantity = async (itemId, newQty) => {
    if (newQty <= 0) {
      removeItem(itemId);
      return;
    }

    try {
      if (isGuest) {
        // Update guest cart
        const updatedGuestCart = guestCart.map(item => 
          item.listing_id === itemId ? { ...item, qty: newQty } : item
        );
        setGuestCart(updatedGuestCart);
        localStorage.setItem('guest_cart', JSON.stringify(updatedGuestCart));
        
        // Recalculate totals
        const total = updatedGuestCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        setCart({
          items: updatedGuestCart,
          total: total,
          item_count: updatedGuestCart.reduce((sum, item) => sum + item.qty, 0)
        });
      } else {
        // Update authenticated cart
        const response = await fetch(`${API}/cart/update`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ listing_id: itemId, quantity: newQty })
        });

        if (response.ok) {
          fetchCart();
        }
      }
    } catch (error) {
      console.error('Error updating quantity:', error);
    }
  };

  const removeItem = async (itemId) => {
    try {
      if (isGuest) {
        // Remove from guest cart
        const updatedGuestCart = guestCart.filter(item => item.listing_id !== itemId);
        setGuestCart(updatedGuestCart);
        localStorage.setItem('guest_cart', JSON.stringify(updatedGuestCart));
        
        // Recalculate totals
        const total = updatedGuestCart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        setCart({
          items: updatedGuestCart,
          total: total,
          item_count: updatedGuestCart.reduce((sum, item) => sum + item.qty, 0)
        });
      } else {
        // Remove from authenticated cart
        const response = await fetch(`${API}/cart/remove`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ listing_id: itemId })
        });

        if (response.ok) {
          fetchCart();
        }
      }
    } catch (error) {
      console.error('Error removing item:', error);
    }
  };

  const proceedToCheckout = () => {
    if (isGuest) {
      navigate('/checkout/guest');
    } else {
      setShowCheckout(true);
    }
  };

  const handleCheckout = async () => {
    if (!shippingAddress.full_name || !shippingAddress.phone || !shippingAddress.address_line_1) {
      alert('Please fill in all required shipping address fields');
      return;
    }

    setCheckingOut(true);
    try {
      const response = await fetch(`${API}/cart/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ shipping_address: shippingAddress })
      });

      if (response.ok) {
        const result = await response.json();
        alert('Order placed successfully!');
        navigate('/dashboard');
      } else {
        const error = await response.json();
        alert(error.detail || 'Checkout failed');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      alert('Checkout failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Loading your cart...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" onClick={() => navigate(-1)} className="flex items-center space-x-2">
              <ArrowLeft className="h-5 w-5" />
              <span>Continue Shopping</span>
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-3">
                <ShoppingCart className="h-8 w-8" />
                <span>Shopping Cart</span>
              </h1>
              {isGuest && (
                <p className="text-sm text-orange-600 mt-1">
                  You're shopping as a guest. <button onClick={() => navigate('/login')} className="underline">Login</button> to save your cart.
                </p>
              )}
            </div>
          </div>
          <Badge variant="secondary" className="text-sm">
            {cart.item_count} {cart.item_count === 1 ? 'item' : 'items'}
          </Badge>
        </div>

        {cart.items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Browse our marketplace to find livestock for your farm.</p>
            <Button onClick={() => navigate('/marketplace')} className="bg-green-600 hover:bg-green-700">
              Browse Marketplace
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cart.items.map((item) => (
                <Card key={item.listing_id || item.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4">
                      {/* Item Image */}
                      <div className="flex-shrink-0">
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <Package className="h-8 w-8 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-lg font-semibold text-gray-900 truncate">
                          {item.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Price: R{item.price?.toFixed(2) || '0.00'} per unit
                        </p>
                        <p className="text-sm text-gray-500">
                          Subtotal: R{((item.price || 0) * (item.qty || item.quantity || 0)).toFixed(2)}
                        </p>
                      </div>
                      
                      {/* Quantity Controls */}
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.listing_id || item.id, (item.qty || item.quantity) - 1)}
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-medium">
                          {item.qty || item.quantity || 0}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.listing_id || item.id, (item.qty || item.quantity) + 1)}
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Remove Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.listing_id || item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-4">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Order Summary</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between text-sm">
                    <span>Subtotal ({cart.item_count} items)</span>
                    <span>R{cart.total?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Delivery</span>
                    <span className="text-green-600">Calculated at checkout</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>R{cart.total?.toFixed(2) || '0.00'}</span>
                  </div>
                  
                  <Button 
                    onClick={proceedToCheckout}
                    className="w-full bg-green-600 hover:bg-green-700"
                    disabled={cart.items.length === 0}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    Proceed to Checkout
                  </Button>
                  
                  {isGuest && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        As a guest, you'll be directed to guest checkout where you can complete your purchase without creating an account.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}