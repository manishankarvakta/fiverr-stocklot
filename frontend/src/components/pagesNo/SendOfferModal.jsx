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
        <form onSubmit={handleSubmit} className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-emerald-900">
              Send Offer - {request.title || request.species}
            </h2>
            <Button variant="outline" size="sm" onClick={onClose} type="button">
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Request Summary */}
          <Card className="mb-6 bg-gray-50">
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Requested:</span>
                  <p className="font-medium">{request.qty} {request.unit} of {request.species}</p>
                </div>
                <div>
                  <span className="text-gray-600">Location:</span>
                  <p className="font-medium">{request.province}</p>
                </div>
                {request.target_price && (
                  <div className="col-span-2">
                    <span className="text-gray-600">Buyer's target price:</span>
                    <p className="font-medium text-green-600">R{request.target_price} per {request.unit}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Offer Form */}
          <div className="space-y-4 mb-6">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantity Offering *
              </label>
              <input
                type="number"
                min="1"
                max={request.qty}
                value={formData.qty}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  qty: parseInt(e.target.value) || 1
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
              <p className="text-sm text-gray-600 mt-1">
                Maximum: {request.qty} {request.unit}
              </p>
            </div>

            {/* Unit Price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price (ZAR) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.unit_price_minor}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  unit_price_minor: parseFloat(e.target.value) || 0
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="0.00"
                required
              />
            </div>

            {/* Delivery Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Delivery Method *
              </label>
              <select
                value={formData.delivery_mode}
                onChange={(e) => setFormData(prev => ({...prev, delivery_mode: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
              >
                <option value="SELLER">I will deliver{request.distance_km ? ` (${request.distance_km}km away)` : ''}</option>
                <option value="RFQ">Buyer arranges pickup</option>
              </select>
              {formData.delivery_mode === 'SELLER' && request.distance_km && (
                <p className="text-sm text-blue-600 mt-1">
                  Shipping cost will be calculated: R{shippingCost.toFixed(2)} 
                  (R2/km/unit, min R50)
                </p>
              )}
            </div>

            {/* Validity Period */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Offer Valid For
              </label>
              <select
                value={formData.validity_days}
                onChange={(e) => setFormData(prev => ({...prev, validity_days: parseInt(e.target.value)}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="1">1 day</option>
                <option value="3">3 days</option>
                <option value="7">1 week</option>
                <option value="14">2 weeks</option>
                <option value="30">1 month</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Notes (Optional)
              </label>
              <textarea
                rows={3}
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Any additional details about your offer..."
              />
            </div>
          </div>

          {/* Offer Summary */}
          <Card className="mb-6 bg-emerald-50 border-emerald-200">
            <CardContent className="pt-4">
              <h4 className="font-medium mb-3 text-emerald-900">Offer Summary</h4>
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
                {shippingCost > 0 && (
                  <div className="flex justify-between">
                    <span>Shipping ({request.distance_km}km):</span>
                    <span>R{shippingCost.toFixed(2)}</span>
                  </div>
                )}
                {abattoir_fee > 0 && (
                  <div className="flex justify-between">
                    <span>Abattoir Fee:</span>
                    <span>R{abattoir_fee.toFixed(2)}</span>
                  </div>
                )}
                <hr className="border-emerald-200" />
                <div className="flex justify-between font-medium text-emerald-900">
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
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-between">
            <Button type="button" variant="outline" onClick={onClose}>
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
  );
}