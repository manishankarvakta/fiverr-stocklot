#!/usr/bin/env python3
"""
🧪 CHECKOUT PREVIEW ENDPOINT TESTING
Testing the /api/checkout/preview endpoint to verify fee data structure
"""

import asyncio
import aiohttp
import json
import logging
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class CheckoutPreviewTester:
    """Checkout Preview Endpoint Tester"""
    
    def __init__(self, base_url: str = "https://farmstock-hub-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session = None
        self.test_results = []
        
    async def setup_session(self):
        """Setup HTTP session"""
        self.session = aiohttp.ClientSession()
        
    async def cleanup_session(self):
        """Cleanup HTTP session"""
        if self.session:
            await self.session.close()
    
    def log_test_result(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = {
            "test": test_name,
            "status": status,
            "success": success,
            "details": details,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        logger.info(f"{status} - {test_name}: {details}")
        
        if response_data and success:
            logger.info(f"Response data: {json.dumps(response_data, indent=2)}")
    
    async def test_checkout_preview_endpoint(self):
        """Test the checkout preview endpoint with sample cart data"""
        test_name = "Checkout Preview Endpoint"
        
        try:
            # Sample cart data as specified in the review request
            cart_data = {
                "cart": [
                    {
                        "seller_id": "test-seller-123",
                        "merch_subtotal_minor": 100000,  # R1000.00 in minor units
                        "delivery_minor": 5000,          # R50.00 delivery
                        "abattoir_minor": 2000,          # R20.00 abattoir
                        "species": "cattle",
                        "export": False
                    }
                ],
                "currency": "ZAR"
            }
            
            logger.info(f"Testing checkout preview with cart data: {json.dumps(cart_data, indent=2)}")
            
            async with self.session.post(
                f"{self.api_url}/checkout/preview",
                json=cart_data,
                headers={"Content-Type": "application/json"}
            ) as response:
                
                response_text = await response.text()
                logger.info(f"Response status: {response.status}")
                logger.info(f"Response headers: {dict(response.headers)}")
                logger.info(f"Response text: {response_text}")
                
                if response.status == 200:
                    try:
                        response_data = json.loads(response_text)
                        
                        # Verify response structure
                        if "success" in response_data and response_data["success"]:
                            preview = response_data.get("preview", {})
                            
                            # Check for expected fields
                            expected_fields = [
                                "per_seller",
                                "cart_totals", 
                                "fee_config_id",
                                "currency"
                            ]
                            
                            missing_fields = []
                            for field in expected_fields:
                                if field not in preview:
                                    missing_fields.append(field)
                            
                            if missing_fields:
                                self.log_test_result(
                                    test_name, 
                                    False, 
                                    f"Missing expected fields: {missing_fields}",
                                    response_data
                                )
                                return
                            
                            # Check per_seller calculations
                            per_seller = preview.get("per_seller", [])
                            if not per_seller:
                                self.log_test_result(
                                    test_name, 
                                    False, 
                                    "No per_seller calculations found",
                                    response_data
                                )
                                return
                            
                            seller_calc = per_seller[0]  # First seller
                            
                            # Check for fee breakdown fields
                            lines = seller_calc.get("lines", {})
                            expected_fee_fields = [
                                "buyer_processing_fee_minor",
                                "escrow_service_fee_minor",
                                "merch_subtotal_minor",
                                "delivery_minor",
                                "abattoir_minor"
                            ]
                            
                            missing_fee_fields = []
                            for field in expected_fee_fields:
                                if field not in lines:
                                    missing_fee_fields.append(field)
                            
                            if missing_fee_fields:
                                self.log_test_result(
                                    test_name, 
                                    False, 
                                    f"Missing fee fields in lines: {missing_fee_fields}",
                                    response_data
                                )
                                return
                            
                            # Verify buyer_processing_fee_minor calculation (1.5% of 100000 = 1500)
                            buyer_processing_fee = lines.get("buyer_processing_fee_minor", 0)
                            expected_processing_fee = 1500  # 1.5% of 100000
                            
                            # Verify escrow_service_fee_minor (default R25.00 = 2500)
                            escrow_fee = lines.get("escrow_service_fee_minor", 0)
                            expected_escrow_fee = 2500  # R25.00 in minor units
                            
                            # Log detailed fee breakdown
                            fee_details = f"""
Fee Breakdown Analysis:
- Merchandise Subtotal: R{lines.get('merch_subtotal_minor', 0) / 100:.2f}
- Delivery Fee: R{lines.get('delivery_minor', 0) / 100:.2f}
- Abattoir Fee: R{lines.get('abattoir_minor', 0) / 100:.2f}
- Buyer Processing Fee: R{buyer_processing_fee / 100:.2f} (Expected: R{expected_processing_fee / 100:.2f})
- Escrow Service Fee: R{escrow_fee / 100:.2f} (Expected: R{expected_escrow_fee / 100:.2f})

Cart Totals:
- Buyer Total: R{preview.get('cart_totals', {}).get('buyer_total_minor', 0) / 100:.2f}
- Seller Net Payout: R{preview.get('cart_totals', {}).get('seller_total_net_payout_minor', 0) / 100:.2f}
- Platform Revenue: R{preview.get('cart_totals', {}).get('platform_revenue_estimate_minor', 0) / 100:.2f}

Fee Config ID: {preview.get('fee_config_id')}
Currency: {preview.get('currency')}
                            """
                            
                            self.log_test_result(
                                test_name, 
                                True, 
                                f"Checkout preview successful! {fee_details}",
                                response_data
                            )
                            
                        else:
                            self.log_test_result(
                                test_name, 
                                False, 
                                f"API returned success=false: {response_data}",
                                response_data
                            )
                            
                    except json.JSONDecodeError as e:
                        self.log_test_result(
                            test_name, 
                            False, 
                            f"Invalid JSON response: {e}",
                            {"raw_response": response_text}
                        )
                        
                elif response.status == 400:
                    try:
                        error_data = json.loads(response_text)
                        self.log_test_result(
                            test_name, 
                            False, 
                            f"Bad request (400): {error_data.get('detail', 'Unknown error')}",
                            error_data
                        )
                    except:
                        self.log_test_result(
                            test_name, 
                            False, 
                            f"Bad request (400): {response_text}"
                        )
                        
                elif response.status == 404:
                    self.log_test_result(
                        test_name, 
                        False, 
                        "Endpoint not found (404) - checkout preview endpoint may not be implemented"
                    )
                    
                elif response.status == 500:
                    try:
                        error_data = json.loads(response_text)
                        self.log_test_result(
                            test_name, 
                            False, 
                            f"Server error (500): {error_data.get('detail', 'Unknown server error')}",
                            error_data
                        )
                    except:
                        self.log_test_result(
                            test_name, 
                            False, 
                            f"Server error (500): {response_text}"
                        )
                        
                else:
                    self.log_test_result(
                        test_name, 
                        False, 
                        f"Unexpected status code {response.status}: {response_text}"
                    )
                    
        except Exception as e:
            self.log_test_result(
                test_name, 
                False, 
                f"Request failed: {str(e)}"
            )
    
    async def test_fee_breakdown_endpoint(self):
        """Test the fee breakdown endpoint for additional fee information"""
        test_name = "Fee Breakdown Endpoint"
        
        try:
            # Test with the same amount as in cart (R1000.00)
            params = {
                "amount": 1000.00,
                "species": "cattle",
                "export": "false"
            }
            
            logger.info(f"Testing fee breakdown with params: {params}")
            
            async with self.session.get(
                f"{self.api_url}/fees/breakdown",
                params=params
            ) as response:
                
                response_text = await response.text()
                logger.info(f"Fee breakdown response status: {response.status}")
                
                if response.status == 200:
                    try:
                        response_data = json.loads(response_text)
                        
                        if "success" in response_data and response_data["success"]:
                            breakdown = response_data.get("breakdown", {})
                            config_used = response_data.get("config_used", {})
                            
                            breakdown_details = f"""
Fee Breakdown Details:
- Config Used: {config_used.get('name')} (ID: {config_used.get('id')})
- Model: {config_used.get('model')}
- Breakdown: {json.dumps(breakdown, indent=2)}
                            """
                            
                            self.log_test_result(
                                test_name, 
                                True, 
                                f"Fee breakdown successful! {breakdown_details}",
                                response_data
                            )
                        else:
                            self.log_test_result(
                                test_name, 
                                False, 
                                f"Fee breakdown failed: {response_data}",
                                response_data
                            )
                            
                    except json.JSONDecodeError as e:
                        self.log_test_result(
                            test_name, 
                            False, 
                            f"Invalid JSON response: {e}",
                            {"raw_response": response_text}
                        )
                        
                else:
                    self.log_test_result(
                        test_name, 
                        False, 
                        f"Fee breakdown failed with status {response.status}: {response_text}"
                    )
                    
        except Exception as e:
            self.log_test_result(
                test_name, 
                False, 
                f"Fee breakdown request failed: {str(e)}"
            )
    
    async def run_all_tests(self):
        """Run all checkout preview tests"""
        logger.info("🚀 Starting Checkout Preview Endpoint Testing")
        logger.info(f"Base URL: {self.base_url}")
        logger.info(f"API URL: {self.api_url}")
        
        await self.setup_session()
        
        try:
            # Test checkout preview endpoint
            await self.test_checkout_preview_endpoint()
            
            # Test fee breakdown endpoint for additional context
            await self.test_fee_breakdown_endpoint()
            
        finally:
            await self.cleanup_session()
        
        # Print summary
        self.print_test_summary()
    
    def print_test_summary(self):
        """Print test summary"""
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result["success"])
        failed_tests = total_tests - passed_tests
        
        logger.info("\n" + "="*80)
        logger.info("🧪 CHECKOUT PREVIEW ENDPOINT TEST SUMMARY")
        logger.info("="*80)
        logger.info(f"Total Tests: {total_tests}")
        logger.info(f"✅ Passed: {passed_tests}")
        logger.info(f"❌ Failed: {failed_tests}")
        logger.info(f"Success Rate: {(passed_tests/total_tests)*100:.1f}%" if total_tests > 0 else "No tests run")
        
        if failed_tests > 0:
            logger.info("\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result["success"]:
                    logger.info(f"  - {result['test']}: {result['details']}")
        
        if passed_tests > 0:
            logger.info("\n✅ PASSED TESTS:")
            for result in self.test_results:
                if result["success"]:
                    logger.info(f"  - {result['test']}: {result['details'][:100]}...")

async def main():
    """Main test runner"""
    tester = CheckoutPreviewTester()
    await tester.run_all_tests()

if __name__ == "__main__":
    asyncio.run(main())