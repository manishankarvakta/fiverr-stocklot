import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, CardContent, CardHeader, CardTitle, Badge, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui';
import { 
  MessageSquare, Package, MapPin, Clock, DollarSign, 
  CheckCircle, XCircle, Eye, User, Star, AlertCircle,
  RefreshCw, Loader2, Bell, TrendingUp, Calendar
} from 'lucide-react';
import {
  useGetBuyerOffersQuery,
  useAcceptOfferMutation,
  useDeclineOfferMutation,
} from '@/store/api/buyRequests.api';

const BuyerOffersPage = ({ user }) => {
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, accepted, declined

  const navigate = useNavigate();

  // RTK Query hooks
  const { 
    data: offersData, 
    isLoading: loading, 
    error: queryError,
    refetch 
  } = useGetBuyerOffersQuery(
    filter !== 'all' ? { status: filter } : {},
    { skip: !user }
  );
  console.log('Offers Data:', offersData);

  const [acceptOffer, { isLoading: acceptLoading }] = useAcceptOfferMutation();
  const [declineOffer, { isLoading: declineLoading }] = useDeclineOfferMutation();

  const actionLoading = acceptLoading || declineLoading;
  const offers = offersData?.items || [];
  const error = queryError?.data?.message || queryError?.message || null;

  const handleOfferAction = async (offerId, requestId, action) => {
    try {
      const result = action === 'accept'
        ? await acceptOffer({ requestId, offerId }).unwrap()
        : await declineOffer({ requestId, offerId }).unwrap();
      
      // Show success message
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-md z-50 shadow-lg';
      toast.innerHTML = `
        <div class="flex items-center gap-2">
          <div class="text-lg">${action === 'accept' ? '✅' : '❌'}</div>
          <div>
            <div class="font-medium">Offer ${action}ed successfully!</div>
            <div class="text-sm opacity-90">${result.message || 'Success'}</div>
          </div>
        </div>
      `;
      document.body.appendChild(toast);
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast);
        }
      }, 5000);

      // Refresh offers
      refetch();
      setShowDetailModal(false);

    } catch (error) {
      console.error(`Error ${action}ing offer:`, error);
      
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-md z-50';
      toast.textContent = error?.data?.message || error?.message || `Failed to ${action} offer`;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending</Badge>;
      case 'accepted':
        return <Badge variant="default" className="bg-green-50 text-green-700 border-green-200">Accepted</Badge>;
      case 'declined':
        return <Badge variant="destructive">Declined</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR'
    }).format(amount);
  };

  const getOfferStats = () => {
    const stats = {
      total: offers.length,
      pending: offers.filter(o => o.status === 'pending').length,
      accepted: offers.filter(o => o.status === 'accepted').length,
      declined: offers.filter(o => o.status === 'declined').length,
      totalValue: offers.reduce((sum, o) => sum + (o.offer_price * o.qty), 0)
    };
    return stats;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-600 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">🔒</span>
          </div>
          <h2 className="text-xl font-semibold text-emerald-900 mb-2">Authentication Required</h2>
          <p className="text-emerald-700 mb-4">Please log in to view your offers</p>
          <Button onClick={() => navigate('/login')} className="bg-emerald-600 hover:bg-emerald-700">
            Log In
          </Button>
        </div>
      </div>
    );
  }

  if (!user.roles?.includes('buyer')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-600 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Buyer Account Required</h2>
          <p className="text-gray-700 mb-4">You need a buyer account to view offers</p>
          <Button onClick={() => navigate('/profile')} variant="outline">
            Update Account Type
          </Button>
        </div>
      </div>
    );
  }

  const stats = getOfferStats();

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-emerald-900 flex items-center gap-3">
              <MessageSquare className="h-8 w-8" />
              Your Offers
            </h1>
            <p className="text-emerald-700 mt-1">Manage offers received on your buy requests</p>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={() => refetch()} variant="outline" disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate('/create-buy-request')} className="bg-emerald-600 hover:bg-emerald-700">
              + New Request
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
              <div className="text-sm text-gray-600">Total Offers</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
              <div className="text-sm text-gray-600">Accepted</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.declined}</div>
              <div className="text-sm text-gray-600">Declined</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-lg font-bold text-emerald-600">{formatCurrency(stats.totalValue)}</div>
              <div className="text-sm text-gray-600">Total Value</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg border p-4 mb-6">
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Offers', count: stats.total },
              { key: 'pending', label: 'Pending', count: stats.pending },
              { key: 'accepted', label: 'Accepted', count: stats.accepted },
              { key: 'declined', label: 'Declined', count: stats.declined }
            ].map(({ key, label, count }) => (
              <Button
                key={key}
                onClick={() => setFilter(key)}
                variant={filter === key ? 'default' : 'outline'}
                size="sm"
                className="h-9"
              >
                {label} ({count})
              </Button>
            ))}
          </div>
        </div>

        {/* Offers List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Loading your offers...</span>
          </div>
        ) : error ? (
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Offers</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => refetch()} variant="outline">
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : offers.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No Offers Yet</h3>
              <p className="text-gray-600 mb-6">
                {filter === 'all' 
                  ? "You haven't received any offers on your buy requests yet."
                  : `No ${filter} offers found.`
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => navigate('/create-buy-request')} className="bg-emerald-600 hover:bg-emerald-700">
                  Create Buy Request
                </Button>
                <Button onClick={() => navigate('/buy-requests')} variant="outline">
                  Browse Marketplace
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {offers.map((offer) => (
              <Card key={offer.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-emerald-900">
                        {offer.request_title}
                      </CardTitle>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {offer.request_quantity}
                        </Badge>
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {offer.request_location}
                        </span>
                      </div>
                    </div>
                    {getStatusBadge(offer.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Offer Details */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-600">Offer Price</div>
                        <div className="text-lg font-bold text-emerald-600">
                          {formatCurrency(offer.offer_price)}/unit
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-600">Total Value</div>
                        <div className="text-lg font-bold text-gray-900">
                          {formatCurrency(offer.offer_price * offer.qty)}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 text-sm">
                      <span className="font-medium">Quantity:</span> {offer.qty} units
                    </div>
                  </div>

                  {/* Seller Info */}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                      <User className="h-5 w-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-sm">{offer.seller_name}</div>
                      <div className="text-xs text-gray-600 flex items-center gap-1">
                        {offer.seller_verified ? (
                          <>
                            <CheckCircle className="h-3 w-3 text-green-500" />
                            Verified Seller
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 text-gray-400" />
                            Unverified
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-600">
                      {formatDate(offer.created_at)}
                    </div>
                  </div>

                  {/* Message Preview */}
                  {offer.message && (
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 rounded">
                      <div className="text-xs text-blue-600 font-medium mb-1">Message from seller:</div>
                      <div className="text-sm text-blue-800 line-clamp-2">
                        {offer.message}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedOffer(offer);
                        setShowDetailModal(true);
                      }}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                    
                    {offer.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleOfferAction(offer.id, offer.request_id, 'accept')}
                          disabled={actionLoading}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOfferAction(offer.id, offer.request_id, 'decline')}
                          disabled={actionLoading}
                          className="text-red-600 border-red-300 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Decline
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Offer Detail Modal */}
        {selectedOffer && (
          <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Offer Details
                </DialogTitle>
              </DialogHeader>

              <Tabs defaultValue="offer" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="offer">Offer Details</TabsTrigger>
                  <TabsTrigger value="request">Request Details</TabsTrigger>
                  <TabsTrigger value="seller">Seller Info</TabsTrigger>
                </TabsList>

                <TabsContent value="offer" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Offer Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {getStatusBadge(selectedOffer.status)}
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm font-medium text-gray-600">Price per unit</div>
                          <div className="text-xl font-bold text-emerald-600">
                            {formatCurrency(selectedOffer.offer_price)}
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-600">Quantity</div>
                          <div className="text-xl font-bold">{selectedOffer.qty} units</div>
                        </div>
                      </div>
                      
                      <div className="bg-emerald-50 rounded-lg p-4">
                        <div className="text-sm font-medium text-emerald-800">Total Offer Value</div>
                        <div className="text-2xl font-bold text-emerald-600">
                          {formatCurrency(selectedOffer.offer_price * selectedOffer.qty)}
                        </div>
                      </div>

                      {selectedOffer.message && (
                        <div>
                          <div className="text-sm font-medium text-gray-600 mb-2">Message from seller</div>
                          <div className="bg-gray-50 rounded-lg p-3 text-sm">
                            {selectedOffer.message}
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-600">
                        Offer received: {formatDate(selectedOffer.created_at)}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="request" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Your Request</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">Item:</span>
                        <span>{selectedOffer.request_title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Quantity:</span>
                        <span>{selectedOffer.request_quantity}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Location:</span>
                        <span>{selectedOffer.request_location}</span>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="seller" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Seller Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                          <User className="h-8 w-8 text-emerald-600" />
                        </div>
                        <div>
                          <div className="font-medium text-lg">{selectedOffer.seller_name}</div>
                          <div className="flex items-center gap-2 text-sm">
                            {selectedOffer.seller_verified ? (
                              <>
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                <span className="text-green-600">Verified Seller</span>
                              </>
                            ) : (
                              <>
                                <AlertCircle className="h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">Unverified Seller</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>

              <DialogFooter className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" onClick={() => setShowDetailModal(false)} className="flex-1">
                  Close
                </Button>
                
                {selectedOffer.status === 'pending' && (
                  <>
                    <Button
                      onClick={() => handleOfferAction(selectedOffer.id, selectedOffer.request_id, 'decline')}
                      disabled={actionLoading}
                      variant="outline"
                      className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                      Decline Offer
                    </Button>
                    <Button
                      onClick={() => handleOfferAction(selectedOffer.id, selectedOffer.request_id, 'accept')}
                      disabled={actionLoading}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {actionLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                      Accept Offer
                    </Button>
                  </>
                )}
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default BuyerOffersPage;