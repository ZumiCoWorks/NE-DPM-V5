#!/bin/bash

# NavEaze PWA Testing Script
# This script helps test the Progressive Web Apps for mobile functionality

echo "🚀 NavEaze PWA Testing Setup"
echo "=================================="

# Check if the web app is running
if ! curl -s http://localhost:3001 > /dev/null; then
    echo "❌ Web app is not running on http://localhost:3001"
    echo "Please start the web app first with: cd dpm-web && npm run dev"
    exit 1
fi

echo "✅ Web app is running on http://localhost:3001"

# Test PWA endpoints
echo ""
echo "📱 Testing PWA Endpoints..."
echo "=================================="

# Test attendee PWA
echo "Testing Attendee PWA: http://localhost:3001/mobile/attendee"
curl -s -o /dev/null -w "Attendee PWA: %{http_code}\n" http://localhost:3001/mobile/attendee

# Test staff PWA
echo "Testing Staff PWA: http://localhost:3001/mobile/staff"
curl -s -o /dev/null -w "Staff PWA: %{http_code}\n" http://localhost:3001/mobile/staff

# Test PWA manifests
echo ""
echo "📋 Testing PWA Manifests..."
echo "=================================="

echo "Testing Attendee Manifest: http://localhost:3001/attendee-manifest.json"
curl -s http://localhost:3001/attendee-manifest.json | jq -r '.name'

echo "Testing Staff Manifest: http://localhost:3001/staff-manifest.json"
curl -s http://localhost:3001/staff-manifest.json | jq -r '.name'

# Test service worker
echo ""
echo "⚙️  Testing Service Worker..."
echo "=================================="

echo "Testing Service Worker: http://localhost:3001/sw.js"
curl -s -o /dev/null -w "Service Worker: %{http_code}\n" http://localhost:3001/sw.js

echo ""
echo "🎯 PWA Testing Instructions"
echo "=================================="
echo "1. Open Chrome DevTools → Application → Manifest"
echo "2. Check that both manifests load correctly"
echo "3. Test 'Add to Home Screen' functionality"
echo "4. Test offline mode by going offline in DevTools"
echo "5. Test camera access for QR scanning"
echo ""
echo "📱 Mobile Testing URLs:"
echo "Attendee App: http://localhost:3001/mobile/attendee"
echo "Staff App: http://localhost:3001/mobile/staff"
echo ""
echo "🔧 To test on mobile device:"
echo "1. Make sure your phone is on same network"
echo "2. Find your computer's IP: ifconfig | grep inet"
echo "3. Access: http://[YOUR-IP]:3001/mobile/attendee"
echo "4. Install as PWA on your phone"
echo ""
echo "✨ All PWA components are ready for testing!"