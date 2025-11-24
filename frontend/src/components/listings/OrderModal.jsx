import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { useNavigate } from 'react-router-dom';

const OrderModal = ({ listing, isOpen, onClose }) => {
  const navigate = useNavigate();

  const handleCheckout = () => {
    onClose();
    // Navigate to checkout or listing PDP
    navigate(`/listing/${listing?.id}`);
  };

  if (!listing) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Purchase {listing.title}</DialogTitle>
          <DialogDescription>
            You'll be redirected to complete your purchase.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="text-sm text-gray-600">
            <p><strong>Price:</strong> R{listing.price_per_unit?.toLocaleString() || 'N/A'}</p>
            {listing.quantity && (
              <p><strong>Available:</strong> {listing.quantity} {listing.unit || 'head'}</p>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCheckout}>
              Continue to Checkout
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderModal;

