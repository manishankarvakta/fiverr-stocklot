import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../ui';
import { Gavel, Clock, TrendingUp, Users } from 'lucide-react';
import { IfFlag } from '../../providers/FeatureFlagsProvider';

// import api from '../../api/client';

import api from '../../utils/apiHelper';

const AuctionWidget = ({ auctionId, listingId, sellerId, startPrice, currentUserId, onUpdate }) => {
  const [auction, setAuction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState('');
  const [bidding, setBidding] = useState(false);
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (auctionId) {
      loadAuction();
    } else {
      setLoading(false);
    }
  }, [auctionId]);

  useEffect(() => {
    if (auction && auction.status === 'RUNNING') {
      const timer = setInterval(updateTimeLeft, 1000);
      return () => clearInterval(timer);
    }
  }, [auction]);

  const loadAuction = async () => {
    try {
      const response = await api.get(`/auctions/${auctionId}`);
      setAuction(response.data);
    } catch (error) {
      console.error('Error loading auction:', error);
      setAuction(null);
    } finally {
      setLoading(false);
    }
  };

  const extractErrorMessage = (error) => {
    console.log('Raw auction error:', error);
    
    // Handle different error response formats
    if (error.response?.data) {
      const data = error.response.data;
      
      // Handle Pydantic validation errors (array format)
      if (data.detail && Array.isArray(data.detail)) {
        return data.detail.map(err => err.msg || err.message || 'Validation error').join(', ');
      }
      
      // Handle simple detail string
      if (typeof data.detail === 'string') {
        return data.detail;
      }
      
      // Handle other message formats
      if (data.message) return data.message;
      if (data.error) return data.error;
      
      // Fallback to JSON string
      return JSON.stringify(data);
    }
    
    // Handle network errors
    if (error.message) return error.message;
    
    // Ultimate fallback
    return 'An error occurred';
  };

  const createAuction = async () => {
    try {
      const response = await api.post('/auctions', {
        listing_id: listingId,
        seller_id: sellerId,
        start_price_cents: Math.round(startPrice * 100),
        duration_hours: 48
      });
      setAuction(response.data);
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error creating auction:', error);
      const message = extractErrorMessage(error);
      alert(`Failed to create auction: ${message}`);
    }
  };

  const placeBid = async () => {
    if (!bidAmount || bidding) return;
    
    setBidding(true);
    try {
      await api.post(`/auctions/${auction.id}/bids`, {
        amount_cents: Math.round(parseFloat(bidAmount) * 100)
      });
      
      setBidAmount('');
      await loadAuction();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error('Error placing bid:', error);
      const message = extractErrorMessage(error);
      alert(`Failed to place bid: ${message}`);
    } finally {
      setBidding(false);
    }
  };

  const updateTimeLeft = () => {
    if (!auction || auction.status !== 'RUNNING') return;
    
    const now = new Date();
    const endTime = new Date(auction.ends_at);
    const diff = endTime - now;

    if (diff > 0) {
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setTimeLeft(`${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${seconds}s`);
      }
    } else {
      setTimeLeft('Ended');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING': return 'bg-green-100 text-green-800';
      case 'ENDED': return 'bg-blue-100 text-blue-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <IfFlag flag="ff.auction">
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
      </IfFlag>
    );
  }

  const minBidAmount = auction 
    ? auction.current_price_cents + Math.ceil(auction.current_price_cents * auction.min_increment_bps / 10000)
    : 0;

  return (
    <IfFlag flag="ff.auction">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="flex items-center gap-2">
              <Gavel className="h-5 w-5" />
              Live Auction
            </CardTitle>
            {auction && (
              <Badge className={getStatusColor(auction.status)}>
                {auction.status}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {auction ? (
            <>
              {/* Current Price */}
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">
                  R{(auction.current_price_cents / 100).toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">Current Bid</div>
              </div>

              {/* Reserve Price */}
              {auction.reserve_price_cents && (
                <div className="text-center text-sm">
                  <span className="text-gray-500">Reserve: </span>
                  <span className={auction.current_price_cents >= auction.reserve_price_cents ? 'text-green-600' : 'text-orange-600'}>
                    R{(auction.reserve_price_cents / 100).toFixed(2)}
                    {auction.current_price_cents >= auction.reserve_price_cents ? ' ✓' : ' (Not Met)'}
                  </span>
                </div>
              )}

              {/* Time Left */}
              {auction.status === 'RUNNING' && (
                <div className="flex items-center justify-center gap-2 text-orange-600">
                  <Clock className="h-4 w-4" />
                  <span className="font-semibold">{timeLeft}</span>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 text-sm text-center">
                <div>
                  <div className="font-semibold">{auction.bid_count || 0}</div>
                  <div className="text-gray-500">Total Bids</div>
                </div>
                <div>
                  <div className="font-semibold">
                    {(auction.min_increment_bps / 100).toFixed(1)}%
                  </div>
                  <div className="text-gray-500">Min Increment</div>
                </div>
              </div>

              {/* Bidding Interface */}
              {auction.status === 'RUNNING' && currentUserId !== auction.seller_id && (
                <div className="space-y-2">
                  <div className="text-sm text-gray-600">
                    Minimum bid: R{(minBidAmount / 100).toFixed(2)}
                  </div>
                  <input
                    type="number"
                    placeholder={`Min R${(minBidAmount / 100).toFixed(2)}`}
                    value={bidAmount}
                    onChange={(e) => setBidAmount(e.target.value)}
                    className="w-full p-2 border rounded-lg"
                    min={minBidAmount / 100}
                    step="50"
                  />
                  <Button 
                    onClick={placeBid}
                    disabled={bidding || !bidAmount || parseFloat(bidAmount) * 100 < minBidAmount}
                    className="w-full"
                  >
                    {bidding ? 'Placing Bid...' : 'Place Bid'}
                  </Button>
                </div>
              )}

              {/* Winner Display */}
              {auction.status === 'ENDED' && (
                <div className="text-center">
                  {auction.winner_id ? (
                    <div className="text-green-600 font-semibold bg-green-50 p-3 rounded">
                      🎉 Auction Won!
                    </div>
                  ) : (
                    <div className="text-red-600 bg-red-50 p-3 rounded">
                      Reserve not met - No winner
                    </div>
                  )}
                </div>
              )}

              {/* Recent Bids */}
              {auction.bids && auction.bids.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-semibold">Recent Bids</div>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {auction.bids.slice(0, 3).map((bid, index) => (
                      <div key={bid.id || index} className="flex justify-between text-xs">
                        <span>Bidder {bid.bidder_id.slice(-4)}</span>
                        <span>R{(bid.amount_cents / 100).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center space-y-3">
              <div className="text-gray-600">Convert to auction mode</div>
              <Button onClick={createAuction} variant="outline" className="w-full">
                <Gavel className="h-4 w-4 mr-2" />
                Start Auction
              </Button>
              <div className="text-xs text-gray-500">
                Enable competitive bidding
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </IfFlag>
  );
};

export default AuctionWidget;