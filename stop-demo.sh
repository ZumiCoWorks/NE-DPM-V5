#!/bin/bash

# NavEaze Demo Stop Script
# Stops all demo services

echo "🛑 Stopping NavEaze Demo..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Kill processes by PID files
if [ -f /tmp/naveaze-backend.pid ]; then
    echo -e "${YELLOW}Stopping Backend...${NC}"
    kill $(cat /tmp/naveaze-backend.pid) 2>/dev/null || true
    rm /tmp/naveaze-backend.pid
fi

if [ -f /tmp/naveaze-dashboard.pid ]; then
    echo -e "${YELLOW}Stopping Dashboard...${NC}"
    kill $(cat /tmp/naveaze-dashboard.pid) 2>/dev/null || true
    rm /tmp/naveaze-dashboard.pid
fi

if [ -f /tmp/naveaze-mobile.pid ]; then
    echo -e "${YELLOW}Stopping Mobile App...${NC}"
    kill $(cat /tmp/naveaze-mobile.pid) 2>/dev/null || true
    rm /tmp/naveaze-mobile.pid
fi

# Kill any remaining processes on our ports
echo -e "${YELLOW}Cleaning up ports...${NC}"
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
lsof -ti:19006 | xargs kill -9 2>/dev/null || true

# Clean up log files
rm -f /tmp/naveaze-*.log 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ All services stopped successfully${NC}"

