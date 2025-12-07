import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Textarea, Alert, AlertDescription, Badge, Card, CardContent,
  Tabs, TabsContent, TabsList, TabsTrigger
} from '../ui';
import {
  DollarSign, Package, Truck, Calendar, AlertCircle, CheckCircle,
  MapPin, Clock, Star
} from 'lucide-react';
import { useSubmitOfferMutation } from '@/store/api/buyRequests.api';

const SendOfferModal = ({ request, user, open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    qty: request?.qty || 1,
    unit_price: 0, // Price per unit in ZAR (not cents)
    delivery_mode: 'SELLER',
    delivery_cost: 0, // Delivery cost in ZAR
    delivery_days: 7, // Days for delivery
    notes: ''
  });
  const [error, setError] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [useExistingListing, setUseExistingListing] = useState(false);
  
  // RTK Query mutation for submitting offers
  const [submitOffer, { isLoading: loading }] = useSubmitOfferMutation();

  // Load user's existing listings
  useEffect(() => {
    if (open && user) {
      loadUserListings();
    }
  }, [open, user]);

  const loadUserListings = async () => {
    try {
      const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
      const response = await fetch(`${BACKEND_URL}/api/listings/my-listings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const matchingListings = data.listings?.filter(listing => 
          listing.species === request?.species &&
          listing.product_type === request?.product_type &&
          (listing.available_qty || listing.qty_available || 0) >= formData.qty
        ) || [];
        setUserListings(matchingListings);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  };

  // Handle form submission using RTK Query mutation
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Validate form
      if (formData.qty <= 0 || formData.qty > request.qty) {
        throw new Error(`Quantity must be between 1 and ${request.qty}`);
      }

      if (formData.unit_price <= 0) {
        throw new Error('Price must be greater than 0');
      }

      // Prepare offer data matching backend API structure
      // Backend expects: offer_price, qty, message (optional), listing_id (optional)
      const offerData = {
        offer_price: parseFloat(formData.unit_price), // Price per unit in ZAR
        qty: parseInt(formData.qty),
        message: formData.notes || null // Backend uses 'message' field for notes
      };
      
      // Add listing_id if using existing listing
      if (useExistingListing && selectedListing) {
        offerData.listing_id = selectedListing.id;
      }

      // Submit offer using RTK Query mutation
      const result = await submitOffer({
        requestId: request.id,
        ...offerData
      }).unwrap();
      
      // Success
      if (onSuccess) {
        onSuccess(result);
      }
      onClose();

    } catch (error) {
      console.error('Error sending offer:', error);
      // Handle RTK Query error format
      let errorMessage = 'Failed to send offer';
      
      if (error?.data) {
        // Handle Pydantic validation errors (array of error objects)
        if (Array.isArray(error.data.detail)) {
          // Format validation errors
          const validationErrors = error.data.detail.map(err => {
            const field = err.loc && err.loc.length > 1 ? err.loc[err.loc.length - 1] : 'field';
            return `${field}: ${err.msg}`;
          }).join(', ');
          errorMessage = validationErrors || errorMessage;
        } else if (typeof error.data.detail === 'string') {
          errorMessage = error.data.detail;
        } else if (error.data.message) {
          errorMessage = error.data.message;
        } else {
          errorMessage = 'Validation error. Please check your input.';
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else {
        // Fallback: try to extract meaningful error info
        errorMessage = 'An unexpected error occurred. Please try again.';
      }
      
      setError(errorMessage);
    }
  };

  // Calculate totals
  const subtotal = formData.qty * formData.unit_price;
  const delivery_fee = formData.delivery_cost || 0;
  const total = subtotal + delivery_fee;

  // Handle existing listing selection
  const handleListingSelect = (listing) => {
    setSelectedListing(listing);
    setFormData(prev => ({
      ...prev,
      unit_price: listing.price_per_unit || prev.unit_price,
      qty: Math.min(prev.qty, listing.available_qty || listing.qty_available || prev.qty)
    }));
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Send Offer - {request.title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Request Summary */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Species:</span>
                  <p className="font-medium">{request.species}</p>
                </div>
                <div>
                  <span className="text-gray-600">Product Type:</span>
                  <p className="font-medium">{request.product_type}</p>
                </div>
                <div>
                  <span className="text-gray-600">Requested Qty:</span>
                  <p className="font-medium">{request.qty} {request.unit}</p>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <p className="font-medium flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {request.province}
                  </p>
                </div>
                {request.distance_km && (
                  <div>
                    <span className="text-gray-600">Distance:</span>
                    <p className="font-medium">{request.distance_km}km away</p>
                  </div>
                )}
                {(request.deadline_at || request.expires_at) && (
                  <div>
                    <span className="text-gray-600">Deadline:</span>
                    <p className="font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(request.deadline_at || request.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Compliance Alerts */}
          {request.compliance_flags?.kyc && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                KYC verification required for live animal trading. Please complete verification before sending offer.
              </AlertDescription>
            </Alert>
          )}

          {!request.in_range && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                This request may be outside your delivery range. Additional delivery charges may apply.
              </AlertDescription>
            </Alert>
          )}

          {/* Offer Tabs */}
          <Tabs defaultValue="new_quote" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new_quote">Create New Quote</TabsTrigger>
              <TabsTrigger value="existing_listing" disabled={userListings.length === 0}>
                Use Existing Listing ({userListings.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="new_quote" className="space-y-4">
              {/* Quantity */}
              <div>
                <Label htmlFor="qty">Quantity Offering *</Label>
                <Input
                  id="qty"
                  type="number"
                  min="1"
                  max={request.qty}
                  value={formData.qty}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    qty: parseInt(e.target.value) || 1
                  }))}
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Maximum: {request.qty} {request.unit}
                </p>
              </div>

              {/* Unit Price */}
              <div>
                <Label htmlFor="unit_price">Unit Price (ZAR) *</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="unit_price"
                    type="number"
                    step="0.01"
                    min="0.01"
                    className="pl-10"
                    value={formData.unit_price}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      unit_price: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="0.00"
                    required
                  />
                </div>
                {request.target_price && (
                  <p className="text-sm text-gray-600 mt-1">
                    Buyer's target: R{request.target_price} per {request.unit}
                  </p>
                )}
              </div>

              {/* Delivery Cost */}
              <div>
                <Label htmlFor="delivery_cost">Delivery Cost (ZAR) - Optional</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="delivery_cost"
                    type="number"
                    step="0.01"
                    min="0"
                    className="pl-10"
                    value={formData.delivery_cost}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      delivery_cost: parseFloat(e.target.value) || 0
                    }))}
                    placeholder="0.00"
                  />
                </div>
                <p className="text-sm text-gray-600 mt-1">
                  Total delivery cost for the order
                </p>
              </div>

              {/* Delivery Days */}
              <div>
                <Label htmlFor="delivery_days">Delivery Days *</Label>
                <Input
                  id="delivery_days"
                  type="number"
                  min="1"
                  max="30"
                  value={formData.delivery_days}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    delivery_days: parseInt(e.target.value) || 7
                  }))}
                  required
                />
                <p className="text-sm text-gray-600 mt-1">
                  Number of days to deliver after order confirmation
                </p>
              </div>
            </TabsContent>

            <TabsContent value="existing_listing" className="space-y-4">
              {userListings.length > 0 ? (
                <div className="space-y-3">
                  <Label>Select from your existing listings:</Label>
                  {userListings.map((listing) => (
                    <Card 
                      key={listing.id} 
                      className={`cursor-pointer transition-colors ${
                        selectedListing?.id === listing.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleListingSelect(listing)}
                    >
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{listing.title}</h4>
                            <p className="text-sm text-gray-600">
                              R{listing.price_per_unit} per {listing.unit} • 
                              {listing.available_qty} available
                            </p>
                          </div>
                          {selectedListing?.id === listing.id && (
                            <CheckCircle className="h-5 w-5 text-blue-500" />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-4">
                  No matching listings found. Create a new quote instead.
                </p>
              )}
            </TabsContent>
          </Tabs>


          {/* Additional Notes */}
          <div>
            <Label htmlFor="notes">Additional Notes (Optional)</Label>
            <Textarea
              id="notes"
              rows={3}
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
              placeholder="Any additional details about your offer..."
            />
          </div>

          {/* Offer Summary */}
          <Card className="bg-gray-50">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-3">Offer Summary</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Quantity:</span>
                  <span>{formData.qty} {request.unit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Unit Price:</span>
                  <span>R{formData.unit_price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R{subtotal.toFixed(2)}</span>
                </div>
                {delivery_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Cost:</span>
                    <span>R{delivery_fee.toFixed(2)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>R{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Delivery Days:</span>
                  <span>{formData.delivery_days} days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Alert className="border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Offer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SendOfferModal;