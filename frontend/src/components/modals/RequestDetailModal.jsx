import React, { useState } from "react";
import { MapPin, Clock, Users, DollarSign, CheckCircle, XCircle, Eye } from "lucide-react";
import { Button, Badge } from "../ui";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

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
                <span className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  {request.offers_count || 0} offers
                </span>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              <XCircle className="h-4 w-4" />
            </Button>
          </div>

          {/* Request Details */}
          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-emerald-900 mb-2">Requirements</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Species:</span>
                    <span className="font-medium">{request.species}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantity:</span>
                    <span className="font-medium">{request.qty} {request.unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Max Price:</span>
                    <span className="font-medium text-emerald-600">R{request.max_price_per_unit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Delivery Mode:</span>
                    <span className="font-medium capitalize">{request.delivery_mode}</span>
                  </div>
                </div>
              </div>

              {request.description && (
                <div>
                  <h3 className="font-semibold text-emerald-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-700">{request.description}</p>
                </div>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-emerald-900 mb-2">Buyer Information</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Name:</span>
                    <span className="font-medium">{request.buyer_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Location:</span>
                    <span className="font-medium">{request.province}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact:</span>
                    <span className="font-medium">{request.buyer_phone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-900 mb-2">Status</h3>
                <div className="flex items-center gap-2">
                  <Badge 
                    className={
                      request.status === 'active' ? 'bg-green-100 text-green-700' :
                      request.status === 'expired' ? 'bg-red-100 text-red-700' :
                      'bg-yellow-100 text-yellow-700'
                    }
                  >
                    {request.status === 'active' ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Active
                      </>
                    ) : request.status === 'expired' ? (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Expired
                      </>
                    ) : (
                      'Pending'
                    )}
                  </Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            {user?.roles?.includes('buyer') && request.buyer_id === user.id && (
              <Button
                variant="outline"
                onClick={loadOffers}
                disabled={offersLoading}
                className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              >
                <Eye className="h-4 w-4 mr-2" />
                {offersLoading ? 'Loading...' : 'View Offers'}
              </Button>
            )}
            
            {user?.roles?.includes('seller') && request.buyer_id !== user.id && request.status === 'active' && (
              <Button
                onClick={() => onSendOffer(request)}
                className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Send Offer
              </Button>
            )}
          </div>

          {/* Offers Section */}
          {showOffers && (
            <div className="mt-6 border-t pt-6">
              <h3 className="font-semibold text-emerald-900 mb-4">Received Offers</h3>
              {offers.length > 0 ? (
                <div className="space-y-3">
                  {offers.map((offer, index) => (
                    <div key={offer.id || index} className="border border-emerald-200 rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-medium text-emerald-900">{offer.seller_name}</h4>
                          <p className="text-sm text-gray-600">{offer.seller_location}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-emerald-600">R{offer.price_per_unit}</p>
                          <p className="text-sm text-gray-600">per {offer.unit}</p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                          Qty: {offer.qty} • Delivery: {offer.delivery_mode}
                        </div>
                        <Button
                          onClick={() => handleAcceptOffer(offer)}
                          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                        >
                          Accept Offer
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No offers received yet.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default RequestDetailModal;
