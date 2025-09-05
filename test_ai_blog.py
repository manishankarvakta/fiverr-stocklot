#!/usr/bin/env python3
"""
Test AI Blog Content Generation endpoint
"""
import requests
import json

# Backend URL
BACKEND_URL = "http://localhost:8001"

def get_admin_token():
    """Get admin authentication token"""
    login_data = {"email": "admin@stocklot.co.za", "password": "admin123"}
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/auth/login", json=login_data)
        if response.status_code == 200:
            return response.json().get("access_token")
    except:
        pass
    return None

def test_ai_blog_generation():
    """Test AI blog content generation"""
    print("🔍 Testing AI Blog Content Generation")
    print("=" * 45)
    
    token = get_admin_token()
    if not token:
        print("❌ Could not get admin token")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    # Test title generation
    print("1. Testing AI title generation...")
    title_data = {
        "type": "title",
        "prompt": "Generate a compelling blog post title about cattle breeding in South Africa",
        "category": "cattle breeding"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/ai/generate-blog-content",
                               json=title_data, headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ SUCCESS!")
            print(f"   Generated title: {result['content'][:100]}...")
        else:
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
    
    # Test excerpt generation
    print("\n2. Testing AI excerpt generation...")
    excerpt_data = {
        "type": "excerpt",
        "prompt": "Generate a brief excerpt for a blog post about cattle breeding best practices",
        "category": "cattle breeding",
        "context": {
            "title": "Ultimate Guide to Cattle Breeding in South Africa"
        }
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/ai/generate-blog-content",
                               json=excerpt_data, headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ SUCCESS!")
            print(f"   Generated excerpt: {result['content'][:150]}...")
        else:
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")
    
    # Test custom content generation
    print("\n3. Testing custom AI content generation...")
    content_data = {
        "type": "custom",
        "prompt": "Write 2 paragraphs about the importance of proper cattle nutrition during winter months in South Africa",
        "category": "livestock nutrition"
    }
    
    try:
        response = requests.post(f"{BACKEND_URL}/api/ai/generate-blog-content",
                               json=content_data, headers=headers)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print(f"   ✅ SUCCESS!")
            print(f"   Generated content: {result['content'][:200]}...")
        else:
            print(f"   Response: {response.text[:200]}")
    except Exception as e:
        print(f"   ❌ ERROR: {e}")

if __name__ == "__main__":
    test_ai_blog_generation()