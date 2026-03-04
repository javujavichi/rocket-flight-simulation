#!/bin/bash

# Rocket Flight Digital Twin - Development Startup Script
# This script starts all services needed for local development

set -e

echo "🚀 Rocket Flight Digital Twin - Starting Development Environment"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Error: Docker is not running. Please start Docker Desktop and try again."
  exit 1
fi

echo "✅ Docker is running"
echo ""

# Step 1: Start Kafka
echo "${CYAN}[1/4] Starting Kafka...${NC}"
docker compose up -d

# Wait for Kafka to be healthy
echo "${YELLOW}⏳ Waiting for Kafka to be ready...${NC}"
while ! docker compose ps | grep -q "healthy"; do
  echo "   Checking Kafka health..."
  sleep 2
done
echo "${GREEN}✅ Kafka is ready!${NC}"
echo ""

# Step 2: Start Realtime Gateway
echo "${CYAN}[2/4] Starting Realtime Gateway...${NC}"
cd realtime-gateway
pnpm dev > ../logs/gateway.log 2>&1 &
GATEWAY_PID=$!
echo "${GREEN}✅ Gateway started (PID: $GATEWAY_PID)${NC}"
cd ..
echo ""

# Step 3: Start Rocket Simulator
echo "${CYAN}[3/4] Starting Rocket Simulator...${NC}"
cd telemetry-flight-simulator
pnpm dev > ../logs/simulator.log 2>&1 &
SIM_PID=$!
echo "${GREEN}✅ Simulator started (PID: $SIM_PID)${NC}"
cd ..
echo ""

# Step 4: Start Mission Control UI
echo "${CYAN}[4/4] Starting Mission Control UI...${NC}"
cd mission-control-ui
pnpm dev > ../logs/ui.log 2>&1 &
UI_PID=$!
echo "${GREEN}✅ UI started (PID: $UI_PID)${NC}"
cd ..
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🎉 All services started successfully!"
echo ""
echo "📍 Services running at:"
echo "   • Mission Control: ${CYAN}http://localhost:3000${NC}"
echo "   • About Page:      ${CYAN}http://localhost:3000/about${NC}"
echo "   • Gateway Health:  ${CYAN}http://localhost:4001/health${NC}"
echo "   • Kafka UI:        ${CYAN}http://localhost:8080${NC}"
echo ""
echo "💡 Tips:"
echo "   • View logs: ${YELLOW}tail -f logs/*.log${NC}"
echo "   • Stop Kafka: ${YELLOW}pnpm kafka:stop${NC}"
echo "   • View Kafka logs: ${YELLOW}pnpm kafka:logs${NC}"
echo ""
echo "📝 Process IDs saved:"
echo "   • Gateway: $GATEWAY_PID"
echo "   • Simulator: $SIM_PID"
echo "   • UI: $UI_PID"
echo ""
echo "To stop all services:"
echo "   ${YELLOW}kill $GATEWAY_PID $SIM_PID $UI_PID && pnpm kafka:stop${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Press Ctrl+C to stop watching. Services will continue in background."
echo ""

# Store PIDs for cleanup
echo "$GATEWAY_PID $SIM_PID $UI_PID" > .dev-pids

# Follow logs
tail -f logs/*.log
