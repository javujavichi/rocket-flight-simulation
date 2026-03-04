# Rocket Flight Digital Twin

A real-time digital twin system for simulating and monitoring rocket launches. Features a distributed microservices architecture with event streaming, telemetry validation, data persistence, and live visualization.

## Table of Contents

- [Quick Start (One Command)](#quick-start-one-command)
- [Prerequisites](#prerequisites)
- [Running Services Individually](#running-services-individually)
- [Stopping Services](#stopping-services)
- [Available URLs](#available-urls)
- [Available Commands Reference](#available-commands-reference)
- [Troubleshooting](#troubleshooting)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Configuration](#configuration)
- [Development](#development)
- [Observability & Monitoring](#observability--monitoring)
- [Production Deployment](#production-deployment)

---

## Quick Start (One Command)

### First-Time Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Build the telemetry service (only needed once)
cd telemetry-service && mvn clean package && cd ..
```

### Start Everything

```bash
pnpm dev:all
```

This single command:
- Starts Kafka, PostgreSQL, and Kafka UI (Docker containers)
- Starts the Telemetry Service (validates and persists data)
- Starts the Rocket Simulator (generates telemetry)
- Starts the Realtime Gateway (WebSocket server)
- Starts the Mission Control UI (Next.js dashboard)

Wait 10-15 seconds for all services to initialize, then open http://localhost:3000

### Alternative: Using Shell Script

For detailed startup logs with colored output:

```bash
./start-dev.sh
```

---

## Prerequisites

| Requirement | Version | Purpose |
|-------------|---------|---------|
| Node.js | 18+ | UI, Gateway, Simulator |
| pnpm | Latest | Package manager |
| Java | 21+ | Telemetry Service |
| Maven | 3.9+ | Building Java services |
| Docker & Docker Compose | Latest | Infrastructure (Kafka, PostgreSQL) |

Verify your setup:

```bash
node --version    # Should be 18+
pnpm --version    # Any recent version
java --version    # Should be 21+
mvn --version     # Should be 3.9+
docker --version  # Any recent version
```

---

## Running Services Individually

When you need to run specific services for development or debugging:

### Infrastructure Only (Kafka, PostgreSQL, Telemetry Service)

```bash
docker compose up -d
```

Check infrastructure health:

```bash
docker compose ps
```

### Individual Node.js Services

| Service | Command | Port |
|---------|---------|------|
| Mission Control UI | `pnpm dev:ui` | 3000 |
| Realtime Gateway | `pnpm dev:gateway` | 4001 |
| Rocket Simulator | `pnpm dev:sim` | - |

Example workflow for debugging the gateway:

```bash
# Start infrastructure
docker compose up -d

# Run gateway in its own terminal (for log visibility)
pnpm dev:gateway

# Run simulator in another terminal
pnpm dev:sim

# Run UI in another terminal
pnpm dev:ui
```

### Rebuild and Restart Telemetry Service

```bash
cd telemetry-service && mvn clean package && cd ..
docker compose up -d --build telemetry-service
```

---

## Stopping Services

### Stop Everything

```bash
./stop-dev.sh
```

Or manually:

```bash
# Press Ctrl+C in the terminal running pnpm dev:all

# Stop Docker containers
docker compose down
```

### Stop Only Infrastructure (Keep Node.js Services)

```bash
docker compose down
```

### Stop Only Node.js Services (Keep Infrastructure)

```bash
# Press Ctrl+C in the terminal running pnpm dev:all
# Or kill by port:
lsof -ti:3000,4001 | xargs kill -9
```

---

## Available URLs

| Service | URL | Description |
|---------|-----|-------------|
| Mission Control Dashboard | http://localhost:3000 | Main web interface |
| About Page | http://localhost:3000/about | System information |
| Realtime Gateway Health | http://localhost:4001/health | Gateway status & metrics |
| Telemetry Service Health | http://localhost:8081/actuator/health | Java service health |
| Kafka UI | http://localhost:8080 | Browse Kafka topics & messages |
| PostgreSQL | `localhost:5432` | Database (user: postgres, pass: postgres) |

---

## Available Commands Reference

### Main Commands

| Command | Description |
|---------|-------------|
| `pnpm dev:all` | Start everything (infrastructure + all services) |
| `./start-dev.sh` | Start with detailed colored output |
| `./stop-dev.sh` | Stop all services |

### Individual Services

| Command | Description |
|---------|-------------|
| `pnpm dev:ui` | Start Mission Control UI (rocket-simulator-ui) |
| `pnpm dev:gateway` | Start Realtime Gateway only |
| `pnpm dev:sim` | Start Rocket Simulator only |

### Infrastructure

| Command | Description |
|---------|-------------|
| `docker compose up -d` | Start Kafka, PostgreSQL, Telemetry Service |
| `docker compose down` | Stop all Docker containers |
| `docker compose ps` | Check container health status |
| `docker compose logs -f <service>` | Stream logs for a service |

### Utilities

| Command | Description |
|---------|-------------|
| `pnpm kafka:health` | Check gateway health via curl |
| `pnpm kafka:logs` | Stream Kafka container logs |

---

## Troubleshooting

### Docker Issues

**"Docker is not running"**

```bash
# Start Docker Desktop, then retry
docker info  # Should not error
```

**Containers not healthy**

```bash
# Check container status
docker compose ps

# View specific container logs
docker compose logs kafka
docker compose logs postgres
docker compose logs telemetry-service

# Restart everything
docker compose down && docker compose up -d
```

### Port Conflicts

**"Port already in use"**

```bash
# Find what's using the port
lsof -i :3000
lsof -i :4001
lsof -i :8080

# Kill processes on common ports
lsof -ti:3000,4001 | xargs kill -9

# Or use stop script
./stop-dev.sh
```

### No Telemetry Data in UI

1. **Verify infrastructure is running:**
   ```bash
   docker compose ps
   # All containers should show "healthy"
   ```

2. **Check Kafka topics exist:**
   ```bash
   docker exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
   # Should show: rocket.telemetry.raw, rocket.telemetry.v1
   ```

3. **Verify gateway is connected:**
   ```bash
   curl http://localhost:4001/health | jq
   # kafka.connected should be true
   ```

4. **Check telemetry service logs:**
   ```bash
   docker compose logs -f telemetry-service
   # Should see "Consumed raw telemetry" messages
   ```

5. **Verify data is being persisted:**
   ```bash
   docker exec postgres psql -U postgres -d telemetry -c "SELECT COUNT(*) FROM telemetry;"
   ```

### WebSocket Connection Issues

**Check gateway health:**

```bash
curl http://localhost:4001/health
```

**Browser console shows WebSocket errors:**
- Open DevTools (F12) → Console
- The UI auto-reconnects with backoff (1s, 2s, 4s, 8s, max 10s)
- Status bar shows connection state

### Kafka Issues

**Check consumer group lag:**

```bash
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group telemetry-service
```

**Reset consumer offsets (if stuck):**

```bash
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group telemetry-service \
  --reset-offsets --to-latest --topic rocket.telemetry.raw --execute
```

### View Logs

```bash
# Docker container logs
docker compose logs -f kafka
docker compose logs -f telemetry-service

# Application logs (when using start-dev.sh)
tail -f logs/*.log
```

---

## System Architecture

```
┌─────────────────┐                           ┌──────────────────┐                           ┌──────────────────┐
│ Rocket Simulator│─────rocket.telemetry.raw─▶│Telemetry Service │────rocket.telemetry.v1───▶│ Realtime Gateway │
│   (Node.js/TS)  │       Kafka Topic         │  (Spring Boot)   │       Kafka Topic         │   (Node.js/TS)   │
│                 │                            │                  │                            │                  │
│ • Physics Sim   │                            │ • Validation     │                            │ • WebSocket      │
│ • Stage Control │                            │ • Normalization  │                            │ • Health API     │
│ • Telemetry Gen │                            │ • Phase Detection│                            └────────┬─────────┘
└─────────────────┘                            └────────┬─────────┘                                     │
                                                        │                                               │ WebSocket
                                                        ▼                                               │ 
                                                 ┌────────────┐                                         ▼
                                                 │ PostgreSQL │                                  ┌──────────────────┐
                                                 │  Database  │                                  │ Mission Control  │
                                                 │            │                                  │  Dashboard       │
                                                 │ • Indexed  │                                  │  (Next.js/React) │
                                                 │ • Queryable│                                  │                  │
                                                 └────────────┘                                  │ • Live Charts    │
                                                                                                  │ • Trajectory     │
                                                                                                  │ • Event Log      │
                                                                                                  └──────────────────┘
```

### Core Components

| Component | Technology | Purpose |
|-----------|------------|---------|
| Rocket Simulator | Node.js/TypeScript | Physics-based simulation producing raw telemetry |
| Telemetry Service | Spring Boot (Java 21) | Validation, normalization, persistence |
| PostgreSQL | PostgreSQL 16 | Time-series telemetry storage |
| Realtime Gateway | Node.js/TypeScript | WebSocket server streaming to clients |
| Mission Control | Next.js/React | Real-time dashboard visualization |

### Features Overview

**Simulation & Physics**
- Two-stage rocket simulation with configurable parameters
- Realistic physics (gravity, thrust, drag, stage separation)
- Live or simulation modes

**Data Pipeline**
- Event streaming via Apache Kafka with partitioned topics
- Telemetry validation with configurable thresholds
- Flight phase detection (LIFTOFF, ASCENT, MAX_Q, STAGE_SEPARATION, ORBIT)
- PostgreSQL persistence with indexed queries

**Real-time Visualization**
- Live charts (altitude, velocity, acceleration, thrust, fuel)
- Animated trajectory view (Earth to orbit)
- Event log with mission milestones
- Connection monitoring with auto-reconnect

## Project Structure

```
rocket-flight-digital-twin/
├── rocket-simulator-ui/            # Mission Control dashboard (Next.js)
│   ├── app/                        # Next.js App Router pages
│   ├── components/                 # React components & shadcn/ui
│   ├── hooks/                      # WebSocket and utility hooks
│   ├── lib/                        # Types, simulation engine, utils
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   ├── tsconfig.json
│   ├── Dockerfile
│   └── package.json
├── rocket-sim/                     # Rocket simulator service (Node.js)
│   ├── src/
│   │   ├── index.ts                # Kafka producer entry point
│   │   └── simulation.ts           # Physics engine
│   └── package.json
├── realtime-gateway/               # WebSocket gateway (Node.js)
│   ├── src/
│   │   └── index.ts                # Kafka consumer + WebSocket server
│   └── package.json
├── telemetry-service/              # Telemetry validation service (Spring Boot)
│   ├── src/main/java/              # Java source
│   ├── src/main/resources/
│   │   └── application.yml
│   └── pom.xml
├── docs/                           # Documentation
│   ├── kafka-high-level.md         # Kafka architecture concepts
│   ├── OrlandoDevOps.md            # Failure scenarios & operational testing
│   ├── QUICK_START.md              # Condensed quick start
│   └── OBSERVABILITY_TESTING.md    # Observability guide
├── docker-compose.yml              # Infrastructure (Kafka, PostgreSQL, services)
├── package.json                    # Monorepo orchestration scripts
├── start-dev.sh                    # Startup script with colored output
├── stop-dev.sh                     # Shutdown script
└── README.md
```

## How It Works

### Data Flow

1. **Rocket Simulator** generates telemetry at 10Hz based on physics calculations
2. **Publishes** raw telemetry to Kafka topic `rocket.telemetry.raw`
3. **Telemetry Service** consumes raw events, validates, normalizes, and enriches them
4. **Persists** validated telemetry to PostgreSQL with indexed timestamps
5. **Publishes** normalized telemetry to Kafka topic `rocket.telemetry.v1`
6. **Realtime Gateway** consumes validated events and broadcasts via WebSocket
7. **Mission Control** receives real-time updates and renders charts/visualizations

### 1. Rocket Simulator (Node.js)

Physics-based simulation calculating:
- **Altitude** via velocity integration over time
- **Velocity** from net forces (thrust - gravity - drag)
- **Acceleration** from thrust-to-mass ratio
- **Fuel consumption** based on burn rate and throttle
- **Flight phases** (pre-launch → stage 1 ascent → stage separation → stage 2 ascent → orbit)

Publishes raw telemetry to Kafka `rocket.telemetry.raw` at 10Hz (100ms intervals).

### 2. Telemetry Service (Spring Boot)

Processes raw telemetry through validation pipeline:
- **Consumes** from `rocket.telemetry.raw` with manual acknowledgment
- **Validates** telemetry against configurable thresholds:
  - Altitude: 0-200,000m
  - Velocity: 0-10,000 m/s
  - Thrust: 0-10,000,000 N
  - Propellant: 0-350,000 kg
  - Throttle: 0.0-1.0
- **Detects flight phase** based on altitude and T+ time:
  - LIFTOFF (T+0 to T+5s)
  - ASCENT_STAGE1 (altitude < 70km)
  - MAX_Q (around 10-15km altitude)
  - STAGE_SEPARATION (T+150s)
  - ASCENT_STAGE2 (70km-100km)
  - ORBIT_INSERTION (approaching 100km)
  - ORBIT (altitude > 100km)
- **Enriches** telemetry with:
  - `phase`: Calculated flight phase
  - `isValid`: Boolean validation result
  - `validationErrors`: Array of error messages
  - `processedAt`: Timestamp of processing
  - `version`: Contract version ("v1")
- **Persists** to PostgreSQL with indexes on `flight_id`, `timestamp`, `t_plus_ms`
- **Publishes** normalized `TelemetryV1` events to `rocket.telemetry.v1`

### 3. Realtime Gateway (Node.js)

WebSocket server bridging Kafka and browser clients:
- **Consumes** from `rocket.telemetry.v1` topic
- **Maintains** WebSocket connections at `/ws` endpoint
- **Broadcasts** telemetry to all connected clients in real-time
- **Exposes** `/health` endpoint with metrics:
  - Kafka connection status and message rates
  - WebSocket client count
  - Last message timestamp and offset
  - Service uptime
- **Logs** structured JSON with partition/offset/correlation IDs

### 4. Mission Control Dashboard (Next.js + React)

Interactive web interface with:
- **Mode switcher**: Toggle between Simulation and Live modes
- **Parameter controls**: Adjust rocket mass, thrust, burn duration (simulation mode only)
- **Real-time charts**: Altitude, velocity, acceleration, thrust, propellant
- **Trajectory visualization**: Animated rocket position from Earth to orbit
- **Event log**: Mission milestones (ignition, liftoff, MAX-Q, MECO, stage separation, orbit insertion)
- **Status monitoring**: Connection health, message rate, telemetry freshness warnings
- **Auto-reconnect**: Exponential backoff WebSocket reconnection (1s, 2s, 4s, 8s, max 10s)

---

## Configuration

### Environment Variables

**Rocket Simulator** (`rocket-sim/.env`):
```env
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC=rocket.telemetry.raw
```

**Realtime Gateway** (`realtime-gateway/.env`):
```env
KAFKA_BOOTSTRAP_SERVERS=localhost:9092
KAFKA_TOPIC=rocket.telemetry.v1
KAFKA_GROUP_ID=realtime-gateway
PORT=4001
```

**Telemetry Service** (`telemetry-service/src/main/resources/application.yml`):
```yaml
spring:
  kafka:
    bootstrap-servers: kafka:19092
    consumer:
      group-id: telemetry-service
      auto-offset-reset: latest
    producer:
      acks: all
  datasource:
    url: jdbc:postgresql://postgres:5432/telemetry
    username: postgres
    password: postgres
```

**Mission Control Dashboard** (`.env.local`):
```env
NEXT_PUBLIC_WS_URL=ws://localhost:4001/ws
```

---

## Development

### Customizing Simulation Parameters

Parameters can be adjusted in the UI (simulation mode) or by editing [lib/simulation-engine.ts](lib/simulation-engine.ts):

**Stage 1:**
- `s1MaxThrustN`: Maximum thrust (Newtons)
- `s1PropellantKg`: Initial propellant mass (kg)
- `s1DryMassKg`: Stage dry mass without propellant (kg)
- `s1BurnDurationMs`: Burn duration (milliseconds)

**Stage 2:**
- `s2MaxThrustN`: Maximum thrust (Newtons)
- `s2PropellantKg`: Initial propellant mass (kg)
- `s2DryMassKg`: Stage dry mass (kg)
- `s2IgnitionMs`: Stage 2 ignition time (ms after launch)
- `s2BurnDurationMs`: Burn duration (milliseconds)
- `payloadMassKg`: Payload mass (kg)

### Adding New Telemetry Fields

1. Update raw contract in `rocket-sim/src/simulation.ts`
2. Add to validation service `telemetry-service/.../dto/TelemetryRaw.java`
3. Add to normalized contract `TelemetryV1.java`
4. Update validation logic in `TelemetryValidationService.java`
5. Update entity in `TelemetryEntity.java` for persistence
6. Update UI types in `lib/telemetry-types.ts`
7. Add to charts in `components/telemetry-chart.tsx`

### Modifying Validation Rules

Edit `telemetry-service/src/main/resources/application.yml`:

```yaml
validation:
  thresholds:
    altitude:
      min: 0
      max: 200000
    velocity:
      min: 0
      max: 10000
```

---

## Observability & Monitoring

### Health Endpoints

**Realtime Gateway:**
```bash
curl http://localhost:4001/health
```

**Telemetry Service:**
```bash
curl http://localhost:8081/actuator/health
```

### Database Queries

```bash
# View recent telemetry
docker exec postgres psql -U postgres -d telemetry -c \
  "SELECT flight_id, t_plus_ms, altitude_m, velocity_ms, phase FROM telemetry ORDER BY timestamp DESC LIMIT 10;"

# Count records by flight
docker exec postgres psql -U postgres -d telemetry -c \
  "SELECT flight_id, COUNT(*) FROM telemetry GROUP BY flight_id;"

# Check invalid records
docker exec postgres psql -U postgres -d telemetry -c \
  "SELECT COUNT(*) FROM telemetry WHERE is_valid = false;"
```

### Structured Logs

All services output structured JSON:

**Gateway:**
```json
{"level":"info","msg":"kafka_message","flightId":"FLT-12345","tPlusMs":15320,"partition":2,"offset":"12345","clients":1}
```

**Simulator:**
```json
{"level":"info","msg":"producing","flightId":"FLT-12345","tPlusMs":15000,"altitude":45230,"velocity":1523}
```

---

## Performance

| Metric | Value |
|--------|-------|
| Telemetry Rate | 10 events/second (100ms intervals) |
| End-to-End Latency | ~100-200ms |
| WebSocket Latency | <50ms typical |
| Database Throughput | ~10 inserts/second |
| Kafka Partitions | 3 per topic |
| UI Render Rate | 60fps |

---

## Technology Stack

| Layer | Technologies |
|-------|--------------|
| Frontend | Next.js 15, React 19, TypeScript, Recharts, shadcn/ui, Tailwind CSS |
| Backend | Node.js 18+ (Simulator, Gateway), Spring Boot 3.2.3, Java 21 |
| Infrastructure | Apache Kafka 3.7.0 (KRaft), PostgreSQL 16, Docker Compose |
| Communication | WebSocket, Kafka pub/sub |

---

## Production Deployment

For production deployment, consider:

1. **Infrastructure**: Managed Kafka (Confluent, MSK), managed PostgreSQL (RDS, Cloud SQL), Kubernetes
2. **Security**: OAuth2/JWT auth, TLS for Kafka, WSS for WebSocket, API gateway with rate limiting
3. **Scaling**: Horizontal gateway scaling, increase Kafka partitions, connection pooling
4. **Monitoring**: Prometheus/Grafana, distributed tracing (Jaeger, Zipkin), consumer lag alerts
5. **Data Management**: Retention policies, database backups, Kafka log retention, cold storage archival

---

## Additional Documentation

- [docs/OrlandoDevOps.md](docs/OrlandoDevOps.md) - Failure scenarios and operational testing
- [docs/QUICK_START.md](docs/QUICK_START.md) - Condensed quick start guide
- [docs/kafka-high-level.md](docs/kafka-high-level.md) - Kafka architecture concepts
- [rocket-simulator-ui/README.md](rocket-simulator-ui/README.md) - Mission Control UI details
- [rocket-sim/README.md](rocket-sim/README.md) - Simulator service details
- [realtime-gateway/README.md](realtime-gateway/README.md) - Gateway service details
- [telemetry-service/README.md](telemetry-service/README.md) - Telemetry service details

---

## License

MIT

---

Made with ❤️ by Javiera Laso
