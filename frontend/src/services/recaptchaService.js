/**
 * Google reCAPTCHA Enterprise Service
 * Handles reCAPTCHA token generation for secure authentication
 */

const RECAPTCHA_SITE_KEY = process.env.REACT_APP_RECAPTCHA_SITE_KEY;

class RecaptchaService {
  constructor() {
    this.siteKey = RECAPTCHA_SITE_KEY;
    this.isReady = false;
    this.initPromise = null;
  }

  /**
   * Initialize reCAPTCHA Enterprise
   */
  async init() {
    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (!this.siteKey) {
        console.warn('reCAPTCHA site key not configured');
        resolve(false);
        return;
      }

      if (typeof window.grecaptcha === 'undefined') {
        console.warn('reCAPTCHA script not loaded');
        resolve(false);
        return;
      }

      window.grecaptcha.enterprise.ready(() => {
        this.isReady = true;
        resolve(true);
      });
    });

    return this.initPromise;
  }

  /**
   * Execute reCAPTCHA for a specific action
   * @param {string} action - The action being performed (e.g., 'LOGIN', 'REGISTER', 'SOCIAL_LOGIN')
   * @returns {Promise<string|null>} - reCAPTCHA token or null if not available
   */
  async executeRecaptcha(action = 'SUBMIT') {
    try {
      const initialized = await this.init();
      
      if (!initialized) {
        console.warn('reCAPTCHA not available');
        return null;
      }

      const token = await window.grecaptcha.enterprise.execute(this.siteKey, {
        action: action
      });

      return token;
    } catch (error) {
      console.error('reCAPTCHA execution failed:', error);
      return null;
    }
  }

  /**
   * Execute reCAPTCHA for login actions
   */
  async executeLogin() {
    return this.executeRecaptcha('LOGIN');
  }

  /**
   * Execute reCAPTCHA for registration actions
   */
  async executeRegister() {
    return this.executeRecaptcha('REGISTER');
  }

  /**
   * Execute reCAPTCHA for social login actions
   */
  async executeSocialLogin() {
    return this.executeRecaptcha('SOCIAL_LOGIN');
  }

  /**
   * Execute reCAPTCHA for form submissions
   */
  async executeSubmit() {
    return this.executeRecaptcha('SUBMIT');
  }

  /**
   * Check if reCAPTCHA is available and ready
   */
  isAvailable() {
    return !!(this.siteKey && typeof window.grecaptcha !== 'undefined');
  }
}

// Create singleton instance
const recaptchaService = new RecaptchaService();

export default recaptchaService;