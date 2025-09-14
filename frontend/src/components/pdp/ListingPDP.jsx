import React, { useState, useMemo, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ImageGallery from './ImageGallery';
import SellerCard from './SellerCard';
import RatingSummary from './RatingSummary';
import Certificates from './Certificates';
import GeofenceBanner from './GeofenceBanner';
import ReviewsList from './ReviewsList';
import RelatedGrid from './RelatedGrid';
import AskQuestionButton from './AskQuestionButton';

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

  useEffect(() => {
    fetchListing();
    fetchABConfig();
  }, [id]);

  useEffect(() => {
    // Track PDP view
    if (data) {
      trackAnalytics('pdp_view', { listing_id: data.id });
      trackABEvents('view');
    }
  }, [data, abConfig]);

  const fetchListing = async (retryCount = 0) => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/listings/${id}/pdp`, {
        credentials: 'include'
      });

      if (response.status === 429) {
        // Rate limited - wait and retry up to 3 times
        if (retryCount < 3) {
          const retryAfter = response.headers.get('retry-after') || 2;
          console.log(`Rate limited, retrying in ${retryAfter} seconds...`);
          setTimeout(() => {
            fetchListing(retryCount + 1);
          }, parseInt(retryAfter) * 1000);
          return;
        } else {
          setError('Too many requests. Please refresh the page in a moment.');
          setLoading(false);
          return;
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const listingData = await response.json();
      setData(listingData);
    } catch (err) {
      console.error('Error fetching listing:', err);
      if (err.message.includes('429')) {
        setError('Server is busy. Please try again in a moment.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchABConfig = async () => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/ab-test/pdp-config/${id}`, {
        credentials: 'include'
      });

      if (response.ok) {
        const config = await response.json();
        setAbConfig(config);
      } else if (response.status === 429) {
        // Rate limited - use default config and don't retry to avoid blocking PDP
        console.warn('A/B config rate limited, using default');
        setAbConfig({ layout: 'default', experiment_tracking: [] });
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (err) {
      console.error('Error fetching A/B config:', err);
      // Always continue with default config - don't let A/B testing break PDP
      setAbConfig({ layout: 'default', experiment_tracking: [] });
    }
  };

  const trackABEvents = async (eventType) => {
    if (!abConfig?.experiment_tracking) return;

    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      
      for (const experiment of abConfig.experiment_tracking) {
        await fetch(`${backendUrl}/api/ab-test/track-event`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            experiment_id: experiment.experiment_id,
            variant: experiment.variant,
            user_identifier: sessionStorage.getItem('user_id') || 'anonymous',
            event_type: eventType,
            metadata: { listing_id: id }
          })
        });
      }
    } catch (err) {
      console.error('A/B tracking failed:', err);
    }
  };

  const trackAnalytics = async (eventType, eventData = {}) => {
    try {
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/analytics/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          event_type: eventType,
          listing_id: data?.id,
          session_id: sessionStorage.getItem('session_id') || Date.now().toString(),
          metadata: eventData
        })
      });
      
      // Don't throw errors for analytics - just log them
      if (!response.ok && response.status !== 429) {
        console.warn(`Analytics tracking failed: ${response.status}`);
      }
    } catch (err) {
      // Silent fail for analytics - don't break PDP
      console.error('Analytics tracking failed:', err);
    }
  };

  const addToCart = async () => {
    try {
      console.log('🛒 Adding to cart:', data.id, 'Quantity:', qty);
      
      // Use the working backend URL
      const backendUrl = window.REACT_APP_BACKEND_URL || 
                        process.env.REACT_APP_BACKEND_URL || 
                        'https://farmstock-hub-1.preview.emergentagent.com';
      
      const response = await fetch(`${backendUrl}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || 'guest'}`
        },
        body: JSON.stringify({
          listing_id: data.id,
          quantity: qty,
          price_per_unit: data.price,
          listing_title: data.title
        })
      });
      
      console.log('🛒 Cart API response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('🛒 Cart API response:', result);
        
        // Show success message
        alert(`✅ Added to Cart!

${data.title}
Quantity: ${qty}
Price: R${data.price} each

Item successfully added to your cart.`);
        
        // Track analytics for successful cart addition
        trackAnalytics('add_to_cart', { quantity: qty, price: data.price });
        trackABEvents('conversion');
        
      } else {
        const errorData = await response.text();
        console.error('🚨 Cart API error:', response.status, errorData);
        
        // Fallback: Show manual cart addition
        alert(`ℹ️ Cart Service Unavailable

${data.title} - R${data.price}
Quantity: ${qty}

Please note this item for manual processing.`);
      }
      
    } catch (error) {
      console.error('🚨 Add to cart error:', error);
      
      // Graceful fallback
      alert(`ℹ️ Network Error

${data.title} - R${data.price}
Quantity: ${qty}

Please try again or contact support.`);
    }
  };

  const buyNow = async () => {
    console.log('🛒 PDP BUY NOW: Using proper checkout flow with fees');
    
    try {
      // Add item to cart first
      const cartItem = {
        listing_id: data.id,
        title: data.title,
        price: data.price,
        qty: qty,
        species: data.species_id,
        product_type: data.product_type_id
      };
      
      // Add to localStorage cart for guest users
      const existingCart = JSON.parse(localStorage.getItem('cart') || '[]');
      const existingItemIndex = existingCart.findIndex(item => item.listing_id === data.id);
      
      if (existingItemIndex >= 0) {
        existingCart[existingItemIndex].qty = qty; // Set exact quantity
      } else {
        existingCart.push(cartItem);
      }
      
      localStorage.setItem('cart', JSON.stringify(existingCart));
      
      console.log('🛒 Item added to cart, redirecting to checkout with fees...');
      
      // Check if user is logged in
      const token = localStorage.getItem('token');
      if (token) {
        // Authenticated user - go to regular checkout
        navigate('/checkout');
      } else {
        // Guest user - go to guest checkout (which includes proper fee calculation)
        navigate('/checkout/guest');
      }
      
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