#!/usr/bin/env python3
"""
Debug 2FA endpoints
"""

import asyncio
import aiohttp
import json

async def debug_endpoints():
    async with aiohttp.ClientSession() as session:
        base_url = "https://farmstock-hub-1.preview.emergentagent.com/api"
        
        # Test 1: Health check
        print("1. Testing health endpoint...")
        async with session.get(f"{base_url}/health") as response:
            print(f"   Status: {response.status}")
            print(f"   Response: {await response.text()}")
        
        # Test 2: Login
        print("\n2. Testing login...")
        login_data = {"email": "admin@stocklot.co.za", "password": "admin123"}
        async with session.post(f"{base_url}/auth/login", json=login_data) as response:
            print(f"   Status: {response.status}")
            text = await response.text()
            print(f"   Response: {text[:200]}...")
            
            if response.status == 200:
                data = json.loads(text)
                if "user" in data:
                    email = data["user"]["email"]
                    
                    # Test 3: 2FA Setup with Bearer token
                    print(f"\n3. Testing 2FA setup with Bearer token: {email}")
                    headers = {"Authorization": f"Bearer {email}"}
                    async with session.post(f"{base_url}/auth/2fa/setup", headers=headers) as response:
                        print(f"   Status: {response.status}")
                        text = await response.text()
                        print(f"   Response: {text[:200]}...")
                        
                    # Test 4: 2FA Status
                    print(f"\n4. Testing 2FA status...")
                    async with session.get(f"{base_url}/auth/2fa/status", headers=headers) as response:
                        print(f"   Status: {response.status}")
                        text = await response.text()
                        print(f"   Response: {text[:200]}...")

if __name__ == "__main__":
    asyncio.run(debug_endpoints())