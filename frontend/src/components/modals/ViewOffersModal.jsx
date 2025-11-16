import React, { useState, useEffect } from "react";
import { X, AlertCircle, Clock, MapPin, Package, DollarSign, CheckCircle, User } from "lucide-react";
import { Button, Card, CardContent, Badge } from "../ui";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-emerald-600" />
                            <span className="font-semibold text-emerald-900">{offer.seller_name}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{offer.seller_location}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Package className="h-4 w-4" />
                            <span>{offer.qty} {offer.unit}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span className={timeRemaining.color}>{timeRemaining.text} remaining</span>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="space-y-3">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600">R{unitPrice.toFixed(2)}</div>
                            <div className="text-sm text-gray-600">per {offer.unit}</div>
                          </div>
                          <div className="text-center">
                            <div className="text-lg font-semibold text-gray-900">R{totalPrice.toFixed(2)}</div>
                            <div className="text-sm text-gray-600">total</div>
                          </div>
                          {offer.delivery_mode && (
                            <div className="text-center">
                              <Badge variant="outline" className="text-xs">
                                {offer.delivery_mode === 'SELLER' ? 'Seller Delivers' : 
                                 offer.delivery_mode === 'BUYER' ? 'Buyer Collects' : 
                                 'Request for Quote'}
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="space-y-3">
                          <Button
                            onClick={() => onAcceptOffer(offer)}
                            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
                            disabled={timeRemaining.text === 'Expired'}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Accept Offer
                          </Button>
                          
                          {offer.notes && (
                            <div className="text-sm text-gray-600">
                              <strong>Notes:</strong> {offer.notes}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* No Offers State */}
          {!loading && offers.length === 0 && !error && (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Offers Yet</h3>
              <p className="text-gray-600">No sellers have submitted offers for this request yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ViewOffersModal;
