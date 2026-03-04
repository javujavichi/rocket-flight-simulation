# Failure Scenarios and Operational Behavior

Distributed systems are designed with the assumption that **components will fail**. This project lets you test how an event-driven architecture behaves when services or infrastructure stop working — and how they recover.

## Table of Contents

- [System Architecture](#system-architecture)
- [Prerequisites](#prerequisites)
- [Observability Tools](#observability-tools)
- [Scenario 1 — Telemetry Service Failure](#scenario-1--telemetry-service-failure)
- [Scenario 2 — Kafka Restart](#scenario-2--kafka-restart)
- [Scenario 3 — Gateway Failure](#scenario-3--gateway-failure)
- [Scenario 4 — Simulation Service Stops](#scenario-4--simulation-service-stops)
- [Scenario 5 — Consumer Backlog Processing](#scenario-5--consumer-backlog-processing)
- [Scenario 6 — Postgres Failure](#scenario-6--postgres-failure)
- [Scenario 7 — Multiple Simultaneous Failures](#scenario-7--multiple-simultaneous-failures)
- [Key Architecture Details](#key-architecture-details)
- [Quick Reference](#quick-reference)

---

## System Architecture

```
rocket-sim (Node.js)
    │  produces every 50 ms
    ▼
rocket.telemetry.raw (Kafka topic · 3 partitions)
    │
    ▼
telemetry-service (Spring Boot)
    │  validates → persists to Postgres → publishes
    ▼
rocket.telemetry.v1 (Kafka topic · 3 partitions)
    │
    ▼
realtime-gateway (Node.js)
    │  broadcasts over WebSocket
    ▼
Mission Control UI (Next.js · ws://localhost:4001/ws)
```

Kafka acts as the **event backbone**. Each service can fail and recover independently without losing data because Kafka retains messages and consumers track their own offsets.

---

## Prerequisites

Before running any failure scenario, make sure the full system is up and healthy:

```bash
pnpm dev:all
```

This starts Docker infrastructure (Kafka, PostgreSQL, telemetry-service, Kafka UI) and the three local services (UI, Gateway, Simulator). Wait until all services show output in the terminal before proceeding.

Verify infrastructure health:

```bash
docker compose ps                   # All containers should be "Up" or "running"
pnpm kafka:health                   # Should show status: "ok", kafka.connected: true
curl -s http://localhost:8081/actuator/health | jq .status   # Should return "UP"
```

---

## Observability Tools

Open all of these before testing so you can observe changes in real time:

| Tool | URL | What It Shows |
|------|-----|---------------|
| Kafka UI | http://localhost:8080 | Topic offsets, consumer lag, partition distribution |
| Gateway Health | http://localhost:4001/health | Kafka connection, message rate, WebSocket client count |
| Telemetry Service Health | http://localhost:8081/actuator/health | Spring Boot health, DB connection, Kafka status |
| Mission Control UI | http://localhost:3000 | Live telemetry charts, connection status |

### Useful Commands

```bash
# Infrastructure status
docker compose ps
docker compose logs -f kafka
docker compose logs -f telemetry-service
docker compose logs -f postgres

# Gateway metrics (message rate, connected clients)
pnpm kafka:health

# Kafka topic offsets (run inside the Kafka container)
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --group telemetry-service

docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --group realtime-gateway
```

---

## Scenario 1 — Telemetry Service Failure

**Goal:** Show that upstream producers and Kafka are unaffected when a downstream consumer crashes.

### Trigger

```bash
docker compose stop telemetry-service
```

### What Happens

1. rocket-sim continues producing telemetry every 50 ms into `rocket.telemetry.raw`
2. Kafka durably stores these events — nothing is lost
3. telemetry-service is the only service that reads from `rocket.telemetry.raw` and writes to `rocket.telemetry.v1`, so the normalized topic stops receiving new events
4. realtime-gateway has nothing new to consume — the UI freezes on the last received telemetry point

### Verification

```bash
# Raw topic offsets keep increasing (rocket-sim is still producing)
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --group telemetry-service
# Look at LAG column — it grows while the service is down

# Gateway reports zero message rate
pnpm kafka:health
# messagesPerSecond should drop to 0
```

### Recovery

```bash
docker compose start telemetry-service
```

The service resumes from the **last committed Kafka offset** (manual acknowledgment mode). It processes the accumulated backlog and catches up.

### DevOps Lesson

Kafka decouples producers from consumers. The producer does not know or care that the consumer is down.

---

## Scenario 2 — Kafka Restart

**Goal:** Observe what happens when the central event backbone goes down temporarily.

### Trigger

```bash
docker compose restart kafka
```

### What Happens

1. **rocket-sim:** KafkaJS producer fails to publish — retries automatically (configured with 10 retries, 1 s initial backoff)
2. **telemetry-service:** Spring Kafka consumer loses connection — reconnects automatically when Kafka comes back
3. **realtime-gateway:** KafkaJS consumer disconnects — reconnects automatically (10 retries)
4. **Kafka UI:** Temporarily unavailable (it connects to the same broker)

### Verification

```bash
# Watch rocket-sim terminal for temporary errors, then successful reconnect
# Watch telemetry-service logs for kafka reconnection
docker compose logs -f telemetry-service | grep -i "connect\|error\|rebalance"

# After Kafka comes back, verify all consumers rejoin
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --list
# Should show: telemetry-service, realtime-gateway
```

### Recovery

Automatic — all services have built-in retry/reconnect logic.

If a service fails to reconnect after ~30 seconds, restart it manually:

```bash
docker compose restart telemetry-service
# or restart the local services:
pnpm dev:gateway
pnpm dev:sim
```

### DevOps Lesson

Retry and reconnect configuration is critical. Both KafkaJS and Spring Kafka handle transient broker failures out of the box when configured properly.

---

## Scenario 3 — Gateway Failure

**Goal:** Demonstrate that the data pipeline continues working even when the delivery layer to the UI goes down.

### Trigger

Stop the gateway process (running locally via `concurrently`):

```bash
# If running separately:
# Press Ctrl+C in the gateway terminal
# Or kill it:
kill $(lsof -ti:4001)
```

### What Happens

1. Kafka topics continue receiving events — the pipeline is unaffected
2. telemetry-service continues normalizing and persisting as normal
3. The UI loses its WebSocket connection to `ws://localhost:4001/ws`
4. **No data is lost** — realtime-gateway uses a consumer group (`realtime-gateway`), and when it restarts, it resumes from the last committed offset

### Verification

```bash
# Confirm the gateway is down
curl -s http://localhost:4001/health
# Should fail: connection refused

# Confirm the pipeline is still working
docker compose logs --tail=5 telemetry-service
# Should still show "Published to rocket.telemetry.v1" messages

# Check the UI — connection status indicator should show disconnected
```

### Recovery

```bash
pnpm dev:gateway
```

The gateway reconnects to Kafka, resumes consuming from `rocket.telemetry.v1`, and the UI reconnects via WebSocket.

### DevOps Lesson

The presentation layer (gateway + UI) is fully decoupled from the data processing layer. Backend processing never stops.

---

## Scenario 4 — Simulation Service Stops

**Goal:** See what happens when the data source (rocket-sim) stops producing events.

### Trigger

```bash
# If running separately:
# Press Ctrl+C in the rocket-sim terminal
# Or kill it:
kill $(lsof -ti:9092 -sTCP:ESTABLISHED) 2>/dev/null  # less reliable
# Simpler: just Ctrl+C in the concurrently terminal
```

### What Happens

1. No new telemetry events are produced to `rocket.telemetry.raw`
2. All downstream services remain running and healthy
3. Kafka topic offsets stop increasing
4. The UI displays the last received telemetry but no new data arrives

### Verification

```bash
# Gateway reports zero message rate
pnpm kafka:health
# messagesPerSecond: 0, but status: "ok" and kafka.connected: true

# All infrastructure is still healthy
docker compose ps
curl -s http://localhost:8081/actuator/health | jq .status
```

### Recovery

```bash
pnpm dev:sim
```

A new flight starts automatically. The simulator generates a new `flightId` (UUID) and begins producing telemetry from T+0.

### DevOps Lesson

Producers are independent. Stopping the data source does not cascade failures to consumers or infrastructure.

---

## Scenario 5 — Consumer Backlog Processing

**Goal:** Prove that Kafka durably stores events and services can catch up after downtime.

### Step 1 — Create a Backlog

```bash
docker compose stop telemetry-service
```

Wait **30–60 seconds** while rocket-sim continues producing at ~20 events/second. This accumulates ~600–1200 raw events in Kafka.

### Step 2 — Verify the Backlog

```bash
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --group telemetry-service
```

The **LAG** column shows how many unprocessed messages are waiting.

### Step 3 — Restart and Watch the Catch-Up

```bash
docker compose start telemetry-service
```

### What to Observe

```bash
# Watch the logs — notice the burst of rapid processing
docker compose logs -f telemetry-service

# Run the consumer group describe repeatedly to watch LAG decrease
watch -n 1 "docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --group telemetry-service"
```

- **LAG decreases rapidly** as telemetry-service processes the backlog
- **Gateway message rate spikes** temporarily above normal during catch-up
- **UI receives a burst** of telemetry as the gateway catches up

### DevOps Lesson

Kafka provides **durable event storage** with configurable retention. Services resume from their last committed offset, not from "now." No events are lost — the system is self-healing.

---

## Scenario 6 — Postgres Failure

**Goal:** Understand the impact of a persistence layer failure on the event pipeline.

### Trigger

```bash
docker compose stop postgres
```

### What Happens

1. rocket-sim continues producing to `rocket.telemetry.raw` — unaffected
2. telemetry-service reads a raw event, validates it, and attempts to persist to Postgres
3. **The `save()` call throws a database connection exception**
4. Because the service uses **manual Kafka acknowledgment**, the message is **not acknowledged** — it stays in the topic
5. Spring Kafka retries the same message, which fails again → the consumer enters a retry loop
6. `rocket.telemetry.v1` stops receiving new events (the publish to v1 happens after the DB write)
7. The gateway and UI freeze — same effect as Scenario 1

### Verification

```bash
# Telemetry service logs show database errors
docker compose logs -f telemetry-service | grep -i "error\|exception\|connect"
# Look for: "Error persisting telemetry" or HikariPool connection timeout

# Postgres health check fails
docker compose ps postgres
# Should show "exited" or no healthy status

# Consumer group shows growing lag
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --group telemetry-service
```

### Recovery

```bash
docker compose start postgres

# Wait a few seconds for HikariCP connection pool to recover, then:
docker compose restart telemetry-service
```

> **Why restart telemetry-service?** The HikariCP connection pool may have exhausted its retry budget. Restarting ensures a clean connection pool. In production, you would configure connection pool recovery and health-based restarts.

### DevOps Lesson

Persistence failures cascade to message acknowledgment. Manual ack protects against data loss — the message is retried rather than silently dropped. But the entire pipeline stalls until the database recovers.

---

## Scenario 7 — Multiple Simultaneous Failures

**Goal:** Stress-test the architecture by combining multiple failures.

### Trigger

```bash
# Stop both telemetry-service and postgres at once
docker compose stop telemetry-service postgres
```

Wait 30–60 seconds.

### Then Restart in Dependency Order

```bash
docker compose start postgres

# Wait for Postgres to be healthy
until docker compose exec postgres pg_isready -U postgres 2>/dev/null; do sleep 1; done
echo "Postgres is ready"

docker compose start telemetry-service
```

### What to Observe

1. During downtime, `rocket.telemetry.raw` accumulates hundreds of events
2. `rocket.telemetry.v1` receives nothing — gateway and UI are frozen
3. After restart, the telemetry-service consumes the full backlog
4. The system fully recovers without manual intervention beyond restarting

### Verification

```bash
# After recovery, confirm zero lag on both consumer groups
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --all-groups
```

### DevOps Lesson

Startup order matters. Postgres must be available before telemetry-service attempts to connect, or the service will fail on the first message. Docker Compose `depends_on` with health checks handles this in production.

---

## Key Architecture Details

Understanding these details helps explain the behavior observed in each scenario:

| Property | Value | Relevance |
|----------|-------|-----------|
| Kafka partitions | 3 per topic | Allows parallel consumer threads |
| telemetry-service concurrency | 3 threads | Matches partition count — one thread per partition |
| Kafka acknowledgment mode | Manual (`AckMode.MANUAL`) | Messages only committed after successful processing |
| telemetry-service consumer group | `telemetry-service` | Tracks offsets independently from gateway |
| realtime-gateway consumer group | `realtime-gateway` | Tracks offsets independently from telemetry-service |
| auto-offset-reset | `earliest` (telemetry-service) | On first start, reads from beginning of topic |
| KafkaJS retry config | 10 retries, 1 s initial backoff | rocket-sim and gateway reconnect automatically |
| HikariCP pool size | max 10, min idle 5 | Connection pool to Postgres |
| rocket-sim tick rate | 50 ms (~20 events/sec) | Rate of telemetry production |
| Flight duration | 280 seconds | Each flight runs for ~4.5 minutes, then a new flight starts after 10 s |

---

## Quick Reference

### Service Restart Commands

| Service | Command |
|---------|---------|
| Kafka | `docker compose restart kafka` |
| PostgreSQL | `docker compose start postgres` |
| Telemetry Service | `docker compose restart telemetry-service` |
| Realtime Gateway | `pnpm dev:gateway` |
| Rocket Simulator | `pnpm dev:sim` |
| Mission Control UI | `pnpm dev:ui` |
| Everything | `pnpm dev:all` |

### Diagnostic Commands

```bash
# Full system status
docker compose ps && pnpm kafka:health

# Consumer group lag (most useful for debugging)
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --all-groups

# Tail logs for a specific service
docker compose logs -f telemetry-service
docker compose logs -f kafka
docker compose logs -f postgres

# Check topic message counts
docker exec kafka /opt/kafka/bin/kafka-run-class.sh kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 --topic rocket.telemetry.raw
docker exec kafka /opt/kafka/bin/kafka-run-class.sh kafka.tools.GetOffsetShell \
  --broker-list localhost:9092 --topic rocket.telemetry.v1
```

### Stop Everything

```bash
# Stop local services: Ctrl+C in the terminal running pnpm dev:all
# Stop infrastructure:
docker compose down
# Stop and remove volumes (resets Postgres data):
docker compose down -v
```