#!/bin/bash
# Comprehensive API Endpoint Testing Script using curl
# Tests all endpoints documented in API_DOCUMENTATION.md

BACKEND_URL="https://apilifestock.aamardokan.online"
BASE_URL="${BACKEND_URL}/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
PASSED=0
FAILED=0
SKIPPED=0
TOTAL=0

# Auth token storage
AUTH_TOKEN=""

print_status() {
    local method=$1
    local endpoint=$2
    local status=$3
    local details=$4
    
    case $status in
        "PASS")
            echo -e "${GREEN}✅${NC} ${method:6} ${endpoint:50} PASS"
            ((PASSED++))
            ;;
        "FAIL")
            echo -e "${RED}❌${NC} ${method:6} ${endpoint:50} FAIL"
            ((FAILED++))
            ;;
        "SKIP")
            echo -e "${YELLOW}⏭️${NC} ${method:6} ${endpoint:50} SKIP"
            ((SKIPPED++))
            ;;
    esac
    
    if [ -n "$details" ]; then
        echo "   └─ $details"
    fi
    ((TOTAL++))
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local requires_auth=$3
    local data=$4
    local expected_status=$5
    
    local url="${BASE_URL}${endpoint}"
    local headers=()
    local status_code
    
    # Add auth header if needed
    if [ "$requires_auth" = "true" ] && [ -n "$AUTH_TOKEN" ]; then
        headers+=("-H" "Authorization: Bearer ${AUTH_TOKEN}")
    fi
    
    headers+=("-H" "Content-Type: application/json")
    
    # Make request
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET "$url" "${headers[@]}" 2>&1)
    elif [ "$method" = "POST" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "\n%{http_code}" -X POST "$url" "${headers[@]}" -d "$data" 2>&1)
        else
            response=$(curl -s -w "\n%{http_code}" -X POST "$url" "${headers[@]}" 2>&1)
        fi
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT "$url" "${headers[@]}" -d "$data" 2>&1)
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$url" "${headers[@]}" 2>&1)
    else
        print_status "$method" "$endpoint" "SKIP" "Unknown method"
        return
    fi
    
    # Extract status code (last line)
    status_code=$(echo "$response" | tail -n1)
    response_body=$(echo "$response" | sed '$d')
    
    # Check if status is acceptable
    if [ "$status_code" -ge 200 ] && [ "$status_code" -lt 300 ]; then
        print_status "$method" "$endpoint" "PASS" "Status: $status_code"
    elif [ -n "$expected_status" ] && [ "$status_code" = "$expected_status" ]; then
        print_status "$method" "$endpoint" "PASS" "Status: $status_code (expected)"
    elif [ "$status_code" = "401" ] || [ "$status_code" = "403" ]; then
        print_status "$method" "$endpoint" "SKIP" "Status: $status_code (auth required)"
    else
        print_status "$method" "$endpoint" "FAIL" "Status: $status_code"
    fi
}

authenticate() {
    echo ""
    echo "================================================================================"
    echo "🔐 AUTHENTICATION"
    echo "================================================================================"
    
    # Try to login
    local login_data='{"email":"test@example.com","password":"testpass123"}'
    local response=$(curl -s -w "\n%{http_code}" -X POST "${BASE_URL}/auth/login" \
        -H "Content-Type: application/json" \
        -d "$login_data" 2>&1)
    
    local status_code=$(echo "$response" | tail -n1)
    local response_body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "200" ]; then
        # Try to extract token from JSON response
        AUTH_TOKEN=$(echo "$response_body" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4)
        if [ -z "$AUTH_TOKEN" ]; then
            AUTH_TOKEN=$(echo "$response_body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
        fi
        
        if [ -n "$AUTH_TOKEN" ]; then
            echo -e "${GREEN}✅ Authentication successful${NC}"
            return 0
        fi
    fi
    
    echo -e "${YELLOW}⚠️  Authentication failed or skipped (using public endpoints only)${NC}"
    return 1
}

echo "================================================================================"
echo "🧪 STOCKLOT API ENDPOINT TESTING"
echo "================================================================================"
echo "Backend URL: $BACKEND_URL"
echo "Base URL: $BASE_URL"
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# Test health endpoints
echo "================================================================================"
echo "🏥 HEALTH & SYSTEM ENDPOINTS"
echo "================================================================================"
test_endpoint "GET" "/health" false
test_endpoint "GET" "/performance/health-check" false

# Authenticate
authenticate

