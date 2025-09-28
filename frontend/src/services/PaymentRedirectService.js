// Enhanced Payment Redirect Service
class PaymentRedirectService {
  static redirectToPayment(orderData) {
    console.log('🔧 PaymentRedirectService activated');
    console.log('Order Data:', orderData);
    
    // Extract payment URL with multiple fallbacks
    const paymentUrl = this.extractPaymentUrl(orderData);
    
    if (paymentUrl) {
      console.log('✅ Payment URL found:', paymentUrl);
      
      // Method 1: Immediate redirect
      this.immediateRedirect(paymentUrl);
      
      // Method 2: Delayed redirect with notification
      this.delayedRedirectWithNotification(paymentUrl);
      
      // Method 3: Multiple fallback redirects
      this.multipleRedirectFallbacks(paymentUrl);
      
      return true;
    } else {
      console.log('❌ No payment URL found in order data');
      return false;
    }
  }
  
  static extractPaymentUrl(orderData) {
    const possiblePaths = [
      'paystack.authorization_url',
      'authorization_url',
      'redirect_url', 
      'payment_url',
      'data.authorization_url',
      'result.authorization_url'
    ];
    
    for (const path of possiblePaths) {
      const url = this.getNestedValue(orderData, path);
      if (url && this.isValidPaymentUrl(url)) {
        console.log(`Found payment URL at path: ${path}`);
        return url;
      }
    }
    
    return null;
  }
  
  static getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
  
  static isValidPaymentUrl(url) {
    return url && (
      url.includes('paystack.com') || 
      url.includes('checkout') ||
      url.includes('payment') ||
      url.includes('demo-checkout')
    );
  }
  
  static immediateRedirect(paymentUrl) {
    console.log('🚀 Method 1: Immediate redirect');
    setTimeout(() => {
      window.location.href = paymentUrl;
    }, 100);
  }
  
  static delayedRedirectWithNotification(paymentUrl) {
    console.log('🔔 Method 2: Delayed redirect with notification');
    
    // Create notification
    const notification = this.createNotification(
      '🎉 Order successful! Redirecting to payment...',
      3000
    );
    
    setTimeout(() => {
      notification.remove();
      window.location.replace(paymentUrl);
    }, 3000);
  }
  
  static multipleRedirectFallbacks(paymentUrl) {
    console.log('🔄 Method 3: Multiple fallback redirects');
    
    const fallbacks = [
      () => { window.location.assign(paymentUrl); },
      () => { window.open(paymentUrl, '_self'); },
      () => { document.location = paymentUrl; },
      () => { window.location = paymentUrl; }
    ];
    
    fallbacks.forEach((fallback, index) => {
      setTimeout(() => {
        try {
          console.log(`🔄 Fallback ${index + 1} executing`);
          fallback();
        } catch (error) {
          console.log(`❌ Fallback ${index + 1} failed:`, error);
        }
      }, (index + 4) * 1000);
    });
  }
  
  static createNotification(message, duration = 3000) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #059669;
      color: white;
      padding: 15px 25px;
      border-radius: 8px;
      z-index: 9999;
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      font-size: 16px;
      font-weight: 600;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      animation: slideDown 0.3s ease-out;
    `;
    
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    // Auto-remove
    setTimeout(() => {
      if (notification.parentNode) {
        notification.style.animation = 'slideUp 0.3s ease-in forwards';
        setTimeout(() => notification.remove(), 300);
      }
    }, duration);
    
    return notification;
  }
  
  static addStyles() {
    if (!document.getElementById('payment-redirect-styles')) {
      const style = document.createElement('style');
      style.id = 'payment-redirect-styles';
      style.textContent = `
        @keyframes slideDown {
          from { transform: translateX(-50%) translateY(-100%); opacity: 0; }
          to { transform: translateX(-50%) translateY(0); opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateX(-50%) translateY(0); opacity: 1; }
          to { transform: translateX(-50%) translateY(-100%); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }
  }
}

// Initialize styles
PaymentRedirectService.addStyles();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PaymentRedirectService;
}

// Global access
window.PaymentRedirectService = PaymentRedirectService;