# Stage 2 Implementation Guide

## Overview

Stage 2 adds a **data validation and persistence layer** between the simulator and the UI:

**Before (Stage 1)**:
```
rocket-sim → [rocket.telemetry.raw] → realtime-gateway → UI
```

**After (Stage 2)**:
```
rocket-sim → [rocket.telemetry.raw] → telemetry-service → [rocket.telemetry.v1] → realtime-gateway → UI
                                              ↓
                                         PostgreSQL
```

## What's New

### 1. Telemetry Service (Spring Boot)
- Validates telemetry data
- Normalizes to TelemetryV1 contract
- Persists to PostgreSQL
- Publishes normalized events

### 2. PostgreSQL Database
- Stores all validated telemetry
- Indexed for fast queries
- Tracks validation errors

### 3. New Kafka Topic
- `rocket.telemetry.v1` - Normalized, validated telemetry

### 4. Updated Realtime Gateway
- Now consumes from `rocket.telemetry.v1`
- Receives only validated data

---

## Complete Run Instructions

### Step 1: Stop Existing Services

```bash
# Stop all running services
pnpm kafka:stop

# Kill any background processes
pkill -f "pnpm dev"
pkill -f "rocket-sim"
pkill -f "realtime-gateway"
```

### Step 2: Start Infrastructure

```bash
# Start Kafka, Postgres, and Telemetry Service
docker compose up -d

# Wait for all services to be healthy (30-60 seconds)
docker compose ps

# Expected output:
# kafka             healthy
# postgres          healthy  
# telemetry-service healthy
# kafka-ui          running
```

### Step 3: Verify Infrastructure

```bash
# Check Kafka topics
docker exec kafka kafka-topics.sh \
  --bootstrap-server localhost:9092 --list

# Should show:
# rocket.telemetry.raw
# rocket.telemetry.v1

# Check telemetry-service health
curl http://localhost:8081/actuator/health | jq

# Should show: {"status":"UP"}
```

### Step 4: Start Application Services

```bash
# Open 3 separate terminals:

# Terminal 1: Start UI
pnpm dev

# Terminal 2: Start Realtime Gateway  
cd realtime-gateway && pnpm dev

# Terminal 3: Start Rocket Simulator
cd rocket-sim && pnpm dev
```

### Step 5: Verify End-to-End Flow

Open browser: http://localhost:3000

1. Click **"Live"** mode
2. You should see:
   - ✅ Green "Connected" status
   - ✅ Telemetry charts updating
   - ✅ Rocket animation moving
   - ✅ Message rate ~20 msg/s

---

## Acceptance Tests

### Test 1: Telemetry Service Health

**Command**:
```bash
curl http://localhost:8081/actuator/health | jq
```

**Expected**:
```json
{
  "status": "UP",
  "components": {
    "db": {"status": "UP"},
    "kafka": {"status": "UP"}
  }
}
```

✅ **PASS**: Service is healthy and connected to Kafka & Postgres

---

### Test 2: Raw Telemetry Production

**Command**:
```bash
docker exec kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic rocket.telemetry.raw \
  --from-beginning --max-messages 3
```

**Expected**: JSON messages with fields:
- `flightId`
- `tPlusMs`
- `altitudeM`
- `thrustN`
- etc.

✅ **PASS**: Simulator is producing raw telemetry

---

### Test 3: Normalized Telemetry in Kafka

**Command**:
```bash
docker exec kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic rocket.telemetry.v1 \
  --from-beginning --max-messages 3 | jq
```

**Expected**: JSON messages with additional fields:
- `id` - Database ID
- `phase` - Flight phase (e.g., "LIFTOFF", "ASCENT_STAGE1")
- `isValid` - Boolean
- `processedAt` - Timestamp
- `version: "v1"`

✅ **PASS**: Telemetry service is normalizing and publishing

---

### Test 4: Database Persistence

**Command**:
```bash
docker exec postgres psql -U postgres -d telemetry -c \
  "SELECT COUNT(*) as total_records, 
          COUNT(CASE WHEN is_valid THEN 1 END) as valid_records,
          COUNT(CASE WHEN NOT is_valid THEN 1 END) as invalid_records
   FROM telemetry;"
```

**Expected**:
```
 total_records | valid_records | invalid_records 
---------------+---------------+-----------------
          5612 |          5612 |               0
```

✅ **PASS**: Telemetry is being persisted to database

---

### Test 5: Validation Logic

**Test invalid data**:
```bash
# Connect to Postgres
docker exec -it postgres psql -U postgres -d telemetry

# Query for any validation errors
SELECT flight_id, t_plus_ms, is_valid, validation_errors 
FROM telemetry 
WHERE is_valid = false 
LIMIT 5;
```

**Expected**: If simulator sends valid data, should return 0 rows.

