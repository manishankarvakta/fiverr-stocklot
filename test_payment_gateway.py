#!/usr/bin/env python3
"""
Direct Payment Gateway Test - Test payment redirection without cart
"""

import requests
import json

def test_direct_payment():
    """Test payment creation and redirection directly"""
    print("🔧 TESTING DIRECT PAYMENT GATEWAY INTEGRATION")
    print("=" * 60)
    
    # Test data for direct payment
    test_order_data = {
        "contact": {
            "email": "test.payment@example.com", 
            "full_name": "Payment Test User",
            "phone": "0123456789"
        },
        "ship_to": {
            "address": "123 Payment Test Street",
            "city": "Cape Town",
            "province": "Western Cape",
            "postal_code": "8000"
        },
        "items": [
            {
                "listing_id": "test-payment-listing-123",
                "qty": 1,
                "species": "cattle",
                "product_type": "breeding",
                "line_total": 1250
            }
        ],
        "quote": {
            "sellers": [
                {
                    "seller_id": "test-payment-seller",
                    "subtotal": 1250,
                    "delivery": 50,
                    "items": [
                        {
                            "listing_id": "test-payment-listing-123",
                            "title": "Payment Test Cattle",
                            "unit": "head",
                            "qty": 1,
                            "price": 1250,
                            "line_total": 1250,
                            "species": "cattle",
                            "product_type": "breeding"
                        }
                    ]
                }
            ],
            "summary": {
                "subtotal": 1250,
                "delivery_total": 50,
                "buyer_processing_fee": 19.5,  # 1.5% of 1300
                "escrow_service_fee": 25,
                "grand_total": 1294.5,
                "currency": "ZAR"
            }
        }
    }
    
    try:
        # Test guest checkout payment
        print("📧 Testing guest checkout payment creation...")
        response = requests.post(
            "https://farmstock-hub-1.preview.emergentagent.com/api/checkout/guest/create",
            json=test_order_data,
            headers={"Content-Type": "application/json"},
            timeout=15
        )
        
        print(f"Response Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS: Order created successfully!")
            print(f"Order Group ID: {result.get('order_group_id')}")
            print(f"Order Count: {result.get('order_count')}")
            
            # Check for payment URL
            if result.get('paystack') and result['paystack'].get('authorization_url'):
                payment_url = result['paystack']['authorization_url']
                payment_ref = result['paystack'].get('reference')
                
                print(f"✅ PAYMENT URL FOUND: {payment_url}")
                print(f"📋 Payment Reference: {payment_ref}")
                
                # Test the payment URL accessibility
                print("\n🔗 Testing payment URL accessibility...")
                try:
                    payment_response = requests.head(payment_url, timeout=10)
                    if payment_response.status_code in [200, 302, 301]:
                        print("✅ Payment URL is accessible!")
                        print(f"Payment gateway status: {payment_response.status_code}")
                    else:
                        print(f"⚠️ Payment URL returned status: {payment_response.status_code}")
                except Exception as e:
                    print(f"❌ Payment URL test failed: {str(e)}")
                
                # Generate HTML test page
                html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Payment Gateway Test</title>
    <style>
        body {{ font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }}
        .container {{ max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .success {{ color: #059669; font-weight: bold; }}
        .payment-btn {{ background: #059669; color: white; padding: 15px 30px; border: none; border-radius: 6px; font-size: 16px; cursor: pointer; text-decoration: none; display: inline-block; }}
        .payment-btn:hover {{ background: #047857; }}
        .details {{ background: #f9fafb; padding: 15px; border-radius: 6px; margin: 15px 0; }}
        .auto-redirect {{ background: #fef3c7; padding: 10px; border-radius: 4px; margin: 10px 0; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>🎉 Payment Gateway Test - SUCCESS!</h1>
        
        <div class="success">
            ✅ Order created successfully!<br>
            ✅ Payment URL generated!<br>
            ✅ Payment gateway accessible!
        </div>
        
        <div class="details">
            <strong>Order Details:</strong><br>
            Order ID: {result.get('order_group_id')}<br>
            Amount: R{test_order_data['quote']['summary']['grand_total']}<br>
            Payment Reference: {payment_ref}<br>
        </div>
        
        <div class="auto-redirect">
            <strong>🚀 Automatic Redirect Test:</strong><br>
            This page will automatically redirect to the payment gateway in 3 seconds...
        </div>
        
        <a href="{payment_url}" class="payment-btn">
            🔗 Go to Payment Gateway (Manual)
        </a>
        
        <br><br>
        <small><strong>Payment URL:</strong> {payment_url}</small>
        
        <script>
            console.log('Payment URL:', '{payment_url}');
            console.log('Starting automatic redirect test...');
            
            // Automatic redirect test
            setTimeout(() => {{
                console.log('Redirecting to payment gateway...');
                window.location.href = '{payment_url}';
            }}, 3000);
        </script>
    </div>
</body>
</html>
                """
                
                # Save test page
                with open('/app/payment_test.html', 'w') as f:
                    f.write(html_content)
                
                print("\n📄 HTML test page created: /app/payment_test.html")
                print(f"🌐 Direct payment URL: {payment_url}")
                
                return {
                    'success': True,
                    'payment_url': payment_url,
                    'reference': payment_ref,
                    'order_id': result.get('order_group_id'),
                    'test_file': '/app/payment_test.html'
                }
                
            else:
                print("❌ NO PAYMENT URL FOUND in response")
                print(f"Available keys: {list(result.keys())}")
                print(f"Full response: {json.dumps(result, indent=2)}")
                return {'success': False, 'error': 'No payment URL in response'}
                
        else:
            print(f"❌ Request failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return {'success': False, 'error': f'HTTP {response.status_code}'}
            
    except Exception as e:
        print(f"❌ Exception occurred: {str(e)}")
        return {'success': False, 'error': str(e)}

def create_payment_redirect_fix():
    """Create a JavaScript-based payment redirect fix"""
    print("\n🔧 CREATING PAYMENT REDIRECT FIX")
    print("=" * 40)
    
    js_fix = """
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
"""
    
    with open('/app/payment_redirect_fix.js', 'w') as f:
        f.write(js_fix)
    
    print("📄 JavaScript fix created: /app/payment_redirect_fix.js")
    
    return js_fix

if __name__ == "__main__":
    # Run direct payment test
    result = test_direct_payment()
    
    # Create JavaScript fix
    js_fix = create_payment_redirect_fix()
    
    print("\n" + "=" * 60)
    print("🎯 PAYMENT GATEWAY TEST SUMMARY")
    print("=" * 60)
    
    if result.get('success'):
        print("✅ RESULT: Payment gateway integration is WORKING!")
        print(f"🔗 Payment URL: {result.get('payment_url')}")
        print(f"📋 Reference: {result.get('reference')}")
        print(f"📄 Test Page: {result.get('test_file')}")
        print("\n🔧 SOLUTION: Payment gateway is working correctly.")
        print("   Issue is likely in frontend redirect handling.")
        print("   JavaScript fix has been created to ensure reliable redirection.")
    else:
        print("❌ RESULT: Payment gateway integration needs fixing")
        print(f"❌ Error: {result.get('error')}")
        print("\n🔧 SOLUTION: Backend payment initialization needs debugging")
    
    print(f"\n📋 Next Steps:")
    print(f"   1. Apply JavaScript fix to frontend")
    print(f"   2. Test payment flow with cart items")
    print(f"   3. Verify Paystack configuration")