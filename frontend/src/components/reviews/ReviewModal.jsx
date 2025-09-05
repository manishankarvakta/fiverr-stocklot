// 📝 REVIEW MODAL COMPONENT
// Modal for creating and editing reviews with full validation

import React, { useState, useEffect } from 'react';
import { X, Upload, Trash2 } from 'lucide-react';
import StarInput from './StarInput';

const ReviewModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  orderGroupId,
  direction,
  existingReview = null,
  isLoading = false 
}) => {
  const [formData, setFormData] = useState({
    rating: 0,
    title: '',
    body: '',
    tags: [],
    photos: []
  });
  
  const [errors, setErrors] = useState({});
  const [customTag, setCustomTag] = useState('');
  
  // Common tags for quick selection
  const commonTags = {
    BUYER_ON_SELLER: [
      'Great Communication',
      'Fast Delivery',
      'Quality Animals',
      'Fair Pricing',
      'Professional',
      'Responsive',
      'Reliable',
      'Good Packaging'
    ],
    SELLER_ON_BUYER: [
      'Prompt Payment',
      'Good Communication',
      'Easy to Work With',
      'Reliable',
      'Professional',
      'Quick Pickup',
      'Respectful',
      'Clear Instructions'
    ]
  };
  
  // Initialize form with existing review data
  useEffect(() => {
    if (existingReview) {
      setFormData({
        rating: existingReview.rating || 0,
        title: existingReview.title || '',
        body: existingReview.body || '',
        tags: existingReview.tags || [],
        photos: existingReview.photos || []
      });
    } else {
      setFormData({
        rating: 0,
        title: '',
        body: '',
        tags: [],
        photos: []
      });
    }
    setErrors({});
  }, [existingReview, isOpen]);
  
  const validateForm = () => {
    const newErrors = {};
    
    if (formData.rating === 0) {
      newErrors.rating = 'Please select a rating';
    }
    
    if (!formData.body?.trim()) {
      newErrors.body = 'Please provide a review description';
    } else if (formData.body.length < 10) {
      newErrors.body = 'Review must be at least 10 characters long';
    } else if (formData.body.length > 2000) {
      newErrors.body = 'Review must be less than 2000 characters';
    }
    
    if (formData.title && formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }
    
    if (formData.tags.length > 10) {
      newErrors.tags = 'Maximum 10 tags allowed';
    }
    
    if (formData.photos.length > 6) {
      newErrors.photos = 'Maximum 6 photos allowed';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const reviewData = {
      order_group_id: orderGroupId,
      direction: direction,
      ...formData
    };
    
    try {
      await onSubmit(reviewData);
    } catch (error) {
      console.error('Review submission failed:', error);
      setErrors({ general: 'Failed to submit review. Please try again.' });
    }
  };
  
  const handleTagAdd = (tag) => {
    if (!formData.tags.includes(tag) && formData.tags.length < 10) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };
  
  const handleTagRemove = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };
  
  const handleCustomTagAdd = () => {
    if (customTag.trim() && !formData.tags.includes(customTag.trim()) && formData.tags.length < 10) {
      handleTagAdd(customTag.trim());
      setCustomTag('');
    }
  };
  
  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (formData.photos.length + files.length > 6) {
      setErrors(prev => ({ ...prev, photos: 'Maximum 6 photos allowed' }));
      return;
    }
    
    // In a real app, you'd upload these to your media service
    // For now, we'll simulate with file URLs
    const newPhotos = files.map(file => URL.createObjectURL(file));
    
    setFormData(prev => ({
      ...prev,
      photos: [...prev.photos, ...newPhotos]
    }));
  };
  
  const handlePhotoRemove = (photoToRemove) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter(photo => photo !== photoToRemove)
    }));
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold">
            {existingReview ? 'Edit Review' : 'Write a Review'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {errors.general}
            </div>
          )}
          
          {/* Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rating *
            </label>
            <StarInput
              name="rating"
              value={formData.rating}
              onChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
              required
              size="lg"
            />
            {errors.rating && (
              <p className="mt-1 text-sm text-red-600">{errors.rating}</p>
            )}
          </div>
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Review Title (Optional)
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="Brief headline for your review"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              maxLength={200}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>
          
          {/* Review Body */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Review *
            </label>
            <textarea
              value={formData.body}
              onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
              placeholder={direction === 'BUYER_ON_SELLER' 
                ? "How was the livestock quality, communication, and delivery?"
                : "How reliable was the buyer? Was payment prompt and collection smooth?"
              }
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              maxLength={2000}
            />
            <div className="flex justify-between mt-1">
              {errors.body ? (
                <p className="text-sm text-red-600">{errors.body}</p>
              ) : (
                <p className="text-sm text-gray-500">
                  Minimum 10 characters
                </p>
              )}
              <span className="text-sm text-gray-500">
                {formData.body.length}/2000
              </span>
            </div>
          </div>
          
          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags (Optional)
            </label>
            
            {/* Common Tags */}
            <div className="mb-3">
              <p className="text-xs text-gray-500 mb-2">Quick select:</p>
              <div className="flex flex-wrap gap-2">
                {commonTags[direction]?.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagAdd(tag)}
                    disabled={formData.tags.includes(tag)}
                    className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                      formData.tags.includes(tag)
                        ? 'bg-green-100 border-green-300 text-green-700 cursor-not-allowed'
                        : 'bg-gray-50 border-gray-300 text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Custom Tag Input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                placeholder="Add custom tag"
                className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleCustomTagAdd())}
              />
              <button
                type="button"
                onClick={handleCustomTagAdd}
                disabled={!customTag.trim() || formData.tags.length >= 10}
                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Add
              </button>
            </div>
            
            {/* Selected Tags */}
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 border border-green-300 text-green-700 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleTagRemove(tag)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            
            {errors.tags && (
              <p className="mt-1 text-sm text-red-600">{errors.tags}</p>
            )}
          </div>
          
          {/* Photos (for buyer reviews only) */}
          {direction === 'BUYER_ON_SELLER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Photos (Optional)
              </label>
              
              {/* Upload Button */}
              <div className="mb-3">
                <label className="inline-flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                  <Upload className="w-4 h-4" />
                  <span className="text-sm">Upload Photos</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={formData.photos.length >= 6}
                  />
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Maximum 6 photos, 10MB each
                </p>
              </div>
              
              {/* Photo Preview */}
              {formData.photos.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                  {formData.photos.map((photo, index) => (
                    <div key={index} className="relative">
                      <img
                        src={photo}
                        alt={`Review photo ${index + 1}`}
                        className="w-full h-20 object-cover rounded border"
                      />
                      <button
                        type="button"
                        onClick={() => handlePhotoRemove(photo)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {errors.photos && (
                <p className="mt-1 text-sm text-red-600">{errors.photos}</p>
              )}
            </div>
          )}
          
          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || formData.rating === 0}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Submitting...' : (existingReview ? 'Update Review' : 'Submit Review')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;