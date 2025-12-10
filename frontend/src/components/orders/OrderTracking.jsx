import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  MapPin, Truck, Clock, CheckCircle, Package, Phone, 
  Calendar, User, Search
} from 'lucide-react';
import { useLazyGetOrderTrackingQuery, useGetOrderByIdQuery, useLazyGetOrderByIdQuery } from '../../store/api/orders.api';

const OrderTracking = () => {
  const [trackingId, setTrackingId] = useState('');
  const [trackTrackinging, { data: trackingData, isLoading: trackingLoading, error: trackingError }] = useLazyGetOrderTrackingQuery();
  
  // Fallback: if tracking endpoint doesn't exist, use order details
  const [getOrderById, { data: orderData, isLoading: orderLoading, error: orderError }] = useLazyGetOrderByIdQuery();

  const handleTrack = () => {
    if (!trackingId.trim()) return;
    
    // Try tracking endpoint first
    trackTrackinging(trackingId).catch(() => {
      // Fallback to order details if tracking endpoint doesn't exist
      getOrderById(trackingId);
    });
  };

  const loading = trackingLoading || orderLoading;
  const error = trackingError || orderError;
  
  // Extract tracking data - prefer tracking endpoint, fallback to order data
  const trackingInfo = trackingData || (orderData ? {
    order_id: orderData.id,
    current_step: getStepFromStatus(orderData.status || orderData.delivery_status),
    estimated_delivery: orderData.estimated_delivery_date,
    carrier: orderData.carrier || 'Direct Delivery',
    seller_name: orderData.seller_name,
    error: null
  } : null);

  // Helper function to convert order status to tracking step
  function getStepFromStatus(status) {
    const statusMap = {
      'pending': 1,
      'confirmed': 2,
      'shipped': 4,
      'delivered': 5,
      'completed': 5
    };
    return statusMap[status?.toLowerCase()] || 1;
  }

  const trackingSteps = [
    { id: 1, title: 'Order Placed', icon: Package, description: 'Your order has been received' },
    { id: 2, title: 'Order Confirmed', icon: CheckCircle, description: 'Seller has confirmed your order' },
    { id: 3, title: 'Preparing for Shipment', icon: Clock, description: 'Order is being prepared' },
    { id: 4, title: 'In Transit', icon: Truck, description: 'Order is on the way' },
    { id: 5, title: 'Delivered', icon: MapPin, description: 'Order has been delivered' }
  ];

  const currentStep = trackingInfo?.current_step || 1;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-900 mb-2">Order Tracking</h1>
        <p className="text-emerald-700">Track your livestock order delivery</p>
      </div>

      {/* Tracking Input */}
      <Card>
        <CardHeader>
          <CardTitle>Track Your Order</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Enter your order ID..."
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
                className="pl-10"
                onKeyPress={(e) => e.key === 'Enter' && handleTrack()}
              />
            </div>
            <Button 
              onClick={handleTrack}
              disabled={loading || !trackingId.trim()}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                  Tracking...
                </>
              ) : 'Track Order'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tracking Results */}
      {trackingInfo && (
        <>
          {(trackingInfo.error || error) ? (
            <Card className="border-red-200">
              <CardContent className="text-center py-8">
                <Package className="h-12 w-12 text-red-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-red-800 mb-2">Tracking Failed</h3>
                <p className="text-red-600">
                  {trackingInfo.error || error?.data?.detail || error?.message || 'Order not found or tracking unavailable'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Order Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Order Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Order ID</p>
                      <p className="font-medium">#{trackingInfo.order_id || trackingId}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Estimated Delivery</p>
                      <p className="font-medium">{trackingInfo.estimated_delivery || 'TBD'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Carrier</p>
                      <p className="font-medium">{trackingInfo.carrier || 'Direct Delivery'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tracking Progress */}
              <Card>
                <CardHeader>
                  <CardTitle>Delivery Progress</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {trackingSteps.map((step, index) => {
                      const isCompleted = step.id <= currentStep;
                      const isCurrent = step.id === currentStep;
                      const IconComponent = step.icon;

                      return (
                        <div key={step.id} className="flex items-center space-x-4">
                          <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                            isCompleted 
                              ? 'bg-emerald-100 text-emerald-600' 
                              : 'bg-gray-100 text-gray-400'
                          }`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <h3 className={`font-medium ${
                                isCompleted ? 'text-emerald-900' : 'text-gray-500'
                              }`}>
                                {step.title}
                              </h3>
                              {isCurrent && (
                                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                                  Current
                                </Badge>
                              )}
                            </div>
                            <p className={`text-sm ${
                              isCompleted ? 'text-emerald-700' : 'text-gray-400'
                            }`}>
                              {step.description}
                            </p>
                          </div>
                          
                          {isCompleted && (
                            <CheckCircle className="h-5 w-5 text-emerald-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Need Help?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-emerald-600" />
                    <span>Support: 0800 123 456</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-emerald-600" />
                    <span>Seller: {trackingInfo.seller_name || 'Contact via messages'}</span>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default OrderTracking;