# Authentication endpoints
echo ""
echo "================================================================================"
echo "🔐 AUTHENTICATION ENDPOINTS"
echo "================================================================================"
test_endpoint "POST" "/auth/register" false '{"email":"test'$(date +%s)'@example.com","password":"testpass123","full_name":"Test User","role":"buyer"}' "201"
test_endpoint "GET" "/auth/me" true

# Listings endpoints
echo ""
echo "================================================================================"
echo "📦 LISTINGS ENDPOINTS"
echo "================================================================================"
test_endpoint "GET" "/listings" false
test_endpoint "GET" "/listings/search" false "?q=cattle"
test_endpoint "GET" "/listings/my" true

# Cart endpoints
echo ""
echo "================================================================================"
echo "🛒 CART ENDPOINTS"
echo "================================================================================"
test_endpoint "GET" "/cart" true
test_endpoint "POST" "/cart/add" true '{"listing_id":"test","quantity":1}' "400"

# Orders endpoints
echo ""
echo "================================================================================"
echo "📋 ORDERS ENDPOINTS"
echo "================================================================================"
test_endpoint "GET" "/orders/user" true

# Messaging endpoints
echo ""
echo "================================================================================"
echo "💬 MESSAGING ENDPOINTS"
echo "================================================================================"
test_endpoint "GET" "/inbox/summary" true
test_endpoint "GET" "/inbox" true
test_endpoint "GET" "/messaging/conversations" true

# Notifications endpoints
echo ""
echo "================================================================================"
echo "🔔 NOTIFICATIONS ENDPOINTS"
echo "================================================================================"
test_endpoint "GET" "/notifications" true

# Wishlist endpoints
echo ""
echo "================================================================================"
echo "❤️  WISHLIST ENDPOINTS"
echo "================================================================================"
test_endpoint "GET" "/buyer/wishlist" true
test_endpoint "GET" "/buyer/wishlist/stats" true

# Price alerts endpoints
echo ""
echo "================================================================================"
echo "💰 PRICE ALERTS ENDPOINTS"
echo "================================================================================"
test_endpoint "GET" "/buyer/price-alerts" true
test_endpoint "GET" "/buyer/price-alerts/stats" true

# Search endpoints
echo ""
echo "================================================================================"
echo "🔍 SEARCH ENDPOINTS"
echo "================================================================================"
test_endpoint "POST" "/search/semantic" false '{"query":"cattle for sale"}'
test_endpoint "GET" "/search/autocomplete" false "?q=cow"

# Buy requests endpoints
echo ""
echo "================================================================================"
echo "🛒 BUY REQUESTS ENDPOINTS"
echo "================================================================================"
test_endpoint "GET" "/public/buy-requests" false
test_endpoint "GET" "/buy-requests/my" true

# Admin endpoints
echo ""
echo "================================================================================"
echo "👑 ADMIN ENDPOINTS"
echo "================================================================================"
test_endpoint "GET" "/admin/users" true
test_endpoint "GET" "/admin/moderation/stats" true

# Contact endpoints
echo ""
echo "================================================================================"
echo "📧 CONTACT ENDPOINTS"
echo "================================================================================"
test_endpoint "POST" "/contact" false '{"name":"Test User","email":"test@example.com","message":"Test message"}'

# KYC endpoints
echo ""
echo "================================================================================"
echo "🆔 KYC ENDPOINTS"
echo "================================================================================"
test_endpoint "GET" "/kyc/status" true
test_endpoint "POST" "/kyc/start" true

# 2FA endpoints
echo ""
echo "================================================================================"
echo "🔒 2FA ENDPOINTS"
echo "================================================================================"
test_endpoint "GET" "/auth/2fa/status" true

# Print summary
echo ""
echo "================================================================================"
echo "📊 TEST SUMMARY"
echo "================================================================================"
echo "Total Tests: $TOTAL"
echo -e "${GREEN}✅ Passed:   $PASSED${NC}"
echo -e "${RED}❌ Failed:   $FAILED${NC}"
echo -e "${YELLOW}⏭️  Skipped:  $SKIPPED${NC}"

if [ $TOTAL -gt 0 ]; then
    success_rate=$(echo "scale=1; $PASSED * 100 / $TOTAL" | bc)
    echo ""
    echo "📈 Success Rate: ${success_rate}%"
fi

echo ""
echo "================================================================================"
echo "Completed at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "================================================================================"

exit $([ $FAILED -eq 0 ] && echo 0 || echo 1)

