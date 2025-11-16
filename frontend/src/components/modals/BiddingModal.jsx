import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { 
  Button, Input, Label, Card, CardContent, Badge,
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle
} from "../ui";
import { 
  TrendingUp, Shield, Eye, ShoppingCart
} from "lucide-react";

function BiddingModal({ listing, isOpen, onClose, onBidPlaced, onViewDetails }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bidAmount, setBidAmount] = useState('');
  const [maxBid, setMaxBid] = useState('');
  const [useAutoBidding, setUseAutoBidding] = useState(false);
  const [bidHistory, setBidHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showBidHistory, setShowBidHistory] = useState(false);

  const currentBid = listing.current_bid || listing.starting_price;
  const minimumBid = currentBid + (currentBid * 0.05); // 5% increment minimum
  const timeRemaining = listing.auction_end_time ? new Date(listing.auction_end_time) - new Date() : 0;

  useEffect(() => {
    if (isOpen && listing.id) {
      fetchBidHistory();
      setBidAmount(Math.ceil(minimumBid).toString());
    }
  }, [isOpen, listing.id, minimumBid]);

  const fetchBidHistory = async () => {
    try {
      // Simulate bid history - in real app this would be an API call
      const mockHistory = [
        { id: 1, bidder: 'Anonymous', amount: listing.starting_price, timestamp: new Date(Date.now() - 3600000) },
        { id: 2, bidder: 'Anonymous', amount: currentBid, timestamp: new Date(Date.now() - 1800000) }
      ];
      setBidHistory(mockHistory);
    } catch (error) {
      console.error('Error fetching bid history:', error);
    }
  };

  const placeBid = async () => {
    if (!user) {
      alert('Please login to place a bid');
      return;
    }

    const bidValue = parseFloat(bidAmount);
    if (bidValue < minimumBid) {
      alert(`Minimum bid is R${minimumBid.toFixed(2)}`);
      return;
    }

    if (listing.reserve_price && bidValue < listing.reserve_price) {
      alert(`Bid must meet reserve price of R${listing.reserve_price}`);
      return;
    }

    setLoading(true);
    try {
      // Simulate API call to place bid
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const newBid = {
        id: Date.now(),
        bidder: user.full_name,
        amount: bidValue,
        timestamp: new Date(),
        auto_bid: useAutoBidding,
        max_bid: useAutoBidding ? parseFloat(maxBid) : null
      };

      setBidHistory(prev => [...prev, newBid]);
      
      // Update listing current bid (in real app, this would come from server)
      listing.current_bid = bidValue;
      listing.total_bids = (listing.total_bids || 0) + 1;

      onBidPlaced(listing, newBid);
      
      // Show success notification
      showNotification('Bid placed successfully!', 'success');
      
      // Reset form
      setBidAmount(Math.ceil(bidValue * 1.05).toString());
      
    } catch (error) {
      console.error('Error placing bid:', error);
      showNotification('Failed to place bid. Please try again.', 'error');
    }
    setLoading(false);
  };

  const handleBuyNow = (listing) => {
    if (!user) {
      // For guest users, add to cart and redirect to guest checkout
      const cartItem = {
        listing_id: listing.id,
        title: listing.title,
        price: listing.price_per_unit,
        qty: 1,
        species: listing.species_id,
        product_type: listing.product_type_id
      };
      
      // Add to cart in localStorage
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = existingCart.findIndex(item => item.listing_id === listing.id);
      
      if (existingItemIndex >= 0) {
        existingCart[existingItemIndex].qty += 1;
      } else {
        existingCart.push(cartItem);
      }
      
      localStorage.setItem('cart', JSON.stringify(existingCart));
      
      // Redirect to guest checkout
      navigate('/checkout/guest'); 
      return;
    }
    
    // For authenticated users, show the listing details
    onViewDetails(listing);
  };

  // Separate function for viewing details (works for both guests and authenticated users)
  const handleViewDetails = (listing) => {
    // Navigate to PDP page for both guests and authenticated users
    navigate(`/listing/${listing.id}`);
  };

  const formatTimeRemaining = (ms) => {
    if (ms <= 0) return 'Auction Ended';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  const showNotification = (message, type) => {
    // This would integrate with your notification system
    alert(message);
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-orange-600" />
            {listing.listing_type === 'hybrid' ? 'Bid or Buy Now' : 'Place Your Bid'}
          </DialogTitle>
          <DialogDescription>
            {listing.title} • {formatTimeRemaining(timeRemaining)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Auction Status */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-orange-700">Current Bid</p>
                  <p className="text-2xl font-bold text-orange-900">R{currentBid}</p>
                </div>
                <div>
                  <p className="text-sm text-orange-700">Minimum Next Bid</p>
                  <p className="text-xl font-semibold text-orange-800">R{Math.ceil(minimumBid)}</p>
                </div>
              </div>
              
              {listing.reserve_price && (
                <div className="mt-3 p-3 bg-yellow-100 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <Shield className="inline h-4 w-4 mr-1" />
                    Reserve Price: R{listing.reserve_price}
                    {currentBid >= listing.reserve_price ? ' (Met)' : ' (Not Met)'}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bidding Form */}
          <div className="space-y-4">
            <div>
              <Label className="text-emerald-800">Your Bid Amount (R)</Label>
              <Input
                type="number"
                step="0.01"
                min={minimumBid}
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
                placeholder={`Minimum: R${Math.ceil(minimumBid)}`}
                className="border-emerald-200 text-lg"
              />
            </div>

            {/* Auto-bidding Option */}
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <input
                    type="checkbox"
                    id="auto-bid"
                    checked={useAutoBidding}
                    onChange={(e) => setUseAutoBidding(e.target.checked)}
                    className="rounded border-blue-300"
                  />
                  <Label htmlFor="auto-bid" className="text-blue-900 font-semibold">
                    Enable Auto-bidding (Proxy Bidding)
                  </Label>
                </div>
                
                {useAutoBidding && (
                  <div>
                    <Label className="text-blue-800">Maximum Bid Amount (R)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min={bidAmount}
                      value={maxBid}
                      onChange={(e) => setMaxBid(e.target.value)}
                      placeholder="Enter your maximum bid"
                      className="border-blue-200 mt-2"
                    />
                    <p className="text-xs text-blue-600 mt-2">
                      We'll automatically bid on your behalf up to this amount when others outbid you.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={placeBid}
              disabled={loading || timeRemaining <= 0}
              className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white"
            >
              {loading ? (
                <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
              ) : (
                <TrendingUp className="h-4 w-4 mr-2" />
              )}
              Place Bid - R{bidAmount}
            </Button>
            
            {listing.listing_type === 'hybrid' && (
              <Button
                onClick={() => handleBuyNow(listing)}
                disabled={loading || timeRemaining <= 0}
                className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                Buy Now - R{listing.buy_now_price}
              </Button>
            )}
          </div>

          {/* Bid History */}
          <div>
            <Button
              variant="outline"
              onClick={() => setShowBidHistory(!showBidHistory)}
              className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50"
            >
              <Eye className="h-4 w-4 mr-2" />
              {showBidHistory ? 'Hide' : 'Show'} Bid History ({bidHistory.length})
            </Button>
            
            {showBidHistory && (
              <Card className="mt-3 border-emerald-200">
                <CardContent className="p-4">
                  <div className="space-y-3 max-h-40 overflow-y-auto">
                    {bidHistory.length > 0 ? (
                      bidHistory.slice().reverse().map((bid, index) => (
                        <div key={bid.id} className="flex justify-between items-center py-2 border-b border-emerald-100 last:border-b-0">
                          <div>
                            <p className="font-semibold text-emerald-900">
                              {bid.bidder === user?.full_name ? 'You' : bid.bidder}
                              {bid.auto_bid && <Badge className="ml-2 text-xs bg-blue-100 text-blue-700">Auto</Badge>}
                            </p>
                            <p className="text-xs text-emerald-600">
                              {new Date(bid.timestamp).toLocaleString()}
                            </p>
                          </div>
                          <p className="font-bold text-emerald-900">R{bid.amount}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-emerald-600 text-center">No bids yet. Be the first!</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default BiddingModal;
