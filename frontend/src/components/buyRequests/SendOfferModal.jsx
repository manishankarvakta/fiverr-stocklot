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

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const SendOfferModal = ({ request, user, open, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    qty: request?.qty || 1,
    unit_price_minor: 0, // Price in cents
    delivery_mode: 'SELLER',
    abattoir_fee_minor: 0,
    validity_days: 7,
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userListings, setUserListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [useExistingListing, setUseExistingListing] = useState(false);

  // Load user's existing listings
  useEffect(() => {
    if (open && user) {
      loadUserListings();
    }
  }, [open, user]);

  const loadUserListings = async () => {
    try {
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
          listing.available_qty >= formData.qty
        ) || [];
        setUserListings(matchingListings);
      }
    } catch (error) {
      console.error('Error loading listings:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate form
      if (formData.qty <= 0 || formData.qty > request.qty) {
        throw new Error(`Quantity must be between 1 and ${request.qty}`);
      }

      if (formData.unit_price_minor <= 0) {
        throw new Error('Price must be greater than 0');
      }

      // Calculate validity expiry
      const validityExpiresAt = new Date();
      validityExpiresAt.setDate(validityExpiresAt.getDate() + formData.validity_days);

      // Prepare offer data
      const offerData = {
        qty: parseInt(formData.qty),
        unit_price_minor: Math.round(formData.unit_price_minor * 100), // Convert to cents
        delivery_mode: formData.delivery_mode,
        abattoir_fee_minor: Math.round(formData.abattoir_fee_minor * 100),
        validity_expires_at: validityExpiresAt.toISOString(),
        notes: formData.notes
      };

      if (useExistingListing && selectedListing) {
        offerData.listing_id = selectedListing.id;
      }

      // Send offer
      const response = await fetch(`${BACKEND_URL}/api/buy-requests/${request.id}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(offerData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to send offer');
      }

      const result = await response.json();
      
      // Success
      onSuccess && onSuccess(result);
      onClose();

    } catch (error) {
      console.error('Error sending offer:', error);
      setError(error.message || 'Failed to send offer');
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const subtotal = formData.qty * formData.unit_price_minor;
  const abattoir_fee = formData.delivery_mode === 'RFQ' ? formData.abattoir_fee_minor * formData.qty : 0;
  const total = subtotal + abattoir_fee;

  // Handle existing listing selection
  const handleListingSelect = (listing) => {
    setSelectedListing(listing);
    setFormData(prev => ({
      ...prev,
      unit_price_minor: listing.price_per_unit || prev.unit_price_minor,
      qty: Math.min(prev.qty, listing.available_qty)
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
                <div>
                  <span className="text-gray-600">Deadline:</span>
                  <p className="font-medium flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(request.deadline_at).toLocaleDateString()}
                  </p>
                </div>
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
                    value={formData.unit_price_minor}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      unit_price_minor: parseFloat(e.target.value) || 0
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

              {/* Delivery Mode */}
              <div>
                <Label htmlFor="delivery_mode">Delivery Method *</Label>
                <Select 
                  value={formData.delivery_mode}
                  onValueChange={(value) => setFormData(prev => ({...prev, delivery_mode: value}))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SELLER">I will deliver</SelectItem>
                    <SelectItem value="RFQ">Buyer arranges pickup</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Abattoir Fee (if RFQ mode) */}
              {formData.delivery_mode === 'RFQ' && (
                <div>
                  <Label htmlFor="abattoir_fee">Abattoir Fee per unit (ZAR)</Label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="abattoir_fee"
                      type="number"
                      step="0.01"
                      min="0"
                      className="pl-10"
                      value={formData.abattoir_fee_minor}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        abattoir_fee_minor: parseFloat(e.target.value) || 0
                      }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>
              )}
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

          {/* Validity Period */}
          <div>
            <Label htmlFor="validity">Offer Valid For</Label>
            <Select 
              value={formData.validity_days.toString()}
              onValueChange={(value) => setFormData(prev => ({...prev, validity_days: parseInt(value)}))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 day</SelectItem>
                <SelectItem value="3">3 days</SelectItem>
                <SelectItem value="7">1 week</SelectItem>
                <SelectItem value="14">2 weeks</SelectItem>
                <SelectItem value="30">1 month</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
                  <span>R{formData.unit_price_minor.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>R{subtotal.toFixed(2)}</span>
                </div>
                {abattoir_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Abattoir Fee:</span>
                    <span>R{abattoir_fee.toFixed(2)}</span>
                  </div>
                )}
                <hr />
                <div className="flex justify-between font-medium">
                  <span>Total:</span>
                  <span>R{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Valid until:</span>
                  <span>
                    {new Date(Date.now() + formData.validity_days * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  </span>
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