import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui';
import { Button } from './ui';
import { Input } from './ui';
import { Label } from './ui';
import { X, Mail, ShoppingCart } from 'lucide-react';
import lifecycleEmailService from '../services/lifecycleEmailService';

const EmailCaptureModal = ({ 
  isOpen, 
  onClose, 
  trigger = 'cart_add',
  title = "Save your cart",
  description = "Get notified about price drops and cart reminders"
}) => {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || loading) return;

    setLoading(true);
    
    try {
      const success = await lifecycleEmailService.subscribeToMarketing(
        email, 
        consent, 
        trigger === 'cart_add' ? 'guest_cart' : 'guest_browse'
      );

      if (success) {
        setSubmitted(true);
        
        // Close modal after 2 seconds
        setTimeout(() => {
          onClose();
          setSubmitted(false);
          setEmail('');
          setConsent(true);
        }, 2000);
      } else {
        alert('Failed to save email. Please try again.');
      }
    } catch (error) {
      console.error('Email capture error:', error);
      alert('Failed to save email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {trigger === 'cart_add' ? (
                <ShoppingCart className="h-5 w-5 text-emerald-600" />
              ) : (
                <Mail className="h-5 w-5 text-emerald-600" />
              )}
              <DialogTitle className="text-emerald-900">{title}</DialogTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-gray-600">
            {description}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="h-8 w-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">All set!</h3>
            <p className="text-gray-600">
              We'll keep you updated about your cart and send you the best livestock deals.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="mt-1"
              />
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                id="consent"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <Label htmlFor="consent" className="text-sm text-gray-600 leading-relaxed">
                I agree to receive email updates about my cart, price drops, and livestock deals from StockLot.
                You can unsubscribe at any time.
              </Label>
            </div>

            <div className="flex space-x-3">
              <Button
                type="submit"
                disabled={!email || !consent || loading}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {loading ? 'Saving...' : 'Save My Cart'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="px-6"
              >
                Skip
              </Button>
            </div>

            <p className="text-xs text-gray-500 text-center">
              Protected by our privacy policy. We respect your inbox.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EmailCaptureModal;