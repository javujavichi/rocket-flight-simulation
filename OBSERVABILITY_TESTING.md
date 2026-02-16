# Observability Testing Guide

This guide walks through testing all observability features of the Rocket Flight Digital Twin system.

## Prerequisites

Ensure all services are running:
```bash
# Start Kafka
docker compose up -d

# Start Realtime Gateway (Terminal 1)
cd realtime-gateway
pnpm dev

# Start Rocket Simulator (Terminal 2)  
cd rocket-sim
pnpm dev

# Start UI (Terminal 3)
cd ..
pnpm dev
```

## Test 1: Base Flow - Normal Operation

**Expected:** UI shows connected state, charts update, telemetry flows

### Steps:

1. Open browser to http://localhost:3000

2. Observe the Status Bar (top of page):
   - ✅ Status: "Connected" (green)
   - ✅ Flight ID displayed (e.g., "FLT-12345678")
   - ✅ Mission Time updates (T+00:00, T+00:01, etc.)
   - ✅ Last Update timestamp ticking
   - ✅ Message Rate: ~20 msg/s (approximately)
   - ❌ No "No telemetry received" warning

3. Observe the Charts:
   - ✅ All 4 charts (Altitude, Velocity, Thrust, Propellant) update in real-time
   - ✅ Rocket animation moves upward
   - ✅ Event log shows mission events

4. Check gateway health endpoint:
```bash
curl http://localhost:4001/health
```

**Expected response:**
```json
{
  "status": "ok",
  "kafka": {
    "connected": true,
    "topic": "rocket.telemetry.raw",
    "groupId": "realtime-gateway",
    "lastMessageTs": "2026-02-15T...",
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

✅ **Test 1 PASSED** if all above conditions met.

---

## Test 2: Simulator Stops - No Telemetry Warning

**Expected:** UI remains connected but shows "No telemetry received" warning after 3 seconds

### Steps:

1. With UI running and connected, stop the rocket simulator:
```bash
# In the rocket-sim terminal, press Ctrl+C
```

2. Observe Status Bar within 3 seconds:
   - ✅ Status: Still "Connected" (green) - WebSocket stays up
   - ✅ Message Rate drops to 0.0 msg/s
   - ⚠️ "No telemetry received" warning appears (yellow) after 3s
   - ✅ Last Update timestamp stops changing
   - ✅ Charts stop updating

3. Check gateway health (should still show connected):
```bash
curl http://localhost:4001/health
```

**Expected:**
- `kafka.connected: true` (still connected to Kafka)
- `kafka.messagesPerSecond: 0` (no messages)
- `ws.clients: 1` (UI still connected)

✅ **Test 2 PASSED** if warning appears and WebSocket remains connected.

---

## Test 3: Gateway Stops - Disconnection & Auto-Reconnect

**Expected:** UI shows "Disconnected", then auto-reconnects when gateway restarts

### Steps:

1. Stop the realtime gateway:
```bash
# In the realtime-gateway terminal, press Ctrl+C
```

2. Observe Status Bar immediately:
   - ✅ Status: "Disconnected" (red)
   - ✅ Footer shows "Disconnected" or "Attempting to reconnect..."
   - ✅ Help text shows "Attempting to reconnect..."

3. Wait and observe reconnection attempts (check browser console):
```
[useTelemetryStream] Disconnected
[useTelemetryStream] Reconnecting in 1000ms (attempt 1)
[useTelemetryStream] Connecting... (attempt 2)
[useTelemetryStream] Reconnecting in 2000ms (attempt 2)
[useTelemetryStream] Connecting... (attempt 3)
[useTelemetryStream] Reconnecting in 4000ms (attempt 3)
```
   - ✅ Reconnect delays increase: 1s → 2s → 4s → 8s → 10s (max)
   - ✅ Status alternates: "Disconnected" → "Reconnecting"

4. Restart the gateway:
```bash
cd realtime-gateway
pnpm dev
```

5. Observe Status Bar within ~10 seconds:
   - ✅ Status: "Connected" (green) without page refresh!
   - ✅ Telemetry resumes (if simulator still running)
   - ✅ Message Rate starts climbing

✅ **Test 3 PASSED** if UI reconnects automatically and exponential backoff observed.

---

## Test 4: Health Endpoint Accuracy

**Expected:** `/health` reflects real-time system state

### Steps:

1. **With all services running:**
```bash
curl -s http://localhost:4001/health | jq
```

**Expected:**
- `status: "ok"`
- `kafka.connected: true`
- `kafka.messagesPerSecond: > 0`
- `ws.clients: 1` (or number of open browser tabs)

2. **Stop simulator, check health again:**
```bash
# Stop rocket-sim
curl -s http://localhost:4001/health | jq '.kafka.messagesPerSecond'
```

**Expected:**
- `messagesPerSecond: 0` (or very low)
- `lastMessageTs` unchanged (timestamp frozen)

3. **Open multiple browser tabs, check client count:**
```bash
# Open 3 tabs to http://localhost:3000
curl -s http://localhost:4001/health | jq '.ws.clients'
```

**Expected:**
- `ws.clients: 3`

✅ **Test 4 PASSED** if health endpoint accurately reflects system state.

---

## Test 5: Structured Logs

**Expected:** Services output JSON logs with relevant debugging info

### Gateway Logs:

Look for structured logs in gateway terminal:

```json
{"level":"info","msg":"gateway_starting","kafkaBootstrap":"localhost:9092","kafkaTopic":"rocket.telemetry.raw","kafkaGroupId":"realtime-gateway","wsPort":4001}
{"level":"info","msg":"http_server_started","port":4001,"healthEndpoint":"http://localhost:4001/health","wsEndpoint":"ws://localhost:4001/ws"}
{"level":"info","msg":"kafka_connected","brokers":["localhost:9092"]}
{"level":"info","msg":"ws_client_connected","ip":"::ffff:127.0.0.1","totalClients":1}
{"level":"debug","msg":"kafka_message","flightId":"FLT-12345678","tPlusMs":5000,"partition":2,"offset":"250","messageCount":100,"clients":1}
```

### Simulator Logs:

Look for structured logs in rocket-sim terminal:

```json
{"level":"info","msg":"rocket_sim_starting","flightId":"FLT-12345678","kafkaBootstrap":"localhost:9092","kafkaTopic":"rocket.telemetry.raw","tickMs":50}
{"level":"info","msg":"kafka_producer_connected","brokers":["localhost:9092"]}
{"level":"info","msg":"producing","flightId":"FLT-12345678","tPlusMs":10000,"tPlusSec":"10.0","altitudeM":25420,"velocityMS":850,"thrustN":7607000,"propellantKg":282400,"stage":1,"throttle":1,"partition":1,"offset":"500","messageCount":200}
```

### Verification:

- ✅ All logs are valid JSON (one per line)
- ✅ Logs include `flightId`, `partition`, `offset` for traceability
- ✅ Telemetry values match what's shown in UI
- ✅ Gateway logs only print ~1/sec (not overwhelming)
- ✅ Simulator logs only print ~1/sec

✅ **Test 5 PASSED** if logs are structured, parseable, and useful.

---

## Test 6: Message Rate Calculator

**Expected:** UI accurately tracks messages per second over 5-second window

### Steps:

1. With all services running, observe Status Bar "Rate"

2. The value should stabilize around **20 msg/s** (simulator sends 20 updates/sec)

3. Stop the simulator briefly, then restart:
   - ✅ Rate drops to 0.0 msg/s within 5 seconds
   - ✅ Rate climbs back up when simulator restarts
   - ✅ Rate smooths out (rolling 5-second average)

4. Open browser console and check:
```javascript
// messageTimestampsRef contains timestamps in last 5s
// messagesPerSecond = (count of timestamps) / 5
```

✅ **Test 6 PASSED** if rate calculation is accurate and responsive.

---

## Test 7: No Duplicate Connections

**Expected:** Reconnection logic prevents multiple WebSocket instances

### Steps:

1. Open browser DevTools → Network tab → WS filter

2. Disconnect and reconnect gateway multiple times rapidly

3. Observe WebSocket connections:
   - ✅ Only ONE active WebSocket at a time
   - ✅ Old connection closes before new one opens
   - ✅ No "ghost" connections remain open

4. Check `wsRef.current` cleanup in source code

✅ **Test 7 PASSED** if no duplicate connections created.

---

## Acceptance Criteria Summary

| Test | Criteria | Status |
|------|----------|--------|
| 1 | Base flow: connected, charts move, status bar updates | ✅ |
| 2 | Simulator stops → "No telemetry" warning within 3s | ✅ |
| 3 | Gateway stops → auto-reconnect with exponential backoff | ✅ |
| 4 | Health endpoint shows accurate metrics | ✅ |
| 5 | Structured JSON logs with partition/offset | ✅ |
| 6 | Message rate calculation (5s rolling window) | ✅ |
| 7 | No duplicate WebSocket connections | ✅ |

---

## Additional Manual Tests

### Test: Kafka Topic Inspection

View messages directly from Kafka:
```bash
docker exec -it kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 \
  --topic rocket.telemetry.raw \
  --from-beginning \
  --max-messages 5
