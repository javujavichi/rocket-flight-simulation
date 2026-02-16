# Quick Start Guide

Welcome to Rocket Flight Digital Twin! 🚀

## Fastest Way to Get Started

1. **Clone and Install:**
   ```bash
   cd rocket-flight-simulation
   pnpm install
   ```

2. **Start Everything:**
   ```bash
   pnpm dev:all
   ```

   That's it! Wait 10-15 seconds for all services to start.

3. **Open your browser:**
   - Dashboard: http://localhost:3000
   - About Page: http://localhost:3000/about

## What Gets Started

When you run `pnpm dev:all`, these services start automatically:

✅ **Kafka** (Docker container) - Event streaming platform
✅ **Realtime Gateway** - WebSocket server on port 4001
✅ **Rocket Simulator** - Physics simulation engine
✅ **Mission Control UI** - Next.js dashboard on port 3000

## Alternative: Better Output

For more detailed startup logs:

```bash
./start-dev.sh
```

This script:
- Shows colored progress for each step
- Displays service URLs
- Streams logs to both console and files
- Saves process IDs for easy stopping

## Stopping Services

```bash
./stop-dev.sh
```

Or use:
```bash
pnpm kafka:stop
```

## Troubleshooting

**"Docker is not running"**
- Start Docker Desktop before running commands

**"Port already in use"**
- Stop existing services: `./stop-dev.sh`
- Or manually kill: `lsof -ti:3000,4001 | xargs kill`

**"Kafka not ready"**
- Wait 10-15 seconds after starting
- Check: `docker compose ps`
- View logs: `pnpm kafka:logs`

## Additional Commands

View logs in real-time:
```bash
tail -f logs/*.log
```

Check gateway health:
```bash
curl http://localhost:4001/health | jq
```

For full documentation, see [README.md](README.md)
