import React, { useState, useEffect } from "react";
import { XCircle, DollarSign, Package, Truck, Calendar, FileText } from "lucide-react";
import { Button, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

function SendOfferModal({ request, user, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    qty: Math.min(request.qty, 1),
    unit_price_minor: 0,
    delivery_mode: 'SELLER',
    abattoir_fee_minor: 0,
    validity_days: 7,
    notes: ''
  });
  const [shippingCost, setShippingCost] = useState(0);

  // Calculate shipping cost based on distance
  const calculateShippingCost = (deliveryMode, distance) => {
    if (deliveryMode !== 'SELLER' || !distance) return 0;
    
    // Basic shipping calculation: R2 per km per unit, minimum R50
    const costPerKmPerUnit = 2;
    const minimumCost = 50;
    const calculatedCost = distance * costPerKmPerUnit * formData.qty;
    
    return Math.max(minimumCost, calculatedCost);
  };

  // Update shipping cost when delivery mode or quantity changes
  useEffect(() => {
    if (formData.delivery_mode === 'SELLER' && request.distance_km) {
      const newShippingCost = calculateShippingCost(formData.delivery_mode, request.distance_km);
      setShippingCost(newShippingCost);
    } else {
      setShippingCost(0);
    }
  }, [formData.delivery_mode, formData.qty, request.distance_km]);

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
      alert('Offer sent successfully! The buyer will be notified.');
      onSuccess && onSuccess(result);

    } catch (error) {
      console.error('Error sending offer:', error);
      setError(error.message || 'Failed to send offer');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = formData.qty * formData.unit_price_minor;
  const abattoir_fee = formData.delivery_mode === 'RFQ' ? formData.abattoir_fee_minor * formData.qty : 0;
  const total = subtotal + abattoir_fee + shippingCost;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-emerald-900 mb-2">Send Offer</h2>
              <p className="text-emerald-600">{request.title || `${request.species} Needed`}</p>
            </div>
            <Button variant="outline" onClick={onClose}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Request Summary */}
            <div className="bg-emerald-50 p-4 rounded-lg">
              <h3 className="font-semibold text-emerald-900 mb-2">Request Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Species:</span>
                  <span className="ml-2 font-medium">{request.species}</span>
                </div>
                <div>
                  <span className="text-gray-600">Quantity:</span>
                  <span className="ml-2 font-medium">{request.qty} {request.unit}</span>
                </div>
                <div>
                  <span className="text-gray-600">Max Price:</span>
                  <span className="ml-2 font-medium text-emerald-600">R{request.max_price_per_unit}</span>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <span className="ml-2 font-medium">{request.province}</span>
                </div>
              </div>
            </div>

            {/* Offer Form */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="qty" className="text-emerald-800">Quantity *</Label>
                <Input
                  id="qty"
                  type="number"
                  min="1"
                  max={request.qty}
                  value={formData.qty}
                  onChange={(e) => setFormData({...formData, qty: parseInt(e.target.value) || 1})}
                  className="border-emerald-200"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Maximum: {request.qty} {request.unit}</p>
              </div>

              <div>
                <Label htmlFor="unit_price" className="text-emerald-800">Price per Unit (R) *</Label>
                <Input
                  id="unit_price"
                  type="number"
                  step="0.01"
                  min="0"
                  max={request.max_price_per_unit}
                  value={formData.unit_price_minor}
                  onChange={(e) => setFormData({...formData, unit_price_minor: parseFloat(e.target.value) || 0})}
                  className="border-emerald-200"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Maximum: R{request.max_price_per_unit}</p>
              </div>
            </div>

            <div>
              <Label htmlFor="delivery_mode" className="text-emerald-800">Delivery Mode *</Label>
              <Select value={formData.delivery_mode} onValueChange={(value) => setFormData({...formData, delivery_mode: value})}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SELLER">
                    <div className="flex items-center">
                      <Truck className="h-4 w-4 mr-2" />
                      Seller Delivers
                    </div>
                  </SelectItem>
                  <SelectItem value="BUYER">
                    <div className="flex items-center">
                      <Package className="h-4 w-4 mr-2" />
                      Buyer Collects
                    </div>
                  </SelectItem>
                  <SelectItem value="RFQ">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2" />
                      Request for Quote
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.delivery_mode === 'RFQ' && (
              <div>
                <Label htmlFor="abattoir_fee" className="text-emerald-800">Abattoir Fee per Unit (R)</Label>
                <Input
                  id="abattoir_fee"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.abattoir_fee_minor}
                  onChange={(e) => setFormData({...formData, abattoir_fee_minor: parseFloat(e.target.value) || 0})}
                  className="border-emerald-200"
                />
              </div>
            )}

            <div>
              <Label htmlFor="validity_days" className="text-emerald-800">Offer Validity (Days) *</Label>
              <Select value={formData.validity_days.toString()} onValueChange={(value) => setFormData({...formData, validity_days: parseInt(value)})}>
                <SelectTrigger className="border-emerald-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Day</SelectItem>
                  <SelectItem value="3">3 Days</SelectItem>
                  <SelectItem value="7">7 Days</SelectItem>
                  <SelectItem value="14">14 Days</SelectItem>
                  <SelectItem value="30">30 Days</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="notes" className="text-emerald-800">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="border-emerald-200"
                placeholder="Any additional information about your offer..."
                rows={3}
              />
            </div>

            {/* Cost Breakdown */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-900 mb-3">Cost Breakdown</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal ({formData.qty} {request.unit} × R{formData.unit_price_minor})</span>
                  <span>R{subtotal.toFixed(2)}</span>
                </div>
                {formData.delivery_mode === 'RFQ' && abattoir_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Abattoir Fee ({formData.qty} × R{formData.abattoir_fee_minor})</span>
                    <span>R{abattoir_fee.toFixed(2)}</span>
                  </div>
                )}
                {formData.delivery_mode === 'SELLER' && shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping Cost</span>
                    <span>R{shippingCost.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t pt-2 flex justify-between font-semibold">
                  <span>Total</span>
                  <span>R{total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <Button type="button" variant="outline" onClick={onClose} className="border-emerald-300">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
              >
                {loading ? 'Sending...' : 'Send Offer'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default SendOfferModal;
