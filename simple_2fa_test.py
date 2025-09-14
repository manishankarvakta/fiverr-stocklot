#!/usr/bin/env python3
"""
Simplified 2FA Testing - Direct API calls
"""

import asyncio
import aiohttp
import json
import logging
import pyotp
import time

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def test_2fa_system():
    """Test 2FA system with direct API calls"""
    base_url = "https://farmstock-hub-1.preview.emergentagent.com/api"
    
    results = {
        "total_tests": 0,
        "passed_tests": 0,
        "failed_tests": 0,
        "test_results": {}
    }
    
    async with aiohttp.ClientSession() as session:
        
        # Test 1: Admin Login
        logger.info("🔐 Testing Admin Login...")
        results["total_tests"] += 1
        
        login_data = {"email": "admin@stocklot.co.za", "password": "admin123"}
        async with session.post(f"{base_url}/auth/login", json=login_data) as response:
            if response.status == 200:
                data = await response.json()
                if "user" in data:
                    admin_email = data["user"]["email"]
                    logger.info("✅ Admin login successful")
                    results["passed_tests"] += 1
                    results["test_results"]["Admin Login"] = True
                    
                    # Test 2: 2FA Setup
                    logger.info("🔧 Testing 2FA Setup...")
                    results["total_tests"] += 1
                    
                    headers = {"Authorization": f"Bearer {admin_email}"}
                    async with session.post(f"{base_url}/auth/2fa/setup", headers=headers) as setup_response:
                        if setup_response.status == 200:
                            setup_data = await setup_response.json()
                            if "secret_key" in setup_data and "backup_codes" in setup_data:
                                secret_key = setup_data["secret_key"]
                                backup_codes = setup_data["backup_codes"]
                                logger.info("✅ 2FA Setup successful")
                                logger.info(f"   - Secret key: {secret_key[:8]}...")
                                logger.info(f"   - Backup codes: {len(backup_codes)} codes")
                                logger.info(f"   - QR code: {len(setup_data.get('qr_code', ''))} chars")
                                results["passed_tests"] += 1
                                results["test_results"]["2FA Setup"] = True
                                
                                # Test 3: 2FA Setup Verification
                                logger.info("🔐 Testing 2FA Setup Verification...")
                                results["total_tests"] += 1
                                
                                totp = pyotp.TOTP(secret_key)
                                token = totp.now()
                                
                                verify_data = {"token": token}
                                async with session.post(f"{base_url}/auth/2fa/verify-setup", 
                                                       json=verify_data, headers=headers) as verify_response:
                                    if verify_response.status == 200:
                                        verify_result = await verify_response.json()
                                        if verify_result.get("success"):
                                            logger.info("✅ 2FA Setup Verification successful")
                                            results["passed_tests"] += 1
                                            results["test_results"]["2FA Setup Verification"] = True
                                            
                                            # Test 4: 2FA Status
                                            logger.info("📊 Testing 2FA Status...")
                                            results["total_tests"] += 1
                                            
                                            async with session.get(f"{base_url}/auth/2fa/status", 
                                                                 headers=headers) as status_response:
                                                if status_response.status == 200:
                                                    status_data = await status_response.json()
                                                    if status_data.get("enabled"):
                                                        logger.info("✅ 2FA Status check successful")
                                                        logger.info(f"   - Enabled: {status_data['enabled']}")
                                                        logger.info(f"   - Backup codes remaining: {status_data.get('backup_codes_remaining', 'N/A')}")
                                                        results["passed_tests"] += 1
                                                        results["test_results"]["2FA Status"] = True
                                                        
                                                        # Test 5: 2FA Login Verification
                                                        logger.info("🔑 Testing 2FA Login Verification...")
                                                        results["total_tests"] += 1
                                                        
                                                        new_token = totp.now()
                                                        login_verify_data = {"token": new_token}
                                                        
                                                        async with session.post(f"{base_url}/auth/2fa/verify", 
                                                                               json=login_verify_data) as login_verify_response:
                                                            if login_verify_response.status == 200:
                                                                login_verify_result = await login_verify_response.json()
                                                                if login_verify_result.get("success"):
                                                                    logger.info("✅ 2FA Login Verification successful")
                                                                    results["passed_tests"] += 1
                                                                    results["test_results"]["2FA Login Verification"] = True
                                                                    
                                                                    # Test 6: Backup Code Verification
                                                                    logger.info("🔑 Testing Backup Code Verification...")
                                                                    results["total_tests"] += 1
                                                                    
                                                                    backup_code = backup_codes[0]
                                                                    backup_verify_data = {"backup_code": backup_code}
                                                                    
                                                                    async with session.post(f"{base_url}/auth/2fa/verify", 
                                                                                           json=backup_verify_data) as backup_verify_response:
                                                                        if backup_verify_response.status == 200:
                                                                            backup_verify_result = await backup_verify_response.json()
                                                                            if backup_verify_result.get("success"):
                                                                                logger.info("✅ Backup Code Verification successful")
                                                                                logger.info(f"   - Remaining codes: {backup_verify_result.get('remaining_backup_codes', 'N/A')}")
                                                                                results["passed_tests"] += 1
                                                                                results["test_results"]["Backup Code Verification"] = True
                                                                                
                                                                                # Test 7: Backup Codes Regeneration
                                                                                logger.info("🔄 Testing Backup Codes Regeneration...")
                                                                                results["total_tests"] += 1
                                                                                
                                                                                regen_token = totp.now()
                                                                                regen_data = {"token": regen_token}
                                                                                
                                                                                async with session.post(f"{base_url}/auth/2fa/regenerate-backup-codes", 
                                                                                                       json=regen_data, headers=headers) as regen_response:
                                                                                    if regen_response.status == 200:
                                                                                        regen_result = await regen_response.json()
                                                                                        if regen_result.get("success") and "backup_codes" in regen_result:
                                                                                            new_backup_codes = regen_result["backup_codes"]
                                                                                            logger.info("✅ Backup Codes Regeneration successful")
                                                                                            logger.info(f"   - New codes generated: {len(new_backup_codes)}")
                                                                                            results["passed_tests"] += 1
                                                                                            results["test_results"]["Backup Codes Regeneration"] = True
                                                                                        else:
                                                                                            logger.error("❌ Backup Codes Regeneration failed")
                                                                                            results["failed_tests"] += 1
                                                                                            results["test_results"]["Backup Codes Regeneration"] = False
                                                                                    else:
                                                                                        logger.error("❌ Backup Codes Regeneration failed")
                                                                                        results["failed_tests"] += 1
                                                                                        results["test_results"]["Backup Codes Regeneration"] = False
                                                                            else:
                                                                                logger.error("❌ Backup Code Verification failed")
                                                                                results["failed_tests"] += 1
                                                                                results["test_results"]["Backup Code Verification"] = False
                                                                        else:
                                                                            logger.error("❌ Backup Code Verification failed")
                                                                            results["failed_tests"] += 1
                                                                            results["test_results"]["Backup Code Verification"] = False
                                                                else:
                                                                    logger.error("❌ 2FA Login Verification failed")
                                                                    results["failed_tests"] += 1
                                                                    results["test_results"]["2FA Login Verification"] = False
                                                            else:
                                                                logger.error("❌ 2FA Login Verification failed")
                                                                results["failed_tests"] += 1
                                                                results["test_results"]["2FA Login Verification"] = False
                                                    else:
                                                        logger.error("❌ 2FA Status check failed")
                                                        results["failed_tests"] += 1
                                                        results["test_results"]["2FA Status"] = False
                                                else:
                                                    logger.error("❌ 2FA Status check failed")
                                                    results["failed_tests"] += 1
                                                    results["test_results"]["2FA Status"] = False
                                        else:
                                            logger.error("❌ 2FA Setup Verification failed")
                                            results["failed_tests"] += 1
                                            results["test_results"]["2FA Setup Verification"] = False
                                    else:
                                        logger.error("❌ 2FA Setup Verification failed")
                                        results["failed_tests"] += 1
                                        results["test_results"]["2FA Setup Verification"] = False
                            else:
                                logger.error("❌ 2FA Setup failed")
                                results["failed_tests"] += 1
                                results["test_results"]["2FA Setup"] = False
                        else:
                            logger.error("❌ 2FA Setup failed")
                            results["failed_tests"] += 1
                            results["test_results"]["2FA Setup"] = False
                else:
                    logger.error("❌ Admin login failed")
                    results["failed_tests"] += 1
                    results["test_results"]["Admin Login"] = False
            else:
                logger.error("❌ Admin login failed")
                results["failed_tests"] += 1
                results["test_results"]["Admin Login"] = False
        
        # Test 8: Admin 2FA Statistics
        logger.info("📈 Testing Admin 2FA Statistics...")
        results["total_tests"] += 1
        
        if "Admin Login" in results["test_results"] and results["test_results"]["Admin Login"]:
            headers = {"Authorization": f"Bearer admin@stocklot.co.za"}
            async with session.get(f"{base_url}/admin/2fa/stats", headers=headers) as stats_response:
                if stats_response.status == 200:
                    stats_data = await stats_response.json()
                    if "total_users" in stats_data:
                        logger.info("✅ Admin 2FA Statistics successful")
                        logger.info(f"   - Total users: {stats_data['total_users']}")
                        logger.info(f"   - Users with 2FA: {stats_data.get('users_with_2fa', 'N/A')}")
                        logger.info(f"   - Adoption rate: {stats_data.get('adoption_rate', 'N/A')}%")
                        results["passed_tests"] += 1
                        results["test_results"]["Admin 2FA Statistics"] = True
                    else:
                        logger.error("❌ Admin 2FA Statistics failed")
                        results["failed_tests"] += 1
                        results["test_results"]["Admin 2FA Statistics"] = False
                else:
                    logger.error("❌ Admin 2FA Statistics failed")
                    results["failed_tests"] += 1
                    results["test_results"]["Admin 2FA Statistics"] = False
        else:
            logger.error("❌ Admin 2FA Statistics skipped (no admin login)")
            results["failed_tests"] += 1
            results["test_results"]["Admin 2FA Statistics"] = False
    
    return results

async def main():
    logger.info("🚀 Starting Simplified 2FA System Testing...")
    logger.info("=" * 60)
    
    results = await test_2fa_system()
    
    # Print final results
    logger.info("\n" + "=" * 60)
    logger.info("📊 FINAL TEST RESULTS")
    logger.info("=" * 60)
    logger.info(f"✅ Passed: {results['passed_tests']}")
    logger.info(f"❌ Failed: {results['failed_tests']}")
    logger.info(f"📈 Success Rate: {(results['passed_tests']/results['total_tests'])*100:.1f}%")
    
    logger.info("\n📋 DETAILED RESULTS:")
    for test_name, passed in results["test_results"].items():
        status = "✅ PASSED" if passed else "❌ FAILED"
        logger.info(f"   {test_name}: {status}")
    
    return results

if __name__ == "__main__":
    asyncio.run(main())