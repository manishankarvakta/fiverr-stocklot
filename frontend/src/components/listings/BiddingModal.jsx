import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Gavel, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const BiddingModal = ({ listing, isOpen, onClose, onBidPlaced }) => {
  const navigate = useNavigate();
  const [bidAmount, setBidAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePlaceBid = async () => {
    if (!bidAmount || parseFloat(bidAmount) <= 0) {
      alert('Please enter a valid bid amount');
      return;
    }

    setLoading(true);
    try {
      // Navigate to listing PDP where bidding can be handled properly
      onClose();
      navigate(`/listing/${listing?.id}?action=bid&amount=${bidAmount}`);
      
      if (onBidPlaced) {
        onBidPlaced(listing, { type: 'bid', amount: parseFloat(bidAmount) });
      }
    } catch (error) {
      console.error('Error placing bid:', error);
      alert('Failed to place bid. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!listing) return null;

  const minBid = listing.current_bid 
    ? listing.current_bid * 1.05 // 5% increment
    : listing.starting_price || listing.price_per_unit || 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Place a Bid
          </DialogTitle>
          <DialogDescription>
            Enter your bid amount for {listing.title}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="bidAmount">Bid Amount (ZAR)</Label>
            <Input
              id="bidAmount"
              type="number"
              placeholder={`Minimum: R${minBid.toLocaleString()}`}
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              min={minBid}
              step="100"
            />
            <p className="text-xs text-gray-500">
              Minimum bid: R{minBid.toLocaleString()}
            </p>
          </div>

          {listing.auction_end_time && (
            <div className="flex items-center gap-2 text-sm text-orange-600">
              <Clock className="h-4 w-4" />
              <span>Auction ends: {new Date(listing.auction_end_time).toLocaleString()}</span>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button 
              onClick={handlePlaceBid}
              disabled={loading || !bidAmount || parseFloat(bidAmount) < minBid}
            >
              {loading ? 'Placing Bid...' : 'Place Bid'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BiddingModal;

