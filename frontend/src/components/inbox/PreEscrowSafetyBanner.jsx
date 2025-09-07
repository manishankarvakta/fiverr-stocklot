import React from 'react';
import { Alert, AlertDescription } from '../ui/alert';
import { Shield } from 'lucide-react';

export function PreEscrowSafetyBanner() {
  return (
    <Alert className="border-amber-300 bg-amber-50">
      <Shield className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        For your safety, phone numbers, emails and external links are hidden until payment is secured in escrow.
      </AlertDescription>
    </Alert>
  );
}