import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageGallery from './ImageGallery';
import SellerCard from './SellerCard';
import RatingSummary from './RatingSummary';
import Certificates from './Certificates';
import GeofenceBanner from './GeofenceBanner';
import ReviewsList from './ReviewsList';
import RelatedGrid from './RelatedGrid';
import AskQuestionButton from './AskQuestionButton';
import GroupBuyWidget from '../features/GroupBuyWidget';
import AuctionWidget from '../features/AuctionWidget';
import TrustScoreDisplay from '../features/TrustScoreDisplay';
import api from '../../api/client'; // Use centralized API client

const ListingPDP = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState(null);
  const [abConfig, setAbConfig] = useState(null);

  const priceFmt = useMemo(() => 
    new Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' }), []
  );

  const fetchListing = useCallback(async (retryCount = 0) => {
    try {
      setLoading(true);
      const response = await api.get(`/listings/${id}/pdp`);
      setData(response.data);
    } catch (err) {
      console.error('Error fetching listing:', err);
      if (err.response?.status === 429 && retryCount < 3) {
        const retryAfter = err.response.headers['retry-after'] || 2;
        console.log(`Rate limited, retrying in ${retryAfter} seconds...`);
        setTimeout(() => {
          fetchListing(retryCount + 1);
        }, parseInt(retryAfter) * 1000);
        return;
      } else if (err.response?.status === 404) {
        setError('Listing not found');
      } else {
        setError('Error loading listing details');
      }
    } finally {
      setLoading(false);
    }
  }, [id]); // Only id as dependency

  const fetchABConfig = useCallback(async () => {
    try {
      const response = await api.get(`/ab-test/pdp-config/${id}`);
      
      if (response.data) {
        setAbConfig(response.data);
      } else {
        // Default config if no A/B test active
        setAbConfig({ layout: 'default', experiment_tracking: [] });
      }
    } catch (err) {
      console.error('Error fetching A/B config:', err);
      // Always continue with default config - don't let A/B testing break PDP
      setAbConfig({ layout: 'default', experiment_tracking: [] });
    }
  }, [id]); // Only id as dependency

  useEffect(() => {
    fetchListing();
    fetchABConfig();
  }, [fetchListing, fetchABConfig]); // Use memoized functions as dependencies

  useEffect(() => {
    // Track PDP view
    if (data) {
      trackAnalytics('pdp_view', { listing_id: data.id });
      trackABEvents('view');
    }
  }, [data, abConfig]);

  const trackAnalytics = useCallback(async (eventType, eventData = {}) => {
    try {
      await api.post('/analytics/track', {
        event_type: eventType,
        listing_id: data?.id,
        user_id: data?.currentUserId || 'anonymous',
        metadata: eventData,
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      console.error('Analytics error:', err);
      // Don't block user experience for analytics failures
    }
  }, [data]);

  const trackABEvents = useCallback(async (eventType) => {
    if (!abConfig?.experiment_tracking) return;
    
    try {
      for (const experiment of abConfig.experiment_tracking) {
        await api.post('/ab-test/track-event', {
          experiment_id: experiment.experiment_id,
          variant: experiment.variant,
          event_type: eventType,
          listing_id: data?.id,
          user_id: data?.currentUserId || 'anonymous',
          timestamp: new Date().toISOString()
        });
      }
    } catch (err) {
      console.error('A/B tracking error:', err);
      // Don't block user experience for tracking failures
    }
  }, [abConfig, data]);

  const addToCart = useCallback(async (qtyParam = qty) => {
    try {
      const response = await api.post('/cart/add', {
        listing_id: data.id,
        quantity: qtyParam,
        price_per_unit: data.price,
        timestamp: new Date().toISOString()
      });
      
      console.log('🛒 Cart API response:', response.data);
      
      // Show success message
      alert(`✅ Added to Cart!
      
${data.title}
Quantity: ${qtyParam}
Unit Price: R${data.price}
Total: R${(data.price * qtyParam).toFixed(2)}`);
      
      // Track analytics for successful cart addition
      trackAnalytics('add_to_cart', { quantity: qtyParam, price: data.price });
      trackABEvents('conversion');
      
    } catch (err) {
      console.error('🚨 Cart API error:', err);
      
      // Fallback: Show manual cart addition
      alert(`ℹ️ Cart Service Unavailable
      
Please contact us to place your order:
📧 info@stocklot.co.za
📞 0800 123 456

${data.title} - Quantity: ${qtyParam}`);
    }
  }, [data, qty, trackAnalytics, trackABEvents]);

  const buyNow = async () => {
    console.log('🛒 PDP BUY NOW: Using proper checkout flow with fees');
    
    try {
      // Create cart item in the format expected by guest checkout
      const cartItem = {
        listing_id: data.id,
        title: data.title,
        price: parseFloat(data.price),
        qty: qty,
        species: data.species || 'livestock',
        product_type: data.product_type || 'animal'
      };
      
      console.log('🛒 Adding item to localStorage cart:', cartItem);
      
      // Add to localStorage cart for guest checkout
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Remove any existing items with the same listing_id
      const filteredCart = existingCart.filter(item => item.listing_id !== data.id);
      
      // Add the new item
      filteredCart.push(cartItem);
      
      localStorage.setItem('cart', JSON.stringify(filteredCart));
      
      console.log('🛒 Updated cart in localStorage:', filteredCart);
      
      // Navigate to guest checkout
      navigate('/checkout/guest');
      
      // Track analytics
      trackAnalytics('buy_now_click', { 
        quantity: qty, 
        price: data.price,
        total_before_fees: data.price * qty
      });
      trackABEvents('conversion');
      
    } catch (error) {
      console.error('🚨 Buy Now error:', error);
      
      // Fallback alert
      alert(`⚠️ Buy Now Error

There was an issue processing your request.

Product: ${data.title}
Quantity: ${qty}

Please try again or add to cart first.`);
    }
  };

  const requestDeliveryQuote = async () => {
    try {
      trackAnalytics('delivery_quote_request', { quantity: qty });
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      await fetch(`${backendUrl}/api/logistics/rfq`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listing_id: data.id, qty })
      });
      alert('Delivery quote request sent to transporters.');
    } catch (err) {
      console.error('Error requesting quote:', err);
      alert('Failed to send quote request');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6">
              <div className="aspect-square bg-gray-200 rounded"></div>
            </div>
            <div className="lg:col-span-6 space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-12 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Listing Not Found</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button 
            onClick={() => navigate('/marketplace')}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to Marketplace
          </button>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const seoTitle = `${data.title} | ${data.species} · ${data.breed} · ${data.location?.province} | StockLot`;

  return (
    <main className="container mx-auto px-4 py-6">
      {/* SEO Meta */}
      <title>{seoTitle}</title>
      
      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-600 mb-4">
        <button 
          onClick={() => navigate('/marketplace')}
          className="hover:underline"
        >
          Marketplace
        </button>
        <span className="mx-2">›</span>
        <button 
          onClick={() => navigate(`/marketplace?species=${encodeURIComponent(data.species)}`)}
          className="hover:underline"
        >
          {data.species}
        </button>
        <span className="mx-2">›</span>
        <span className="text-gray-900">{data.breed}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        {/* Gallery */}
        <div className="lg:col-span-6">
          <ImageGallery media={data.media || []} />
        </div>

        {/* Summary / CTA */}
        <div className="lg:col-span-6 space-y-3 lg:space-y-4">
          <h1 className="text-3xl font-bold text-gray-900">{data.title}</h1>
          
          <div className="text-sm text-gray-600">
            {data.species} • {data.breed} • {data.product_type}
          </div>

          <div className="flex items-end gap-3">
            <div className="text-4xl font-bold text-green-600">
              {priceFmt.format(data.price)}
            </div>
            <div className="text-lg text-gray-600">per {data.unit}</div>
          </div>

          <GeofenceBanner 
            inRange={data.in_range} 
            province={data.location?.province} 
          />

          <div className="flex items-center gap-3 py-2">
            <label className="text-sm font-medium">Quantity:</label>
            <input 
              type="number" 
              min={1} 
              max={data.qty_available} 
              value={qty}
              onChange={(e) => setQty(parseInt(e.target.value) || 1)}
              className="w-20 border border-gray-300 rounded px-3 py-1"
            />
            <div className="text-sm text-gray-600">
              {data.qty_available} available
            </div>
          </div>

          {/* Mobile-optimized action buttons with A/B testing support */}
          <div className={`grid gap-3 pt-4 ${
            abConfig?.cta_placement === 'bottom' 
              ? 'grid-cols-1' 
              : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
          }`}>
            <button 
              onClick={addToCart}
              className={`px-4 sm:px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors ${
                abConfig?.cta_style === 'large' ? 'text-lg py-4' : ''
              }`}
            >
              Add to Cart
            </button>
            <button 
              onClick={buyNow}
              className="px-4 sm:px-6 py-3 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 font-medium transition-colors"
            >
              Buy Now
            </button>
            <button 
              onClick={requestDeliveryQuote}
              className="px-4 sm:px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors sm:col-span-1"
            >
              Request Quote
            </button>
            <div className="sm:col-span-1">
              <AskQuestionButton listingId={data.id} />
            </div>
          </div>

          {/* StockLot Differentiator Features */}
          <div className="mt-6 space-y-4">
            {/* Group Buying Widget */}
            <GroupBuyWidget 
              listingId={data.id}
              sellerId={data.seller_id}
              targetCents={Math.round(data.price * 100)}
              onUpdate={(status) => {
                console.log('Group buy status updated:', status);
                // Could refresh listing data or show notification
              }}
            />
            
            {/* Auction Widget */}
            <AuctionWidget 
              listingId={data.id}
              sellerId={data.seller_id}
              startPrice={data.price}
              currentUserId={data.currentUserId}
              onUpdate={(status) => {
                console.log('Auction status updated:', status);
                // Could refresh listing data or show notification
              }}
            />
          </div>

          {/* Seller */}
          <SellerCard seller={data.seller} listingId={data.id} />

          {/* Key attributes - Mobile optimized */}
          <section className="mt-4 lg:mt-6">
            <h2 className="text-lg lg:text-xl font-semibold mb-3">Key Details</h2>
            <div className="grid grid-cols-1 gap-2 lg:gap-4">
              {Object.entries(data.attributes || {}).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center py-2 border-b border-gray-100 text-sm lg:text-base">
                  <span className="text-gray-600 font-medium">{key}:</span>
                  <span className="text-gray-900 text-right">{String(value)}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Certificates */}
          <Certificates certs={data.certificates} />
        </div>
      </div>

      {/* Description & Reviews - Mobile optimized */}
      <section className="mt-8 lg:mt-12 grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-lg border p-4 lg:p-6 mb-6 lg:mb-8">
            <h2 className="text-xl lg:text-2xl font-semibold mb-3 lg:mb-4">Description</h2>
            <div className="prose prose-gray prose-sm lg:prose-base max-w-none">
              <p className="whitespace-pre-wrap text-sm lg:text-base leading-relaxed">{data.description}</p>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-lg border p-4 lg:p-6">
            <RatingSummary summary={data.reviewSummary} />
            <ReviewsList listingId={data.id} sellerId={data.seller?.id} />
          </div>
        </div>

        {/* Sidebar - Mobile responsive */}
        <aside className="lg:col-span-4 space-y-4 lg:space-y-6">
          <RelatedGrid items={data.similar || []} />
          
          {/* Trust Badge */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold text-green-800">StockLot Escrow</span>
            </div>
            <p className="text-sm text-green-700">
              Your payment is held securely and only released to the seller after you confirm delivery.
            </p>
          </div>
        </aside>
      </section>

      {/* JSON-LD for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: data.title,
            category: `${data.species} > ${data.breed} > ${data.product_type}`,
            image: (data.media || []).filter(m => m.type === 'image').map(m => m.url),
            offers: {
              '@type': 'Offer',
              priceCurrency: 'ZAR',
              price: data.price,
              availability: data.qty_available > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
              url: `https://stocklot.farm/listing/${data.id}`
            },
            aggregateRating: data.reviewSummary?.count ? {
              '@type': 'AggregateRating',
              ratingValue: data.reviewSummary.average,
              reviewCount: data.reviewSummary.count
            } : undefined,
            brand: {
              '@type': 'Organization',
              name: data.seller?.name
            }
          })
        }}
      />
    </main>
  );
};

export default ListingPDP;