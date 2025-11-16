// 🧪 REVIEWS TEST PAGE
// Dedicated page for testing all review components

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui';

// Import all review components
import RatingBadge from '../components/reviews/RatingBadge';
import StarInput from '../components/reviews/StarInput';
import ReviewModal from '../components/reviews/ReviewModal';
import ReviewCard from '../components/reviews/ReviewCard';
import SellerReviewsSection from '../components/reviews/SellerReviewsSection';
import PostOrderReviewPrompt from '../components/reviews/PostOrderReviewPrompt';

const ReviewsTestPage = () => {
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDirection, setReviewDirection] = useState('BUYER_ON_SELLER');
  const [starRating, setStarRating] = useState(0);

  // Mock data for testing
  const mockUser = {
    id: 'user123',
    full_name: 'John Doe',
    roles: ['buyer', 'seller'],
    token: 'mock-token'
  };

  const mockReview = {
    id: 'review123',
    rating: 4,
    title: 'Great seller, quality livestock!',
    body: 'I purchased 50 Boer goats from this seller and was very impressed with the quality. The animals were healthy, well-cared for, and exactly as described. Communication was excellent throughout the process.',
    tags: ['Great Communication', 'Quality Animals', 'Fast Delivery'],
    photos: [
      'https://via.placeholder.com/200x150/10b981/ffffff?text=Goat+1',
      'https://via.placeholder.com/200x150/10b981/ffffff?text=Goat+2'
    ],
    reviewer_id: 'buyer456',
    reviewer_name: 'Jane Smith',
    reviewer_verified: true,
    is_verified: true,
    created_at: '2024-01-15T10:30:00Z',
    reply_body: 'Thank you for the positive feedback! We take great pride in our livestock quality and customer service.',
    reply_created_at: '2024-01-16T08:15:00Z'
  };

  const handleReviewSubmit = async (reviewData) => {
    console.log('Review submitted:', reviewData);
    alert('Review submitted successfully! (This is a test)');
    setShowReviewModal(false);
  };

  const handleReply = async (reviewId, replyText) => {
    console.log('Reply submitted:', { reviewId, replyText });
    alert('Reply submitted successfully! (This is a test)');
  };

  const handleReport = async (reviewId) => {
    console.log('Review reported:', reviewId);
    alert('Review reported successfully! (This is a test)');
  };

  const handleFlag = async (reviewId) => {
    console.log('Review flagged:', reviewId);
    alert('Review flagged successfully! (This is a test)');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reviews & Ratings System Test Page
          </h1>
          <p className="text-gray-600">
            Testing all review components and their functionality
          </p>
        </div>

        <div className="grid gap-8">
          {/* 1. RatingBadge Component Tests */}
          <Card>
            <CardHeader>
              <CardTitle>1. RatingBadge Component</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Size: xs</p>
                  <RatingBadge value={4.5} count={123} size="xs" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Size: sm</p>
                  <RatingBadge value={3.8} count={45} size="sm" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Size: md</p>
                  <RatingBadge value={4.9} count={789} size="md" />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Size: lg</p>
                  <RatingBadge value={2.3} count={12} size="lg" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">No rating</p>
                  <RatingBadge value={null} count={0} />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Hide count</p>
                  <RatingBadge value={4.2} showCount={false} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 2. StarInput Component Tests */}
          <Card>
            <CardHeader>
              <CardTitle>2. StarInput Component</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Interactive Star Rating</p>
                <StarInput
                  name="test-rating"
                  value={starRating}
                  onChange={setStarRating}
                  size="lg"
                />
                <p className="text-sm text-gray-600 mt-2">
                  Current rating: {starRating} stars
                </p>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium mb-2">Size: sm</p>
                  <StarInput value={3} size="sm" disabled />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Size: md</p>
                  <StarInput value={4} size="md" disabled />
                </div>
                <div>
                  <p className="text-sm font-medium mb-2">Size: lg</p>
                  <StarInput value={5} size="lg" disabled />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. ReviewModal Component Tests */}
          <Card>
            <CardHeader>
              <CardTitle>3. ReviewModal Component</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setReviewDirection('BUYER_ON_SELLER');
                    setShowReviewModal(true);
                  }}
                >
                  Test Buyer Review Modal
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setReviewDirection('SELLER_ON_BUYER');
                    setShowReviewModal(true);
                  }}
                >
                  Test Seller Review Modal
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                Click the buttons above to test the review modal with different directions.
              </p>
            </CardContent>
          </Card>

          {/* 4. ReviewCard Component Tests */}
          <Card>
            <CardHeader>
              <CardTitle>4. ReviewCard Component</CardTitle>
            </CardHeader>
            <CardContent>
              <ReviewCard
                review={mockReview}
                currentUser={mockUser}
                canReply={true}
                onReply={handleReply}
                onReport={handleReport}
                onFlag={handleFlag}
              />
            </CardContent>
          </Card>

          {/* 5. SellerReviewsSection Component Tests */}
          <Card>
            <CardHeader>
              <CardTitle>5. SellerReviewsSection Component</CardTitle>
            </CardHeader>
            <CardContent>
              <SellerReviewsSection
                sellerId="seller123"
                currentUser={mockUser}
                canReply={true}
                showFilters={true}
                initialSort="recent"
              />
            </CardContent>
          </Card>

          {/* 6. PostOrderReviewPrompt Component Tests */}
          <Card>
            <CardHeader>
              <CardTitle>6. PostOrderReviewPrompt Component</CardTitle>
            </CardHeader>
            <CardContent>
              <PostOrderReviewPrompt
                orderGroupId="order123"
                sellerId="seller123"
                buyerId="buyer456"
                currentUser={mockUser}
                orderStatus="DELIVERED"
                deliveredAt="2024-01-10T12:00:00Z"
                onReviewSubmitted={(result) => {
                  console.log('Review submitted from prompt:', result);
                  alert('Review submitted from prompt! (This is a test)');
                }}
              />
            </CardContent>
          </Card>

          {/* Component Integration Status */}
          <Card>
            <CardHeader>
              <CardTitle>Component Integration Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Badge variant="success">✅</Badge>
                  <span className="text-sm">RatingBadge</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">✅</Badge>
                  <span className="text-sm">StarInput</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">✅</Badge>
                  <span className="text-sm">ReviewModal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="success">✅</Badge>
                  <span className="text-sm">ReviewCard</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">⚠️</Badge>
                  <span className="text-sm">SellerReviewsSection</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="warning">⚠️</Badge>
                  <span className="text-sm">PostOrderReviewPrompt</span>
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                ✅ = Component renders without errors<br/>
                ⚠️ = Component may have API dependencies
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Review Modal */}
      {showReviewModal && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmit={handleReviewSubmit}
          orderGroupId="test-order-123"
          direction={reviewDirection}
          isLoading={false}
        />
      )}
    </div>
  );
};

export default ReviewsTestPage;