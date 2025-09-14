import React from 'react';

const FeeBreakdown = ({
  currency = 'ZAR',
  subtotalCents,
  processingFeeCents,  // 1.5% returned by API (buyer_processing_fee_minor)
  escrowFeeCents,      // fixed 2500 from API
  grandTotalCents,
}) => {
  const formatCurrency = (cents, curr = 'ZAR') => {
    return new Intl.NumberFormat('en-ZA', { 
      style: 'currency', 
      currency: curr 
    }).format(cents / 100);
  };

  return (
    <div className="rounded-lg border p-4 space-y-2 bg-white">
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Subtotal</span>
        <span data-testid="subtotal" className="font-medium">
          {formatCurrency(subtotalCents, currency)}
        </span>
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Processing Fee (1.5%)</span>
        <span className="font-medium">
          {formatCurrency(processingFeeCents, currency)}
        </span>
      </div>
      
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Escrow Service Fee</span>
        <span className="font-medium">
          {formatCurrency(escrowFeeCents, currency)}
        </span>
      </div>
      
      <div className="h-px bg-gray-200 my-3" />
      
      <div className="flex justify-between font-semibold text-lg">
        <span>Total</span>
        <span data-testid="grand-total" className="text-green-600">
          {formatCurrency(grandTotalCents, currency)}
        </span>
      </div>
    </div>
  );
};

export default FeeBreakdown;