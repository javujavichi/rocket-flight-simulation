# Mission Control UI

A real-time Mission Control dashboard built with Next.js and React, displaying live telemetry from a rocket flight simulation.

## Purpose

This service is the **user-facing layer** of the telemetry pipeline. It connects to the Realtime Gateway via WebSocket and renders all incoming telemetry data as live charts, trajectory animations, and a mission event log.

```
realtime-gateway → WebSocket → mission-control-ui → Browser
```

## What It Does

- Opens a persistent WebSocket connection to `ws://localhost:4001/ws`
- Receives `TelemetryV1` events and renders them in real time at 60fps
- Provides two operating modes: **Live** (data from the pipeline) and **Simulation** (local physics engine)
- Auto-reconnects on connection loss with exponential backoff (1s → 2s → 4s → 8s → max 10s)
- Displays a status bar with connection health, message rate, and stale-data warnings

## Key Pages

| Route | Description |
|-------|-------------|
| `/` | Main Mission Control dashboard |
| `/about` | System architecture overview |

## Dashboard Features

- **Live charts** — altitude, velocity, acceleration, thrust, propellant (Recharts)
- **Trajectory view** — animated rocket position from ground to orbit
- **Event log** — mission milestones: ignition, liftoff, MAX-Q, MECO, stage separation, orbit insertion
- **Simulation config panel** — adjust rocket parameters when in simulation mode
- **Status bar** — connection state, flight ID, T+ time, message rate

## Configuration

Create a `.env.local` file (copy from `.env.local.example`):

```env
NEXT_PUBLIC_WS_URL=ws://localhost:4001/ws
```

## Running

### With the full stack

```bash
# From project root
pnpm dev:all
```

### Standalone

```bash
cd mission-control-ui

# Install dependencies (first time only)
pnpm install

# Development server with Turbopack
pnpm dev

# Production build
pnpm build
pnpm start
```

### Prerequisites

- Node.js 18+
- Realtime Gateway running on port 4001 (for live mode)

## Technology Stack

| Technology | Purpose |
|------------|---------|
| Next.js 15 (App Router) | Framework |
| React 19 | UI library |
| TypeScript | Type safety |
| Recharts | Real-time charts |
| shadcn/ui + Radix UI | Component library |
| Tailwind CSS | Styling |
| WebSocket (ws) | Live telemetry stream |

## Troubleshooting

**Dashboard shows "Disconnected"**

```bash
# Verify the gateway is running
curl http://localhost:4001/health

# Check env variable
cat .env.local
# Should contain: NEXT_PUBLIC_WS_URL=ws://localhost:4001/ws
```

**No data after connecting**

```bash
# Check gateway metrics — kafka.connected should be true and msg_rate > 0
curl http://localhost:4001/health | jq '{kafka: .kafka.connected, msg_rate: .kafka.messagesPerSecond}'
```
