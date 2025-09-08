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

  const fetchListing = async () => {
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/listings/${id}/pdp`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const listingData = await response.json();
      setData(listingData);
    } catch (err) {
      console.error('Error fetching listing:', err);
      setError(err.message);
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
      }
    } catch (err) {
      console.error('Error fetching A/B config:', err);
      // Continue with default config
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
      await fetch(`${backendUrl}/api/analytics/track`, {
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
    } catch (err) {
      console.error('Analytics tracking failed:', err);
    }
  };

  const addToCart = async () => {
    try {
      trackAnalytics('add_to_cart', { quantity: qty, price: data.price });
      trackABEvents('conversion');
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listing_id: data.id, qty })
      });

      if (response.ok) {
        navigate('/cart');
      } else {
        alert('Please log in to add items to cart');
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart');
    }
  };

  const buyNow = async () => {
    try {
      trackAnalytics('buy_now_click', { quantity: qty, price: data.price });
      
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(`${backendUrl}/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listing_id: data.id, qty })
      });

      if (response.ok) {
        navigate('/checkout');
      } else {
        navigate('/checkout/guest', { 
          state: { listing_id: data.id, qty } 
        });
      }
    } catch (err) {
      console.error('Error buying now:', err);
      navigate('/checkout/guest', { 
        state: { listing_id: data.id, qty } 
      });
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

      {/* Description & Reviews */}
      <section className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <div className="bg-white rounded-lg border p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Description</h2>
            <div className="prose prose-gray max-w-none">
              <p className="whitespace-pre-wrap">{data.description}</p>
            </div>
          </div>

          {/* Reviews */}
          <div className="bg-white rounded-lg border p-6">
            <RatingSummary summary={data.reviewSummary} />
            <ReviewsList listingId={data.id} sellerId={data.seller?.id} />
          </div>
        </div>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-6">
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