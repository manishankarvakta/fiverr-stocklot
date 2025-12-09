import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ContactSellerButton from './ContactSellerButton';
import { useGetSellerProfileQuery } from '@/store/api/seller.api';

const SellerProfile = () => {
  const { handle } = useParams();
  const navigate = useNavigate();

  const { data, isLoading: loading, error, isError } = useGetSellerProfileQuery(handle);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-ZA', { 
      style: 'currency', 
      currency: 'ZAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <svg
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
    ));
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-ZA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="animate-pulse space-y-8">
          {/* Header skeleton */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-start gap-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
          
          {/* Listings skeleton */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-lg border p-4">
                <div className="aspect-square bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError || error) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Seller Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error?.data?.detail || error?.message || 'Failed to load seller profile.'}
          </p>
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

  return (
    <main className="container mx-auto px-4 py-6 space-y-8">
      {/* Header */}
      <section className="bg-white rounded-lg border p-6">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-100">
              {data.avatar ? (
                <img src={data.avatar} alt={data.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                  {data.name}
                  {data.is_verified && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      Verified Seller
                    </span>
                  )}
                </h1>
                
                <div className="text-gray-600 mt-2">
                  @{data.handle} • {data.province} • {data.years_active}+ years on StockLot
                </div>
                
                <div className="flex items-center mt-3 space-x-4">
                  <div className="flex items-center space-x-1">
                    {renderStars(Math.floor(data.rating || 0))}
                    <span className="text-lg font-semibold text-gray-900 ml-2">
                      {data.rating?.toFixed(1) || '—'}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    {data.review_count} review{data.review_count === 1 ? '' : 's'}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end space-y-3">
                {/* Contact Info */}
                <div className="text-sm text-gray-500 text-right">
                  <div>📞 {data.contact?.phone_masked || 'Hidden'}</div>
                  <div>✉️ {data.contact?.email_masked || 'Hidden'}</div>
                </div>
                
                <ContactSellerButton sellerId={data.id} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About */}
      {data.about && (
        <section className="bg-white rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">About</h2>
          <div className="prose prose-gray max-w-none">
            <p className="whitespace-pre-wrap">{data.about}</p>
          </div>
        </section>
      )}

      {/* Active Listings */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Active Listings</h2>
        {data.active_listings?.length ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.active_listings.map(listing => (
              <button
                key={listing.id}
                onClick={() => navigate(`/listing/${listing.id}`)}
                className="bg-white rounded-lg border p-4 hover:shadow-lg transition-shadow text-left"
              >
                <div className="aspect-square relative rounded-lg overflow-hidden bg-gray-100 mb-3">
                  {listing.media ? (
                    <img 
                      src={listing.media} 
                      alt={listing.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
                
                <h3 className="font-medium text-gray-900 line-clamp-2 mb-2">
                  {listing.title}
                </h3>
                
                <div className="text-lg font-semibold text-green-600 mb-1">
                  {formatPrice(listing.price)} / {listing.unit}
                </div>
                
                <div className="text-sm text-gray-500">
                  {listing.province}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No active listings at the moment.</p>
          </div>
        )}
      </section>

      {/* Reviews */}
      <section className="bg-white rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-6">Recent Reviews</h2>
        {data.recent_reviews?.length ? (
          <div className="space-y-6">
            {data.recent_reviews.map(review => (
              <div key={review.id} className="border border-gray-100 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    {renderStars(review.stars)}
                    <span className="text-sm font-medium">{review.stars}/5</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatDate(review.created_at)}
                  </span>
                </div>
                
                <p className="text-gray-700 mb-3">{review.comment}</p>
                
                {review.images?.length > 0 && (
                  <div className="flex space-x-2 mb-3">
                    {review.images.slice(0, 4).map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`Review ${index + 1}`}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ))}
                    {review.images.length > 4 && (
                      <div className="w-16 h-16 bg-gray-100 rounded border flex items-center justify-center text-xs text-gray-500">
                        +{review.images.length - 4}
                      </div>
                    )}
                  </div>
                )}
                
                <div className="text-xs text-gray-500">
                  By: {review.buyer_handle}
                </div>
              </div>
            ))}
            
            <div className="text-center">
              <button className="text-green-600 hover:text-green-700 font-medium">
                View all reviews →
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-500">No reviews yet.</p>
          </div>
        )}
      </section>
    </main>
  );
};

export default SellerProfile;