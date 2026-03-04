# Realtime Gateway

A lightweight WebSocket server that bridges validated Kafka telemetry events to browser clients in real time.

## Purpose

This service is the **last hop** in the telemetry pipeline before the data reaches the UI. It consumes normalized telemetry from Kafka and pushes each event to all connected WebSocket clients instantly. It also exposes an HTTP health endpoint with operational metrics.

```
... → [rocket.telemetry.v1] → realtime-gateway → WebSocket → Mission Control UI
```

## What It Does

- Consumes events from Kafka topic `rocket.telemetry.v1`
- Broadcasts each event as a raw JSON string to all connected WebSocket clients
- Automatically cleans up closed/dead WebSocket connections
- Tracks message rates (5-second rolling window) and connection metrics
- Exposes `/health` endpoint with Kafka and WebSocket status
- Logs structured JSON to stdout

## Endpoints

### WebSocket

```
ws://localhost:4001/ws
```

Connect here to receive a live stream of `TelemetryV1` JSON events. Each message is a complete telemetry payload (see the [telemetry-processor README](../telemetry-processor/README.md) for the full schema).

**Example message received by a client:**

```json
{
  "id": 1234,
  "eventId": "FLT-A3F1B2C4-15000",
  "flightId": "FLT-A3F1B2C4",
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

### Health Check

```
GET http://localhost:4001/health
```

Returns Kafka and WebSocket metrics:

```json
{
  "status": "ok",
  "kafka": {
    "connected": true,
    "topic": "rocket.telemetry.v1",
    "groupId": "realtime-gateway",
    "lastMessageTs": "2026-03-03T12:00:15.000Z",
    "lastOffset": "5432",
    "lastPartition": 0,
    "messagesInLast5s": 50,
    "messagesPerSecond": 10.0
  },
  "ws": {
    "clients": 2
  },
  "uptimeSeconds": 300
}
```

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker address |
| `KAFKA_TOPIC` | `rocket.telemetry.v1` | Topic to consume from |
| `KAFKA_GROUP_ID` | `realtime-gateway` | Kafka consumer group ID |
| `PORT` | `4001` | HTTP and WebSocket server port |

## Running

### With the full stack

```bash
# From project root
pnpm dev:all
```

### Standalone

```bash
# Install dependencies
pnpm install

# Development (uses tsx, no build step needed)
pnpm dev

# Production (build first)
pnpm build
pnpm start
```

### Prerequisites

- Node.js 18+
- Kafka running with `rocket.telemetry.v1` topic populated (start `telemetry-processor` first)

## Logs

All output is structured JSON:

```json
{"level":"info","msg":"gateway_starting","ts":"...","kafkaTopic":"rocket.telemetry.v1","wsPort":4001}
{"level":"info","msg":"kafka_connected","ts":"...","brokers":["localhost:9092"]}
{"level":"info","msg":"ws_client_connected","ts":"...","ip":"::1","totalClients":1}
{"level":"debug","msg":"kafka_message","ts":"...","flightId":"FLT-A3F1B2C4","tPlusMs":1000,"partition":0,"offset":"12","clients":1}
{"level":"info","msg":"ws_client_disconnected","ts":"...","totalClients":0}
```

## Troubleshooting

**`kafka.connected` is false in health endpoint**

```bash
# Verify Kafka and telemetry-processor are running
docker compose ps

# Check gateway logs
pnpm dev
# or
docker compose logs -f realtime-gateway
```

**`messagesPerSecond` is 0**

The gateway is connected but not receiving events. This usually means the telemetry-processor is not running or is not publishing to `rocket.telemetry.v1`.

```bash
# Check telemetry-processor
docker compose logs -f telemetry-processor

# Verify v1 topic has messages
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic rocket.telemetry.v1 \
  --max-messages 1
```

**UI is not receiving data**

```bash
# Check how many WebSocket clients are connected
curl http://localhost:4001/health | jq '.ws.clients'

# Verify UI is connecting to the correct endpoint
# Should be: NEXT_PUBLIC_WS_URL=ws://localhost:4001/ws
```

**Consumer group lag**

```bash
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 \
  --describe --group realtime-gateway
```
