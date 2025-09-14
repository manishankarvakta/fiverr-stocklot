
// Enhanced Payment Redirect Fix
function enhancedPaymentRedirect(orderData) {
    console.log('🔧 Enhanced Payment Redirect Fix Activated');
    console.log('Order Data:', orderData);
    
    // Multiple ways to find payment URL
    const possibleUrls = [
        orderData?.paystack?.authorization_url,
        orderData?.authorization_url,
        orderData?.redirect_url,
        orderData?.payment_url,
        orderData?.data?.authorization_url
    ];
    
    const paymentUrl = possibleUrls.find(url => 
        url && (url.includes('paystack.com') || url.includes('checkout'))
    );
    
    if (paymentUrl) {
        console.log('✅ Payment URL found:', paymentUrl);
        
        // Create visible countdown
        const countdown = document.createElement('div');
        countdown.style.cssText = `
            position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
            background: #059669; color: white; padding: 15px 25px;
            border-radius: 8px; z-index: 9999; font-family: Arial;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        countdown.innerHTML = '🚀 Redirecting to payment gateway in <span id="countdown">3</span> seconds...';
        document.body.appendChild(countdown);
        
        // Countdown timer
        let seconds = 3;
        const timer = setInterval(() => {
            seconds--;
            const countElement = document.getElementById('countdown');
            if (countElement) countElement.textContent = seconds;
            
            if (seconds <= 0) {
                clearInterval(timer);
                console.log('🚀 Redirecting to:', paymentUrl);
                window.location.href = paymentUrl;
            }
        }, 1000);
        
        // Fallback direct redirect
        setTimeout(() => {
            if (window.location.href === window.location.href) {
                console.log('🔄 Fallback redirect triggered');
                window.location.replace(paymentUrl);
            }
        }, 4000);
        
        return true;
    } else {
        console.log('❌ No valid payment URL found');
        console.log('Available keys:', Object.keys(orderData));
        return false;
    }
}

// Auto-apply fix when payment response received
window.paymentRedirectFix = enhancedPaymentRedirect;
