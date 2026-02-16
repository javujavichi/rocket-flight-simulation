# Rocket Flight Digital Twin

A real-time digital twin system for simulating and monitoring rocket launches. Features a distributed microservices architecture with event streaming, telemetry validation, data persistence, and live visualization.

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

## Core Components

1. **Rocket Simulator** - Physics-based simulation engine producing raw telemetry
2. **Telemetry Service** - Spring Boot microservice for validation, normalization, and persistence
3. **PostgreSQL** - Time-series telemetry storage with indexed queries
4. **Realtime Gateway** - WebSocket server streaming validated telemetry to clients
5. **Mission Control Dashboard** - Next.js web application with real-time visualization

## Features

### Simulation & Physics
- **Two-stage rocket simulation** with configurable parameters (mass, thrust, burn duration)
- **Realistic physics** including gravity, thrust, drag, and stage separation
- **Live or simulation modes** - run physics simulation or connect to real telemetry sources

### Data Pipeline
- **Event streaming** via Apache Kafka with partitioned topics
- **Telemetry validation** with configurable thresholds (altitude, velocity, thrust, propellant)
- **Data normalization** to TelemetryV1 contract with enriched fields
- **Flight phase detection** (LIFTOFF, ASCENT, MAX_Q, STAGE_SEPARATION, ORBIT_INSERTION, ORBIT)
- **PostgreSQL persistence** with indexed time-series storage for historical queries

### Real-time Visualization
- **Interactive dashboard** with live charts for altitude, velocity, acceleration, thrust, fuel
- **Animated trajectory view** showing rocket position from Earth to orbit
- **Event log** displaying mission milestones (ignition, MECO, stage sep, apogee)
- **Connection monitoring** with auto-reconnect and health indicators
- **Message rate tracking** and telemetry freshness warnings

### Observability
- **Health endpoints** exposing Kafka, database, and WebSocket metrics
- **Structured JSON logging** with correlation IDs and partition/offset tracking
- **Configurable parameters** via UI controls in simulation mode
- **Status bar** with real-time connection health and telemetry stats

## Prerequisites

- **Node.js 18+** - For UI, gateway, and simulator services
- **Java 21+** - For Spring Boot telemetry service
- **Maven 3.9+** - For building Java services
- **Docker & Docker Compose** - For infrastructure (Kafka, PostgreSQL)
- **pnpm** - Package manager for Node.js services

## Quick Start

### 🚀 Complete System Startup

1. **Build the telemetry service:**
```bash
cd telemetry-service
mvn clean package
cd ..
```

2. **Start infrastructure (Kafka, PostgreSQL, Telemetry Service):**
```bash
docker compose up -d
```

3. **Wait for services to be healthy:**
```bash
docker compose ps
# All services should show "healthy" status
```

4. **Start application services:**
```bash
pnpm install
pnpm dev:all
```

This starts the simulator, gateway, and UI concurrently.

**Services will be available at:**
- 🎯 **Mission Control Dashboard**: http://localhost:3000
- 🔌 **Realtime Gateway Health**: http://localhost:4001/health
- 🩺 **Telemetry Service Health**: http://localhost:8081/actuator/health
- 📊 **Kafka UI**: http://localhost:8080
- 🗄️ **PostgreSQL**: localhost:5432 (postgres/postgres)

### 🛑 Stopping Services

```bash
# Stop application services (Ctrl+C in terminal running pnpm dev:all)

# Stop infrastructure
docker compose down
```

## Project Structure

