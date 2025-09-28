// src/services/api.js - Comprehensive API service layer
import { apiCall, authAPI, listingsAPI, cartAPI, orderAPI, checkoutAPI } from '../api/client';

// Authentication Services
export const AuthService = {
  async login(email, password) {
    const response = await authAPI.login({ email, password });
    if (response.access_token) {
      localStorage.setItem('token', response.access_token);
    }
    return response;
  },

  async register(userData) {
    return await authAPI.register(userData);
  },

  async logout() {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('token');
    }
  },

  async getProfile() {
    return await authAPI.getProfile();
  },

  async forgotPassword(email) {
    return await apiCall('/auth/forgot-password', {
      method: 'POST',
      data: { email },
    });
  },

  async resetPassword(token, password) {
    return await apiCall('/auth/reset-password', {
      method: 'POST',
      data: { token, password },
    });
  },

  async updateProfile(profileData) {
    return await apiCall('/user/profile', {
      method: 'PUT',
      data: profileData,
    });
  },
};

// Listing Services
export const ListingService = {
  async getListings(filters = {}) {
    return await listingsAPI.getAll(filters);
  },

  async getListing(id) {
    return await listingsAPI.getById(id);
  },

  async createListing(listingData) {
    return await listingsAPI.create(listingData);
  },

  async updateListing(id, listingData) {
    return await listingsAPI.update(id, listingData);
  },

  async deleteListing(id) {
    return await listingsAPI.delete(id);
  },

  async getMyListings() {
    return await apiCall('/seller/listings');
  },

  async getListingPerformance(listingId) {
    return await apiCall(`/listings/${listingId}/performance`);
  },

  async enhanceListing(listingId, enhancementData) {
    return await apiCall(`/listings/${listingId}/enhance`, {
      method: 'POST',
      data: enhancementData,
    });
  },
};

// Cart Services
export const CartService = {
  async getCart() {
    return await cartAPI.get();
  },

  async addToCart(listingId, quantity = 1) {
    return await cartAPI.add({
      listing_id: listingId,
      quantity,
    });
  },

  async updateCartItem(itemId, quantity) {
    return await cartAPI.update({
      item_id: itemId,
      quantity,
    });
  },

  async removeFromCart(itemId) {
    return await cartAPI.remove(itemId);
  },

  async clearCart() {
    return await apiCall('/cart/clear', {
      method: 'DELETE',
    });
  },
};

// Order Services
export const OrderService = {
  async getOrders() {
    return await orderAPI.getAll();
  },

  async getOrder(orderId) {
    return await orderAPI.getById(orderId);
  },

  async updateOrderStatus(orderId, status) {
    return await orderAPI.updateStatus(orderId, status);
  },

  async cancelOrder(orderId) {
    return await apiCall(`/orders/${orderId}/cancel`, {
      method: 'POST',
    });
  },

  async getOrderTracking(orderId) {
    return await apiCall(`/orders/${orderId}/tracking`);
  },
};

// Checkout Services
export const CheckoutService = {
  async getGuestQuote(cartData) {
    return await checkoutAPI.guestQuote(cartData);
  },

  async createGuestOrder(orderData) {
    return await checkoutAPI.guestCreate(orderData);
  },

  async createOrder(orderData) {
    return await checkoutAPI.create(orderData);
  },

  async getFeeBreakdown(items) {
    return await apiCall('/fees/breakdown', {
      method: 'POST',
      data: { items },
    });
  },
};

// Search Services
export const SearchService = {
  async searchListings(query, filters = {}) {
    return await apiCall('/search/listings', {
      params: { q: query, ...filters },
    });
  },

  async getSearchSuggestions(query) {
    return await apiCall('/search/suggestions', {
      params: { q: query },
    });
  },

  async getTrendingSearches() {
    return await apiCall('/search/trending');
  },
};

// Messaging Services
export const MessagingService = {
  async getThreads() {
    return await apiCall('/inbox/threads');
  },

  async getMessages(threadId) {
    return await apiCall(`/inbox/threads/${threadId}/messages`);
  },

  async sendMessage(threadId, content) {
    return await apiCall(`/inbox/threads/${threadId}/messages`, {
      method: 'POST',
      data: { content },
    });
  },

  async markThreadAsRead(threadId) {
    return await apiCall(`/inbox/threads/${threadId}/read`, {
      method: 'PUT',
    });
  },
};

// Notification Services
export const NotificationService = {
  async getNotifications(limit = 20) {
    return await apiCall('/notifications', {
      params: { limit },
    });
  },

  async markAsRead(notificationIds) {
    return await apiCall('/notifications/mark-read', {
      method: 'POST',
      data: { notification_ids: notificationIds },
    });
  },

  async markAllAsRead() {
    return await apiCall('/notifications/mark-all-read', {
      method: 'POST',
    });
  },

  async updatePreferences(preferences) {
    return await apiCall('/notifications/preferences', {
      method: 'PUT',
      data: preferences,
    });
  },
};

