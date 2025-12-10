import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { 
  Star, MessageSquare, User, Calendar, Filter, Search,
  ThumbsUp, ThumbsDown, AlertCircle, TrendingUp, Award
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { useGetReviewsQuery, useReplyToReviewMutation } from '../../store/api/reviews.api';

const CustomerReviews = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Get seller reviews - filter by seller_id from current user
  const sellerId = user?.id;
  const { data: reviewsData, isLoading: loading, error, refetch } = useGetReviewsQuery(
    { seller_id: sellerId },
    { skip: !sellerId }
  );
  c
  
  const [replyToReview] = useReplyToReviewMutation();

  // Extract reviews and calculate stats
  const reviews = reviewsData?.reviews || reviewsData?.items || [];
  
  const stats = useMemo(() => {
    if (reviews.length === 0) {
      return {
        average_rating: 0,
        total_reviews: 0,
        rating_breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        recent_trend: 0
      };
    }
    
    const total = reviews.length;
    const sum = reviews.reduce((acc, r) => acc + (r.rating || r.stars || 0), 0);
    const avg = sum / total;
    
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const rating = r.rating || r.stars || 0;
      if (rating >= 1 && rating <= 5) {
        breakdown[rating]++;
      }
    });
    
    return {
      average_rating: avg,
      total_reviews: total,
      rating_breakdown: breakdown,
      recent_trend: 0 // Calculate if needed
    };
  }, [reviews]);

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'published': return 'bg-green-100 text-green-800 border-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'flagged': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredReviews = reviews.filter(review => {
    const buyerName = review.buyer_name || review.reviewer_name || '';
    const listingTitle = review.listing_title || '';
    const comment = review.comment || '';
    const rating = review.rating || review.stars || 0;
    const status = review.status || review.moderation_status || 'published';
    
    const matchesSearch = buyerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          listingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          comment.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRating = ratingFilter === 'all' || rating === parseInt(ratingFilter);
    const matchesStatus = statusFilter === 'all' || status === statusFilter;
    return matchesSearch && matchesRating && matchesStatus;
  });

  const renderStars = (rating) => {
    return [...Array(5)].map((_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading reviews...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8 text-red-600">
        <h3>Error loading reviews</h3>
        <p className="text-sm">{error?.data?.detail || error?.message || 'Something went wrong.'}</p>
        <Button onClick={() => refetch()} className="mt-4 bg-emerald-600 hover:bg-emerald-700">Retry</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-emerald-900">Customer Reviews</h1>
        <p className="text-emerald-700">Manage and respond to customer feedback</p>
      </div>

      {/* Review Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-2xl font-bold text-emerald-900">{stats.average_rating}</p>
                  <div className="flex">
                    {renderStars(Math.round(stats.average_rating))}
                  </div>
                </div>
              </div>
              <Star className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-emerald-900">{stats.total_reviews}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recent Trend</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold text-green-600">+{stats.recent_trend}%</p>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-2xl font-bold text-emerald-900">
                  {Math.round((reviews.filter(r => r.response).length / reviews.length) * 100) || 0}%
                </p>
              </div>
              <Award className="h-8 w-8 text-emerald-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Rating Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[5, 4, 3, 2, 1].map(rating => (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-16">
                  <span className="text-sm font-medium">{rating}</span>
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                </div>
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{
                      width: `${stats.total_reviews > 0 ? (stats.rating_breakdown[rating] / stats.total_reviews) * 100 : 0}%`
                    }}
                  ></div>
                </div>
                <span className="text-sm text-gray-600 w-8">
                  {stats.rating_breakdown[rating]}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search reviews..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={ratingFilter}
          onChange={(e) => setRatingFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="all">All Ratings</option>
          <option value="5">5 Stars</option>
          <option value="4">4 Stars</option>
          <option value="3">3 Stars</option>
          <option value="2">2 Stars</option>
          <option value="1">1 Star</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 bg-white"
        >
          <option value="all">All Status</option>
          <option value="published">Published</option>
          <option value="pending">Pending</option>
          <option value="flagged">Flagged</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {filteredReviews.map((review) => (
          <Card key={review.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {review.buyer_name || review.reviewer_name || 'Anonymous'}
                    </h4>
                    {review.listing_title && (
                      <p className="text-sm text-gray-600">{review.listing_title}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 mb-1">
                    {renderStars(review.rating || review.stars || 0)}
                    <span className={`text-sm font-medium ml-1 ${getRatingColor(review.rating || review.stars || 0)}`}>
                      {review.rating || review.stars || 0}/5
                    </span>
                  </div>
                  <Badge className={`${getStatusColor(review.status || review.moderation_status || 'published')} border text-xs`}>
                    {review.status || review.moderation_status || 'published'}
                  </Badge>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-gray-800 leading-relaxed">{review.comment}</p>
              </div>

              {(review.response || review.seller_reply) && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-800">Your Response</span>
                  </div>
                  <p className="text-emerald-700 text-sm">{review.response || review.seller_reply}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-4 border-t">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="h-4 w-4" />
                    {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                  {review.helpful_votes && (
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <ThumbsUp className="h-4 w-4" />
                      {review.helpful_votes} helpful
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!(review.response || review.seller_reply) && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1"
                      onClick={async () => {
                        const replyText = prompt('Enter your response:');
                        if (replyText) {
                          try {
                            await replyToReview({
                              reviewId: review.id,
                              reply: replyText
                            }).unwrap();
                            refetch();
                          } catch (error) {
                            console.error('Error replying to review:', error);
                          }
                        }
                      }}
                    >
                      <MessageSquare className="h-3 w-3" />
                      Respond
                    </Button>
                  )}
                  
                  {review.status === 'flagged' && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-1 text-red-600 border-red-200"
                    >
                      <AlertCircle className="h-3 w-3" />
                      Review Flag
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredReviews.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Reviews Found</h3>
            <p className="text-gray-600">
              {reviews.length === 0 
                ? "You haven't received any reviews yet." 
                : "No reviews match your current filters."}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomerReviews;