import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { MessageSquare, Clock, DollarSign, TrendingUp, Check, X, Eye, Filter, Search, Calendar, Package, User } from 'lucide-react';
import {
  useGetSellerOffersQuery,
  // useGetSellerOfferStatsQuery, // Endpoint doesn't exist
  // useRespondToOfferMutation, // Not applicable - sellers can't respond to their own offers
  // useCreateCounterOfferMutation, // Not applicable
} from '../../store/api/seller.api';

// Helper function for offer status badge - shared between components
const getOfferStatusBadge = (status) => {
  const statusConfig = {
    pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
    accepted: { label: 'Accepted', className: 'bg-green-100 text-green-800 border-green-200' },
    declined: { label: 'Declined', className: 'bg-red-100 text-red-800 border-red-200' },
    expired: { label: 'Expired', className: 'bg-gray-100 text-gray-800 border-gray-200' },
    cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800 border-gray-200' },
  };
  
  const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;
  
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.className}`}>
      {config.label}
    </span>
  );
};

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
  // Note: API only supports status and species filters, not type/search/sort
  const { data: offersData, isLoading: loading, error, refetch: refetchOffers } = useGetSellerOffersQuery({
    status: filters.status !== 'all' ? filters.status : undefined,
    species: filters.type !== 'all' ? filters.type : undefined,
    // type, search, and sort are not supported by the API - filtering done client-side
  });
  
  // Stats endpoint doesn't exist - calculating from offers data instead
  // const { data: statsData } = useGetSellerOfferStatsQuery();
  // Sellers cannot respond to their own offers - only buyers can accept/reject
  // const [respondToOfferMutation] = useRespondToOfferMutation();
  // const [createCounterOfferMutation] = useCreateCounterOfferMutation();

  // Extract offers from API response - API returns { offers: [...], total_count: ..., has_more: ... }
  // or { items: [...] } depending on which endpoint is used
  const offers = offersData?.offers || offersData?.data?.offers || offersData?.items || [];
  
  // Calculate stats from offers data
  const stats = {
    pending_offers: offers.filter(o => o.status === 'pending').length,
    accepted_offers: offers.filter(o => o.status === 'accepted').length,
    total_offers: offers.length,
    acceptance_rate: offers.length > 0 
      ? offers.filter(o => o.status === 'accepted').length / offers.length 
      : 0
  };

  // Note: Sellers cannot respond to their own offers - only buyers can accept/reject offers
  // These functions are kept for potential future use but won't work with current API
  const respondToOffer = async (offerId, response, message = '') => {
    console.warn('Seller cannot respond to their own offers. Only buyers can accept/reject offers.');
    // This functionality doesn't exist in the current API
  };

  const createCounterOffer = async (offerId, counterOfferData) => {
    console.warn('Counter offers from sellers are not currently supported.');
    // This functionality doesn't exist in the current API
  };

  const getOfferTypeIcon = () => {
    // All offers are on buy requests
    return <MessageSquare className="h-4 w-4" />;
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

  if (error) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-red-900 mb-2">Error Loading Offers</h3>
          <p className="text-red-700 mb-4">
            {error?.data?.detail || error?.message || 'Failed to load offers. Please try again.'}
          </p>
          <button
            onClick={() => refetchOffers()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Client-side filtering for search and sort (since API doesn't support these)
  let filteredOffers = [...offers];
  
  // Search filter (client-side)
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    filteredOffers = filteredOffers.filter(offer => {
          const request = offer.request || {};
          return (
            request.species?.toLowerCase().includes(searchLower) ||
            request.breed?.toLowerCase().includes(searchLower) ||
            request.product_type?.toLowerCase().includes(searchLower) ||
            request.province?.toLowerCase().includes(searchLower) ||
            request.city?.toLowerCase().includes(searchLower) ||
            (offer.notes || offer.message)?.toLowerCase().includes(searchLower) ||
            offer.id?.toLowerCase().includes(searchLower)
          );
    });
  }
  
  // Sort filter (client-side)
  if (filters.sort === 'oldest') {
    filteredOffers.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  } else if (filters.sort === 'highest_value') {
    filteredOffers.sort((a, b) => {
      const aValue = (a.price_per_unit || 0) * (a.quantity_available || 0);
      const bValue = (b.price_per_unit || 0) * (b.quantity_available || 0);
      return bValue - aValue;
    });
  } else if (filters.sort === 'lowest_value') {
    filteredOffers.sort((a, b) => {
      const aValue = (a.price_per_unit || 0) * (a.quantity_available || 0);
      const bValue = (b.price_per_unit || 0) * (b.quantity_available || 0);
      return aValue - bValue;
    });
  } else if (filters.sort === 'expiring_soon') {
    filteredOffers.sort((a, b) => {
      const aExpiry = a.expires_at ? new Date(a.expires_at) : new Date(0);
      const bExpiry = b.expires_at ? new Date(b.expires_at) : new Date(0);
      return aExpiry - bExpiry;
    });
  } else {
    // Default: newest first
    filteredOffers.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
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

      {/* Stats Cards - Calculate from offers data */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Pending Offers</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {offers.filter(o => o.status === 'pending').length}
                </p>
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
                <p className="text-sm font-medium text-gray-600">Accepted Offers</p>
                <p className="text-2xl font-bold text-green-600">
                  {offers.filter(o => o.status === 'accepted').length}
                </p>
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
                <p className="text-sm font-medium text-gray-600">Total Offers</p>
                <p className="text-2xl font-bold text-blue-600">{offers.length}</p>
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
                <p className="text-2xl font-bold text-purple-600">
                  {offers.length > 0 
                    ? ((offers.filter(o => o.status === 'accepted').length / offers.length) * 100).toFixed(1)
                    : 0}%
                </p>
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
              <option value="all">All Species</option>
              <option value="Cattle">Cattle</option>
              <option value="Goats">Goats</option>
              <option value="Sheep">Sheep</option>
              <option value="Poultry">Poultry</option>
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
                {filteredOffers.length} of {offers.length} offers
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Offers List */}
      <div className="space-y-4">
        {filteredOffers.map((offer) => {
          const timeRemaining = calculateTimeRemaining(offer.expires_at);
          const request = offer.request || {};
          const pricePerUnit = offer.price_per_unit || offer.offer_price || 0;
          const quantity = offer.quantity_available || offer.qty || 0;
          const totalValue = pricePerUnit * quantity;
          const location = request.province 
            ? `${request.province}${request.city ? `, ${request.city}` : ''}${request.country ? `, ${request.country}` : ''}`
            : request.city 
            ? `${request.city}${request.country ? `, ${request.country}` : ''}`
            : request.country || 'N/A';
          
          return (
            <Card key={offer.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                  {/* Status */}
                  <div className="lg:col-span-2">
                    <div className="flex items-center gap-2 mb-2">
                      {getOfferTypeIcon()}
                      <span className="text-sm font-medium text-gray-900">Buy Request</span>
                    </div>
                    {getOfferStatusBadge(offer.status)}
                  </div>
                  
                  {/* Buy Request Info */}
                  <div className="lg:col-span-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span className="font-medium text-gray-900">
                          {request.species || 'N/A'} {request.breed ? `- ${request.breed}` : ''}
                        </span>
                      </div>
                      {request.product_type && (
                        <p className="text-xs text-gray-500">
                          Type: {request.product_type}
                        </p>
                      )}
                      <p className="text-sm text-gray-600">
                        Buyer wants: {request.qty || 0} {request.unit || 'units'}
                      </p>
                      {request.target_price && (
                        <p className="text-xs text-gray-500">
                          Target: R{request.target_price.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per {request.unit || 'unit'}
                        </p>
                      )}
                      <p className="text-xs text-blue-600">📍 {location}</p>
                      {(request.deadline_at || request.expires_at) && (
                        <p className="text-xs text-gray-500">
                          Deadline: {new Date(request.deadline_at || request.expires_at).toLocaleDateString('en-ZA')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Your Offer Details */}
                  <div className="lg:col-span-3">
                    <div className="space-y-1">
                      <p className="text-xs font-medium text-gray-500 mb-1">Your Offer:</p>
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="font-bold text-green-600">
                          R{pricePerUnit.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        <span className="text-xs text-gray-500">per {request.unit || 'unit'}</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Quantity: {quantity} {request.unit || 'units'}
                      </p>
                      <p className="text-sm font-medium text-gray-900">
                        Total: R{totalValue.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      {offer.delivery_cost && (
                        <p className="text-xs text-blue-600">
                          + R{offer.delivery_cost.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} delivery
                        </p>
                      )}
                      {offer.delivery_days && (
                        <p className="text-xs text-gray-500">
                          Delivery: {offer.delivery_days} days
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Time & Date */}
                  <div className="lg:col-span-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="h-3 w-3" />
                        <span>Created: {offer.created_at ? new Date(offer.created_at).toLocaleDateString('en-ZA') : 'N/A'}</span>
                      </div>
                      {request.created_at && (
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <span>Request: {new Date(request.created_at).toLocaleDateString('en-ZA')}</span>
                        </div>
                      )}
                      {timeRemaining && (
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          <span className={timeRemaining === 'Expired' ? 'text-red-600' : 'text-orange-600'}>
                            {timeRemaining}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="lg:col-span-2">
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => setSelectedOffer(offer)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm px-3 py-1.5 border border-blue-200 rounded hover:bg-blue-50"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </button>
                      
                      {offer.status === 'pending' && (
                        <p className="text-xs text-gray-500 italic">
                          Waiting for buyer response
                        </p>
                      )}
                      {offer.status === 'accepted' && (
                        <p className="text-xs text-green-600 font-medium">
                          ✓ Accepted by buyer
                        </p>
                      )}
                      {offer.status === 'declined' && (
                        <p className="text-xs text-red-600 font-medium">
                          ✗ Declined by buyer
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Offer Notes */}
                {(offer.notes || offer.message) && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs font-medium text-gray-500 mb-1">Your Message:</p>
                    <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">
                      "{offer.notes || offer.message}"
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredOffers.length === 0 && offers.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No offers yet</h3>
            <p className="text-gray-500">
              Offers you make on buy requests will appear here
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
  const request = offer.request || {};
  const timeRemaining = offer.expires_at 
    ? Math.max(0, Math.floor((new Date(offer.expires_at) - new Date()) / (1000 * 60 * 60)))
    : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Offer Details</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        {/* Buy Request Information */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Buy Request Details</h3>
          <div className="bg-gray-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Species:</span>
              <span className="font-medium">{request.species || 'N/A'}</span>
            </div>
            {request.breed && (
              <div className="flex justify-between">
                <span className="text-gray-600">Breed:</span>
                <span className="font-medium">{request.breed}</span>
              </div>
            )}
            {request.product_type && (
              <div className="flex justify-between">
                <span className="text-gray-600">Product Type:</span>
                <span className="font-medium">{request.product_type}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Quantity Needed:</span>
              <span className="font-medium">{request.qty || 0} {request.unit || 'units'}</span>
            </div>
            {request.target_price && (
              <div className="flex justify-between">
                <span className="text-gray-600">Target Price:</span>
                <span className="font-medium">R{request.target_price.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} per {request.unit || 'unit'}</span>
              </div>
            )}
            {(request.province || request.country) && (
              <div className="flex justify-between">
                <span className="text-gray-600">Location:</span>
                <span className="font-medium">
                  {request.province ? `${request.province}${request.country ? `, ${request.country}` : ''}` : request.country || 'N/A'}
                </span>
              </div>
            )}
            {request.city && (
              <div className="flex justify-between">
                <span className="text-gray-600">City:</span>
                <span className="font-medium">{request.city}</span>
              </div>
            )}
            {(request.deadline_at || request.expires_at) && (
              <div className="flex justify-between">
                <span className="text-gray-600">Deadline:</span>
                <span className="font-medium">
                  {new Date(request.deadline_at || request.expires_at).toLocaleDateString('en-ZA')}
                </span>
              </div>
            )}
            {request.created_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Request Created:</span>
                <span className="font-medium">
                  {new Date(request.created_at).toLocaleDateString('en-ZA')}
                </span>
              </div>
            )}
            {request.notes && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <p className="text-gray-600 mb-1">Buyer Notes:</p>
                <p className="text-gray-700">"{request.notes}"</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Your Offer Details */}
        <div className="mb-6">
          <h3 className="font-medium text-gray-900 mb-3">Your Offer</h3>
          <div className="bg-green-50 p-4 rounded-lg space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Price per Unit:</span>
              <span className="font-bold text-green-600">
                R{((offer.price_per_unit || offer.offer_price || 0)).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Quantity Available:</span>
              <span className="font-medium">{offer.quantity_available || offer.qty || 0} {request.unit || 'units'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Value:</span>
              <span className="font-bold text-green-600">
                R{(((offer.price_per_unit || offer.offer_price || 0) * (offer.quantity_available || offer.qty || 0))).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
            {offer.delivery_cost && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Cost:</span>
                <span className="font-medium">R{offer.delivery_cost.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
            )}
            {offer.delivery_days && (
              <div className="flex justify-between">
                <span className="text-gray-600">Delivery Time:</span>
                <span className="font-medium">{offer.delivery_days} days</span>
              </div>
            )}
            {offer.created_at && (
              <div className="flex justify-between">
                <span className="text-gray-600">Created:</span>
                <span className="font-medium">{new Date(offer.created_at).toLocaleDateString('en-ZA')}</span>
              </div>
            )}
            {timeRemaining !== null && (
              <div className="flex justify-between">
                <span className="text-gray-600">Expires:</span>
                <span className={timeRemaining > 0 ? 'text-orange-600' : 'text-red-600'}>
                  {timeRemaining > 0 ? `${timeRemaining}h remaining` : 'Expired'}
                </span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Status:</span>
              {getOfferStatusBadge(offer.status)}
            </div>
          </div>
        </div>
        
        {/* Your Message */}
        {(offer.notes || offer.message) && (
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-2">Your Message to Buyer</h3>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-gray-700">"{offer.notes || offer.message}"</p>
            </div>
          </div>
        )}
        
        {/* Status Message */}
        {offer.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <Clock className="h-4 w-4 inline mr-2" />
              This offer is pending buyer response. You will be notified when the buyer accepts or declines.
            </p>
          </div>
        )}
        
        {offer.status === 'accepted' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-green-800">
              <Check className="h-4 w-4 inline mr-2" />
              This offer has been accepted by the buyer. An order should be created automatically.
            </p>
          </div>
        )}
        
        {offer.status === 'declined' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">
              <X className="h-4 w-4 inline mr-2" />
              This offer was declined by the buyer.
            </p>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SellerOffers;