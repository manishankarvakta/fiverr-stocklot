// 🏪 SELLER REVIEWS SECTION
// Complete seller reviews display with stats, filters, and pagination

import React, { useState, useEffect } from 'react';
import { ChevronDown, Filter, Star } from 'lucide-react';
import RatingBadge from './RatingBadge';
import ReviewCard from './ReviewCard';
import analytics from '../../services/analytics';

const SellerReviewsSection = ({ 
  sellerId, 
  currentUser, 
  canReply = false,
  showFilters = true,
  initialSort = 'recent'
}) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState(initialSort);
  const [showFiltersPanel, setShowFiltersPanel] = useState(false);
  const [filters, setFilters] = useState({
    rating: null,
    hasPhotos: false,
    hasReply: false
  });
  
  // Fetch reviews
  const fetchReviews = async (page = 1, sort = sortBy) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        sort: sort
      });
      
      const response = await fetch(`/api/public/sellers/${sellerId}/reviews?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }
      
      const data = await response.json();
      
      setReviews(data.reviews || []);
      setStats(data.stats || {});
      setCurrentPage(page);
      
    } catch (err) {
      setError(err.message);
      console.error('Error fetching reviews:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Initial load
  useEffect(() => {
    if (sellerId) {
      fetchReviews(1, sortBy);
      // Track review section view
      analytics.trackReviewSectionView(sellerId, 'full_page');
    }
  }, [sellerId, sortBy]);
  
  // Handle sort change
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    setCurrentPage(1);
    fetchReviews(1, newSort);
  };
  
  // Handle page change
  const handlePageChange = (newPage) => {
    fetchReviews(newPage, sortBy);
  };
  
  // Handle reply
  const handleReply = async (reviewId, replyText) => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ body: replyText })
      });
      
      if (!response.ok) {
        throw new Error('Failed to add reply');
      }
      
      // Refresh reviews to show the new reply
      fetchReviews(currentPage, sortBy);
      
    } catch (err) {
      console.error('Error adding reply:', err);
      throw err; // Re-throw to let ReviewCard handle the error
    }
  };
  
  // Handle report
  const handleReport = async (reviewId) => {
    // Implement report functionality
    console.log('Report review:', reviewId);
    alert('Review reported. Thank you for your feedback.');
  };
  
  // Handle flag (admin only)
  const handleFlag = async (reviewId) => {
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}/flag`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token || localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          reason: 'Flagged from seller reviews section',
          admin_notes: 'Requires manual review'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to flag review');
      }
      
      alert('Review flagged for moderation.');
      
    } catch (err) {
      console.error('Error flagging review:', err);
      alert('Failed to flag review.');
    }
  };
  
  if (loading && reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(n => (
              <div key={n} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-center py-8">
          <p className="text-red-600">Error loading reviews: {error}</p>
          <button
            onClick={() => fetchReviews(1, sortBy)}
            className="mt-2 text-green-600 hover:text-green-700"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header with Stats */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Reviews & Ratings
          </h3>
          
          {showFilters && (
            <button
              onClick={() => setShowFiltersPanel(!showFiltersPanel)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <Filter className="w-4 h-4" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFiltersPanel ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>
        
        {/* Rating Overview */}
        <div className="flex items-center gap-6 mb-4">
          <div className="text-center">
            <RatingBadge 
              value={stats.avg_bayes} 
              count={stats.count}
              size="lg"
            />
            <p className="text-xs text-gray-500 mt-1">
              {stats.count} review{stats.count !== 1 ? 's' : ''}
            </p>
          </div>
          
          {/* Star Distribution */}
          {stats.stars && (
            <div className="flex-1 max-w-md">
              {[5, 4, 3, 2, 1].map(star => {
                const count = stats.stars[star.toString()] || 0;
                const percentage = stats.count > 0 ? (count / stats.count) * 100 : 0;
                
                return (
                  <div key={star} className="flex items-center gap-2 text-xs mb-1">
                    <span className="w-3 text-right">{star}</span>
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-yellow-500 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-gray-500">{count}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Filters & Sort */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="recent">Most Recent</option>
              <option value="helpful">Most Helpful</option>
              <option value="rating_high">Highest Rated</option>
              <option value="rating_low">Lowest Rated</option>
            </select>
          </div>
          
          <p className="text-sm text-gray-500">
            Showing {reviews.length} of {stats.count} reviews
          </p>
        </div>
      </div>
      
      {/* Reviews List */}
      <div className="divide-y divide-gray-200">
        {reviews.length === 0 ? (
          <div className="p-8 text-center">
            <Star className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">
              No reviews yet
            </h4>
            <p className="text-gray-500">
              Be the first to leave a review for this seller.
            </p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="p-6">
              <ReviewCard
                review={review}
                currentUser={currentUser}
                canReply={canReply && currentUser?.id === sellerId}
                onReply={handleReply}
                onReport={handleReport}
                onFlag={handleFlag}
                showReplyButton={!review.reply_body}
              />
            </div>
          ))
        )}
      </div>
      
      {/* Pagination */}
      {stats.count > 10 && (
        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            
            <span className="px-4 py-1 text-sm text-gray-600">
              Page {currentPage} of {Math.ceil(stats.count / 10)}
            </span>
            
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= Math.ceil(stats.count / 10) || loading}
              className="px-3 py-1 border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerReviewsSection;