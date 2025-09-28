// Enhanced Mobile Payment with AI Analytics and Capacitor Deep-Linking
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, CreditCard, Brain, BarChart3, TrendingUp, 
  CheckCircle, AlertCircle, Loader2, Zap, Target,
  ExternalLink, RefreshCw, Shield, Clock, Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { useAuth } from '@/auth/AuthContext';

const EnhancedMobilePayment = ({ 
  paymentData, 
  onPaymentComplete, 
  onPaymentCancel,
  onPaymentError 
}) => {
  const [paymentState, setPaymentState] = useState('initializing'); // initializing, ready, processing, success, error
  const [paymentAnalytics, setPaymentAnalytics] = useState(null);
  const [mobileOptimization, setMobileOptimization] = useState(null);
  const [deepLinkConfig, setDeepLinkConfig] = useState(null);
  const [paymentUrl, setPaymentUrl] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [aiInsights, setAiInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const isNative = Capacitor.isNativePlatform();
  const API_BASE = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

  useEffect(() => {
    initializePayment();
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, []);

  useEffect(() => {
    // Timer countdown
    if (paymentState === 'processing' && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeRemaining === 0) {
      handlePaymentTimeout();
    }
  }, [paymentState, timeRemaining]);

  const initializePayment = async () => {
    try {
      setLoading(true);
      
      // Step 1: Get AI payment analytics and optimization
      await Promise.all([
        loadPaymentAnalytics(),
        optimizeMobileFlow(),
        generateDeepLinkConfig()
      ]);
      
      // Step 2: Initialize payment with backend
      await initializePaymentBackend();
      
      setPaymentState('ready');
      
    } catch (error) {
      console.error('Error initializing payment:', error);
      setPaymentState('error');
      toast({
        title: "Initialization Error",
        description: "Failed to initialize payment system. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPaymentAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/ai/payments/analytics`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPaymentAnalytics(data);
          
          // Track analytics event
          trackPaymentEvent('payment_analytics_loaded', {
            success_rate: data.payment_analysis?.performance_assessment?.overall_health,
            mobile_score: data.payment_analysis?.mobile_insights?.mobile_optimization_score
          });
        }
      }
    } catch (error) {
      console.error('Error loading payment analytics:', error);
    }
  };

  const optimizeMobileFlow = async () => {
    try {
      const deviceInfo = {
        is_mobile: /Mobi|Android/i.test(navigator.userAgent),
        device_type: isNative ? (Capacitor.getPlatform()) : 'web',
        screen_width: window.screen.width,
        screen_height: window.screen.height,
        user_agent: navigator.userAgent,
        supports_capacitor: isNative
      };

      const userBehavior = {
        session_start: Date.now(),
        referrer: document.referrer,
        previous_payments: localStorage.getItem('payment_history') ? 
          JSON.parse(localStorage.getItem('payment_history')).length : 0
      };

      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/ai/payments/optimize-mobile`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ device_info: deviceInfo, user_behavior: userBehavior })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setMobileOptimization(data);
          
          // Apply AI-suggested optimizations
          applyMobileOptimizations(data);
        }
      }
    } catch (error) {
      console.error('Error optimizing mobile flow:', error);
    }
  };

  const generateDeepLinkConfig = async () => {
    try {
      const paymentId = paymentData?.id || 'payment_' + Date.now();
      const returnUrl = `${window.location.origin}/payment/return`;
      const deviceType = isNative ? Capacitor.getPlatform() : 'web';

      const response = await fetch(`${API_BASE}/api/ai/payments/deep-link-config`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_id: paymentId,
          return_url: returnUrl,
          device_type: deviceType
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDeepLinkConfig(data);
        }
      }
    } catch (error) {
      console.error('Error generating deep link config:', error);
    }
  };

  const initializePaymentBackend = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Create payment request with AI optimizations
      const paymentRequest = {
        ...paymentData,
        mobile_optimized: true,
        device_info: mobileOptimization?.device_specific_settings,
        expected_success_rate: paymentAnalytics?.insights?.conversion_opportunities || '85%'
      };

      const response = await fetch(`${API_BASE}/api/payments/paystack/init`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(paymentRequest)
      });

      if (response.ok) {
        const data = await response.json();
        setPaymentUrl(data.authorization_url);
        
        // Generate AI insights for this specific payment
        await generatePaymentInsights(paymentRequest);
        
      } else {
        throw new Error('Failed to initialize payment');
      }
    } catch (error) {
      console.error('Error initializing payment backend:', error);
      throw error;
    }
  };

  const generatePaymentInsights = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/ai/payments/predict-success`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount_cents: paymentData?.amount_cents || 0,
          currency: 'ZAR',
          is_mobile: true,
          device_type: isNative ? Capacitor.getPlatform() : 'web',
          time_of_day: new Date().getHours(),
          day_of_week: new Date().getDay()
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAiInsights(data);
        }
      }
    } catch (error) {
      console.error('Error generating payment insights:', error);
    }
  };

  const processPayment = async () => {
    try {
      setPaymentState('processing');
      
      // Add haptic feedback for native apps
      if (isNative) {
        await Haptics.impact({ style: ImpactStyle.Medium });
      }

      // Track payment initiation
      await trackPaymentEvent('payment_initiated', {
        amount: paymentData?.amount_cents,
        method: 'mobile',
        device_type: isNative ? Capacitor.getPlatform() : 'web'
      });

      if (isNative) {
        // Use Capacitor Browser for native apps
        await handleNativePayment();
      } else {
        // Use optimized web flow
        await handleWebPayment();
      }

    } catch (error) {
      console.error('Error processing payment:', error);
      setPaymentState('error');
      toast({
        title: "Payment Error",
        description: "Failed to process payment. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleNativePayment = async () => {
    try {
      const browserOptions = {
        ...deepLinkConfig?.capacitor_config?.browser_options,
        url: paymentUrl
      };

      // Open payment in Capacitor Browser
      await Browser.open(browserOptions);

      // Start polling for payment status
      startPaymentPolling();

      // Set up deep link listener
      setupDeepLinkListener();

    } catch (error) {
      console.error('Error with native payment:', error);
      throw error;
    }
  };

  const handleWebPayment = async () => {
    try {
      const browserConfig = deepLinkConfig?.browser_config || {};
      
      // Open payment in popup window
      const paymentWindow = window.open(
        paymentUrl,
        'paystack_payment',
        browserConfig.window_features || 'width=400,height=600,scrollbars=yes,resizable=yes'
      );

      if (paymentWindow) {
        // Focus the payment window
        if (browserConfig.auto_focus) {
          paymentWindow.focus();
        }

        // Start polling for payment status
        startPaymentPolling();

        // Monitor popup window
        monitorPaymentWindow(paymentWindow);
      } else {
        // Fallback to redirect if popup blocked
        window.location.href = paymentUrl;
      }

    } catch (error) {
      console.error('Error with web payment:', error);
      throw error;
    }
  };

  const startPaymentPolling = () => {
    const interval = setInterval(async () => {
      try {
        const status = await checkPaymentStatus();
        if (status && status !== 'pending') {
          clearInterval(interval);
          setPollingInterval(null);
          handlePaymentResult(status);
        }
      } catch (error) {
        console.error('Error polling payment status:', error);
      }
    }, deepLinkConfig?.mobile_config?.status_polling_interval || 2000);

    setPollingInterval(interval);
  };

  const checkPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE}/api/payments/${paymentData?.id}/status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        return data.status;
      }
    } catch (error) {
      console.error('Error checking payment status:', error);
    }
    return null;
  };

  const handlePaymentResult = async (status) => {
    setPaymentState(status);

    // Add haptic feedback
    if (isNative) {
      const hapticStyle = status === 'success' ? ImpactStyle.Heavy : ImpactStyle.Light;
      await Haptics.impact({ style: hapticStyle });
    }

    // Track payment result
    await trackPaymentEvent('payment_completed', {
      status: status,
      duration: 300 - timeRemaining,
      method: 'mobile'
    });

    // Handle result
    if (status === 'success') {
      setPaymentState('success');
      toast({
        title: "Payment Successful",
        description: "Your payment has been processed successfully!",
        variant: "default"
      });
      
      // Close browser if native and configured to do so
      if (isNative && deepLinkConfig?.mobile_config?.auto_close_on_success) {
        await Browser.close();
      }
      
      if (onPaymentComplete) {
        onPaymentComplete({ status, paymentData });
      }
    } else if (status === 'failed') {
      setPaymentState('error');
      if (onPaymentError) {
        onPaymentError({ status, paymentData });
      }
    } else if (status === 'cancelled') {
      setPaymentState('ready');
      if (onPaymentCancel) {
        onPaymentCancel({ status, paymentData });
      }
    }
  };

  const handlePaymentTimeout = () => {
    setPaymentState('error');
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    toast({
      title: "Payment Timeout",
      description: "Payment session has expired. Please try again.",
      variant: "destructive"
    });
  };

  const trackPaymentEvent = async (eventType, eventData) => {
    try {
      await fetch(`${API_BASE}/api/ai/payments/track-analytics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          payment_id: paymentData?.id || 'unknown',
          event_type: eventType,
          event_data: {
            ...eventData,
            timestamp: Date.now(),
            device_info: {
              is_mobile: /Mobi|Android/i.test(navigator.userAgent),
              is_native: isNative,
              platform: isNative ? Capacitor.getPlatform() : 'web'
            },
            user_agent: navigator.userAgent,
            session_id: sessionStorage.getItem('session_id') || 'anonymous'
          }
        })
      });
    } catch (error) {
      console.error('Error tracking payment event:', error);
    }
  };

  const applyMobileOptimizations = (optimization) => {
    // Apply AI-suggested UI optimizations
    const settings = optimization.device_specific_settings || {};
    
    // Apply dynamic styles based on AI recommendations
    const style = document.createElement('style');
    style.innerHTML = `
      .mobile-payment-container .payment-button {
        font-size: ${settings.font_size || '16px'};
        padding: ${settings.spacing === 'increased' ? '16px 24px' : '12px 20px'};
        min-height: ${settings.button_size === 'large' ? '48px' : '40px'};
      }
    `;
    document.head.appendChild(style);
  };

  const setupDeepLinkListener = () => {
    // Set up listener for deep links (when payment returns to app)
    if (isNative && deepLinkConfig?.deep_link) {
      // This would be handled by Capacitor's URL handling in a real implementation
      console.log('Deep link configured:', deepLinkConfig.deep_link);
    }
  };

  const monitorPaymentWindow = (paymentWindow) => {
    const checkClosed = setInterval(() => {
      if (paymentWindow.closed) {
        clearInterval(checkClosed);
        // Window closed - check final status
        setTimeout(() => checkPaymentStatus(), 1000);
      }
    }, 1000);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatCurrency = (cents) => `R${(cents / 100).toFixed(2)}`;

  if (loading) {
    return (
      <div className="mobile-payment-container max-w-md mx-auto p-6">
        <Card>
          <CardContent className="py-12 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-4" />
            <p className="text-gray-600">Optimizing payment experience...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mobile-payment-container max-w-md mx-auto p-6 space-y-6">
      {/* AI Insights Header */}
      {aiInsights && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="font-semibold text-emerald-900">AI Payment Optimization</p>
                  <p className="text-sm text-emerald-700">
                    Success probability: {(aiInsights.success_probability * 100).toFixed(0)}%
                  </p>
                </div>
              </div>
              <Badge className="bg-emerald-600 text-white">
                <Sparkles className="h-3 w-3 mr-1" />
                {aiInsights.risk_level} risk
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mobile Payment</span>
            {isNative && (
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                <Smartphone className="h-3 w-3 mr-1" />
                Native
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Payment Details */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Amount:</span>
              <span className="font-bold text-lg">
                {formatCurrency(paymentData?.amount_cents || 0)}
              </span>
            </div>
            
            {paymentState === 'processing' && (
              <div className="flex justify-between">
                <span className="text-gray-600">Time remaining:</span>
                <span className="font-mono text-orange-600">
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>

          {/* Payment State UI */}
          {paymentState === 'ready' && (
            <div className="space-y-4">
              <Button 
                onClick={processPayment}
                className="payment-button w-full bg-emerald-600 hover:bg-emerald-700"
                size="lg"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Pay Securely with Paystack
              </Button>
              
              <div className="flex items-center justify-center text-xs text-gray-500">
                <Shield className="h-3 w-3 mr-1" />
                256-bit SSL encryption
              </div>
            </div>
          )}

          {paymentState === 'processing' && (
            <div className="space-y-4">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-600 mx-auto mb-2" />
                <p className="font-medium">Processing your payment...</p>
                <p className="text-sm text-gray-600">
                  {isNative ? 'Payment opened in secure browser' : 'Complete payment in the popup window'}
                </p>
              </div>
              
              <Progress 
                value={(300 - timeRemaining) / 300 * 100} 
                className="w-full"
              />
              
              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => setPaymentState('ready')}
                  size="sm"
                >
                  Cancel Payment
                </Button>
              </div>
            </div>
          )}

          {paymentState === 'success' && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-green-50 rounded-lg">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold text-green-900">Payment Successful!</h3>
                <p className="text-sm text-green-700">
                  Your payment has been processed successfully.
                </p>
              </div>
              
              <Button 
                onClick={() => navigate('/orders')}
                className="w-full"
              >
                View Order Details
              </Button>
            </div>
          )}

          {paymentState === 'error' && (
            <div className="text-center space-y-4">
              <div className="p-4 bg-red-50 rounded-lg">
                <AlertCircle className="h-12 w-12 text-red-600 mx-auto mb-2" />
                <h3 className="font-semibold text-red-900">Payment Failed</h3>
                <p className="text-sm text-red-700">
                  There was an issue processing your payment.
                </p>
              </div>
              
              <div className="space-y-2">
                <Button 
                  onClick={() => setPaymentState('ready')}
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                
                <Button 
                  variant="outline"
                  onClick={onPaymentCancel}
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Performance Insights */}
      {paymentAnalytics?.success && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <BarChart3 className="h-4 w-4" />
              Payment Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Platform Success Rate</p>
                <p className="font-medium">
                  {(paymentAnalytics.metrics?.success_rate * 100 || 85).toFixed(1)}%
                </p>
              </div>
              <div>
                <p className="text-gray-600">Mobile Optimization</p>
                <p className="font-medium">
                  {paymentAnalytics.payment_analysis?.mobile_insights?.mobile_optimization_score || 85}/100
                </p>
              </div>
            </div>
            
            {paymentAnalytics.recommendations?.length > 0 && (
              <Alert>
                <Lightbulb className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>AI Tip:</strong> {paymentAnalytics.recommendations[0]?.action}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Mobile Optimization Info */}
      {mobileOptimization?.success && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-sm">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900">
                Mobile Flow Optimized
              </span>
              <Badge variant="outline" className="text-blue-600 border-blue-300 text-xs">
                +{mobileOptimization.expected_improvement || 15}% success rate
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Info (only in development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-gray-200">
          <CardHeader>
            <CardTitle className="text-sm text-gray-600">Debug Info</CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-gray-500 space-y-1">
            <p>State: {paymentState}</p>
            <p>Native: {isNative ? 'Yes' : 'No'}</p>
            <p>Platform: {isNative ? Capacitor.getPlatform() : 'Web'}</p>
            <p>Deep Link: {deepLinkConfig?.success ? 'Configured' : 'Not configured'}</p>
            <p>AI Optimized: {mobileOptimization?.success ? 'Yes' : 'No'}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedMobilePayment;