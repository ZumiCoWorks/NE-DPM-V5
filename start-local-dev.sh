#!/bin/bash

# 🚀 DPM Local Development Startup Script
# This script helps you run all three DPM apps locally

echo "🚀 Starting DPM Local Development Environment..."
echo "================================================"

# Check if backend is already running
if curl -s http://localhost:3001/api/health > /dev/null; then
    echo "✅ Backend API is already running on port 3001"
else
    echo "❌ Backend API is not running. Please start it first:"
    echo "   cd /Users/zumiww/Documents/NE\\ DPM\\ V5/dpm-web && npm run dev"
    exit 1
fi

# Function to start mobile app
start_mobile_app() {
    local app_name=$1
    local app_dir=$2
    
    echo "📱 Starting $app_name..."
    cd "$app_dir" || exit 1
    
    if [ ! -d "node_modules" ]; then
        echo "📦 Installing dependencies for $app_name..."
        npm install
    fi
    
    echo "🚀 Starting Expo for $app_name..."
    echo "   Scan the QR code with your phone to open in Expo Go app"
    echo "   Make sure your phone and computer are on the same WiFi network"
    expo start --tunnel
}

# Menu for user selection
echo ""
echo "Select which mobile app to start:"
echo "1. Attendee Mobile App (for attendees to scan QR codes)"
echo "2. Staff Mobile App (for staff to capture leads)"
echo "3. Both Mobile Apps (requires two terminals)"
echo "4. Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        start_mobile_app "Attendee Mobile App" "/Users/zumiww/Documents/NE DPM V5/attendee-mobile"
        ;;
    2)
        start_mobile_app "Staff Mobile App" "/Users/zumiww/Documents/NE DPM V5/staff-mobile"
        ;;
    3)
        echo "🔄 Starting both mobile apps..."
        echo "⚠️  You'll need to open two separate terminals for this:"
        echo ""
        echo "Terminal 1 - Attendee App:"
        echo "   cd /Users/zumiww/Documents/NE\\ DPM\\ V5/attendee-mobile && npm install && expo start --tunnel"
        echo ""
        echo "Terminal 2 - Staff App:"
        echo "   cd /Users/zumiww/Documents/NE\\ DPM\\ V5/staff-mobile && npm install && expo start --tunnel"
        echo ""
        read -p "Press Enter when you have both terminals ready..."
        ;;
    4)
        echo "👋 Exiting..."
        exit 0
        ;;
    *)
        echo "❌ Invalid choice. Please run the script again."
        exit 1
        ;;
esac