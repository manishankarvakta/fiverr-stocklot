import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { 
  Plus, Target, MessageSquare, Clock, MapPin, DollarSign, 
  Eye, Edit, Pause, Play, Copy, X, CheckCircle, AlertCircle,
  Filter, Search, RefreshCw, TrendingUp, Users, Activity
} from 'lucide-react';

const BuyRequestDashboard = ({ userRole = 'BUYER' }) => {
  // State management
  const [activeTab, setActiveTab] = useState(userRole === 'BUYER' ? 'my-requests' : 'in-range');
  const [requests, setRequests] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    active: 0,
    offers_received: 0,
    accepted: 0,
    expiring_soon: 0
  });
  
  // Filters
  const [filters, setFilters] = useState({
    status: 'all',
    species: '',
    province: '',
    search: ''
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    hasMore: false
  });

  const statusOptions = [
    { value: 'all', label: 'All Requests' },
    { value: 'open', label: 'Active' },
    { value: 'accepted', label: 'Accepted' },
    { value: 'closed', label: 'Closed' },
    { value: 'expired', label: 'Expired' }
  ];

  const ZA_PROVINCES = [
    'Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape',
    'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'
  ];

  // Load data based on active tab and user role
  useEffect(() => {
    loadData();
  }, [activeTab, filters, pagination.offset]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (userRole === 'BUYER') {
        if (activeTab === 'my-requests') {
          await loadMyRequests();
        }
      } else if (userRole === 'SELLER') {
        if (activeTab === 'in-range') {
          await loadInRangeRequests();
        } else if (activeTab === 'my-offers') {
          await loadMyOffers();
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadMyRequests = async () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      limit: pagination.limit,
      offset: pagination.offset,
      ...(filters.status !== 'all' && { status: filters.status }),
      ...(filters.species && { species: filters.species }),
      ...(filters.province && { province: filters.province })
    });

    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/buy-requests/my?${params}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests || []);
      setPagination(prev => ({ ...prev, hasMore: data.has_more }));
      
      // Calculate stats
      const stats = data.requests.reduce((acc, req) => {
        if (req.status === 'open') acc.active++;
        acc.offers_received += req.offers_count || 0;
        if (req.accepted_offers > 0) acc.accepted++;
        
        // Check if expiring soon (within 24 hours)
        const expiresAt = new Date(req.expires_at);
        const now = new Date();
        const hoursUntilExpiry = (expiresAt - now) / (1000 * 60 * 60);
        if (hoursUntilExpiry <= 24 && hoursUntilExpiry > 0) acc.expiring_soon++;
        
        return acc;
      }, { active: 0, offers_received: 0, accepted: 0, expiring_soon: 0 });
      
      setStats(stats);
    }
  };

  const loadInRangeRequests = async () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      limit: pagination.limit,
      offset: pagination.offset,
      ...(filters.species && { species: filters.species }),
      ...(filters.province && { province: filters.province })
    });

    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/seller/requests/in-range?${params}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests || []);
      setPagination(prev => ({ ...prev, hasMore: data.has_more }));
    }
  };

  const loadMyOffers = async () => {
    const token = localStorage.getItem('token');
    const params = new URLSearchParams({
      limit: pagination.limit,
      offset: pagination.offset,
      ...(filters.status !== 'all' && { status: filters.status })
    });

    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/seller/offers?${params}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    });

    if (res.ok) {
      const data = await res.json();
      setOffers(data.offers || []);
      setPagination(prev => ({ ...prev, hasMore: data.has_more }));
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset pagination
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

  const formatPrice = (price) => {
    if (!price) return 'Negotiable';
    return `R${Number(price).toFixed(2)}`;
  };

  const getStatusBadge = (status) => {
    const variants = {
      open: 'bg-green-100 text-green-800',
      accepted: 'bg-blue-100 text-blue-800',
      closed: 'bg-gray-100 text-gray-800',
      expired: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      declined: 'bg-red-100 text-red-800'
    };
    
    return (
      <Badge className={variants[status] || 'bg-gray-100 text-gray-800'}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </Badge>
    );
  };

  const showToast = (message, type = 'info') => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-4 rounded-md z-50 max-w-sm ${
      type === 'error' ? 'bg-red-500' : 
      type === 'success' ? 'bg-green-500' : 'bg-blue-500'
    } text-white`;
    toast.innerHTML = `
      <div class="flex items-center gap-2">
        <span class="text-sm">${message}</span>
      </div>
    `;
    document.body.appendChild(toast);
    setTimeout(() => document.body.removeChild(toast), 4000);
  };

  const handleAcceptOffer = (requestId, offerId) => {
    // This would open the accept offer modal
    console.log('Accept offer:', { requestId, offerId });
    showToast('Opening checkout flow...', 'info');
  };

  const handlePauseRequest = async (requestId) => {
    // Implementation for pausing request
    showToast('Request paused', 'success');
  };

  const handleDuplicateRequest = (requestId) => {
    // Implementation for duplicating request
    showToast('Request duplicated', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.active}</div>
                <div className="text-sm text-gray-600">Active Requests</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MessageSquare className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.offers_received}</div>
                <div className="text-sm text-gray-600">Offers Received</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.accepted}</div>
                <div className="text-sm text-gray-600">Accepted</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.expiring_soon}</div>
                <div className="text-sm text-gray-600">Expiring Soon</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Buy Request Dashboard</CardTitle>
            <Button 
              onClick={loadData} 
              disabled={loading}
              variant="outline"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              {userRole === 'BUYER' && (
                <TabsTrigger value="my-requests">My Buy Requests</TabsTrigger>
              )}
              {userRole === 'SELLER' && (
                <>
                  <TabsTrigger value="in-range">Requests Inbox</TabsTrigger>
                  <TabsTrigger value="my-offers">My Offers</TabsTrigger>
                </>
              )}
            </TabsList>

            {/* Filters */}
            <div className="grid md:grid-cols-5 gap-3 mb-6">
              <div className="md:col-span-2 relative">
                <Input
                  placeholder="Search requests..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  className="pr-8"
                />
                <Search className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
              </div>
              
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.species} onValueChange={(value) => handleFilterChange('species', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-species">All species</SelectItem>
                  <SelectItem value="cattle">Cattle</SelectItem>
                  <SelectItem value="poultry">Poultry</SelectItem>
                  <SelectItem value="sheep">Sheep</SelectItem>
                  <SelectItem value="goats">Goats</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filters.province} onValueChange={(value) => handleFilterChange('province', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All provinces" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-provinces">All provinces</SelectItem>
                  {ZA_PROVINCES.map(province => (
                    <SelectItem key={province} value={province}>
                      {province}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tab Contents */}
            <TabsContent value="my-requests">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading your requests...</p>
                  </div>
                ) : (
                  <>
                    {requests.map(request => (
                      <Card key={request.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">
                                  {request.species} • {request.product_type}
                                </h3>
                                {getStatusBadge(request.status)}
                                {request.offers_count > 0 && (
                                  <Badge variant="outline" className="bg-blue-50">
                                    {request.offers_count} offer{request.offers_count !== 1 ? 's' : ''}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid md:grid-cols-3 gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {request.qty} {request.unit}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {request.province}
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatPrice(request.target_price)} / {request.unit}
                                </div>
                              </div>

                              {request.notes && (
                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded mb-3">
                                  {request.notes}
                                </p>
                              )}

                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Clock className="h-3 w-3" />
                                Created: {formatDate(request.created_at)}
                                {request.expires_at && (
                                  <span className="ml-4">
                                    Expires: {formatDate(request.expires_at)}
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 ml-4">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              
                              {request.status === 'open' && (
                                <>
                                  <Button size="sm" variant="outline">
                                    <Edit className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handlePauseRequest(request.id)}
                                  >
                                    <Pause className="h-3 w-3 mr-1" />
                                    Pause
                                  </Button>
                                </>
                              )}
                              
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleDuplicateRequest(request.id)}
                              >
                                <Copy className="h-3 w-3 mr-1" />
                                Duplicate
                              </Button>

                              {request.pending_offers > 0 && (
                                <Button 
                                  size="sm" 
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  onClick={() => handleAcceptOffer(request.id, 'offer-id')}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Review Offers
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {requests.length === 0 && (
                      <div className="text-center py-12">
                        <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                          No buy requests yet
                        </h3>
                        <p className="text-gray-500 mb-4">
                          Create your first buy request to start receiving offers from sellers.
                        </p>
                        <Button>
                          <Plus className="h-4 w-4 mr-2" />
                          Create Buy Request
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="in-range">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Finding requests in your area...</p>
                  </div>
                ) : (
                  <>
                    {requests.map(request => (
                      <Card key={request.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">
                                  {request.species} • {request.product_type}
                                </h3>
                                {getStatusBadge(request.status)}
                                {request.my_offer_status && (
                                  <Badge variant="outline" className="bg-purple-50">
                                    My offer: {request.my_offer_status}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {request.qty} {request.unit}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {request.province}
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatPrice(request.target_price)} / {request.unit}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(request.created_at)}
                                </div>
                              </div>

                              {request.notes && (
                                <p className="text-sm text-gray-600 bg-gray-50 p-2 rounded">
                                  {request.notes}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 ml-4">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                View Details
                              </Button>
                              
                              {!request.my_offer_status && request.status === 'open' && (
                                <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Send Offer
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {requests.length === 0 && (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                          No requests in your area
                        </h3>
                        <p className="text-gray-500">
                          Try expanding your service area or check back later for new opportunities.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>

            <TabsContent value="my-offers">
              <div className="space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading your offers...</p>
                  </div>
                ) : (
                  <>
                    {offers.map(offer => (
                      <Card key={offer.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-lg">
                                  {offer.request?.species} • {offer.request?.product_type}
                                </h3>
                                {getStatusBadge(offer.status)}
                              </div>
                              
                              <div className="grid md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                                <div className="flex items-center gap-1">
                                  <Target className="h-3 w-3" />
                                  {offer.qty} {offer.request?.unit}
                                </div>
                                <div className="flex items-center gap-1">
                                  <DollarSign className="h-3 w-3" />
                                  {formatPrice(offer.offer_price)} / {offer.request?.unit}
                                </div>
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {offer.request?.province}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDate(offer.created_at)}
                                </div>
                              </div>

                              {offer.message && (
                                <p className="text-sm text-gray-600 bg-blue-50 p-2 rounded">
                                  <strong>Your message:</strong> {offer.message}
                                </p>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col gap-2 ml-4">
                              <Button size="sm" variant="outline">
                                <Eye className="h-3 w-3 mr-1" />
                                View Request
                              </Button>
                              
                              {offer.status === 'pending' && (
                                <Button size="sm" variant="outline">
                                  <Edit className="h-3 w-3 mr-1" />
                                  Update Offer
                                </Button>
                              )}

                              {offer.status === 'accepted' && (
                                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Start Fulfillment
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {offers.length === 0 && (
                      <div className="text-center py-12">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-600 mb-2">
                          No offers sent yet
                        </h3>
                        <p className="text-gray-500">
                          Browse available buy requests and send your first offer to get started.
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Pagination */}
          {pagination.hasMore && (
            <div className="mt-6 text-center">
              <Button 
                onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                disabled={loading}
                variant="outline"
              >
                Load More
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyRequestDashboard;