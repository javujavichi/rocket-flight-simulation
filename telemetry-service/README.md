# Telemetry Service - Stage 2

## Overview

The **Telemetry Service** is a Spring Boot application that:
- Consumes raw telemetry from Kafka topic `rocket.telemetry.raw`
- Validates and normalizes data into `TelemetryV1` contract
- Persists validated telemetry to PostgreSQL database
- Publishes normalized telemetry to Kafka topic `rocket.telemetry.v1`

## Architecture

```
rocket-sim → [rocket.telemetry.raw] → telemetry-service → [rocket.telemetry.v1] → realtime-gateway → WebSocket → UI
                                              ↓
                                         PostgreSQL
```

## TelemetryV1 Contract

### Schema
```json
{
  "id": 123,
  "eventId": "FLT-123-1000",
  "flightId": "FLT-123",
  "timestamp": "2026-02-16T01:00:00.000Z",
  "tPlusMs": 1000,
  "stage": 1,
  "altitudeM": 150.5,
  "velocityMS": 45.2,
  "thrustN": 7607000,
  "propellantKg": 287000,
  "throttle": 1.0,
  "phase": "LIFTOFF",
  "isValid": true,
  "validationErrors": null,
  "processedAt": "2026-02-16T01:00:00.100Z",
  "version": "v1"
}
```

### Validation Rules
- `flightId`: Required, non-blank
- `tPlusMs`: ≥ 0
- `stage`: 1 or 2
- `altitudeM`: 0 to 200,000
- `velocityMS`: 0 to 10,000
- `thrustN`: 0 to 10,000,000
- `propellantKg`: 0 to 350,000
- `throttle`: 0.0 to 1.0

### Enriched Fields
- `phase`: Flight phase based on tPlusMs (LIFTOFF, ASCENT_STAGE1, MAX_Q, STAGE_SEPARATION, ASCENT_STAGE2, ORBIT_INSERTION, ORBIT)
- `isValid`: Boolean indicating if all validations passed
- `validationErrors`: Semicolon-separated list of validation errors (null if valid)
- `processedAt`: Timestamp when service processed the event

## Technologies

- **Java 21**
- **Spring Boot 3.2.3**
- **Spring Kafka** - Kafka consumer/producer
- **Spring Data JPA** - Database persistence
- **PostgreSQL 16** - Data storage
- **Lombok** - Boilerplate reduction
- **Maven** - Build tool

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

### Run with Docker Compose
```bash
# From project root
docker compose up -d

# Check service health
curl http://localhost:8081/actuator/health
```

### Run Locally (Development)
```bash
# Start Kafka & Postgres
docker compose up -d kafka postgres

# Run Spring Boot
cd telemetry-service
mvn spring-boot:run
```

## Configuration

See `application.yml` for all configuration options.

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `KAFKA_BOOTSTRAP_SERVERS` | localhost:9092 | Kafka brokers |
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | telemetry | Database name |
| `DB_USER` | postgres | Database user |
| `DB_PASSWORD` | postgres | Database password |
| `SERVER_PORT` | 8081 | HTTP server port |

## API Endpoints

### Health Check
```bash
GET http://localhost:8081/actuator/health
```

### Metrics
```bash
GET http://localhost:8081/actuator/metrics
```

## Database Schema

### Table: `telemetry`
```sql
CREATE TABLE telemetry (
    id BIGSERIAL PRIMARY KEY,
    event_id VARCHAR(255) NOT NULL UNIQUE,
    flight_id VARCHAR(255) NOT NULL,
    timestamp TIMESTAMP NOT NULL,
    t_plus_ms BIGINT NOT NULL,
    stage INTEGER,
    altitude_m DOUBLE PRECISION,
    velocity_ms DOUBLE PRECISION,
    thrust_n DOUBLE PRECISION,
    propellant_kg DOUBLE PRECISION,
    throttle DOUBLE PRECISION,
    phase VARCHAR(255),
    is_valid BOOLEAN NOT NULL,
    validation_errors VARCHAR(1000),
    processed_at TIMESTAMP NOT NULL,
    version VARCHAR(10) NOT NULL
);

CREATE INDEX idx_flight_id ON telemetry(flight_id);
CREATE INDEX idx_timestamp ON telemetry(timestamp);
CREATE INDEX idx_t_plus_ms ON telemetry(t_plus_ms);
```

## Monitoring

### Logs
Logs are output in JSON format to stdout:
```json
{
  "level": "DEBUG",
  "msg": "Persisted telemetry: id=123, flightId=FLT-123, tPlusMs=1000",
  "timestamp": "2026-02-16 01:00:00"
}
```

### Metrics
Spring Boot Actuator metrics are available at `/actuator/metrics`:
- JVM metrics
- Kafka consumer metrics
- Database connection pool metrics
- HTTP request metrics

## Error Handling

- **Invalid telemetry**: Marked as `isValid=false` with errors in `validationErrors` field, still persisted and published
- **Kafka errors**: Consumer uses manual acknowledgment with retry on failure
- **Database errors**: Transaction rollback, message remains unacknowledged for retry
- **Serialization errors**: Logged and message is not acknowledged

## Development

### Run Tests
```bash
mvn test
```

### Code Style
Project uses Lombok for boilerplate reduction. Ensure Lombok plugin is installed in your IDE.

## Troubleshooting

### Service won't start
```bash
# Check Kafka connectivity
docker exec -it kafka kafka-topics.sh --bootstrap-server localhost:9092 --list

# Check Postgres connectivity
docker exec -it postgres psql -U postgres -d telemetry -c "SELECT 1"

# Check logs
docker logs telemetry-service
```

### No messages being processed
```bash
# Check if raw topic has messages
docker exec -it kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic rocket.telemetry.raw \
  --from-beginning --max-messages 5

# Check consumer group lag
docker exec -it kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group telemetry-service \
  --describe
```

### Check database records
```bash
docker exec -it postgres psql -U postgres -d telemetry \
  -c "SELECT COUNT(*) FROM telemetry"
```
