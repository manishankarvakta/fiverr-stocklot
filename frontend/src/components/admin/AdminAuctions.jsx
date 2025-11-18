import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../ui';
import { Gavel, Clock, Users, DollarSign } from 'lucide-react';
import api from '../../utils/apiHelper';

const AdminAuctions = () => {
  const [auctions, setAuctions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('RUNNING');

  useEffect(() => {
    loadAuctions();
  }, [statusFilter]);

  const loadAuctions = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/admin/auctions?status=${statusFilter}`);
      setAuctions(response.data.items || []);
    } catch (error) {
      console.error('Error loading auctions:', error);
      setAuctions([]);
    } finally {
      setLoading(false);
    }
  };

  const forceEndAuction = async (auctionId) => {
    try {
      await api.post(`/admin/auctions/${auctionId}/force-end`);
      alert('Auction ended successfully');
      loadAuctions();
    } catch (error) {
      console.error('Error ending auction:', error);
      alert(error.response?.data?.detail || 'Failed to end auction');
    }
  };

  const cancelAuction = async (auctionId) => {
    try {
      await api.post(`/admin/auctions/${auctionId}/cancel`);
      alert('Auction cancelled successfully');
      loadAuctions();
    } catch (error) {
      console.error('Error cancelling auction:', error);
      alert(error.response?.data?.detail || 'Failed to cancel auction');
    }
  };

  const settleAuction = async (auctionId) => {
    try {
      await api.post(`/admin/auctions/${auctionId}/settle`);
      alert('Auction settled successfully');
      loadAuctions();
    } catch (error) {
      console.error('Error settling auction:', error);
      alert(error.response?.data?.detail || 'Failed to settle auction');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING': return 'bg-green-100 text-green-800';
      case 'ENDED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'SCHEDULED': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Gavel className="h-6 w-6" />
          Auction Management
        </h2>
        <select 
          className="border rounded-lg px-3 py-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="RUNNING">Running</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="ENDED">Ended</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {auctions.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Gavel className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <div className="text-gray-500">No {statusFilter.toLowerCase()} auctions found</div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {auctions.map((auction) => (
            <Card key={auction.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {auction.listing_title || `Auction ${auction.id.slice(-8)}`}
                    </CardTitle>
                    <div className="text-sm text-gray-600">
                      Seller: {auction.seller_name} • Listing: {auction.listing_id.slice(-8)}
                    </div>
                  </div>
                  <Badge className={getStatusColor(auction.status)}>
                    {auction.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <div className="font-semibold">Start Price</div>
                    <div className="text-green-600">
                      R{(auction.start_price_cents / 100).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold">Current Price</div>
                    <div className="text-blue-600">
                      R{(auction.current_price_cents / 100).toFixed(2)}
                    </div>
                  </div>
                  <div>
                    <div className="font-semibold">Starts At</div>
                    <div>{new Date(auction.starts_at).toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="font-semibold">Ends At</div>
                    <div>{new Date(auction.ends_at).toLocaleString()}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {auction.status === 'RUNNING' && (
                    <Button
                      onClick={() => forceEndAuction(auction.id)}
                      size="sm"
                      variant="outline"
                      className="hover:bg-orange-50"
                    >
                      <Clock className="h-4 w-4 mr-1" />
                      Force End
                    </Button>
                  )}
                  
                  {(auction.status === 'RUNNING' || auction.status === 'SCHEDULED') && (
                    <Button
                      onClick={() => cancelAuction(auction.id)}
                      size="sm"
                      variant="outline"
                      className="hover:bg-red-50"
                    >
                      Cancel
                    </Button>
                  )}
                  
                  {auction.status === 'ENDED' && (
                    <Button
                      onClick={() => settleAuction(auction.id)}
                      size="sm"
                      variant="outline"
                      className="hover:bg-green-50"
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Settle
                    </Button>
                  )}
                  
                  <Button
                    onClick={() => window.open(`/admin/auctions/${auction.id}`, '_blank')}
                    size="sm"
                    variant="outline"
                  >
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminAuctions;