# Quick Start Guide

Welcome to Rocket Flight Digital Twin!

## First-Time Setup

```bash
# 1. Install Node.js dependencies
pnpm install

# 2. Build the telemetry processor (Java — required once before first run)
cd telemetry-processor && mvn clean package -DskipTests && cd ..
```

## Start Everything (One Command)

```bash
pnpm dev:all
```

Wait 10–15 seconds for all services to initialize, then open your browser.

## What Gets Started

`pnpm dev:all` runs `docker compose up -d` (infrastructure) followed by all Node.js services:

| Service | How | URL |
|---------|-----|-----|
| Kafka | Docker | — |
| PostgreSQL | Docker | `localhost:5432` |
| Telemetry Processor | Docker | http://localhost:8081/actuator/health |
| Kafka UI | Docker | http://localhost:8080 |
| Realtime Gateway | Node.js | http://localhost:4001/health |
| Rocket Simulator | Node.js | — |
| Mission Control UI | Node.js | http://localhost:3000 |

## Alternative: Script with Colored Output

```bash
./start-dev.sh
```

This script shows colored step-by-step progress, streams logs to `logs/*.log`, and saves process IDs for clean shutdown.

## Stopping Services

```bash
./stop-dev.sh
```

Or:

```bash
# Ctrl+C to stop Node.js services, then:
pnpm kafka:stop        # stops all Docker containers
```

## Troubleshooting

**"Docker is not running"**
- Start Docker Desktop, then retry

**"Port already in use"**

```bash
./stop-dev.sh
# or manually:
lsof -ti:3000,4001 | xargs kill -9
```

**"Kafka not ready" / services failing to connect**

```bash
# Check all containers are healthy
docker compose ps

# Stream Kafka logs
pnpm kafka:logs
```

**No telemetry in the UI**

```bash
# Quick health check
pnpm kafka:health
# kafka.connected should be true, msg_rate > 0
```

## Useful Commands

```bash
# View application logs (when started via start-dev.sh)
tail -f logs/*.log

# Check gateway health
curl http://localhost:4001/health | jq

# Check Kafka consumer lag
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --group telemetry-processor
```

For full documentation, see [README.md](../README.md)
