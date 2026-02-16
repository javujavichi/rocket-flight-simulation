#!/bin/bash

# Stop all development services

echo "🛑 Stopping Rocket Flight Digital Twin services..."

# Read PIDs if they exist
if [ -f .dev-pids ]; then
  PIDS=$(cat .dev-pids)
  echo "Stopping processes: $PIDS"
  kill $PIDS 2>/dev/null || true
  rm .dev-pids
  echo "✅ All Node.js services stopped"
else
  echo "⚠️  No PID file found. Killing by port..."
  # Kill by port as fallback
  lsof -ti:3000 | xargs kill -9 2>/dev/null || true
  lsof -ti:4001 | xargs kill -9 2>/dev/null || true
fi

# Stop Kafka
echo "Stopping Kafka..."
docker compose down
echo "✅ Kafka stopped"

echo ""
echo "🎉 All services stopped successfully!"
