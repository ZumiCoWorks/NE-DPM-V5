#!/bin/bash

# DPM Pilot System - Local Startup Script
# For November 21st presentation preparation

echo "🚀 Starting DPM Pilot System - Campus Setup"
echo "=========================================="

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js first."
    exit 1
fi

# Navigate to the main project
cd /Users/zumiww/Documents/NE DPM V5/dpm-web

echo "📦 Installing dependencies..."
npm install

echo "🌐 Starting backend server..."
npm run server:dev &
SERVER_PID=$!

# Wait a moment for server to start
sleep 3

echo "📱 Starting frontend client..."
npm run client:dev &
CLIENT_PID=$!

echo ""
echo "✅ DPM System is now running!"
echo ""
echo "🎯 Access Points:"
echo "   • Main App:     http://localhost:5173"
echo "   • API Health:   http://localhost:3001/api/health"
echo "   • Attendee PWA: http://localhost:5173/mobile/attendee"
echo "   • Staff PWA:    http://localhost:5173/mobile/staff"
echo ""
echo "🔧 Test Endpoints:"
echo "   • QR Nodes:     http://localhost:3001/api/editor/qr-nodes?event_id=550e8400-e29b-41d4-a716-446655440000"
echo "   • Create Lead:  curl -X POST http://localhost:3001/api/leads -H 'Content-Type: application/json' -d '{\"full_name\":\"Test User\",\"email\":\"test@example.com\",\"company\":\"Test Company\"}'"
echo ""
echo "⚠️  To stop everything: Press Ctrl+C or run: kill $SERVER_PID $CLIENT_PID"
echo ""
echo "🎉 Ready for November 21st pilot!"

# Keep script running
wait