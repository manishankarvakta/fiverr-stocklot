// Push Notification Service for StockLot

class PushNotificationService {
  constructor() {
    this.registration = null;
    this.subscription = null;
    this.isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
  }

  // Initialize push notifications
  async init() {
    if (!this.isSupported) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Register service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      console.log('Service Worker registered:', this.registration);

      // Check for existing subscription
      this.subscription = await this.registration.pushManager.getSubscription();
      
      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  // Request permission and subscribe
  async requestPermission() {
    if (!this.isSupported) return false;

    try {
      const permission = await Notification.requestPermission();
      
      if (permission === 'granted') {
        await this.subscribe();
        return true;
      } else {
        console.log('Push notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  }

  // Subscribe to push notifications
  async subscribe() {
    if (!this.registration) {
      await this.init();
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array(process.env.REACT_APP_VAPID_PUBLIC_KEY || 'BN4GvZjnA7WJ9wT2vY5tO8xN9rL8jK4P3zQ7mD6hS2xB9cA5tN8rL4jK7P3zQ9mD6hS2xB5cA8tN1rL4jK7P3zQ')
      });

      this.subscription = subscription;

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);
      
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  // Send subscription to server
  async sendSubscriptionToServer(subscription) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          subscription,
          userAgent: navigator.userAgent
        })
      });

      if (response.ok) {
        console.log('Push subscription sent to server');
        localStorage.setItem('pushSubscribed', 'true');
      } else {
        console.error('Failed to send subscription to server');
      }
    } catch (error) {
      console.error('Error sending subscription to server:', error);
    }
  }

  // Unsubscribe from push notifications
  async unsubscribe() {
    if (!this.subscription) return false;

    try {
      await this.subscription.unsubscribe();
      
      // Notify server
      const token = localStorage.getItem('token');
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      this.subscription = null;
      localStorage.removeItem('pushSubscribed');
      return true;
    } catch (error) {
      console.error('Error unsubscribing from push notifications:', error);
      return false;
    }
  }

  // Show local notification
  showNotification(title, options = {}) {
    if (!this.isSupported) return;

    const defaultOptions = {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      image: '/icons/notification-image.png',
      vibrate: [200, 100, 200],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: 1
      },
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icons/view-icon.png'
        },
        {
          action: 'close',
          title: 'Close',
          icon: '/icons/close-icon.png'
        }
      ]
    };

    const notificationOptions = { ...defaultOptions, ...options };

    if (this.registration) {
      this.registration.showNotification(title, notificationOptions);
    } else if (Notification.permission === 'granted') {
      new Notification(title, notificationOptions);
    }
  }

  // Predefined notification types
  showOrderNotification(orderData) {
    this.showNotification('🎉 Order Confirmed!', {
      body: `Your order #${orderData.id} has been confirmed and payment secured.`,
      tag: 'order-confirmed',
      data: { type: 'order', orderId: orderData.id },
      actions: [
        { action: 'view-order', title: 'View Order' },
        { action: 'track', title: 'Track' }
      ]
    });
  }

  showBidNotification(listingData, bidAmount) {
    this.showNotification('🔔 New Bid Placed!', {
      body: `Someone bid R${bidAmount} on "${listingData.title}"`,
      tag: 'new-bid',
      data: { type: 'bid', listingId: listingData.id },
      actions: [
        { action: 'view-listing', title: 'View Listing' },
        { action: 'place-bid', title: 'Counter Bid' }
      ]
    });
  }

  showMessageNotification(sender, message) {
    this.showNotification('💬 New Message', {
      body: `${sender}: ${message.substring(0, 100)}${message.length > 100 ? '...' : ''}`,
      tag: 'new-message',
      data: { type: 'message', sender },
      actions: [
        { action: 'reply', title: 'Reply' },
        { action: 'view-chat', title: 'View Chat' }
      ]
    });
  }

  showListingNotification(listingData) {
    this.showNotification('📦 New Listing Alert!', {
      body: `${listingData.title} - R${listingData.price} in ${listingData.province}`,
      tag: 'new-listing',
      data: { type: 'listing', listingId: listingData.id },
      actions: [
        { action: 'view-listing', title: 'View Details' },
        { action: 'save', title: 'Save for Later' }
      ]
    });
  }

  showKYCNotification(status) {
    const statusMessages = {
      'APPROVED': { emoji: '✅', title: 'KYC Approved!', body: 'Your verification has been approved. Full access unlocked!' },
      'REJECTED': { emoji: '❌', title: 'KYC Needs Attention', body: 'Please review and resubmit your verification documents.' },
      'PENDING': { emoji: '⏳', title: 'KYC Under Review', body: 'Your documents are being reviewed. We\'ll notify you soon!' }
    };

    const msg = statusMessages[status] || statusMessages['PENDING'];

    this.showNotification(`${msg.emoji} ${msg.title}`, {
      body: msg.body,
      tag: 'kyc-status',
      data: { type: 'kyc', status },
      actions: [
        { action: 'view-kyc', title: 'View Status' }
      ]
    });
  }

  // Utility function to convert VAPID key
  urlB64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Check if subscribed
  isSubscribed() {
    return !!this.subscription && localStorage.getItem('pushSubscribed') === 'true';
  }

  // Get permission status
  getPermissionStatus() {
    if (!this.isSupported) return 'not-supported';
    return Notification.permission;
  }
}

// Create and export singleton instance
export const pushNotificationService = new PushNotificationService();

// Auto-initialize when imported
pushNotificationService.init();

export default pushNotificationService;