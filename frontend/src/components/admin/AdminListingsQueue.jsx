import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle, Button, Input, Badge,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Textarea, Alert, AlertDescription
} from '../ui';
import { Package, Search, Filter, Download, Eye, Check, X, AlertTriangle, Clock } from 'lucide-react';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function AdminListingsQueue() {
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedListing, setSelectedListing] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchListings();
  }, [filterStatus]);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/listings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setListings(Array.isArray(data) ? data : data.listings || []);
      } else {
        console.error('Failed to fetch listings');
        setListings([]);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleListingAction = async (listingId, action) => {
    setActionLoading(true);
    try {
      const url = action === 'approve' 
        ? `${API}/admin/listings/${listingId}/approve`
        : `${API}/admin/listings/${listingId}/reject`;
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          reason: action === 'reject' ? rejectionReason : undefined 
        })
      });
      
      if (response.ok) {
        // Update the listing in local state
        setListings(prev => prev.map(listing => 
          listing.id === listingId 
            ? { ...listing, status: action === 'approve' ? 'approved' : 'rejected' }
            : listing
        ));
        setShowDialog(false);
        setRejectionReason('');
      } else {
        console.error(`Failed to ${action} listing`);
      }
    } catch (error) {
      console.error(`Error ${action}ing listing:`, error);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredListings = listings.filter(listing => {
    if (!listing) return false;
    
    const matchesSearch = !searchTerm || 
      listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.species?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      listing.id?.toLowerCase().includes(searchTerm.toLowerCase());
      
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'pending' && (!listing.status || listing.status === 'pending' || listing.status === 'draft')) ||
      listing.status === filterStatus;
      
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'pending':
      case 'draft':
      default:
        return <Badge variant="outline" className="text-amber-600 border-amber-600">Pending Review</Badge>;
    }
  };

  const getPendingCount = () => {
    return listings.filter(l => !l.status || l.status === 'pending' || l.status === 'draft').length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Listings Moderation Queue</h2>
          <p className="text-gray-600">{getPendingCount()} listings awaiting review</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={fetchListings}>
            <Filter className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-amber-600">{getPendingCount()}</div>
            <div className="text-sm text-gray-500">Pending Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {listings.filter(l => l.status === 'approved').length}
            </div>
            <div className="text-sm text-gray-500">Approved</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">
              {listings.filter(l => l.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-500">Rejected</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{listings.length}</div>
            <div className="text-sm text-gray-500">Total Listings</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search listings by title, species, or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending Review</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Listings ({filteredListings.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
              <p className="text-gray-500 mt-2">Loading listings...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No listings found</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'all' 
                  ? 'Try adjusting your search or filter criteria'
                  : 'No listings have been created yet'
                }
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Listing Details</TableHead>
                  <TableHead>Species</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredListings.map((listing) => (
                  <TableRow key={listing.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{listing.title || 'Untitled Listing'}</div>
                        <div className="text-sm text-gray-500">
                          ID: {listing.id?.slice(0, 8)}...
                        </div>
                        {listing.seller_email && (
                          <div className="text-xs text-gray-400">
                            Seller: {listing.seller_email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{listing.species || 'Not specified'}</div>
                      {listing.breed && (
                        <div className="text-sm text-gray-500">{listing.breed}</div>
                      )}
                    </TableCell>
                    <TableCell className="font-medium">
                      {listing.price ? `R${listing.price.toLocaleString()}` : 'Price not set'}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(listing.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {listing.created_at 
                          ? new Date(listing.created_at).toLocaleDateString()
                          : 'Date unknown'
                        }
                      </div>
                      <div className="text-xs text-gray-500">
                        {listing.created_at 
                          ? new Date(listing.created_at).toLocaleTimeString()
                          : ''
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setSelectedListing(listing);
                            setShowDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {(!listing.status || listing.status === 'pending' || listing.status === 'draft') && (
                          <>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => handleListingAction(listing.id, 'approve')}
                              disabled={actionLoading}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                setSelectedListing(listing);
                                setShowDialog(true);
                              }}
                              disabled={actionLoading}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Listing Details Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Listing Review</DialogTitle>
            <DialogDescription>
              Review and moderate livestock listing
            </DialogDescription>
          </DialogHeader>
          {selectedListing && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Title</label>
                  <p className="text-sm text-gray-900">{selectedListing.title || 'Untitled'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Species</label>
                  <p className="text-sm text-gray-900">{selectedListing.species || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Breed</label>
                  <p className="text-sm text-gray-900">{selectedListing.breed || 'Not specified'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Price</label>
                  <p className="text-sm text-gray-900 font-medium">
                    {selectedListing.price ? `R${selectedListing.price.toLocaleString()}` : 'Not set'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <div className="mt-1">
                    {getStatusBadge(selectedListing.status)}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Listed Date</label>
                  <p className="text-sm text-gray-900">
                    {selectedListing.created_at 
                      ? new Date(selectedListing.created_at).toLocaleDateString()
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium text-gray-700">Description</label>
                <p className="text-sm text-gray-900 mt-1 p-3 bg-gray-50 rounded">
                  {selectedListing.description || 'No description provided'}
                </p>
              </div>

              {selectedListing.location && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Location</label>
                  <p className="text-sm text-gray-900">
                    {selectedListing.location.city}, {selectedListing.location.province}
                  </p>
                </div>
              )}

              {(!selectedListing.status || selectedListing.status === 'pending' || selectedListing.status === 'draft') && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Rejection Reason (optional)</label>
                  <Textarea
                    placeholder="Enter reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="mt-1"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Close
            </Button>
            {selectedListing && (!selectedListing.status || selectedListing.status === 'pending' || selectedListing.status === 'draft') && (
              <>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => handleListingAction(selectedListing.id, 'approve')}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  Approve Listing
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => handleListingAction(selectedListing.id, 'reject')}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  ) : (
                    <X className="h-4 w-4 mr-2" />
                  )}
                  Reject Listing
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}