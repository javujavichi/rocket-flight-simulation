# Telemetry Flight Simulator

A physics-based rocket flight simulator that generates realistic telemetry events and publishes them to Kafka.

## Purpose

This service acts as the **data source** for the entire telemetry pipeline. It simulates a two-stage rocket launch from liftoff to orbit, producing raw sensor data at 20Hz. It is the starting point of the event stream.

```
telemetry-flight-simulator → [rocket.telemetry.raw] → telemetry-processor → ...
```

## What It Does

- Simulates a two-stage rocket flight (~280 seconds total duration)
- Calculates physics per tick: altitude, velocity, thrust, propellant consumption
- Publishes raw telemetry events to Kafka topic `rocket.telemetry.raw`
- Automatically starts a new flight after a 10-second delay when the previous one completes
- Logs structured JSON to stdout

## Flight Profile

| Phase | Time | Description |
|-------|------|-------------|
| Stage 1 burn | T+0 to T+80s | Main engine ignition, liftoff, max-Q |
| Stage 1 coast | T+80s to T+83s | Engine cutoff (MECO), stage separation |
| Stage 2 burn | T+83s to T+260s | Upper stage ignition, ascent to orbit |
| Orbit coast | T+260s to T+280s | Engine cutoff, orbit insertion |

## Physics Model

Each tick calculates:

- **Effective gravity** adjusted for altitude: $g_{eff} = g_0 \cdot \left(\frac{R}{R + h}\right)^2$
- **Net acceleration**: $a = \frac{F_{thrust} - m \cdot g_{eff}}{m}$
- **Velocity integration**: $v_{n+1} = v_n + a \cdot \Delta t$
- **Altitude integration**: $h_{n+1} = h_n + v_n \cdot \Delta t$

### Rocket Parameters

**Stage 1:**
| Parameter | Value |
|-----------|-------|
| Max Thrust | 7,607,000 N |
| Propellant | 287,400 kg |
| Dry Mass | 25,600 kg |
| Burn Duration | 80 seconds |

**Stage 2:**
| Parameter | Value |
|-----------|-------|
| Max Thrust | 934,000 N |
| Propellant | 75,200 kg |
| Dry Mass | 4,000 kg |
| Payload | 5,500 kg |
| Burn Duration | 177 seconds |

## Telemetry Event Schema

Each event published to `rocket.telemetry.raw`:

```json
{
  "eventId": "FLT-A3F1B2C4-15000",
  "flightId": "FLT-A3F1B2C4",
  "ts": "2026-03-03T12:00:15.000Z",
  "tPlusMs": 15000,
  "stage": 1,
  "altitudeM": 4523.5,
  "verticalVelocityMS": 452.1,
  "thrustN": 7607000,
  "propellantKg": 251430.0,
  "throttle": 1.0
}
```

| Field | Type | Description |
|-------|------|-------------|
| `eventId` | string | Unique ID per tick (`flightId-tPlusMs`) |
| `flightId` | string | Unique flight identifier (e.g. `FLT-A3F1B2C4`) |
| `ts` | ISO 8601 | Wall clock timestamp |
| `tPlusMs` | number | Mission elapsed time in milliseconds |
| `stage` | 1 or 2 | Active rocket stage |
| `altitudeM` | number | Altitude in meters above ground |
| `verticalVelocityMS` | number | Vertical velocity in m/s |
| `thrustN` | number | Engine thrust in Newtons |
| `propellantKg` | number | Remaining propellant in kg |
| `throttle` | 0.0–1.0 | Engine throttle level |

## Configuration

| Environment Variable | Default | Description |
|---------------------|---------|-------------|
| `KAFKA_BOOTSTRAP_SERVERS` | `localhost:9092` | Kafka broker address |
| `KAFKA_TOPIC` | `rocket.telemetry.raw` | Target topic name |

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
- Kafka running on `localhost:9092` (or set `KAFKA_BOOTSTRAP_SERVERS`)

## Logs

All output is structured JSON:

```json
{"level":"info","msg":"flight_starting","ts":"...","flightId":"FLT-A3F1B2C4"}
{"level":"info","msg":"producing","ts":"...","flightId":"FLT-A3F1B2C4","tPlusMs":1000,"altitudeM":152,"stage":1,"throttle":0.9}
{"level":"info","msg":"flight_complete","ts":"...","flightId":"FLT-A3F1B2C4","totalMessages":5600}
{"level":"info","msg":"waiting_between_flights","ts":"...","delaySec":10}
```

## Troubleshooting

**Kafka connection error on startup**

```bash
# Verify Kafka is running
docker compose ps kafka

# Check topic exists
docker exec kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
```

**No messages appearing in Kafka UI**

```bash
# Check simulator logs
docker compose logs -f telemetry-flight-simulator
# Or if running locally:
pnpm dev
```
