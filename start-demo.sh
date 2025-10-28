#!/bin/bash

# NavEaze Demo Startup Script
# Starts backend, dashboard, and mobile app simultaneously

echo "🚀 Starting NavEaze Demo..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

echo -e "${BLUE}📂 Working directory: ${SCRIPT_DIR}${NC}"
echo ""

# Kill any existing processes on our ports
echo -e "${YELLOW}🧹 Cleaning up existing processes...${NC}"
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:19006 | xargs kill -9 2>/dev/null || true
sleep 2

# Function to start services
start_services() {
    # Start Backend
    echo -e "${GREEN}🖥️  Starting Backend (Port 3001)...${NC}"
    cd "$SCRIPT_DIR"
    npm run server:dev > /tmp/naveaze-backend.log 2>&1 &
    BACKEND_PID=$!
    echo "   Backend PID: $BACKEND_PID"
    
    # Start Dashboard
    echo -e "${GREEN}📊 Starting Dashboard (Port 5173)...${NC}"
    cd "$SCRIPT_DIR"
    npm run client:dev > /tmp/naveaze-dashboard.log 2>&1 &
    DASHBOARD_PID=$!
    echo "   Dashboard PID: $DASHBOARD_PID"
    
    # Start Mobile App
    echo -e "${GREEN}📱 Starting Mobile App (Port 19006)...${NC}"
    cd "$SCRIPT_DIR/mobile-app"
    npx expo start --web > /tmp/naveaze-mobile.log 2>&1 &
    MOBILE_PID=$!
    echo "   Mobile PID: $MOBILE_PID"
    
    echo ""
    echo -e "${YELLOW}⏳ Waiting for services to start...${NC}"
    sleep 10
    
    echo ""
    echo -e "${GREEN}✅ NavEaze Demo is running!${NC}"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}📊 B2B Dashboard:${NC}  http://localhost:5173"
    echo -e "${BLUE}📱 Mobile App:${NC}     http://localhost:19006"
    echo -e "${BLUE}🖥️  Backend API:${NC}    http://localhost:3001"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo -e "${YELLOW}📝 Logs:${NC}"
    echo "   Backend:   tail -f /tmp/naveaze-backend.log"
    echo "   Dashboard: tail -f /tmp/naveaze-dashboard.log"
    echo "   Mobile:    tail -f /tmp/naveaze-mobile.log"
    echo ""
    echo -e "${YELLOW}🛑 To stop all services:${NC}"
    echo "   Press Ctrl+C or run: ./stop-demo.sh"
    echo ""
    
    # Save PIDs for cleanup
    echo "$BACKEND_PID" > /tmp/naveaze-backend.pid
    echo "$DASHBOARD_PID" > /tmp/naveaze-dashboard.pid
    echo "$MOBILE_PID" > /tmp/naveaze-mobile.pid
    
    # Wait for Ctrl+C
    trap cleanup EXIT INT TERM
    
    # Keep script running
    wait
}

# Cleanup function
cleanup() {
    echo ""
    echo -e "${YELLOW}🛑 Stopping NavEaze Demo...${NC}"
    
    if [ -f /tmp/naveaze-backend.pid ]; then
        kill $(cat /tmp/naveaze-backend.pid) 2>/dev/null || true
        rm /tmp/naveaze-backend.pid
    fi
    
    if [ -f /tmp/naveaze-dashboard.pid ]; then
        kill $(cat /tmp/naveaze-dashboard.pid) 2>/dev/null || true
        rm /tmp/naveaze-dashboard.pid
    fi
    
    if [ -f /tmp/naveaze-mobile.pid ]; then
        kill $(cat /tmp/naveaze-mobile.pid) 2>/dev/null || true
        rm /tmp/naveaze-mobile.pid
    fi
    
    # Kill any remaining processes on our ports
    lsof -ti:3001 | xargs kill -9 2>/dev/null || true
    lsof -ti:5173 | xargs kill -9 2>/dev/null || true
    lsof -ti:19006 | xargs kill -9 2>/dev/null || true
    
    echo -e "${GREEN}✅ All services stopped${NC}"
    exit 0
}

# Start everything
start_services