```
.
├── app/                            # Next.js app directory
│   ├── page.tsx                    # Main dashboard page
│   ├── layout.tsx                  # Root layout with theme provider
│   └── globals.css                 # Mission control theme
├── components/                     # React components
│   ├── mission-dashboard.tsx       # Main orchestration component
│   ├── mission-header.tsx          # Mode switcher and controls
│   ├── simulation-config.tsx       # Parameter configuration panel
│   ├── telemetry-chart.tsx         # Real-time chart component
│   ├── event-log.tsx               # Mission events display
│   └── ui/                         # shadcn/ui components
├── hooks/
│   └── use-telemetry-stream.ts     # WebSocket hook with auto-reconnect
├── lib/
│   ├── telemetry-types.ts          # Shared TypeScript types
│   ├── simulation-engine.ts        # Physics simulation logic
│   └── utils.ts                    # Utility functions
├── rocket-sim/                     # Rocket simulator service (Node.js)
│   ├── src/
│   │   ├── index.ts                # Main entry point
│   │   └── simulation.ts           # Physics engine
│   ├── package.json
│   └── tsconfig.json
├── realtime-gateway/               # WebSocket gateway (Node.js)
│   ├── src/
│   │   └── index.ts                # WebSocket + Kafka consumer
│   ├── package.json
│   └── tsconfig.json
├── telemetry-service/              # Validation service (Spring Boot)
│   ├── src/main/java/com/rocketdemo/telemetry/
│   │   ├── TelemetryServiceApplication.java
│   │   ├── dto/                    # Data transfer objects
│   │   │   ├── TelemetryRaw.java   # Raw input contract
│   │   │   └── TelemetryV1.java    # Validated output contract
│   │   ├── service/                # Business logic
│   │   │   ├── TelemetryValidationService.java
│   │   │   └── TelemetryPersistenceService.java
│   │   ├── kafka/                  # Kafka integration
│   │   │   ├── TelemetryConsumer.java
│   │   │   └── TelemetryProducer.java
│   │   ├── entity/                 # JPA entities
│   │   │   └── TelemetryEntity.java
│   │   ├── repository/             # Data access
│   │   │   └── TelemetryRepository.java
│   │   └── config/                 # Spring configuration
│   │       ├── KafkaConfig.java
│   │       └── JacksonConfig.java
│   ├── src/main/resources/
│   │   └── application.yml         # Service configuration
│   ├── pom.xml                     # Maven dependencies
│   ├── Dockerfile                  # Multi-stage build
│   └── README.md                   # Service documentation
└── docker-compose.yml              # Infrastructure orchestration
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

## Configuration

### Available Scripts

**Full Stack:**
- `pnpm dev:all` - Start all Node.js services (Gateway + Simulator + UI)
- Individual services must be started separately (see Quick Start)

**Development:**
- `pnpm dev` - Start Next.js UI only
- `pnpm dev:gateway` - Start Realtime Gateway only
- `pnpm dev:sim` - Start Rocket Simulator only

**Infrastructure:**
- `docker compose up -d` - Start infrastructure (Kafka, PostgreSQL, Telemetry Service)
- `docker compose down` - Stop all infrastructure services
- `docker compose ps` - Check service health status
- `docker compose logs -f <service>` - View logs for specific service

**Production:**
- `pnpm build` - Build Next.js for production
- `pnpm start` - Start production Next.js server
- `cd telemetry-service && mvn clean package` - Build telemetry service JAR

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

## Development

### Customizing Simulation Parameters

Parameters can be adjusted in the UI (simulation mode) or by editing `lib/simulation-engine.ts`:

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

1. **Update raw contract** in `rocket-sim/src/simulation.ts`:
```typescript
interface TelemetryRaw {
  // existing fields...
  newField: number;
}
```

2. **Add to validation service** `telemetry-service/src/main/java/.../dto/TelemetryRaw.java`:
```java
@NotNull
private Double newField;
```

3. **Add to normalized contract** `TelemetryV1.java`:
```java
@Min(0)
@Max(1000)
private Double newField;
```

4. **Update validation logic** in `TelemetryValidationService.java`

5. **Update entity** in `TelemetryEntity.java` for persistence

6. **Update UI types** in `lib/telemetry-types.ts`

7. **Add to charts** in `components/telemetry-chart.tsx`

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
    # Add custom thresholds...
```

## Observability & Monitoring

### Health Endpoints

**Realtime Gateway:**
```bash
curl http://localhost:4001/health
```
Returns:
```json
{
  "status": "ok",
  "kafka": {
    "connected": true,
    "topic": "rocket.telemetry.v1",
    "groupId": "realtime-gateway",
    "lastMessageTs": "2026-02-15T22:10:05.123Z",
    "messagesPerSecond": 10.2
  },
  "ws": {
    "clients": 2
  },
  "uptimeSeconds": 120
}
```

**Telemetry Service:**
```bash
curl http://localhost:8081/actuator/health
```
Returns:
```json
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "kafka": {"status": "UP"},
    "diskSpace": {"status": "UP"}
  }
}
```

### Database Queries

**View recent telemetry:**
```bash
docker exec postgres psql -U postgres -d telemetry -c \
  "SELECT flight_id, t_plus_ms, altitude_m, velocity_ms, phase FROM telemetry ORDER BY timestamp DESC LIMIT 10;"
```

**Count records by flight:**
```bash
docker exec postgres psql -U postgres -d telemetry -c \
  "SELECT flight_id, COUNT(*) FROM telemetry GROUP BY flight_id;"
```

**Check invalid records:**
```bash
docker exec postgres psql -U postgres -d telemetry -c \
  "SELECT COUNT(*) FROM telemetry WHERE is_valid = false;"
```

### Status Bar (UI)

The dashboard includes real-time monitoring:
- **Connection Status**: Connected (green) / Reconnecting (yellow) / Disconnected (red)
- **Last Message Time**: Timestamp of most recent telemetry
- **Mission Time**: Current T+ time display
- **Flight ID**: Current mission identifier
- **Message Rate**: Messages/second (5s rolling average)
- **Telemetry Warning**: Alert if >3s without data

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

