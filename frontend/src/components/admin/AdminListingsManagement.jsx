import React, { useState, useEffect } from 'react';
import { 
  Card, CardContent, CardHeader, CardTitle,
  Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
  Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Alert, AlertDescription
} from '@/components/ui';
import { 
  Package, CheckCircle, XCircle, Clock, Eye, Edit, Trash2, Search, Filter,
  Star, MapPin, DollarSign, Calendar, AlertTriangle
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || '/api';

export default function AdminListingsManagement() {
  const [listings, setListings] = useState([]);
  const [selectedListing, setSelectedListing] = useState(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [reviewAction, setReviewAction] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchListings();
  }, []);

  const fetchListings = async () => {
    try {
      const response = await fetch(`${API}/admin/listings`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setListings(data.listings || []);
      }
    } catch (error) {
      console.error('Error fetching listings:', error);
    }
  };

  const handleApproveListing = async (listingId, action, notes = '') => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/admin/listings/${listingId}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          action: action, // 'approve', 'reject', 'request_changes'
          notes: notes 
        })
      });

      if (response.ok) {
        fetchListings();
        setShowReviewDialog(false);
        setSelectedListing(null);
        setReviewAction('');
        setReviewNotes('');
        alert(`Listing ${action}d successfully!`);
      } else {
        throw new Error(`Failed to ${action} listing`);
      }
    } catch (error) {
      console.error(`Error ${action}ing listing:`, error);
      alert(`Failed to ${action} listing`);
    } finally {
      setLoading(false);
    }
  };

  const handleBulkApprove = async () => {
    const pendingListings = filteredListings.filter(listing => 
      listing.moderation_status === 'pending'
    );

    if (pendingListings.length === 0) {
      alert('No pending listings to approve');
      return;
    }

    if (!window.confirm(`Approve ${pendingListings.length} pending listings?`)) {
      return;
    }

    setLoading(true);
    try {
      const promises = pendingListings.map(listing =>
        fetch(`${API}/admin/listings/${listing.id}/review`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ action: 'approve', notes: 'Bulk approved' })
        })
      );

      await Promise.all(promises);
      fetchListings();
      alert(`${pendingListings.length} listings approved successfully!`);
    } catch (error) {
      console.error('Error bulk approving listings:', error);
      alert('Failed to bulk approve listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteListing = async (listingId) => {
    if (window.confirm('Are you sure you want to delete this listing?')) {
      try {
        const response = await fetch(`${API}/admin/listings/${listingId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });

        if (response.ok) {
          fetchListings();
          alert('Listing deleted successfully!');
        } else {
          throw new Error('Failed to delete listing');
        }
      } catch (error) {
        console.error('Error deleting listing:', error);
        alert('Failed to delete listing');
      }
    }
  };

  const openReviewDialog = (listing, action) => {
    setSelectedListing(listing);
    setReviewAction(action);
    setReviewNotes('');
    setShowReviewDialog(true);
  };

  const filteredListings = listings.filter(listing => {
    const matchesSearch = listing.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         listing.seller_info?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || listing.moderation_status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  const pendingCount = listings.filter(l => l.moderation_status === 'pending').length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Listings Management</h1>
          {pendingCount > 0 && (
            <Badge className="bg-yellow-100 text-yellow-800 mt-2">
              {pendingCount} Pending Approval
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {pendingCount > 0 && (
            <Button 
              onClick={handleBulkApprove}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve All Pending ({pendingCount})
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search listings by title or seller..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Listings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Listings ({filteredListings.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Listing</TableHead>
                <TableHead>Seller</TableHead>
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
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                      <div>
                        <div className="font-medium">{listing.title}</div>
                        <div className="text-sm text-gray-500">
                          {listing.species} • {listing.quantity} {listing.unit}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{listing.seller_info?.name || 'Unknown'}</div>
                      <div className="text-sm text-gray-500 flex items-center">
                        <MapPin className="h-3 w-3 mr-1" />
                        {listing.location?.province || 'N/A'}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium">R{listing.unit_price || listing.price_per_unit || 0}</div>
                    <div className="text-sm text-gray-500">per {listing.unit}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(listing.moderation_status)}>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(listing.moderation_status)}
                        {listing.moderation_status || 'pending'}
                      </div>
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {listing.created_at ? new Date(listing.created_at).toLocaleDateString() : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      {listing.moderation_status === 'pending' && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => openReviewDialog(listing, 'approve')}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReviewDialog(listing, 'reject')}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => window.open(`/listing/${listing.id}`, '_blank')}
                        title="View PDP"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteListing(listing.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {reviewAction === 'approve' ? 'Approve Listing' : 'Reject Listing'}
            </DialogTitle>
            <DialogDescription>
              {selectedListing && (
                <div className="mt-2">
                  <strong>{selectedListing.title}</strong>
                  <br />
                  <span className="text-sm text-gray-500">
                    by {selectedListing.seller_info?.name}
                  </span>
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Review Notes</Label>
              <Textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  reviewAction === 'approve' 
                    ? "Optional: Add approval notes..."
                    : "Explain why this listing is being rejected..."
                }
                rows={3}
              />
            </div>

            {reviewAction === 'reject' && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  The seller will be notified about the rejection and your feedback.
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleApproveListing(selectedListing?.id, reviewAction, reviewNotes)}
              disabled={loading}
              className={reviewAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : ''}
            >
              {loading ? 'Processing...' : (reviewAction === 'approve' ? 'Approve' : 'Reject')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}