```

**Expected:** See JSON telemetry messages

### Test: Multiple Clients

Open 3 browser tabs to http://localhost:3000

Check health endpoint:
```bash
curl -s http://localhost:4001/health | jq '.ws.clients'
```

**Expected:** `"clients": 3`

All tabs should receive same telemetry simultaneously.

### Test: Long-Running Stability

Let the system run for 5+ minutes:
- ✅ No memory leaks (check `htop` or Activity Monitor)
- ✅ Message rate stays consistent
- ✅ No WebSocket disconnections
- ✅ Charts continue to update smoothly

---

## Debugging Tips

**If tests fail:**

1. **Check service health:**
   ```bash
   curl http://localhost:4001/health
   ```

2. **View Kafka topics:**
   ```bash
   docker exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
   ```

3. **ConsumerGateway logs** (look for connection errors)

4. **Browser console** (look for WebSocket errors)

5. **Kafka consumer group lag:**
   ```bash
   docker exec kafka /opt/kafka/bin/kafka-consumer-groups.sh \
     --bootstrap-server localhost:9092 \
     --group realtime-gateway \
     --describe
   ```

---

## Success Criteria

All 7 tests must pass for full observability compliance. The system should be:

- ✅ Self-explanatory (status bar makes state obvious)
- ✅ Easy to debug (structured logs, health endpoint)
- ✅ Resilient (auto-reconnect, no duplicate connections)
- ✅ Observable (metrics, message rates, warnings)

🎉 **Observability Implementation Complete!**
