// 📝 POST-ORDER REVIEW PROMPT
// Prompts users to leave reviews after order completion

import React, { useState, useEffect } from 'react';
import { Star, X, Clock } from 'lucide-react';
import ReviewModal from './ReviewModal';

const PostOrderReviewPrompt = ({ 
  orderGroupId, 
  sellerId, 
  buyerId, 
  currentUser,
  orderStatus,
  deliveredAt,
  onReviewSubmitted 
}) => {
  const [showPrompt, setShowPrompt] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDirection, setReviewDirection] = useState(null);
  const [eligibility, setEligibility] = useState(null);
  const [existingReviews, setExistingReviews] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if review prompts should be shown
  useEffect(() => {
    if (!currentUser || !orderGroupId || !orderStatus) return;
    
    // Only show for completed/delivered orders
    if (!['DELIVERED', 'COMPLETE'].includes(orderStatus)) return;
    
    checkReviewEligibility();
  }, [currentUser, orderGroupId, orderStatus]);
  
  const checkReviewEligibility = async () => {
    try {
      // Check if user has already reviewed
      const reviewsResponse = await fetch(`/api/reviews?order_group_id=${orderGroupId}`, {
        headers: {
          'Authorization': `Bearer ${currentUser?.token || localStorage.getItem('token')}`
        }
      });
      
      if (reviewsResponse.ok) {
        const reviews = await reviewsResponse.json();
        const existing = {};
        
        reviews.forEach(review => {
          existing[review.direction] = review;
        });
        
        setExistingReviews(existing);
        
        // Determine which reviews are still needed
        const userIsBuyer = currentUser.id === buyerId;
        const userIsSeller = currentUser.id === sellerId;
        
        let shouldShow = false;
        
        if (userIsBuyer && !existing['BUYER_ON_SELLER']) {
          shouldShow = true;
        }
        
        if (userIsSeller && !existing['SELLER_ON_BUYER']) {
          shouldShow = true;
        }
        
        // Check review window (90 days)
        if (deliveredAt) {
          const deliveryDate = new Date(deliveredAt);
          const now = new Date();
          const daysSinceDelivery = (now - deliveryDate) / (1000 * 60 * 60 * 24);
          
          if (daysSinceDelivery > 90) {
            shouldShow = false;
          }
        }
        
        setShowPrompt(shouldShow);
      }
    } catch (error) {
      console.error('Error checking review eligibility:', error);
    }
  };
  
  const handleReviewClick = (direction) => {
    setReviewDirection(direction);
    setShowReviewModal(true);
    setShowPrompt(false);
  };
  
  const handleReviewSubmit = async (reviewData) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser?.token || localStorage.getItem('token')}`
        },
        body: JSON.stringify(reviewData)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to submit review');
      }
      
      const result = await response.json();
      
      // Show success message
      if (result.blind_until) {
        alert('Review submitted successfully! It will be visible after the other party reviews or in 7 days.');
      } else {
        alert('Review submitted successfully!');
      }
      
      // Close modal and refresh
      setShowReviewModal(false);
      setReviewDirection(null);
      
      // Callback to parent component
      if (onReviewSubmitted) {
        onReviewSubmitted(result);
      }
      
      // Refresh eligibility
      await checkReviewEligibility();
      
    } catch (error) {
      console.error('Error submitting review:', error);
      alert(error.message || 'Failed to submit review. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!showPrompt) return null;
  
  const userIsBuyer = currentUser.id === buyerId;
  const userIsSeller = currentUser.id === sellerId;
  
  return (
    <>
      {/* Review Prompt Card */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-600" />
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 mb-1">
                How was your experience?
              </h4>
              <p className="text-sm text-gray-600 mb-3">
                Your feedback helps build trust in our marketplace community.
              </p>
              
              <div className="flex gap-2">
                {userIsBuyer && !existingReviews['BUYER_ON_SELLER'] && (
                  <button
                    onClick={() => handleReviewClick('BUYER_ON_SELLER')}
                    className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Review Seller
                  </button>
                )}
                
                {userIsSeller && !existingReviews['SELLER_ON_BUYER'] && (
                  <button
                    onClick={() => handleReviewClick('SELLER_ON_BUYER')}
                    className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Review Buyer
                  </button>
                )}
              </div>
              
              {/* Review Window Warning */}
              {deliveredAt && (
                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500">
                  <Clock className="w-3 h-3" />
                  <span>
                    Review window expires 90 days after delivery
                  </span>
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowPrompt(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Review Modal */}
      {showReviewModal && reviewDirection && (
        <ReviewModal
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false);
            setReviewDirection(null);
          }}
          onSubmit={handleReviewSubmit}
          orderGroupId={orderGroupId}
          direction={reviewDirection}
          isLoading={isLoading}
        />
      )}
    </>
  );
};

export default PostOrderReviewPrompt;