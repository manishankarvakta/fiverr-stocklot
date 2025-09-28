// 💳 REVIEW CARD COMPONENT
// Individual review display card with reply support

import React, { useState } from 'react';
import { MessageCircle, Flag, ThumbsUp, MoreHorizontal } from 'lucide-react';
import StarInput from './StarInput';

const ReviewCard = ({ 
  review, 
  currentUser, 
  canReply = false, 
  onReply, 
  onReport,
  onFlag,
  showReplyButton = true 
}) => {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  
  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim()) return;
    
    try {
      await onReply(review.id, replyText.trim());
      setReplyText('');
      setShowReplyForm(false);
    } catch (error) {
      console.error('Reply failed:', error);
    }
  };
  
  const formatDate = (dateStr) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  const isOwnReview = currentUser && review.reviewer_id === currentUser.id;
  const canReport = currentUser && !isOwnReview;
  
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {/* Avatar Placeholder */}
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-gray-600">
              {review.reviewer_name?.charAt(0)?.toUpperCase() || '?'}
            </span>
          </div>
          
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-gray-900">
                {review.reviewer_name || 'Anonymous'}
              </span>
              {review.reviewer_verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-800">
                  Verified
                </span>
              )}
              {review.is_verified && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-blue-100 text-blue-800">
                  Verified Purchase
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-3 mt-1">
              <StarInput
                value={review.rating}
                size="sm"
                disabled={true}
                className="pointer-events-none"
              />
              <span className="text-sm text-gray-500">
                {formatDate(review.created_at)}
              </span>
            </div>
          </div>
        </div>
        
        {/* Menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          
          {showMenu && (
            <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              {canReport && (
                <button
                  onClick={() => {
                    onReport?.(review.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  Report Review
                </button>
              )}
              
              {currentUser?.roles?.includes('admin') && (
                <button
                  onClick={() => {
                    onFlag?.(review.id);
                    setShowMenu(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                  <Flag className="w-4 h-4" />
                  Flag for Review
                </button>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* Review Content */}
      <div className="space-y-3">
        {review.title && (
          <h4 className="font-medium text-gray-900">
            {review.title}
          </h4>
        )}
        
        {review.body && (
          <p className="text-gray-700 leading-relaxed">
            {review.body}
          </p>
        )}
        
        {/* Tags */}
        {review.tags && review.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {review.tags.map((tag, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
        
        {/* Photos */}
        {review.photos && review.photos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {review.photos.slice(0, 6).map((photo, index) => (
              <img
                key={index}
                src={photo}
                alt={`Review photo ${index + 1}`}
                className="w-full h-24 object-cover rounded border cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => {
                  // In a real app, you'd open a lightbox/modal here
                  window.open(photo, '_blank');
                }}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Reply Section */}
      {review.reply_body && (
        <div className="bg-gray-50 rounded-lg p-4 ml-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-900">
              Seller Response
            </span>
            <span className="text-xs text-gray-500">
              {formatDate(review.reply_created_at)}
            </span>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">
            {review.reply_body}
          </p>
        </div>
      )}
      
      {/* Reply Form */}
      {showReplyForm && (
        <div className="ml-8 bg-gray-50 rounded-lg p-4">
          <form onSubmit={handleReplySubmit} className="space-y-3">
            <textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              placeholder="Write your response..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
              required
              maxLength={1000}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowReplyForm(false);
                  setReplyText('');
                }}
                className="px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!replyText.trim()}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
              >
                Reply
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <div className="flex items-center gap-4">
          {/* Helpful Button - placeholder for future feature */}
          <button className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ThumbsUp className="w-4 h-4" />
            <span>Helpful</span>
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Reply Button */}
          {canReply && !review.reply_body && showReplyButton && (
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="flex items-center gap-1 text-sm text-green-600 hover:text-green-700"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Reply</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;