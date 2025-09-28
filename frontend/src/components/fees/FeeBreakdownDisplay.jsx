// 💰 FEE BREAKDOWN DISPLAY COMPONENT
// Transparent fee breakdown for checkout and order confirmation

import React, { useState, useEffect } from 'react';
import { Calculator, Info, Eye, EyeOff } from 'lucide-react';

const FeeBreakdownDisplay = ({ 
  amount, 
  species, 
  export: isExport = false, 
  showDetails = true,
  compact = false 
}) => {
  const [breakdown, setBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showFullBreakdown, setShowFullBreakdown] = useState(!compact);

  useEffect(() => {
    if (amount && amount > 0) {
      fetchFeeBreakdown();
    }
  }, [amount, species, isExport]);

  const fetchFeeBreakdown = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        amount: amount.toString(),
        ...(species && { species }),
        export: isExport.toString()
      });

      const response = await fetch(`/api/fees/breakdown?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch fee breakdown');
      }

      const data = await response.json();
      
      if (data.success) {
        setBreakdown(data.breakdown);
      } else {
        throw new Error(data.message || 'Failed to calculate fees');
      }

    } catch (err) {
      console.error('Fee breakdown error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amountMinor) => {
    if (typeof amountMinor !== 'number') return 'R0.00';
    return `R${(amountMinor / 100).toFixed(2)}`;
  };

  const formatPercentage = (rate) => {
    return `${rate.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="animate-pulse flex items-center gap-2">
          <Calculator className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Calculating fees...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-red-700">
          <Info className="w-4 h-4" />
          <span className="text-sm">Error calculating fees: {error}</span>
        </div>
      </div>
    );
  }

  if (!breakdown) {
    return null;
  }

  if (compact && !showFullBreakdown) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Total Fees: {formatCurrency(breakdown.total_buyer_fees_minor)}
            </span>
          </div>
          <button
            onClick={() => setShowFullBreakdown(true)}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <Eye className="w-3 h-3" />
            Details
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-gray-600" />
            <h3 className="text-sm font-medium text-gray-900">Fee Breakdown</h3>
          </div>
          {compact && (
            <button
              onClick={() => setShowFullBreakdown(false)}
              className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700"
            >
              <EyeOff className="w-3 h-3" />
              Hide
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Base Amount */}
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Base Amount</span>
          <span className="text-sm font-medium">
            {formatCurrency(breakdown.base_amount_minor)}
          </span>
        </div>

        {/* Buyer Fees Section */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Buyer Fees
          </div>
          
          {/* Processing Fee */}
          <div className="flex justify-between items-center pl-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Processing Fee</span>
              <span className="text-xs text-gray-400">
                ({formatPercentage(breakdown.processing_fee_rate_pct)})
              </span>
            </div>
            <span className="text-sm">
              {formatCurrency(breakdown.processing_fee_minor)}
            </span>
          </div>

          {/* Escrow Fee */}
          <div className="flex justify-between items-center pl-3">
            <span className="text-sm text-gray-600">Escrow Service Fee</span>
            <span className="text-sm">
              {formatCurrency(breakdown.escrow_fee_minor)}
            </span>
          </div>

          {/* Commission (if BUYER_PAYS_COMMISSION model) */}
          {breakdown.commission_minor > breakdown.total_seller_deductions_minor && (
            <div className="flex justify-between items-center pl-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Platform Commission</span>
                <span className="text-xs text-gray-400">
                  ({formatPercentage(breakdown.commission_rate_pct)})
                </span>
              </div>
              <span className="text-sm">
                {formatCurrency(breakdown.commission_minor - (breakdown.total_seller_deductions_minor - breakdown.payout_fee_minor))}
              </span>
            </div>
          )}
        </div>

        {/* Total Buyer Fees */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-900">Total Buyer Fees</span>
          <span className="text-sm font-medium text-blue-600">
            {formatCurrency(breakdown.total_buyer_fees_minor)}
          </span>
        </div>

        {/* Seller Deductions Section */}
        {showDetails && (
          <div className="space-y-2 pt-2 border-t border-gray-100">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              Seller Deductions
            </div>
            
            {/* Platform Commission (if SELLER_PAYS model) */}
            {breakdown.total_seller_deductions_minor > breakdown.payout_fee_minor && (
              <div className="flex justify-between items-center pl-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Platform Commission</span>
                  <span className="text-xs text-gray-400">
                    ({formatPercentage(breakdown.commission_rate_pct)})
                  </span>
                </div>
                <span className="text-sm text-red-600">
                  -{formatCurrency(breakdown.total_seller_deductions_minor - breakdown.payout_fee_minor)}
                </span>
              </div>
            )}

            {/* Payout Fee */}
            <div className="flex justify-between items-center pl-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Payout Processing Fee</span>
                <span className="text-xs text-gray-400">
                  ({formatPercentage(breakdown.payout_fee_rate_pct)})
                </span>
              </div>
              <span className="text-sm text-red-600">
                -{formatCurrency(breakdown.payout_fee_minor)}
              </span>
            </div>

            {/* Net to Seller */}
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-sm font-medium text-gray-900">Net to Seller</span>
              <span className="text-sm font-medium text-green-600">
                {formatCurrency(breakdown.net_to_seller_minor)}
              </span>
            </div>
          </div>
        )}

        {/* Platform Revenue (Admin/Debug) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="pt-2 border-t border-gray-100">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500">Platform Revenue</span>
              <span className="text-xs text-gray-500">
                {formatCurrency(breakdown.net_to_platform_minor)}
              </span>
            </div>
          </div>
        )}

        {/* Fee Model Info */}
        <div className="bg-blue-50 rounded p-3">
          <div className="flex items-start gap-2">
            <Info className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-blue-800">
              <p className="font-medium mb-1">Fee Model: {
                breakdown.commission_minor > breakdown.total_seller_deductions_minor 
                  ? 'Buyer-Pays Commission' 
                  : 'Seller-Pays'
              }</p>
              <p>
                {breakdown.commission_minor > breakdown.total_seller_deductions_minor
                  ? 'Commission is shown transparently at checkout and paid by the buyer.'
                  : 'Commission is deducted from the seller\'s payout after the transaction.'
                }
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeeBreakdownDisplay;