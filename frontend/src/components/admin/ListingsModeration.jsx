import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui';
import { Search, Filter, Eye, CheckCircle, XCircle, AlertTriangle, Package } from 'lucide-react';
import { useGetAdminListingsQuery } from '@/store/api/admin.api';

// import adminApi from '../../api/adminClient';

const ListingsModeration = () => {
  // const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: 'pending',
    category: 'all',
    search: ''
  });
  const [selectedListing, setSelectedListing] = useState(null);
  const [actionLoading, setActionLoading] = useState({});

// const { data, isLoading, isError } = useGetAdminListingsQuery({
//   status: filters.status !== 'all' ? filters.status : undefined,
//   page,
//   limit: 20,
// });
const {data, isLoading, isError}= useGetAdminListingsQuery()

console.log("Admin Listings Data:", data, isLoading, isError);

const listings = data?.listings || [];
const pagination = data?.pagination;


  useEffect(() => {
    loadListings();
  }, [filters]);

  const loadListings = async () => {
    try {
      setLoading(true);
      
      const params = {};
      if (filters.status !== 'all') params.moderation_status = filters.status;
      if (filters.category !== 'all') params.category = filters.category;
      if (filters.search) params.search = filters.search;
      
      const response = await adminApi.get('/admin/listings', { params });
      setListings(response.data.listings || []);
      
    } catch (error) {
      console.error('Error loading listings:', error);
    } finally {
      setLoading(false);
    }
  };

  const approveListing = async (listingId, note = '') => {
    try {
      setActionLoading(prev => ({ ...prev, [listingId]: 'approve' }));
      
      await adminApi.post(`/admin/listings/${listingId}/approve`, {
        note
      });
      
      await loadListings();
      alert('Listing approved successfully');
      
    } catch (error) {
      console.error('Error approving listing:', error);
      alert('Failed to approve listing');
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[listingId];
        return newState;
      });
    }
  };

  const rejectListing = async (listingId, reason) => {
    try {
      setActionLoading(prev => ({ ...prev, [listingId]: 'reject' }));
      
      await adminApi.post(`/admin/listings/${listingId}/reject`, {
        reason
      });
      
      await loadListings();
      alert('Listing rejected successfully');
      
    } catch (error) {
      console.error('Error rejecting listing:', error);
      alert('Failed to reject listing');
    } finally {
      setActionLoading(prev => {
        const newState = { ...prev };
        delete newState[listingId];
        return newState;
      });
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Listings Moderation</h1>
          <p className="text-gray-600 mt-1">Review and moderate livestock listings</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search listings..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
            
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="suspended">Suspended</option>
            </select>
            
            <select
              value={filters.category}
              onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
              className="border border-gray-300 rounded px-3 py-1 text-sm"
            >
              <option value="all">All Categories</option>
              <option value="poultry">Poultry</option>
              <option value="ruminants">Ruminants</option>
              <option value="exotic">Exotic</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listings ({listings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3">Listing</th>
                  <th className="text-left py-3">Seller</th>
                  <th className="text-left py-3">Category</th>
                  <th className="text-left py-3">Price</th>
                  <th className="text-left py-3">Status</th>
                  <th className="text-left py-3">Created</th>
                  <th className="text-right py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <tr key={listing.id} className="border-b hover:bg-gray-50">
                    <td className="py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gray-200 rounded-lg overflow-hidden">
                          {listing.images && listing.images[0] ? (
                            <img 
                              src={listing.images[0]} 
                              alt={listing.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="h-6 w-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{listing.title}</p>
                          <p className="text-gray-500 text-xs">
                            {listing.quantity} {listing.unit} • {listing.location}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <div>
                        <p className="font-medium">{listing.seller_name}</p>
                        <p className="text-gray-500 text-xs">{listing.seller_email}</p>
                      </div>
                    </td>
                    <td className="py-3">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                        {listing.category}
                      </span>
                    </td>
                    <td className="py-3 font-medium">
                      R{listing.price?.toLocaleString() || 'N/A'}
                    </td>
                    <td className="py-3">
                      {getStatusBadge(listing.moderation_status || 'pending')}
                    </td>
                    <td className="py-3 text-gray-500">
                      {new Date(listing.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedListing(listing)}
                          className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        
                        {listing.moderation_status === 'pending' && (
                          <>
                            <button
                              onClick={() => approveListing(listing.id)}
                              disabled={actionLoading[listing.id]}
                              className="p-1 text-green-600 hover:bg-green-50 rounded"
                              title="Approve Listing"
                            >
                              {actionLoading[listing.id] === 'approve' ? (
                                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <CheckCircle className="h-4 w-4" />
                              )}
                            </button>
                            
                            <button
                              onClick={() => {
                                const reason = prompt('Reason for rejection:');
                                if (reason) rejectListing(listing.id, reason);
                              }}
                              disabled={actionLoading[listing.id]}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                              title="Reject Listing"
                            >
                              {actionLoading[listing.id] === 'reject' ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <XCircle className="h-4 w-4" />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {listings.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                No listings found matching your criteria
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Listing Detail Modal */}
      {selectedListing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-bold mb-4">{selectedListing.title}</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <label className="text-gray-600">Seller:</label>
                <p className="font-medium">{selectedListing.seller_name}</p>
              </div>
              
              <div>
                <label className="text-gray-600">Category:</label>
                <p className="font-medium">{selectedListing.category}</p>
              </div>
              
              <div>
                <label className="text-gray-600">Quantity:</label>
                <p className="font-medium">{selectedListing.quantity} {selectedListing.unit}</p>
              </div>
              
              <div>
                <label className="text-gray-600">Price:</label>
                <p className="font-medium">R{selectedListing.price?.toLocaleString()}</p>
              </div>
              
              <div className="col-span-2">
                <label className="text-gray-600">Description:</label>
                <p className="font-medium mt-1">{selectedListing.description}</p>
              </div>
              
              <div className="col-span-2">
                <label className="text-gray-600">Location:</label>
                <p className="font-medium">{selectedListing.location}</p>
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              {selectedListing.moderation_status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      approveListing(selectedListing.id);
                      setSelectedListing(null);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  >
                    Approve
                  </button>
                  
                  <button
                    onClick={() => {
                      const reason = prompt('Reason for rejection:');
                      if (reason) {
                        rejectListing(selectedListing.id, reason);
                        setSelectedListing(null);
                      }
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
              
              <button
                onClick={() => setSelectedListing(null)}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingsModeration;