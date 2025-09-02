import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Loader2 } from 'lucide-react';

const RespondToBuyRequestModal = ({
  requestId,
  species,
  open,
  onOpenChange,
  onSent
}) => {
  const [offerPrice, setOfferPrice] = useState('');
  const [qty, setQty] = useState('');
  const [message, setMessage] = useState('');
  const [attachMode, setAttachMode] = useState('NONE');
  const [listings, setListings] = useState([]);
  const [listingId, setListingId] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && attachMode === 'EXISTING') {
      const fetchListings = async () => {
        try {
          const token = localStorage.getItem('token');
          const url = `${process.env.REACT_APP_BACKEND_URL}/api/seller/listings${
            species ? `?species=${encodeURIComponent(species)}` : ''
          }`;
          
          const res = await fetch(url, {
            headers: {
              ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
          });
          
          const data = await res.json();
          const opts = (data?.items || data || []).map(l => ({
            id: l.id,
            title: l.title,
            price: Number(l.price_per_unit || l.price || 0),
            unit: l.unit || 'head'
          }));
          setListings(opts);
        } catch (error) {
          console.error('Error fetching listings:', error);
        }
      };
      
      fetchListings();
    }
  }, [open, attachMode, species]);

  const isValid = useMemo(() => {
    return offerPrice && qty && 
           (!attachMode || attachMode === 'NONE' || (attachMode === 'EXISTING' && listingId));
  }, [offerPrice, qty, attachMode, listingId]);

  const handleSubmit = async () => {
    if (!isValid) return;
    
    setLoading(true);
    try {
      const payload = {
        offer_price: Number(offerPrice),
        qty: Number(qty),
        message: message || null,
        listing_id: attachMode === 'EXISTING' && listingId ? listingId : null
      };

      const token = localStorage.getItem('token');
      
      const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/api/buy-requests/${requestId}/offers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Failed to send offer');
      }

      // Show success message
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-green-500 text-white p-4 rounded-md z-50';
      toast.textContent = 'Offer sent successfully! The buyer will be notified.';
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);

      if (onSent) {
        onSent();
      }
      
      onOpenChange(false);
      
    } catch (error) {
      const toast = document.createElement('div');
      toast.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-md z-50';
      toast.textContent = error.message;
      document.body.appendChild(toast);
      setTimeout(() => document.body.removeChild(toast), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    setOfferPrice('');
    setQty('');
    setMessage('');
    setAttachMode('NONE');
    setListingId('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Submit an Offer</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Offer Price (per unit) *</Label>
              <Input 
                type="number" 
                placeholder="e.g. 1750" 
                value={offerPrice} 
                onChange={(e) => setOfferPrice(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div>
              <Label>Quantity You Can Supply *</Label>
              <Input 
                type="number" 
                placeholder="e.g. 80" 
                value={qty} 
                onChange={(e) => setQty(e.target.value)}
                min="1"
              />
            </div>
          </div>

          <div>
            <Label>Message (optional)</Label>
            <Textarea 
              rows={3} 
              placeholder="Delivery timing, location constraints, vaccination status…" 
              value={message} 
              onChange={(e) => setMessage(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Attach Existing Listing?</Label>
              <Select value={attachMode} onValueChange={setAttachMode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">No, price only</SelectItem>
                  <SelectItem value="EXISTING">Yes, choose listing</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {attachMode === 'EXISTING' && (
              <div>
                <Label>Select Listing</Label>
                <Select value={listingId} onValueChange={setListingId}>
                  <SelectTrigger>
                    <SelectValue placeholder={listings.length ? 'Pick a listing' : 'No listings found'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {listings.map(l => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.title} — R{l.price.toFixed(2)}/{l.unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid || loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending…
              </>
            ) : (
              'Send Offer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default RespondToBuyRequestModal;