**Telemetry Service:**
```
INFO [telemetry-service] Processed telemetry: flightId=FLT-12345, phase=ASCENT_STAGE1, valid=true
```

## Troubleshooting

### Services Not Starting

**Check Docker infrastructure:**
```bash
docker compose ps
# All services should show "healthy"
```

**View service logs:**
```bash
docker compose logs kafka
docker compose logs postgres
docker compose logs telemetry-service
```

**Rebuild telemetry service:**
```bash
cd telemetry-service
mvn clean package
cd ..
docker compose up -d --build telemetry-service
```

### No Telemetry Data in UI

**1. Verify simulator is running:**
```bash
# Should see simulator in process list
pnpm dev:all
# Or check if running separately
ps aux | grep "rocket-sim"
```

**2. Check Kafka topics exist:**
```bash
docker exec kafka kafka-topics.sh --bootstrap-server localhost:9092 --list
# Should show: rocket.telemetry.raw and rocket.telemetry.v1
```

**3. Verify telemetry service is consuming:**
```bash
docker compose logs -f telemetry-service
# Should see: "Consumed raw telemetry" messages
```

**4. Check database persistence:**
```bash
docker exec postgres psql -U postgres -d telemetry -c "SELECT COUNT(*) FROM telemetry;"
# Should return count > 0
```

**5. Verify gateway is consuming v1 topic:**
```bash
curl http://localhost:4001/health | jq '.kafka'
# kafka.connected should be true, messagesPerSecond > 0
```

### WebSocket Connection Issues

**Check gateway health:**
```bash
curl http://localhost:4001/health
```

**Verify environment variable:**
```bash
echo $NEXT_PUBLIC_WS_URL
# Should be: ws://localhost:4001/ws
```

**Check browser console:**
- Open DevTools → Console
- Look for WebSocket errors
- Status bar shows connection state

**Auto-reconnect behavior:**
- Exponential backoff: 1s, 2s, 4s, 8s, max 10s
- Check console for reconnection attempts
- Verify only one WebSocket connection exists

### Validation Issues

**Check validation errors in database:**
```bash
docker exec postgres psql -U postgres -d telemetry -c \
  "SELECT event_id, validation_errors FROM telemetry WHERE is_valid = false LIMIT 10;"
```

**Adjust validation thresholds:**
Edit `telemetry-service/src/main/resources/application.yml` and restart service.

### Consumer Lag

**Check Kafka consumer groups:**
```bash
docker exec kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group telemetry-service
  
docker exec kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group realtime-gateway
```

**Reset offsets (if needed):**
```bash
docker exec kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group telemetry-service \
  --reset-offsets --to-latest --topic rocket.telemetry.raw --execute
```

## Performance

- **Telemetry Rate**: 10 events/second (100ms intervals)
- **End-to-End Latency**: ~100-200ms (simulator → validation → UI)
- **WebSocket Latency**: <50ms typical
- **Database Write Throughput**: ~10 inserts/second with batch optimization
- **Kafka Throughput**: 3 partitions per topic for parallelism
- **UI Render Rate**: 60fps chart updates

## Technology Stack

**Frontend:**
- Next.js 15 (React 19, App Router)
- TypeScript
- Recharts for real-time visualization
- shadcn/ui component library
- Tailwind CSS

**Backend Services:**
- Node.js 18+ (Simulator, Gateway)
- Spring Boot 3.2.3 (Telemetry Service)
- Java 21

**Infrastructure:**
- Apache Kafka 3.7.0 (KRaft mode)
- PostgreSQL 16
- Docker & Docker Compose

**Communication:**
- WebSocket (gateway ↔ UI)
- Kafka pub/sub (service ↔ service)

## Production Deployment

For production deployment, consider:

1. **Infrastructure:**
   - Use managed Kafka (Confluent Cloud, MSK, etc.)
   - Use managed PostgreSQL (RDS, Cloud SQL, etc.)
   - Deploy services to Kubernetes or cloud container services

2. **Security:**
   - Add authentication/authorization (OAuth2, JWT)
   - Enable TLS for Kafka connections
   - Use WSS (WebSocket Secure) instead of WS
   - Implement API gateway with rate limiting

3. **Scaling:**
   - Scale gateway horizontally (multiple instances behind load balancer)
   - Increase Kafka partitions for higher throughput
   - Use connection pooling for database
   - Configure consumer concurrency based on partitions

4. **Monitoring:**
   - Set up metrics collection (Prometheus, Grafana)
   - Configure alerting for service health
   - Enable distributed tracing (Jaeger, Zipkin)
   - Monitor Kafka consumer lag

5. **Data Management:**
   - Implement data retention policies
   - Set up database backups
   - Configure Kafka log retention
   - Add data archival to cold storage

## License

MIT
