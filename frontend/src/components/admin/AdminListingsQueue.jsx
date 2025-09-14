import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui';
import { Package, Search, Eye, Check, X, AlertTriangle, Clock, Filter, MapPin } from 'lucide-react';

const AdminListingsQueue = () => {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: ''
  });
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadListings();
  }, [filters]);

  const loadListings = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.category) params.append('category', filters.category);
      if (filters.search) params.append('q', filters.search);

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/listings?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setListings(Array.isArray(data) ? data : data.listings || []);
      } else {
        console.error('Failed to load listings:', response.status);
        alert('Failed to load listings. Please check your permissions.');
      }
    } catch (error) {
      console.error('Error loading listings:', error);
      alert('Error loading listings: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleListingAction = async (listingId, action) => {
    setActionLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Authentication required. Please log in again.');
        return;
      }

      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/admin/listings/${listingId}/${action}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          reason: action === 'reject' ? 'Admin moderation' : undefined,
          admin_notes: `${action} by admin`
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success || result.message) {
          alert(`Listing ${action} successful!`);
          loadListings(); // Refresh list
        } else {
          alert(`Failed to ${action} listing: ` + (result.message || 'Unknown error'));
        }
      } else {
        const error = await response.json();
        alert(`Failed to ${action} listing: ` + (error.detail || 'Server error'));
      }
    } catch (error) {
      console.error(`Error ${action} listing:`, error);
      alert(`Error ${action} listing: ` + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case 'active': return <Badge className="bg-green-100 text-green-800"><Check className="h-3 w-3 mr-1" />Active</Badge>;
      case 'pending': return <Badge className="bg-yellow-100 text-yellow-800"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'rejected': return <Badge className="bg-red-100 text-red-800"><X className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'flagged': return <Badge className="bg-orange-100 text-orange-800"><AlertTriangle className="h-3 w-3 mr-1" />Flagged</Badge>;
      default: return <Badge className="bg-gray-100 text-gray-800">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Livestock Listings</h2>
          <p className="text-gray-600">Review and moderate livestock listings</p>
        </div>
        <Button onClick={loadListings} disabled={loading} className="bg-blue-600 hover:bg-blue-700">
          <Package className="h-4 w-4 mr-2" />
          {loading ? 'Loading...' : 'Refresh Listings'}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="h-5 w-5 mr-2" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Search Listings</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by title or description..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-items">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending Review</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="flagged">Flagged</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select value={filters.category} onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-items">All Categories</SelectItem>
                  <SelectItem value="cattle">Cattle</SelectItem>
                  <SelectItem value="poultry">Poultry</SelectItem>
                  <SelectItem value="sheep">Sheep</SelectItem>
                  <SelectItem value="goats">Goats</SelectItem>
                  <SelectItem value="pigs">Pigs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Listings List */}
      <Card>
        <CardHeader>
          <CardTitle>Listings ({listings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4" />
                <p>Loading listings...</p>
              </div>
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No listings found matching your criteria</p>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map(listing => (
                <div key={listing.id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div>
                          <h3 className="font-semibold">{listing.title}</h3>
                          <p className="text-sm text-gray-600">{listing.description?.substring(0, 100)}...</p>
                        </div>
                        {getStatusBadge(listing.status)}
                        <Badge variant="outline">{listing.species_name || 'Unknown Species'}</Badge>
                      </div>
                      <div className="mt-2 text-sm text-gray-600 grid grid-cols-2 gap-4">
                        <p>Price: R{listing.price_minor ? (listing.price_minor / 100).toLocaleString() : 'N/A'}</p>
                        <p>Quantity: {listing.quantity || 'N/A'}</p>
                        <p>Seller: {listing.seller_name || 'Unknown'}</p>
                        <p>Created: {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'Unknown'}</p>
                      </div>
                      {listing.location && (
                        <div className="mt-2 flex items-center text-sm text-gray-600">
                          <MapPin className="h-3 w-3 mr-1" />
                          {listing.location}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedListing(listing);
                          setShowDetail(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {listing.status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-green-600 hover:text-green-700"
                            onClick={() => handleListingAction(listing.id, 'approve')}
                            disabled={actionLoading}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleListingAction(listing.id, 'reject')}
                            disabled={actionLoading}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {listing.status === 'flagged' && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700"
                          onClick={() => handleListingAction(listing.id, 'unflag')}
                          disabled={actionLoading}
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminListingsQueue;