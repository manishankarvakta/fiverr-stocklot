// 🛒 CHECKOUT FEE PREVIEW COMPONENT
// Real-time fee calculations for multi-seller checkout

import React, { useState, useEffect } from 'react';
import { ShoppingCart, TrendingUp, Users, AlertCircle, Check } from 'lucide-react';

const CheckoutFeePreview = ({ cartItems = [], onFeesCalculated }) => {
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (cartItems.length > 0) {
      calculateCheckoutPreview();
    } else {
      setPreview(null);
      setError(null);
    }
  }, [cartItems]);

  const calculateCheckoutPreview = async () => {
    try {
      setLoading(true);
      setError(null);

      // Format cart items for API
      const formattedCart = cartItems.map(item => ({
        seller_id: item.sellerId || item.seller_id,
        merch_subtotal_minor: Math.round((item.price || 0) * 100), // Convert to minor units
        delivery_minor: Math.round((item.deliveryFee || 0) * 100),
        abattoir_minor: Math.round((item.abattoirFee || 0) * 100),
        species: item.species,
        export: item.export || false
      }));

      const response = await fetch('/api/checkout/preview', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          cart: formattedCart,
          currency: 'ZAR'
        })
      });

      if (!response.ok) {
        throw new Error('Failed to calculate checkout preview');
      }

      const data = await response.json();
      
      if (data.success) {
        setPreview(data.preview);
        
        // Notify parent component
        if (onFeesCalculated) {
          onFeesCalculated(data.preview);
        }
      } else {
        throw new Error(data.message || 'Failed to calculate fees');
      }

    } catch (err) {
      console.error('Checkout preview error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amountMinor) => {
    if (typeof amountMinor !== 'number') return 'R0.00';
    return `R${(amountMinor / 100).toFixed(2)}`;
  };

  const getSellerName = (sellerId) => {
    const cartItem = cartItems.find(item => 
      (item.sellerId || item.seller_id) === sellerId
    );
    return cartItem?.sellerName || `Seller ${sellerId.slice(-4)}`;
  };

  const getFeeModelDisplay = (model) => {
    return model === 'BUYER_PAYS_COMMISSION' ? 'Transparent Pricing' : 'Traditional Pricing';
  };

  const getFeeModelDescription = (model) => {
    return model === 'BUYER_PAYS_COMMISSION' 
      ? 'All fees shown upfront at checkout'
      : 'Platform fees deducted from seller';
  };

  if (cartItems.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <ShoppingCart className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500">Add items to see fee breakdown</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 bg-gray-300 rounded"></div>
            <div className="h-4 bg-gray-300 rounded w-32"></div>
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-gray-300 rounded w-full"></div>
            <div className="h-3 bg-gray-300 rounded w-3/4"></div>
            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center gap-2 text-red-700 mb-2">
          <AlertCircle className="w-5 h-5" />
          <h3 className="font-medium">Fee Calculation Error</h3>
        </div>
        <p className="text-sm text-red-600 mb-3">{error}</p>
        <button
          onClick={calculateCheckoutPreview}
          className="text-sm text-red-700 hover:text-red-900 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  if (!preview) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-5 h-5 text-green-600" />
            <h2 className="text-lg font-semibold text-gray-900">Checkout Summary</h2>
          </div>
          <div className="flex items-center gap-1 text-sm text-green-600">
            <Check className="w-4 h-4" />
            <span>Fees calculated</span>
          </div>
        </div>
      </div>

      {/* Per-Seller Breakdown */}
      <div className="p-6 space-y-6">
        {preview.per_seller && preview.per_seller.length > 1 && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Users className="w-4 h-4" />
              <span>Multi-Seller Order ({preview.per_seller.length} sellers)</span>
            </div>
            
            {preview.per_seller.map((seller, index) => (
              <div key={seller.seller_id} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {getSellerName(seller.seller_id)}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {getFeeModelDisplay(seller.fee_model)}
                    </p>
                  </div>
                  <span className="text-lg font-semibold text-gray-900">
                    {formatCurrency(seller.totals.buyer_total_minor)}
                  </span>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items</span>
                    <span>{formatCurrency(seller.lines.merch_subtotal_minor)}</span>
                  </div>
                  
                  {seller.lines.delivery_minor > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery</span>
                      <span>{formatCurrency(seller.lines.delivery_minor)}</span>
                    </div>
                  )}
                  
                  {seller.lines.abattoir_minor > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Abattoir</span>
                      <span>{formatCurrency(seller.lines.abattoir_minor)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Fee</span>
                    <span>{formatCurrency(seller.lines.buyer_processing_fee_minor)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Escrow Fee</span>
                    <span>{formatCurrency(seller.lines.escrow_service_fee_minor)}</span>
                  </div>
                  
                  {seller.lines.buyer_commission_minor > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Commission</span>
                      <span>{formatCurrency(seller.lines.buyer_commission_minor)}</span>
                    </div>
                  )}
                </div>
                
                {/* Seller Payout Info */}
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Seller receives</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(seller.totals.seller_net_payout_minor)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Single Seller Summary */}
        {preview.per_seller && preview.per_seller.length === 1 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-gray-900">Order Details</h3>
              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                {getFeeModelDisplay(preview.per_seller[0].fee_model)}
              </span>
            </div>
            
            <div className="space-y-3">
              {preview.per_seller.map(seller => (
                <div key={seller.seller_id} className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items</span>
                    <span>{formatCurrency(seller.lines.merch_subtotal_minor)}</span>
                  </div>
                  
                  {seller.lines.delivery_minor > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Delivery</span>
                      <span>{formatCurrency(seller.lines.delivery_minor)}</span>
                    </div>
                  )}
                  
                  {seller.lines.abattoir_minor > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Abattoir Services</span>
                      <span>{formatCurrency(seller.lines.abattoir_minor)}</span>
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Processing Fee</span>
                    <span>{formatCurrency(seller.lines.buyer_processing_fee_minor)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Secure Escrow</span>
                    <span>{formatCurrency(seller.lines.escrow_service_fee_minor)}</span>
                  </div>
                  
                  {seller.lines.buyer_commission_minor > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Platform Commission</span>
                      <span>{formatCurrency(seller.lines.buyer_commission_minor)}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Total Summary */}
        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex justify-between items-center mb-3">
            <span className="text-lg font-semibold text-gray-900">Total Amount</span>
            <span className="text-2xl font-bold text-green-700">
              {formatCurrency(preview.cart_totals.buyer_grand_total_minor)}
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">You pay</span>
              <div className="font-medium text-gray-900">
                {formatCurrency(preview.cart_totals.buyer_grand_total_minor)}
              </div>
            </div>
            <div>
              <span className="text-gray-600">Sellers receive</span>
              <div className="font-medium text-green-600">
                {formatCurrency(preview.cart_totals.seller_total_net_payout_minor)}
              </div>
            </div>
          </div>
        </div>

        {/* Fee Model Information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <h4 className="font-medium text-blue-900 mb-1">
                {getFeeModelDisplay(preview.per_seller[0]?.fee_model || 'SELLER_PAYS')}
              </h4>
              <p className="text-blue-800">
                {getFeeModelDescription(preview.per_seller[0]?.fee_model || 'SELLER_PAYS')}
                {' '}All transactions are secured through our escrow service for your protection.
              </p>
            </div>
          </div>
        </div>

        {/* Platform Revenue (Development Only) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-gray-100 rounded p-3">
            <div className="text-xs text-gray-600">
              <strong>Debug Info:</strong> Platform Revenue: {formatCurrency(preview.cart_totals.platform_revenue_estimate_minor)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutFeePreview;