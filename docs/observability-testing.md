# Observability Testing Guide

This guide walks through testing all observability features of the Rocket Flight Digital Twin system. Each test is designed to verify a specific behavior and includes exact commands and expected outcomes.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Test 1 — Normal Operation](#test-1--normal-operation)
- [Test 2 — Simulator Stops (No Telemetry Warning)](#test-2--simulator-stops-no-telemetry-warning)
- [Test 3 — Gateway Stops (Disconnection and Auto-Reconnect)](#test-3--gateway-stops-disconnection-and-auto-reconnect)
- [Test 4 — Health Endpoint Accuracy](#test-4--health-endpoint-accuracy)
- [Test 5 — Structured Logs](#test-5--structured-logs)
- [Test 6 — Message Rate Calculator](#test-6--message-rate-calculator)
- [Test 7 — No Duplicate Connections](#test-7--no-duplicate-connections)
- [Acceptance Criteria](#acceptance-criteria)
- [Additional Manual Tests](#additional-manual-tests)
- [Debugging Tips](#debugging-tips)

---

## Prerequisites

Start the full system before running any test:

```bash
pnpm dev:all
```

This starts Docker infrastructure (Kafka, PostgreSQL, telemetry-service, Kafka UI) and the three local services (UI, Gateway, Simulator) via `concurrently`.

Verify everything is running:

```bash
docker compose ps                                          # All containers "Up"
pnpm kafka:health                                          # status: "ok", kafka.connected: true
curl -s http://localhost:8081/actuator/health | jq .status  # "UP"
```

Wait until all services show output in the terminal before proceeding.

---

## Test 1 — Normal Operation

**Goal:** Confirm the base flow works — UI shows connected state, charts update, telemetry flows end to end.

### Steps

1. Open http://localhost:3000

2. Observe the Status Bar (top of page):
   - Status: **Connected** (green)
   - Flight ID displayed (e.g., `FLT-A3B7C1D2`)
   - Mission Time updates (`T+00:00`, `T+00:01`, etc.)
   - Last Update timestamp ticking
   - Message Rate: approximately **20 msg/s**
   - No "No telemetry received" warning visible

3. Observe the Charts:
   - All 4 charts (Altitude, Velocity, Thrust, Propellant) update in real time
   - Rocket animation moves upward
   - Event log shows mission events

4. Check the gateway health endpoint:

```bash
curl -s http://localhost:4001/health | jq
```

### Expected Health Response

```json
{
  "status": "ok",
  "kafka": {
    "connected": true,
    "topic": "rocket.telemetry.v1",
    "groupId": "realtime-gateway",
    "lastMessageTs": "2026-03-03T...",
    "lastOffset": "1234",
    "lastPartition": 0,
    "messagesInLast5s": 100,
    "messagesPerSecond": 20
  },
  "ws": {
    "clients": 1
  },
  "uptimeSeconds": 45
}
```

> **Note:** The gateway consumes from `rocket.telemetry.v1` (the normalized topic), not `rocket.telemetry.raw`.

### Pass Criteria

All status bar indicators are correct, charts are updating, and the health endpoint returns `status: "ok"` with `kafka.connected: true`.

---

## Test 2 — Simulator Stops (No Telemetry Warning)

**Goal:** Verify the UI detects when telemetry stops flowing and shows a warning, while the WebSocket connection stays open.

### Steps

1. With the UI running and connected, stop the rocket simulator:

```bash
# If running via pnpm dev:all, stop only the simulator:
kill $(lsof -ti:9092 -sTCP:ESTABLISHED) 2>/dev/null
# Or press Ctrl+C in the rocket-sim terminal if running separately
```

2. Observe the Status Bar within 3 seconds:
   - Status: Still **Connected** (green) — the WebSocket stays open
   - Message Rate drops to **0.0 msg/s**
   - **"No telemetry received"** warning appears (yellow) after 3 seconds
   - Last Update timestamp stops changing
   - Charts stop updating

3. Check gateway health:

```bash
curl -s http://localhost:4001/health | jq '{connected: .kafka.connected, rate: .kafka.messagesPerSecond, clients: .ws.clients}'
```

### Expected

```json
{
  "connected": true,
  "rate": 0,
  "clients": 1
}
```

The gateway is still connected to Kafka and the UI is still connected to the gateway — there is simply no data being produced.

### Technical Detail

The warning threshold is `NO_TELEMETRY_THRESHOLD_MS = 3000` in `use-telemetry-stream.ts`. The hook checks every 500 ms whether the last message timestamp exceeds this threshold.

### Pass Criteria

Warning appears within ~3 seconds. WebSocket remains connected.

---

## Test 3 — Gateway Stops (Disconnection and Auto-Reconnect)

**Goal:** Verify the UI shows "Disconnected," attempts reconnection with exponential backoff, and auto-reconnects when the gateway comes back.

### Step 1 — Stop the Gateway

```bash
kill $(lsof -ti:4001)
```

### Step 2 — Observe the UI

- Status: **Disconnected** (red)
- Help text shows: **"Attempting to reconnect..."**

### Step 3 — Check Browser Console

The reconnect logs follow this pattern:

```
[useTelemetryStream] Disconnected
[useTelemetryStream] Reconnecting in 1000ms (attempt 1)
[useTelemetryStream] Connecting to ws://localhost:4001/ws (attempt 2)
[useTelemetryStream] Reconnecting in 2000ms (attempt 2)
[useTelemetryStream] Connecting to ws://localhost:4001/ws (attempt 3)
[useTelemetryStream] Reconnecting in 4000ms (attempt 3)
[useTelemetryStream] Connecting to ws://localhost:4001/ws (attempt 4)
[useTelemetryStream] Reconnecting in 8000ms (attempt 4)
[useTelemetryStream] Connecting to ws://localhost:4001/ws (attempt 5)
[useTelemetryStream] Reconnecting in 10000ms (attempt 5)
```

Delays increase: **1s → 2s → 4s → 8s → 10s** (max). Defined in `RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 10000]`.

### Step 4 — Restart the Gateway

```bash
pnpm dev:gateway
```

### Step 5 — Observe the UI

Within ~10 seconds:

- Status: **Connected** (green) — without page refresh
- Telemetry resumes (if the simulator is still running)
- Message Rate starts climbing back to ~20 msg/s
- Browser console shows: `[useTelemetryStream] Connected`

### Pass Criteria

UI reconnects automatically. Exponential backoff is visible in console logs. No page refresh required.

---

## Test 4 — Health Endpoint Accuracy

**Goal:** Verify the `/health` endpoint reflects the real-time system state across different conditions.

### Check 1 — All Services Running

```bash
curl -s http://localhost:4001/health | jq '{status, connected: .kafka.connected, rate: .kafka.messagesPerSecond, clients: .ws.clients}'
```

**Expected:**

```json
{
  "status": "ok",
  "connected": true,
  "rate": 20,
  "clients": 1
}
```

### Check 2 — Simulator Stopped

Stop the simulator, wait 5 seconds, then:

```bash
curl -s http://localhost:4001/health | jq '{rate: .kafka.messagesPerSecond, lastTs: .kafka.lastMessageTs}'
```

**Expected:** `rate: 0` (or near zero). `lastTs` is frozen at the last received timestamp.

### Check 3 — Multiple Browser Tabs

Open 3 tabs to http://localhost:3000, then:

```bash
curl -s http://localhost:4001/health | jq '.ws.clients'
```

**Expected:** `3`

### Technical Detail

The rate calculation uses a **5-second sliding window**. The gateway tracks `messageTimestamps[]`, filters to the last 5 seconds, and divides by 5 to get messages per second (rounded to 1 decimal).

### Pass Criteria

All three checks return accurate values that match the system state.

---

## Test 5 — Structured Logs

**Goal:** Confirm all services output structured JSON logs with tracing fields (flightId, partition, offset).

### Gateway Logs

Look for these structured entries in the gateway terminal output:

```json
{"level":"info","msg":"gateway_starting","ts":"...","kafkaBootstrap":"localhost:9092","kafkaTopic":"rocket.telemetry.v1","kafkaGroupId":"realtime-gateway","wsPort":4001}
{"level":"info","msg":"http_server_started","ts":"...","port":4001,"healthEndpoint":"http://localhost:4001/health","wsEndpoint":"ws://localhost:4001/ws"}
{"level":"info","msg":"kafka_connected","ts":"...","brokers":["localhost:9092"]}
{"level":"info","msg":"kafka_subscribed","ts":"...","topic":"rocket.telemetry.v1"}
{"level":"info","msg":"ws_client_connected","ts":"...","ip":"::ffff:127.0.0.1","totalClients":1}
{"level":"debug","msg":"kafka_message","ts":"...","flightId":"FLT-A3B7C1D2","tPlusMs":5000,"partition":2,"offset":"250","messageCount":100,"clients":1}
```

### Simulator Logs

Look for these structured entries in the rocket-sim terminal output:

```json
{"level":"info","msg":"rocket_sim_starting","ts":"...","kafkaBootstrap":"localhost:9092","kafkaTopic":"rocket.telemetry.raw","tickMs":50,"durationMs":280000,"delayBetweenFlights":10000}
{"level":"info","msg":"kafka_producer_connected","ts":"...","brokers":["localhost:9092"]}
{"level":"info","msg":"flight_starting","ts":"...","flightId":"FLT-A3B7C1D2"}
{"level":"info","msg":"producing","ts":"...","flightId":"FLT-A3B7C1D2","tPlusMs":10000,"tPlusSec":"10.0","altitudeM":25420,"velocityMS":850,"thrustN":7607000,"propellantKg":282400,"stage":1,"throttle":1,"partition":1,"offset":"500","messageCount":200}
```

### Verification

- All logs are valid JSON (one entry per line)
- Logs include `flightId`, `partition`, `offset` for end-to-end traceability
- Both gateway and simulator log at ~1 entry/second (not every message — throttled by `lastLogTime`)

### Pass Criteria

Logs are structured, parseable, and include tracing fields.

---

## Test 6 — Message Rate Calculator

**Goal:** Verify the UI accurately tracks messages per second using a 5-second rolling window.

### Steps

1. With all services running, observe the Status Bar "Rate" field
2. The value should stabilize around **20 msg/s** (the simulator sends every 50 ms = 20 events/second)
3. Stop the simulator, then restart it:
   - Rate drops to **0.0 msg/s** within 5 seconds
   - Rate climbs back to ~20 msg/s after restart
   - The value smooths out because it uses a rolling 5-second average

### Technical Detail

In `use-telemetry-stream.ts`:
- `messageTimestampsRef` stores the timestamp of each received message
- Every 500 ms, timestamps older than `RATE_WINDOW_MS` (5000 ms) are pruned
- Rate = `count / 5`, rounded to 1 decimal place

### Pass Criteria

Rate is accurate and responsive. Drops to 0 within 5 seconds when the simulator stops, climbs back when it restarts.

---

## Test 7 — No Duplicate Connections

**Goal:** Verify the reconnection logic prevents multiple simultaneous WebSocket connections.

### Steps

1. Open browser DevTools → Network tab → WS filter
2. Stop and restart the gateway multiple times rapidly
3. Observe WebSocket connections:
   - Only **one** active WebSocket at a time
   - Old connection closes before a new one opens
   - No "ghost" connections remain

### Technical Detail

The `isConnectingRef` flag in `use-telemetry-stream.ts` prevents duplicate connections. The `connect()` function checks both `isConnectingRef.current` and `wsRef.current.readyState === WebSocket.OPEN` before proceeding. Existing connections are closed with `wsRef.current.close()` before creating a new one.

### Pass Criteria

No duplicate WebSocket connections are created at any point.

---

## Acceptance Criteria

| Test | Criteria | Expected |
|------|----------|----------|
| 1 | Base flow: connected, charts update, status bar correct | Connected + ~20 msg/s |
| 2 | Simulator stops → "No telemetry received" warning | Warning within 3 s |
| 3 | Gateway stops → auto-reconnect with exponential backoff | Reconnects without page refresh |
| 4 | Health endpoint reflects accurate metrics | Values match system state |
| 5 | Structured JSON logs with partition/offset | Valid JSON, traceable fields |
| 6 | Message rate calculation (5 s rolling window) | Accurate and responsive |
| 7 | No duplicate WebSocket connections | One connection at a time |

All 7 tests must pass for full observability compliance.

---

## Additional Manual Tests

### Kafka Topic Inspection

View raw messages directly from Kafka:

```bash
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic rocket.telemetry.raw \
  --from-beginning \
  --max-messages 5
```

View normalized messages:

```bash
docker exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic rocket.telemetry.v1 \
  --from-beginning \
  --max-messages 5
```

### Multiple Clients

Open 3 browser tabs to http://localhost:3000 and verify:

```bash
curl -s http://localhost:4001/health | jq '.ws.clients'
```

Expected: `3`. All tabs should receive the same telemetry simultaneously.

### Long-Running Stability

Let the system run for 5+ minutes and verify:

- No memory leaks (check with `htop` or Activity Monitor)
- Message rate stays consistent at ~20 msg/s
- No WebSocket disconnections
- Charts continue to update smoothly
- Each flight runs for ~280 seconds, then a new flight starts after a 10-second delay

---

## Debugging Tips

If any test fails:

1. **Check service health:**

```bash
pnpm kafka:health
curl -s http://localhost:8081/actuator/health | jq
```

2. **List Kafka topics:**

```bash
docker exec kafka /opt/kafka/bin/kafka-topics.sh \
  --bootstrap-server localhost:9092 --list
```

3. **Check consumer group lag:**

```bash
docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
  --bootstrap-server localhost:9092 --describe --all-groups
```

4. **Gateway logs** — look for Kafka connection errors or WebSocket errors in the gateway terminal output.

5. **Browser console** — look for `[useTelemetryStream]` messages showing connection state and errors.

6. **Infrastructure status:**

```bash
docker compose ps
docker compose logs --tail=20 kafka
docker compose logs --tail=20 telemetry-service
```
