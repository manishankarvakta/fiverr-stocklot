import React, { useState, useEffect } from 'react';

const ReviewsList = ({ listingId, sellerId }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [sellerId, listingId]);

  const fetchReviews = async () => {
    if (!sellerId) return;
    
    try {
      setLoading(true);
      const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
      const response = await fetch(
        `${backendUrl}/api/reviews?sellerId=${sellerId}&listingId=${listingId || ''}&page=1&limit=5`,
        { credentials: 'include' }
      );

      if (response.ok) {
        const data = await response.json();
        setReviews(data.items || data.reviews || []);
      } else {
        setError('Failed to load reviews');
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
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
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Recent Reviews</h3>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse border rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-4 bg-gray-200 rounded w-20"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-6">
        <p className="text-gray-500">{error}</p>
      </div>
    );
  }

  if (!reviews.length) {
    return (
      <div className="text-center py-6">
        <h3 className="text-lg font-semibold mb-2">Recent Reviews</h3>
        <p className="text-gray-500">No reviews available yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Recent Reviews</h3>
      
      <div className="space-y-4">
        {reviews.map(review => (
          <div key={review.id || review._id} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {renderStars(review.stars || review.rating || 0)}
                <span className="text-sm text-gray-600">
                  {review.stars || review.rating || 0}/5
                </span>
              </div>
              <span className="text-sm text-gray-500">
                {formatDate(review.created_at)}
              </span>
            </div>
            
            <p className="text-gray-700 mb-2">{review.comment || review.text || 'No comment provided'}</p>
            
            {review.images && review.images.length > 0 && (
              <div className="flex space-x-2 mt-3">
                {review.images.slice(0, 4).map((imageUrl, index) => (
                  <img
                    key={index}
                    src={imageUrl}
                    alt={`Review image ${index + 1}`}
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
            
            <div className="text-xs text-gray-500 mt-2">
              By: {review.buyer_handle || review.buyer_name || 'Anonymous Buyer'}
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <button 
          onClick={() => window.open(`/seller/${sellerId}#reviews`, '_blank')}
          className="text-green-600 hover:text-green-700 text-sm font-medium"
        >
          View all reviews →
        </button>
      </div>
    </div>
  );
};

export default ReviewsList;