To test validation, you can manually insert invalid data:
```bash
docker exec kafka kafka-console-producer.sh \
  --bootstrap-server localhost:9092 \
  --topic rocket.telemetry.raw

# Paste this invalid record (altitude too high):
{"eventId":"TEST-BAD-1","flightId":"TEST","ts":"2026-01-01T00:00:00Z","tPlusMs":1000,"stage":1,"altitudeM":999999,"verticalVelocityMS":100,"thrustN":1000000,"propellantKg":100000,"throttle":1.0}
```

Then query:
```sql
SELECT validation_errors FROM telemetry WHERE event_id = 'TEST-BAD-1';
```

**Expected**:
```
altitude exceeds maximum: 200000
```

✅ **PASS**: Validation is working correctly

---

### Test 6: Realtime Gateway Consumes V1

**Command**:
```bash
curl http://localhost:4001/health | jq '.kafka'
```

**Expected**:
```json
{
  "connected": true,
  "topic": "rocket.telemetry.v1",
  "groupId": "realtime-gateway",
  "lastMessageTs": "2026-02-16T01:30:00.000Z",
  "messagesPerSecond": 20
}
```

✅ **PASS**: Gateway is consuming from v1 topic

---

### Test 7: UI Receives Normalized Data

1. Open browser: http://localhost:3000
2. Open Developer Console (F12)
3. Switch to "Network" tab
4. Filter for "ws" (WebSocket)
5. Click on WebSocket connection
6. Go to "Messages" tab

**Expected**: Should see messages with TelemetryV1 fields:
- `phase`
- `isValid`
- `processedAt`
- `version: "v1"`

✅ **PASS**: UI is receiving normalized telemetry

---

### Test 8: Database Query Performance

**Command**:
```bash
docker exec postgres psql -U postgres -d telemetry -c \
  "EXPLAIN ANALYZE 
   SELECT * FROM telemetry 
   WHERE flight_id = 'FLT-123' 
   ORDER BY t_plus_ms 
   LIMIT 100;"
```

**Expected**: Query should use `idx_flight_id` index and execute in < 10ms

✅ **PASS**: Database indexes are working

---

### Test 9: Consumer Group Lag

**Command**:
```bash
docker exec kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group telemetry-service \
  --describe
```

**Expected**:
```
TOPIC                 PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG
rocket.telemetry.raw  0          1500            1500            0
rocket.telemetry.raw  1          1502            1502            0
rocket.telemetry.raw  2          1498            1498            0
```

✅ **PASS**: No consumer lag, service is keeping up

---

### Test 10: End-to-End Latency

**Command**:
```bash
# Get timestamp from raw topic
docker exec kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic rocket.telemetry.raw \
  --max-messages 1 | jq -r '.ts'

# Get processedAt from v1 topic (should be within ~50ms)
docker exec kafka kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic rocket.telemetry.v1 \
  --max-messages 1 | jq -r '.processedAt'
```

**Expected**: Difference should be < 100ms

✅ **PASS**: Low-latency processing pipeline

---

## Monitoring Dashboard

### Kafka UI
Visit: http://localhost:8080

- View both topics
- Monitor consumer lag
- Inspect messages

### Database Stats
```bash
docker exec postgres psql -U postgres -d telemetry -c \
  "SELECT 
     COUNT(*) as total_records,
     MIN(timestamp) as first_record,
     MAX(timestamp) as last_record,
     COUNT(DISTINCT flight_id) as unique_flights,
     ROUND(AVG(altitude_m)) as avg_altitude
   FROM telemetry;"
```

### Service Metrics
```bash
# Telemetry Service
curl http://localhost:8081/actuator/metrics | jq '.names'

# Specific metric
curl http://localhost:8081/actuator/metrics/jvm.memory.used | jq
```

---

## Troubleshooting

### Telemetry service won't start

```bash
# Check logs
docker logs telemetry-service

# Common issues:
# 1. Kafka not ready - wait 30 seconds and restart
# 2. Postgres not ready - check with: docker exec postgres pg_isready
# 3. Port 8081 in use - change SERVER_PORT in docker-compose.yml
```

### No data in database

```bash
# Check if service is consuming
docker logs telemetry-service | grep "Received message"

# Check Kafka consumer group
docker exec kafka kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --group telemetry-service \
  --describe

# Restart service
docker restart telemetry-service
```

### Gateway not receiving v1 messages

```bash
# Verify gateway is subscribed to correct topic
curl http://localhost:4001/health | jq '.kafka.topic'

# Should show: "rocket.telemetry.v1"

# If not, restart gateway:
cd realtime-gateway && pnpm dev
```

---

## Success Criteria Summary

✅ All 10 acceptance tests pass  
✅ UI shows live telemetry with "Connected" status  
✅ Database contains validated telemetry records  
✅ Kafka has two topics with messages flowing  
✅ No consumer lag (< 10 messages behind)  
✅ End-to-end latency < 100ms  
✅ All services healthy in `docker compose ps`  

---

## Next Steps (Future Enhancements)

- **Stage 3**: Add real-time analytics service
- **Stage 4**: Implement alerting for anomalies
- **Stage 5**: Add data export API
- **Stage 6**: Build admin dashboard for querying historical data
