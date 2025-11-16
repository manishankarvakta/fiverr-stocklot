import React, { useState } from "react";
import { useAuth } from '../../auth/AuthProvider';
import { 
  Button, Input, Label, Badge,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter
} from "../ui";
import { CheckCircle } from "lucide-react";

// API helper with auth token (keeping for backward compatibility)
const apiCall = async (method, url, data = null) => {
  const token = localStorage.getItem('token');
  const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
  const API = `${BACKEND_URL}/api`;
  
  try {
    const config = {
      method: method.toUpperCase(),
      url: `${API}${url}`,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
    };
    
    if (data && (method.toUpperCase() === 'POST' || method.toUpperCase() === 'PUT' || method.toUpperCase() === 'PATCH')) {
      config.data = data;
    }
    
    const response = await fetch(config.url, {
      method: config.method,
      headers: config.headers,
      body: data ? JSON.stringify(data) : undefined
    });
    
    return await response.json();
  } catch (error) {
    console.error('API call failed:', error);
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    throw error;
  }
};

function OrderModal({ listing, categoryName, isOpen, onClose }) {
  const { user } = useAuth();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const totalAmount = (listing.price_per_unit * quantity).toFixed(2);
  const marketplaceFee = (totalAmount * 0.05).toFixed(2);
  const grandTotal = (parseFloat(totalAmount) + parseFloat(marketplaceFee)).toFixed(2);

  const handleOrder = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      console.log('🛒 Creating order for listing:', listing.id, 'Quantity:', quantity);
      
      const response = await apiCall('POST', '/orders', {
        listing_id: listing.id,
        quantity: quantity
      });
      
      console.log('🛒 Order response:', response);
      
      if (response.data?.payment_url) {
        console.log('🛒 Payment URL received:', response.data.payment_url);
        // Redirect to actual payment URL
        window.open(response.data.payment_url, '_blank');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        console.log('🛒 No payment URL in response, marking as success');
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error('🚨 Error creating order:', error);
      // Add user feedback for errors
      alert('Failed to create order. Please try again.');
    }
    setLoading(false);
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-emerald-900 mb-2">Order Created Successfully!</h3>
            <p className="text-emerald-600">Your order has been placed and payment is being processed.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-emerald-900">Complete Your Order</DialogTitle>
          <DialogDescription className="text-emerald-600">
            Review your order details and confirm purchase
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Listing Summary */}
          <div className="border border-emerald-200 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <h4 className="font-semibold text-emerald-900">{listing.title}</h4>
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                {categoryName}
              </Badge>
            </div>
            <p className="text-sm text-emerald-600 mb-2">R{listing.price_per_unit} per {listing.unit}</p>
            {listing.has_vet_certificate && (
              <Badge variant="outline" className="text-xs border-green-500 text-green-700">
                Vet Certified
              </Badge>
            )}
          </div>

          {/* Quantity Selection */}
          <div>
            <Label className="text-emerald-800 mb-2 block">Quantity</Label>
            <div className="flex items-center space-x-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="border-emerald-300"
              >
                -
              </Button>
              <Input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 text-center border-emerald-200"
                min="1"
                max={listing.quantity}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQuantity(Math.min(listing.quantity, quantity + 1))}
                className="border-emerald-300"
              >
                +
              </Button>
              <span className="text-sm text-emerald-600">of {listing.quantity} available</span>
            </div>
          </div>

          {/* Order Summary */}
          <div className="border border-emerald-200 rounded-lg p-4 bg-emerald-50">
            <h4 className="font-semibold text-emerald-900 mb-3">Order Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-700">Subtotal ({quantity} {listing.unit})</span>
                <span className="text-emerald-900">R{totalAmount}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-700">Marketplace Fee (5%)</span>
                <span className="text-emerald-900">R{marketplaceFee}</span>
              </div>
              <div className="border-t border-emerald-200 pt-2 flex justify-between font-semibold">
                <span className="text-emerald-900">Total</span>
                <span className="text-emerald-900">R{grandTotal}</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-emerald-300">
            Cancel
          </Button>
          <Button
            onClick={handleOrder}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
          >
            {loading ? 'Processing...' : `Pay R${grandTotal}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default OrderModal;
