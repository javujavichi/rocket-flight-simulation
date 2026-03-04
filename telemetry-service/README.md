# Telemetry Service

A Spring Boot microservice that validates, normalizes, persists, and republishes raw rocket telemetry events.

## Purpose

This service is the **processing core** of the telemetry pipeline. It sits between the raw data producer and the real-time delivery layer, ensuring that every event is validated against safety thresholds, enriched with flight phase information, and durably stored before being forwarded downstream.

```
[rocket.telemetry.raw] → telemetry-service → [rocket.telemetry.v1]
                                   ↓
                              PostgreSQL
```

## What It Does

1. **Consumes** raw telemetry events from Kafka topic `rocket.telemetry.raw`
2. **Validates** each event against configurable thresholds
3. **Detects** the current flight phase based on altitude and mission time
4. **Persists** every event (valid and invalid) to PostgreSQL
5. **Publishes** the normalized `TelemetryV1` event to Kafka topic `rocket.telemetry.v1`

Invalid events are still persisted and published — they are flagged with `isValid: false` and include `validationErrors` describing what failed.

## TelemetryV1 Contract

### Output Schema

```json
{
  "id": 123,
  "eventId": "FLT-A3F1B2C4-15000",
  "flightId": "FLT-A3F1B2C4",
  "timestamp": "2026-03-03T12:00:15.000Z",
  "tPlusMs": 15000,
  "stage": 1,
  "altitudeM": 4523.5,
  "velocityMS": 452.1,
  "thrustN": 7607000,
  "propellantKg": 251430.0,
  "throttle": 1.0,
  "phase": "ASCENT_STAGE1",
  "isValid": true,
  "validationErrors": null,
  "processedAt": "2026-03-03T12:00:15.100Z",
  "version": "v1"
}
```

### Validation Rules

| Field | Rule |
|-------|------|
| `flightId` | Required, non-blank |
| `tPlusMs` | ≥ 0 |
| `stage` | 1 or 2 |
| `altitudeM` | 0 – 200,000 m |
| `velocityMS` | 0 – 10,000 m/s |
| `thrustN` | 0 – 10,000,000 N |
| `propellantKg` | 0 – 350,000 kg |
| `throttle` | 0.0 – 1.0 |

### Flight Phase Detection

| Phase | Condition |
|-------|-----------|
| `LIFTOFF` | T+0 to T+5s |
| `ASCENT_STAGE1` | altitude < 70 km |
| `MAX_Q` | ~10–15 km altitude |
| `STAGE_SEPARATION` | T+150s |
| `ASCENT_STAGE2` | 70–100 km altitude |
| `ORBIT_INSERTION` | approaching 100 km |
| `ORBIT` | altitude > 100 km |

## Technology Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Java | 21 | Runtime |
| Spring Boot | 3.2.3 | Application framework |
| Spring Kafka | — | Kafka consumer/producer |
| Spring Data JPA | — | Database persistence |
| PostgreSQL | 16 | Telemetry storage |
| Lombok | — | Boilerplate reduction |
| Maven | 3.9+ | Build tool |

## Build & Run

### Prerequisites

- Java 21+
- Maven 3.9+
- Docker & Docker Compose

### Build JAR

```bash
cd telemetry-service
mvn clean package -DskipTests
```

### Run with Docker Compose (Recommended)

```bash
# From project root — starts everything including this service
docker compose up -d

# Check service health
curl http://localhost:8081/actuator/health
```

### Run Locally (Development)

```bash
# Start only Kafka & Postgres as infrastructure
docker compose up -d kafka postgres kafka-init

# Run Spring Boot
cd telemetry-service
mvn spring-boot:run
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker address |
| `DB_HOST` | `localhost` | PostgreSQL host |
| `DB_PORT` | `5432` | PostgreSQL port |
| `DB_NAME` | `telemetry` | Database name |
| `DB_USER` | `postgres` | Database user |
| `DB_PASSWORD` | `postgres` | Database password |
| `SERVER_PORT` | `8081` | HTTP server port |

For full configuration options see `src/main/resources/application.yml`.

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /actuator/health` | Service, Kafka, and database health |
| `GET /actuator/metrics` | JVM, Kafka consumer, and DB pool metrics |

## Database Schema

```sql
CREATE TABLE telemetry (
    id               BIGSERIAL PRIMARY KEY,
    event_id         VARCHAR(255) NOT NULL UNIQUE,
    flight_id        VARCHAR(255) NOT NULL,
    timestamp        TIMESTAMP NOT NULL,
    t_plus_ms        BIGINT NOT NULL,
    stage            INTEGER,
    altitude_m       DOUBLE PRECISION,
    velocity_ms      DOUBLE PRECISION,
    thrust_n         DOUBLE PRECISION,
    propellant_kg    DOUBLE PRECISION,
    throttle         DOUBLE PRECISION,
    phase            VARCHAR(255),
    is_valid         BOOLEAN NOT NULL,
    validation_errors VARCHAR(1000),
    processed_at     TIMESTAMP NOT NULL,
    version          VARCHAR(10) NOT NULL
);

CREATE INDEX idx_flight_id  ON telemetry(flight_id);
CREATE INDEX idx_timestamp  ON telemetry(timestamp);
CREATE INDEX idx_t_plus_ms  ON telemetry(t_plus_ms);
```

## Observability

### Logs

Logs are output in JSON format to stdout:

```json
{"level":"INFO","msg":"Processed telemetry: flightId=FLT-A3F1B2C4, phase=ASCENT_STAGE1, valid=true"}
```

### Useful Queries

```bash
# Row count
docker exec postgres psql -U postgres -d telemetry -c "SELECT COUNT(*) FROM telemetry;"

# Recent events
docker exec postgres psql -U postgres -d telemetry -c \
  "SELECT flight_id, t_plus_ms, altitude_m, phase FROM telemetry ORDER BY timestamp DESC LIMIT 10;"

# Invalid events
docker exec postgres psql -U postgres -d telemetry -c \
  "SELECT event_id, validation_errors FROM telemetry WHERE is_valid = false LIMIT 10;"
```

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Invalid telemetry values | Flagged `isValid=false`, still persisted and published |
| Kafka consumer error | Manual ack — message stays unacknowledged and is retried |
| Database error | Transaction rollback, message unacknowledged for retry |
| Deserialization error | Logged, message skipped |

## Troubleshooting

**Service won't start**

```bash
# Verify Kafka topics exist
docker exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list

# Verify Postgres is reachable
docker exec postgres psql -U postgres -d telemetry -c "SELECT 1"

# View logs
docker compose logs -f telemetry-service
```

**No messages being processed**

```bash
# Check if raw topic has messages
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic rocket.telemetry.raw \
  --from-beginning --max-messages 5

# Check consumer group lag
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group telemetry-service \
  --describe
```

**Rebuild after code changes**

```bash
cd telemetry-service
mvn clean package -DskipTests
cd ..
docker compose up -d --build telemetry-service
```
