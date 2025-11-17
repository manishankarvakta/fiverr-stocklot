import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, Button, Badge } from '../ui';
import { Gavel, Clock, TrendingUp, Users } from 'lucide-react';
import api from '../../api/client';

const AuctionCard = ({ auction, onBid, currentUserId }) => {
  const [bidding, setBidding] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (auction.status === 'RUNNING') {
      const updateTimeLeft = () => {
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

      updateTimeLeft();
      const interval = setInterval(updateTimeLeft, 1000);
      return () => clearInterval(interval);
    }
  }, [auction.ends_at, auction.status]);

  const handleBid = async () => {
    if (!bidAmount || bidding) return;
    
    setBidding(true);
    try {
      await api.post(`/auctions/${auction.id}/bids`, {
        amount_cents: Math.round(parseFloat(bidAmount) * 100)
      });
      
      setBidAmount('');
      if (onBid) onBid();
    } catch (error) {
      console.error('Error bidding:', error);
      alert(error.response?.data?.detail || 'Failed to place bid');
    } finally {
      setBidding(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'RUNNING': return 'green';
      case 'ENDED': return 'blue';
      case 'CANCELLED': return 'red';
      default: return 'gray';
    }
  };

  const minBidAmount = auction.current_price_cents + Math.ceil(auction.current_price_cents * auction.min_increment_bps / 10000);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Live Auction
          </CardTitle>
          <Badge variant={getStatusColor(auction.status)}>
            {auction.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
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
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold">{auction.bid_count || 0}</div>
            <div className="text-gray-500">Total Bids</div>
          </div>
          <div className="text-center">
            <div className="font-semibold">
              {auction.min_increment_bps / 100}%
            </div>
            <div className="text-gray-500">Min Increment</div>
          </div>
        </div>

        {/* Bidding */}
        {auction.status === 'RUNNING' && currentUserId !== auction.seller_id && (
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Minimum bid: R{(minBidAmount / 100).toFixed(2)}
            </div>
            <input
              type="number"
              placeholder={`Minimum R${(minBidAmount / 100).toFixed(2)}`}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              className="w-full p-2 border rounded"
              min={minBidAmount / 100}
              step="50"
            />
            <Button 
              onClick={handleBid}
              disabled={bidding || !bidAmount || parseFloat(bidAmount) * 100 < minBidAmount}
              className="w-full"
            >
              {bidding ? 'Placing Bid...' : 'Place Bid'}
            </Button>
          </div>
        )}

        {/* Winner */}
        {auction.status === 'ENDED' && (
          <div className="text-center">
            {auction.winner_id ? (
              <div className="text-green-600 font-semibold">
                🎉 Auction Won!
              </div>
            ) : (
              <div className="text-red-600">
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
      </CardContent>
    </Card>
  );
};

export default AuctionCard;