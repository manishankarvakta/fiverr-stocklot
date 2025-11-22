import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { MessageSquare, Clock, DollarSign, TrendingUp, Check, X, Eye, Filter, Search, Calendar, Package, User } from 'lucide-react';
import {
  useGetSellerOffersQuery,
  useGetSellerOfferStatsQuery,
  useRespondToOfferMutation,
  useCreateCounterOfferMutation,
} from '../../store/api/seller.api';


const SellerOffers = () => {
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    search: '',
    sort: 'newest'
  });
  const [respondingToId, setRespondingToId] = useState(null);

  // Redux Toolkit Query hooks
  const { data: offersData, isLoading: loading, refetch: refetchOffers } = useGetSellerOffersQuery({
    status: filters.status !== 'all' ? filters.status : undefined,
    type: filters.type !== 'all' ? filters.type : undefined,
    search: filters.search || undefined,
    sort: filters.sort
  });
  
  const { data: statsData } = useGetSellerOfferStatsQuery();
  const [respondToOfferMutation] = useRespondToOfferMutation();
  const [createCounterOfferMutation] = useCreateCounterOfferMutation();

  const offers = offersData?.offers || offersData?.data?.offers || [];
  const stats = statsData?.data || statsData || {};

  const respondToOffer = async (offerId, response, message = '') => {
    try {
      setRespondingToId(offerId);
      await respondToOfferMutation({ offerId, response, message: message || undefined }).unwrap();
      refetchOffers();
    } catch (error) {
      console.error('Error responding to offer:', error);
    } finally {
      setRespondingToId(null);
    }
  };

  const createCounterOffer = async (offerId, counterOfferData) => {
    try {
      await createCounterOfferMutation({ offerId, ...counterOfferData }).unwrap();
      refetchOffers();
    } catch (error) {
      console.error('Error creating counter offer:', error);
    }
  };

  const getOfferStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
      accepted: { label: 'Accepted', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejected', color: 'bg-red-100 text-red-800' },
      countered: { label: 'Countered', color: 'bg-blue-100 text-blue-800' },
      expired: { label: 'Expired', color: 'bg-gray-100 text-gray-800' }
    };
    
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const getOfferTypeIcon = (type) => {
    const typeConfig = {
      buy_request: MessageSquare,
      direct_offer: DollarSign,
      bulk_order: Package,
      negotiation: TrendingUp
    };
    
    const Icon = typeConfig[type] || MessageSquare;
    return <Icon className="h-4 w-4" />;
  };

  const calculateTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    
    if (diff <= 0) return 'Expired';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    return `${hours}h remaining`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offer Management</h1>
          <p className="text-gray-600 mt-1">Manage and negotiate offers from potential buyers</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Offers</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.pending_offers || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-yellow-100">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Accepted This Month</p>
                <p className="text-2xl font-bold text-green-600">{stats.accepted_this_month || 0}</p>
              </div>
              <div className="p-3 rounded-full bg-green-100">
                <Check className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Offer Value</p>
                <p className="text-2xl font-bold text-blue-600">R{(stats.average_offer_value || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-full bg-blue-100">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Acceptance Rate</p>
                <p className="text-2xl font-bold text-purple-600">{((stats.acceptance_rate || 0) * 100).toFixed(1)}%</p>
              </div>
              <div className="p-3 rounded-full bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search offers..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="accepted">Accepted</option>
              <option value="rejected">Rejected</option>
              <option value="countered">Countered</option>
              <option value="expired">Expired</option>
            </select>
            
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Types</option>
              <option value="buy_request">Buy Request</option>
              <option value="direct_offer">Direct Offer</option>
              <option value="bulk_order">Bulk Order</option>
              <option value="negotiation">Negotiation</option>
            </select>
            
            <select
              value={filters.sort}
              onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="highest_value">Highest Value</option>
              <option value="lowest_value">Lowest Value</option>
              <option value="expiring_soon">Expiring Soon</option>
            </select>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                {offers.length} offers
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offers List */}
      <div className="space-y-4">
        {offers.map((offer) => {
          const timeRemaining = calculateTimeRemaining(offer.expires_at);
          const isResponding = respondingToId === offer.id;
          
          return (
            <Card key={offer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Offer Type & Status */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      {getOfferTypeIcon(offer.type)}
                      <span className="text-sm font-medium text-gray-900">
                        {offer.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </span>
                    </div>
                    {getOfferStatusBadge(offer.status)}
                  </div>
                  
                  {/* Buyer Info */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{offer.buyer_name}</span>
                    </div>
                    <p className="text-xs text-gray-500">{offer.buyer_email}</p>
                    {offer.buyer_rating && (
                      <div className="flex items-center gap-1 mt-1">
                        <span className="text-xs text-yellow-600">★</span>
                        <span className="text-xs text-gray-600">{offer.buyer_rating.toFixed(1)}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Listing Info */}
                  <div className="lg:col-span-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900 truncate">{offer.listing_title}</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Quantity: {offer.quantity} {offer.unit}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {offer.listing_id?.slice(0, 8)}...
                    </p>
                  </div>
                  
                  {/* Offer Details */}
                  <div className="lg:col-span-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-green-600">
                          R{offer.offered_price.toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        per {offer.unit}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        Total: R{(offer.offered_price * offer.quantity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  
                  {/* Time & Date */}
                  <div className="lg:col-span-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>{new Date(offer.created_at).toLocaleDateString()}</span>
                      </div>
                      {timeRemaining && (
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          <span className={timeRemaining === 'Expired' ? 'text-red-600' : 'text-orange-600'}>
                            {timeRemaining}
                          </span>
                        </div>
                      )}
                      {offer.delivery_required && (
                        <p className="text-xs text-blue-600">Delivery Required</p>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="lg:col-span-1">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedOffer(offer)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      
                      {offer.status === 'pending' && (
                        <>
                          <button
                            onClick={() => respondToOffer(offer.id, 'accepted')}
                            disabled={isResponding}
                            className="flex items-center gap-1 text-green-600 hover:text-green-700 text-sm disabled:opacity-50"
                          >
                            <Check className="h-4 w-4" />
                            Accept
                          </button>
                          <button
                            onClick={() => respondToOffer(offer.id, 'rejected')}
                            disabled={isResponding}
                            className="flex items-center gap-1 text-red-600 hover:text-red-700 text-sm disabled:opacity-50"
                          >
                            <X className="h-4 w-4" />
                            Decline
                          </button>
                          <button
                            onClick={() => setSelectedOffer(offer)}
                            className="flex items-center gap-1 text-orange-600 hover:text-orange-700 text-sm"
                          >
                            <MessageSquare className="h-4 w-4" />
                            Counter
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Offer Message */}
                {offer.message && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      "{offer.message}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {offers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No offers yet</h3>
            <p className="text-gray-500">
              Your offers from buyers will appear here
            </p>
          </CardContent>
        </Card>
      )}

      {/* Offer Details Modal */}
      {selectedOffer && (
        <OfferDetailsModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          onRespond={respondToOffer}
          onCounter={createCounterOffer}
        />
      )}
    </div>
  );
};

// Offer Details Modal Component
const OfferDetailsModal = ({ offer, onClose, onRespond, onCounter }) => {
  const [responseType, setResponseType] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [counterOffer, setCounterOffer] = useState({
    price: offer.offered_price,
    quantity: offer.quantity,
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleResponse = async () => {
    if (!responseType) return;
    
    setSubmitting(true);
    try {
      await onRespond(offer.id, responseType, responseMessage);
      onClose();
    } catch (error) {
      console.error('Error responding to offer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCounterOffer = async () => {
    setSubmitting(true);
    try {
      await onCounter(offer.id, counterOffer);
      onClose();
    } catch (error) {
      console.error('Error creating counter offer:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const timeRemaining = offer.expires_at 
    ? Math.max(0, Math.floor((new Date(offer.expires_at) - new Date()) / (1000 * 60 * 60)))
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Offer Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Offer Information */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Buyer Information</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Name:</span>
                <span>{offer.buyer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Email:</span>
                <span>{offer.buyer_email}</span>
              </div>
              {offer.buyer_rating && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating:</span>
                  <span>{offer.buyer_rating.toFixed(1)} ⭐</span>
                </div>
              )}
            </div>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Offer Details</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Offered Price:</span>
                <span className="font-medium">R{offer.offered_price.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Quantity:</span>
                <span>{offer.quantity} {offer.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-bold text-green-600">
                  R{(offer.offered_price * offer.quantity).toLocaleString()}
                </span>
              </div>
              {timeRemaining && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires:</span>
                  <span className="text-orange-600">{timeRemaining}h remaining</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Offer Message */}
        {offer.message && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Buyer Message</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">"{offer.message}"</p>
            </div>
          </div>
        )}
        
        {/* Response Options */}
        {offer.status === 'pending' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3">Response Options</h3>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setResponseType('accepted')}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    responseType === 'accepted'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-300 hover:border-green-300'
                  }`}
                >
                  <Check className="h-5 w-5 mx-auto mb-1" />
                  Accept Offer
                </button>
                
                <button
                  onClick={() => setResponseType('rejected')}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    responseType === 'rejected'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-300 hover:border-red-300'
                  }`}
                >
                  <X className="h-5 w-5 mx-auto mb-1" />
                  Decline Offer
                </button>
                
                <button
                  onClick={() => setResponseType('counter')}
                  className={`p-3 border rounded-lg text-center transition-colors ${
                    responseType === 'counter'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-blue-300'
                  }`}
                >
                  <MessageSquare className="h-5 w-5 mx-auto mb-1" />
                  Counter Offer
                </button>
              </div>
            </div>
            
            {/* Response Message */}
            {(responseType === 'accepted' || responseType === 'rejected') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message to Buyer (Optional)
                </label>
                <textarea
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  rows={3}
                  placeholder="Add a message to the buyer..."
                />
              </div>
            )}
            
            {/* Counter Offer Form */}
            {responseType === 'counter' && (
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Counter Offer Details</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Counter Price (R)
                    </label>
                    <input
                      type="number"
                      value={counterOffer.price}
                      onChange={(e) => setCounterOffer(prev => ({ ...prev, price: parseFloat(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={counterOffer.quantity}
                      onChange={(e) => setCounterOffer(prev => ({ ...prev, quantity: parseInt(e.target.value) }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Counter Offer Message
                  </label>
                  <textarea
                    value={counterOffer.message}
                    onChange={(e) => setCounterOffer(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    rows={3}
                    placeholder="Explain your counter offer..."
                  />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-700">
                    Total Counter Offer: R{(counterOffer.price * counterOffer.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            )}
            
            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              
              {responseType === 'counter' ? (
                <button
                  onClick={handleCounterOffer}
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {submitting ? 'Sending...' : 'Send Counter Offer'}
                </button>
              ) : responseType && (
                <button
                  onClick={handleResponse}
                  disabled={submitting}
                  className={`px-4 py-2 rounded-lg text-white disabled:opacity-50 ${
                    responseType === 'accepted' 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? 'Sending...' : `${responseType === 'accepted' ? 'Accept' : 'Decline'} Offer`}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerOffers;