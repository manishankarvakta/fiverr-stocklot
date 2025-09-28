// Request Detail Modal Component
function RequestDetailModal({ request, user, onClose, onSendOffer }) {
  const [loading, setLoading] = useState(false);
  const [offers, setOffers] = useState([]);
  const [showOffers, setShowOffers] = useState(false);
  const [offersLoading, setOffersLoading] = useState(false);

  const timeRemaining = (deadlineAt) => {
    const deadline = new Date(deadlineAt);
    const now = new Date();
    const diff = deadline - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days} days, ${hours} hours`;
    return `${hours} hours`;
  };

  // Load offers if user is the buyer
  const loadOffers = async () => {
    if (!user || !user.roles?.includes('buyer') || request.buyer_id !== user.id) return;
    
    setOffersLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/buy-requests/${request.id}/offers`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOffers(data.items || []);
        setShowOffers(true);
      }
    } catch (error) {
      console.error('Error loading offers:', error);
    } finally {
      setOffersLoading(false);
    }
  };

  // Handle accept offer
  const handleAcceptOffer = async (offer) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/buy-requests/${request.id}/offers/${offer.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Idempotency-Key': `${Date.now()}-${Math.random()}`
        },
        body: JSON.stringify({
          qty: offer.qty,
          address_id: user.addresses?.[0]?.id || 'default',
          delivery_mode: offer.delivery_mode
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to accept offer');
      }

      const result = await response.json();
      
      // Show success message and redirect
      alert(`Offer Accepted! Order created successfully (ID: ${result.order_group_id}). Redirecting to checkout...`);
      
      // Close modal and redirect
      onClose();
      window.location.href = `/checkout/${result.order_group_id}`;
      
    } catch (error) {
      console.error('Error accepting offer:', error);
      alert(`Failed to accept offer: ${error.message}`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-emerald-900 mb-2">
                {request.title || `${request.species} Needed`}
              </h2>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {request.province}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {timeRemaining(request.deadline_at)} remaining
                </span>
                {user && user.roles?.includes('buyer') && request.buyer_id === user.id && request.offers_count > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600">
                    <Package className="h-4 w-4" />
                    {request.offers_count} offers received
                  </span>
                )}
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Show offers section for buyers */}
          {user && user.roles?.includes('buyer') && request.buyer_id === user.id && request.offers_count > 0 && (
            <Card className="mb-6 border-emerald-200 bg-emerald-50">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg text-emerald-900">Offers on Your Request</CardTitle>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={loadOffers}
                    disabled={offersLoading}
                    className="border-emerald-300 text-emerald-700"
                  >
                    {offersLoading ? 'Loading...' : showOffers ? 'Refresh Offers' : 'View Offers'}
                  </Button>
                </div>
              </CardHeader>
              {showOffers && (
                <CardContent>
                  {offers.length > 0 ? (
                    <div className="space-y-3">
                      {offers.map((offer, index) => {
                        const unitPrice = offer.unit_price_minor / 100;
                        const totalPrice = unitPrice * offer.qty;
                        const timeLeft = timeRemaining(offer.validity_expires_at);
                        
                        return (
                          <div key={offer.id} className="bg-white border border-emerald-200 rounded-lg p-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
                              <div>
                                <h5 className="font-medium">Offer #{index + 1}</h5>
                                <p className="text-sm text-gray-600">{offer.qty} {request.unit}</p>
                              </div>
                              <div>
                                <p className="text-lg font-bold text-emerald-600">
                                  R{totalPrice.toFixed(2)}
                                </p>
                                <p className="text-sm text-gray-600">
                                  R{unitPrice.toFixed(2)} per {request.unit}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm">
                                  <span className="text-gray-600">Delivery:</span><br />
                                  {offer.delivery_mode === 'SELLER' ? 'Seller delivers' : 'Buyer pickup'}
                                </p>
                              </div>
                              <div className="text-center">
                                {offer.status === 'pending' && timeLeft !== 'Expired' ? (
                                  <Button 
                                    onClick={() => handleAcceptOffer(offer)}
                                    className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                                  >
                                    Accept & Checkout
                                  </Button>
                                ) : (
                                  <div className="text-sm text-gray-500">
                                    {offer.status === 'accepted' ? 'Accepted' : 'Expired'}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-gray-600">No offers available.</p>
                  )}
                </CardContent>
              )}
            </Card>
          )}

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Request Details */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Request Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Species:</span>
                  <span className="font-medium">{request.species}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Product Type:</span>
                  <span className="font-medium">{request.product_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span className="font-medium">{request.qty} {request.unit}</span>
                </div>
                {request.breed && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Breed:</span>
                    <span className="font-medium">{request.breed}</span>
                  </div>
                )}
                {request.target_price && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Target Price:</span>
                    <span className="font-medium text-green-600">R{request.target_price}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Buyer & Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Buyer & Timeline</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {request.buyer && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Buyer:</span>
                      <span className="font-medium">{request.buyer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Location:</span>
                      <span className="font-medium">{request.buyer.province}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Verified:</span>
                      <span className={`font-medium ${request.buyer.verified ? 'text-green-600' : 'text-gray-500'}`}>
                        {request.buyer.verified ? '✓ Verified' : 'Not verified'}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Posted:</span>
                  <span className="font-medium">{new Date(request.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Deadline:</span>
                  <span className="font-medium">{new Date(request.deadline_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Offers Received:</span>
                  <span className="font-medium">{request.offers_count}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Description */}
          {request.notes_excerpt && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-relaxed">
                  {request.notes_excerpt}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Compliance Flags */}
          {(request.compliance_flags?.kyc || request.compliance_flags?.live) && (
            <Card className="mb-6 border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-lg text-yellow-800">Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {request.compliance_flags?.live && (
                  <div className="flex items-center gap-2 text-yellow-700">
                    <AlertCircle className="h-4 w-4" />
                    <span>Live animals - KYC verification required</span>
                  </div>
                )}
                {request.compliance_flags?.kyc && (
                  <div className="flex items-center gap-2 text-yellow-700">
                    <CheckCircle className="h-4 w-4" />
                    <span>KYC verification needed for this transaction</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            
            {user && user.roles?.includes('seller') ? (
              <Button 
                onClick={onSendOffer}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                disabled={!request.can_send_offer}
              >
                <ArrowRight className="h-4 w-4 mr-2" />
                Send Offer
              </Button>
            ) : user && user.roles?.includes('buyer') && request.buyer_id === user.id ? (
              <div className="text-sm text-gray-600">
                This is your request. Offers will appear above when received.
              </div>
            ) : (
              <Button variant="outline" disabled>
                {!user ? 'Login required' : 'Seller access only'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Send Offer Modal Component
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

// Login Dialog Component
function LoginDialog({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'seller'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { 
            email: formData.email, 
            password: formData.password, 
            full_name: formData.full_name,
            role: formData.role 
          };

      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || (isLogin ? 'Login failed' : 'Registration failed'));
      }

      const data = await response.json();
      
      // Store token and user data
      localStorage.setItem('token', data.access_token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
      }
      
      // Reload page to update user context
      alert(isLogin ? 'Login successful!' : 'Registration successful!');
      window.location.reload();

    } catch (error) {
      console.error('Auth error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-md w-full mx-4">
        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-emerald-900">
              {isLogin ? 'Sign In' : 'Create Account'}
            </h2>
            <Button variant="outline" size="sm" onClick={onClose} type="button">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={formData.full_name}
                  onChange={(e) => setFormData(prev => ({...prev, full_name: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({...prev, email: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData(prev => ({...prev, password: e.target.value}))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                required
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  I want to
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({...prev, role: e.target.value}))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="seller">Sell livestock</option>
                  <option value="buyer">Buy livestock</option>
                </select>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm">{error}</span>
              </div>
            </div>
          )}

          <div className="mt-6 space-y-3">
            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
            >
              {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Create Account')}
            </Button>

            <Button 
              type="button" 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
                setFormData({ email: '', password: '', full_name: '', role: 'seller' });
              }}
            >
              {isLogin ? 'Need an account? Sign up' : 'Already have an account? Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// View Offers Modal Component (for buyers to see and accept offers)
function ViewOffersModal({ request, user, onClose, onAcceptOffer }) {
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load offers for the request
  useEffect(() => {
    const loadOffers = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/buy-requests/${request.id}/offers`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to load offers');
        }

        const data = await response.json();
        setOffers(data.items || []);
        setError(null);
      } catch (error) {
        console.error('Error loading offers:', error);
        setError(error.message);
      } finally {
        setLoading(false);
      }
    };

    if (request.id) {
      loadOffers();
    }
  }, [request.id]);

  const getTimeRemaining = (expiresAt) => {
    const deadline = new Date(expiresAt);
    const now = new Date();
    const diff = deadline - now;
    
    if (diff <= 0) return { text: 'Expired', color: 'text-red-600' };
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return { text: `${days}d ${hours}h`, color: 'text-green-600' };
    return { text: `${hours}h`, color: 'text-yellow-600' };
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-2xl font-bold text-emerald-900 mb-2">
                Offers for: {request.title || `${request.species} Request`}
              </h2>
              <p className="text-gray-600">
                {offers.length} offers received for {request.qty} {request.unit}
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin h-6 w-6 border-2 border-emerald-500 border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-gray-600">Loading offers...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {/* Offers List */}
          {!loading && offers.length > 0 && (
            <div className="space-y-4">
              {offers.map((offer, index) => {
                const timeRemaining = getTimeRemaining(offer.validity_expires_at);
                const unitPrice = offer.unit_price_minor / 100; // Convert from cents
                const totalPrice = unitPrice * offer.qty;
                
                return (
                  <Card key={offer.id} className="border-2 hover:border-emerald-300 transition-colors">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Offer Details */}
                        <div className="space-y-3">
                          <h4 className="font-medium text-lg">Offer #{index + 1}</h4>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Quantity:</span>
                              <span className="font-medium">{offer.qty} {request.unit}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Unit Price:</span>
                              <span className="font-medium">R{unitPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Total:</span>
                              <span className="font-medium text-emerald-600 text-lg">R{totalPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Delivery:</span>
                              <span className="font-medium">
                                {offer.delivery_mode === 'SELLER' ? 'Seller delivers' : 'Buyer pickup'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Seller Info */}
                        <div className="space-y-3">
                          <h5 className="font-medium">Seller Information</h5>
                          <div className="text-sm space-y-1">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Seller:</span>
                              <span className="font-medium">{offer.seller_name || 'Anonymous'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Rating:</span>
                              <div className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span className="text-sm">{offer.seller_rating || 'New'}</span>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Location:</span>
                              <span className="font-medium">{offer.seller_province || 'Not specified'}</span>
                            </div>
                          </div>
                          {offer.notes && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-600 mb-1">Notes:</p>
                              <p className="text-sm bg-gray-50 p-2 rounded">{offer.notes}</p>
                            </div>
                          )}
                        </div>

                        {/* Status & Actions */}
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className={`text-sm font-medium ${timeRemaining.color}`}>
                              {timeRemaining.text} remaining
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              Expires: {new Date(offer.validity_expires_at).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div className="text-center">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                              offer.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              offer.status === 'accepted' ? 'bg-green-100 text-green-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {offer.status?.charAt(0).toUpperCase() + offer.status?.slice(1) || 'Pending'}
                            </span>
                          </div>

                          {offer.status === 'pending' && timeRemaining.text !== 'Expired' && (
                            <Button 
                              onClick={() => onAcceptOffer(offer)}
                              className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Accept & Checkout
                            </Button>
                          )}
                          
                          {timeRemaining.text === 'Expired' && (
                            <Button 
                              variant="outline" 
                              disabled
                              className="w-full"
                            >
                              Expired
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {!loading && offers.length === 0 && !error && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No offers yet</h3>
              <p className="text-gray-600">
                Sellers haven't submitted offers for this request yet. Check back later!
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="flex justify-between items-center pt-6 border-t mt-6">
            <div className="text-sm text-gray-600">
              Request deadline: {new Date(request.deadline_at).toLocaleDateString()}
            </div>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

}
export default RequestDetailModal;