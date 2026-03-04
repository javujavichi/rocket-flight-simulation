# Failure Scenarios and Operational Behavior

Distributed systems are designed with the assumption that **components will fail**. This project allows testing how an event-driven architecture behaves when services or infrastructure stop working.

## System Architecture

```
rocket-sim
    ↓
rocket.telemetry.raw (Kafka topic)
    ↓
telemetry-service
    ↓
rocket.telemetry.v1 (Kafka topic)
    ↓
realtime-gateway
    ↓
Mission Control UI
```

Kafka acts as the **event backbone**, allowing services to fail and recover independently without losing data.

## Observability Tools

Before testing failures, it is recommended to open these observability tools:

| Tool | URL |
|------|-----|
| Kafka UI | http://localhost:8080 |
| Gateway Health | http://localhost:4001/health |
| Telemetry Service Health | http://localhost:8081/actuator/health |
| Mission Control UI | http://localhost:3000 |

### Helpful Operational Commands

```bash
docker compose ps
docker compose logs -f kafka
docker compose logs -f telemetry-service
pnpm kafka:health
```

---

## Scenario 1 — Telemetry Service Failure

### Command

```bash
docker compose stop telemetry-service
```

### What Happens

- rocket-sim continues producing telemetry events
- Kafka continues storing events in `rocket.telemetry.raw`
- The telemetry-service is responsible for transforming raw events into the normalized `rocket.telemetry.v1` topic
- Because the service is stopped, the `rocket.telemetry.v1` topic stops receiving new events
- The UI eventually stops receiving new telemetry updates

### What to Watch

- **Kafka UI:** `rocket.telemetry.raw` offsets keep increasing; `rocket.telemetry.v1` offsets stop increasing

When the telemetry-service restarts, it resumes processing from the last committed Kafka offset.

### Recovery

```bash
docker compose start telemetry-service
```

---

## Scenario 2 — Kafka Restart

### Command

```bash
docker compose restart kafka
```

### What Happens

- Producers temporarily fail to publish messages
- Consumers temporarily lose connection to Kafka
- Services attempt to reconnect automatically once Kafka becomes available

### What to Watch

- **rocket-sim logs:** Temporary message publishing errors
- **telemetry-service logs:** Kafka consumer reconnection attempts
- **Gateway health endpoint:** Kafka connection status may briefly become false
- Kafka UI may be unavailable during restart

### Recovery

Kafka becomes available again and services reconnect automatically.

If a service does not reconnect cleanly, restart it:

```bash
docker compose restart telemetry-service
```

---

## Scenario 3 — Gateway Failure

### Command

Stop the gateway process (if running locally):

```
Ctrl + C
```

Or restart it manually.

### What Happens

- Kafka continues processing telemetry events
- telemetry-service continues writing normalized events
- The UI loses its WebSocket connection to the gateway
- Backend processing continues unaffected

### What to Watch

- UI connection status indicator
- Kafka topics continue growing normally

### Recovery

Restart the gateway service:

```bash
pnpm dev:gateway
```

---

## Scenario 4 — Simulation Service Stops

### Command

Stop rocket-sim:

```
Ctrl + C
```

### What Happens

- No new telemetry events are produced
- Existing services remain healthy
- Kafka topics stop receiving new messages

### What to Watch

- **Kafka UI:** Offsets stop increasing
- **Gateway metrics:** Message rate drops to zero
- **UI:** Telemetry display eventually shows stale data

### Recovery

Restart the simulation:

```bash
pnpm dev:sim
```

---

## Scenario 5 — Consumer Backlog Processing

### Command

Stop telemetry-service for 30–60 seconds:

```bash
docker compose stop telemetry-service
```

Wait while rocket-sim continues generating telemetry.

Restart telemetry-service:

```bash
docker compose start telemetry-service
```

### What Happens

- Kafka accumulates raw telemetry events during the downtime
- When telemetry-service restarts, it resumes consuming from the last committed offset
- The service processes the backlog and catches up

### What to Watch

- **Kafka UI:** Raw topic offsets increase during downtime; normalized topic offsets rapidly increase after restart
- **telemetry-service logs:** Higher event processing rate during catch-up

### DevOps Lesson

Kafka provides durable event storage that allows services to recover without data loss.

---

## Scenario 6 — Postgres Failure

### Command

```bash
docker compose stop postgres
```

### What Happens

- telemetry-service loses access to the persistence layer
- Event normalization may fail or pause depending on error handling
- Kafka continues storing raw telemetry events

### What to Watch

- **Telemetry service logs:** Database connection errors
- **Kafka topics:** Raw telemetry continues accumulating

### Recovery

```bash
docker compose start postgres
docker compose restart telemetry-service
```

---

## Why These Scenarios Matter

These experiments demonstrate several operational properties of event-driven systems:

- Services fail independently
- Events are durably stored in Kafka
- Consumers resume processing automatically
- Infrastructure failures do not permanently break the system
- Systems can recover and replay events

Understanding these behaviors is essential when operating real-world distributed platforms such as:

- Telemetry and IoT pipelines
- Financial trading systems
- Real-time analytics platforms
- Aerospace monitoring systems