// Buy Request Services
export const BuyRequestService = {
  async getBuyRequests(filters = {}) {
    return await apiCall('/buy-requests', {
      params: filters,
    });
  },

  async createBuyRequest(requestData) {
    return await apiCall('/buy-requests', {
      method: 'POST',
      data: requestData,
    });
  },

  async updateBuyRequest(requestId, requestData) {
    return await apiCall(`/buy-requests/${requestId}`, {
      method: 'PUT',
      data: requestData,
    });
  },

  async deleteBuyRequest(requestId) {
    return await apiCall(`/buy-requests/${requestId}`, {
      method: 'DELETE',
    });
  },

  async sendOffer(requestId, offerData) {
    return await apiCall(`/buy-requests/${requestId}/offers`, {
      method: 'POST',
      data: offerData,
    });
  },

  async getOffers(requestId) {
    return await apiCall(`/buy-requests/${requestId}/offers`);
  },

  async acceptOffer(offerId) {
    return await apiCall(`/offers/${offerId}/accept`, {
      method: 'PUT',
    });
  },

  async declineOffer(offerId) {
    return await apiCall(`/offers/${offerId}/decline`, {
      method: 'PUT',
    });
  },
};

// Analytics Services
export const AnalyticsService = {
  async getSellerAnalytics(period = '30days') {
    return await apiCall('/seller/analytics', {
      params: { period },
    });
  },

  async getBuyerAnalytics(period = '30days') {
    return await apiCall('/buyer/analytics', {
      params: { period },
    });
  },

  async getListingAnalytics(listingId) {
    return await apiCall(`/listings/${listingId}/analytics`);
  },

  async getPlatformAnalytics() {
    return await apiCall('/admin/analytics/overview');
  },
};

// Upload Services
export const UploadService = {
  async uploadListingImage(file, listingId) {
    const formData = new FormData();
    formData.append('file', file);
    if (listingId) formData.append('listing_id', listingId);

    return await apiCall('/upload/livestock-image', {
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async uploadVetCertificate(file, listingId) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('listing_id', listingId);

    return await apiCall('/upload/vet-certificate', {
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async uploadProfilePhoto(file) {
    const formData = new FormData();
    formData.append('file', file);

    return await apiCall('/upload/profile-photo', {
      method: 'POST',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
};

// Taxonomy Services
export const TaxonomyService = {
  async getCategories(mode = 'core') {
    return await apiCall('/taxonomy/categories', {
      params: { mode },
    });
  },

  async getSpecies(categoryGroupId = null) {
    return await apiCall('/species', {
      params: categoryGroupId ? { category_group_id: categoryGroupId } : {},
    });
  },

  async getBreeds(speciesId) {
    return await apiCall(`/species/${speciesId}/breeds`);
  },

  async getProductTypes() {
    return await apiCall('/product-types');
  },
};

// Geographic Services
export const GeographicService = {
  async getProvinces() {
    return await apiCall('/geography/provinces');
  },

  async getCities(province) {
    return await apiCall('/geography/cities', {
      params: { province },
    });
  },

  async getPostalCodes(city) {
    return await apiCall('/geography/postal-codes', {
      params: { city },
    });
  },
};

// Payment Services
export const PaymentService = {
  async initializePayment(paymentData) {
    return await apiCall('/payments/initialize', {
      method: 'POST',
      data: paymentData,
    });
  },

  async verifyPayment(reference) {
    return await apiCall(`/payments/verify/${reference}`);
  },

  async getPaymentStatus(paymentId) {
    return await apiCall(`/payments/${paymentId}/status`);
  },
};

// Wishlist Services
export const WishlistService = {
  async getWishlist() {
    return await apiCall('/buyer/wishlist');
  },

  async addToWishlist(listingId) {
    return await apiCall('/buyer/wishlist/add', {
      method: 'POST',
      data: { listing_id: listingId },
    });
  },

  async removeFromWishlist(listingId) {
    return await apiCall(`/buyer/wishlist/remove/${listingId}`, {
      method: 'DELETE',
    });
  },
};

// Review Services
export const ReviewService = {
  async getReviews(sellerId) {
    return await apiCall(`/seller/${sellerId}/reviews`);
  },

  async createReview(reviewData) {
    return await apiCall('/reviews', {
      method: 'POST',
      data: reviewData,
    });
  },

  async getSellerReviews() {
    return await apiCall('/seller/reviews');
  },

  async replyToReview(reviewId, reply) {
    return await apiCall(`/seller/reviews/${reviewId}/reply`, {
      method: 'POST',
      data: { reply },
    });
  },
};

// Admin Services
export const AdminService = {
  async getUsers(filters = {}) {
    return await apiCall('/admin/users', {
      params: filters,
    });
  },

  async updateUserStatus(userId, status) {
    return await apiCall(`/admin/users/${userId}/status`, {
      method: 'PUT',
      data: { status },
    });
  },

  async getModerationQueue() {
    return await apiCall('/admin/moderation/queue');
  },

  async moderateContent(itemId, action, reason) {
    return await apiCall(`/admin/moderation/${itemId}/${action}`, {
      method: 'PUT',
      data: { reason },
    });
  },

  async getSystemMetrics() {
    return await apiCall('/admin/system/metrics');
  },
};

// Error handler for components
export const handleAPIError = (error, showAlert = true) => {
  console.error('API Error:', error);
  
  const errorMessage = error.message || 'An unexpected error occurred';
  
  if (showAlert) {
    alert(errorMessage);
  }
  
  return errorMessage;
};

export default {
  AuthService,
  ListingService,
  CartService,
  OrderService,
  CheckoutService,
  SearchService,
  MessagingService,
  NotificationService,
  BuyRequestService,
  AnalyticsService,
  UploadService,
  TaxonomyService,
  GeographicService,
  PaymentService,
  WishlistService,
  ReviewService,
  AdminService,
  handleAPIError,
};