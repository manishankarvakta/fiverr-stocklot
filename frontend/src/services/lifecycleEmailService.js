// Frontend service for lifecycle email tracking
import { v4 as uuidv4 } from 'uuid';

class LifecycleEmailService {
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.baseUrl = process.env.REACT_APP_BACKEND_URL || '';
  }

  getOrCreateSessionId() {
    let sessionId = localStorage.getItem('stocklot_session_id');
    if (!sessionId) {
      sessionId = uuidv4();
      localStorage.setItem('stocklot_session_id', sessionId);
    }
    return sessionId;
  }

  async subscribeToMarketing(email, consent = true, source = 'guest_cart') {
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('consent', consent);
      formData.append('source', source);
      formData.append('session_id', this.sessionId);

      const response = await fetch(`${this.baseUrl}/api/marketing/subscribe`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      return response.ok;
    } catch (error) {
      console.error('Error subscribing to marketing:', error);
      return false;
    }
  }

  async trackEvent(eventType, payload = {}) {
    try {
      const formData = new FormData();
      formData.append('session_id', this.sessionId);
      formData.append('event_type', eventType);
      formData.append('payload', JSON.stringify(payload));

      // Add user_id if available
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        formData.append('user_id', user.id);
      }

      const response = await fetch(`${this.baseUrl}/api/track`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      return response.ok;
    } catch (error) {
      console.error('Error tracking event:', error);
      return false;
    }
  }

  async createCartSnapshot(cartData) {
    try {
      const formData = new FormData();
      formData.append('session_id', this.sessionId);
      formData.append('cart_id', cartData.id || uuidv4());
      formData.append('items', JSON.stringify(cartData.items || []));
      formData.append('subtotal_minor', Math.round((cartData.subtotal || 0) * 100));
      formData.append('currency', cartData.currency || 'ZAR');

      // Add user_id if available
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.id) {
        formData.append('user_id', user.id);
      }

      const response = await fetch(`${this.baseUrl}/api/cart/snapshot`, {
        method: 'POST',
        credentials: 'include',
        body: formData
      });

      return response.ok;
    } catch (error) {
      console.error('Error creating cart snapshot:', error);
      return false;
    }
  }

  // Specific event tracking methods
  async trackPDPView(listingId, listingTitle, price) {
    return this.trackEvent('pdp.view', {
      listing_id: listingId,
      listing_title: listingTitle,
      price: price
    });
  }

  async trackAddToCart(listingId, listingTitle, quantity, price) {
    return this.trackEvent('add_to_cart', {
      listing_id: listingId,
      listing_title: listingTitle,
      quantity: quantity,
      price: price
    });
  }

  async trackCartUpdate(cartData) {
    // Track the event and create snapshot
    await this.trackEvent('cart.updated', {
      cart_id: cartData.id,
      item_count: cartData.items?.length || 0,
      subtotal: cartData.subtotal || 0
    });

    // Create cart snapshot for abandonment tracking
    return this.createCartSnapshot(cartData);
  }

  async trackCheckoutStarted(cartData) {
    return this.trackEvent('checkout.started', {
      cart_id: cartData.id,
      subtotal: cartData.subtotal || 0,
      item_count: cartData.items?.length || 0
    });
  }

  async trackOrderCompleted(orderId, orderData) {
    return this.trackEvent('order.completed', {
      order_id: orderId,
      total: orderData.total || 0,
      item_count: orderData.items?.length || 0
    });
  }

  async trackBuyRequestStarted(requestData) {
    return this.trackEvent('buy_request.started', {
      livestock_type: requestData.livestock_type,
      quantity: requestData.quantity,
      budget: requestData.budget
    });
  }

  async trackBuyRequestAbandoned(requestData) {
    return this.trackEvent('buy_request.abandoned', {
      livestock_type: requestData.livestock_type,
      quantity: requestData.quantity,
      step: requestData.currentStep || 'unknown'
    });
  }
}

// Create singleton instance
const lifecycleEmailService = new LifecycleEmailService();

export default lifecycleEmailService;