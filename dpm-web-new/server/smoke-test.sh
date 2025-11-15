#!/bin/bash

# DPM Web Smoke Test Script
# Tests API endpoints and basic functionality

echo "🧪 DPM Web Smoke Test"
echo "===================="

# Check if API_URL is set
if [ -z "$API_URL" ]; then
    API_URL="http://localhost:3002/api"
    echo "Using default API_URL: $API_URL"
fi

echo "Testing API endpoints..."
echo ""

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s -X GET "$API_URL/health" | jq '.'
echo ""

# Test auth endpoints (if credentials provided)
if [ -n "$TEST_EMAIL" ] && [ -n "$TEST_PASSWORD" ]; then
    echo "2. Testing authentication..."
    
    # Login
    echo "   Login test..."
    LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
    
    echo "   Response: $LOGIN_RESPONSE"
    
    # Extract token if login successful
    ACCESS_TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.accessToken // empty')
    
    if [ -n "$ACCESS_TOKEN" ] && [ "$ACCESS_TOKEN" != "null" ]; then
        echo "   ✅ Login successful"
        echo ""
        
        # Test dashboard stats
        echo "3. Testing dashboard stats..."
        curl -s -X GET "$API_URL/dashboard/stats" \
            -H "Authorization: Bearer $ACCESS_TOKEN" | jq '.'
        echo ""
        
        # Test venues endpoint
        echo "4. Testing venues endpoint..."
        curl -s -X GET "$API_URL/venues" | jq '.'
        echo ""
        
        # Test events endpoint
        echo "5. Testing events endpoint..."
        curl -s -X GET "$API_URL/events" | jq '.'
        echo ""
        
    else
        echo "   ❌ Login failed"
        echo ""
    fi
else
    echo "2. Skipping auth tests (no credentials provided)"
    echo "   Set TEST_EMAIL and TEST_PASSWORD to test authentication"
    echo ""
fi

echo "✅ Smoke test completed!"
echo ""
echo "Next steps:"
echo "1. Set up your Supabase project"
echo "2. Configure environment variables"
echo "3. Apply database migrations"
echo "4. Test with real credentials:"
echo "   TEST_EMAIL=your@email.com TEST_PASSWORD=yourpass $0"