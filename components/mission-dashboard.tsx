"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { RocketSimulation, DEFAULT_PARAMS, type SimulationParams } from "@/lib/simulation-engine";
import type { TelemetryRaw, SimEvent } from "@/lib/telemetry-types";
import { flightStatus } from "@/lib/telemetry-types";
import { MissionHeader } from "./mission-header";
import { TelemetryChart } from "./telemetry-chart";
import { EventLog } from "./event-log";
import { RocketTrajectory } from "./rocket-trajectory";
import { StatusBar } from "./status-bar";
import { SimulationConfig } from "./simulation-config";
import { useTelemetryStream } from "@/hooks/use-telemetry-stream";

const TICK_MS = 50;
const CHART_SAMPLE_INTERVAL = 10;
const FLIGHT_DURATION_MS = 280_000;
const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:4001/ws";
const DEFAULT_FLIGHT_ID = "FLT-SIM-0001";

interface ChartPoint {
  tPlusMs: number;
  value: number;
}

export function MissionDashboard() {
  const [mode, setMode] = useState<"sim" | "live">("live");
  const [running, setRunning] = useState(false);
  const [flightId, setFlightId] = useState(DEFAULT_FLIGHT_ID);
  const [tPlusMs, setTPlusMs] = useState(0);
  const [events, setEvents] = useState<SimEvent[]>([]);
  const [simParams, setSimParams] = useState<SimulationParams>(DEFAULT_PARAMS);

  const [altData, setAltData] = useState<ChartPoint[]>([]);
  const [velData, setVelData] = useState<ChartPoint[]>([]);
  const [thrustData, setThrustData] = useState<ChartPoint[]>([]);
  const [propData, setPropData] = useState<ChartPoint[]>([]);

  const [latest, setLatest] = useState<TelemetryRaw | null>(null);

  const simRef = useRef<RocketSimulation | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickCountRef = useRef(0);
  const lastPhaseRef = useRef<string | null>(null);

  // Live mode: use telemetry stream hook
  const liveStream = useTelemetryStream(WS_URL);

  const pushTelemetry = useCallback(
    (t: TelemetryRaw, newEvents: SimEvent[]) => {
      setLatest(t);
      setTPlusMs(t.tPlusMs);
      setFlightId(t.flightId);

      tickCountRef.current++;
      if (tickCountRef.current % CHART_SAMPLE_INTERVAL === 0) {
        const pt = { tPlusMs: t.tPlusMs };
        setAltData((prev) => [...prev, { ...pt, value: t.altitudeM }]);
        setVelData((prev) => [...prev, { ...pt, value: t.velocityMS }]);
        setThrustData((prev) => [...prev, { ...pt, value: t.thrustN }]);
        setPropData((prev) => [...prev, { ...pt, value: t.propellantKg }]);
      }

      if (newEvents.length > 0) {
        setEvents((prev) => [...prev, ...newEvents]);
      }
    },
    []
  );

  const resetState = useCallback(() => {
    setRunning(false);
    setTPlusMs(0);
    setEvents([]);
    setAltData([]);
    setVelData([]);
    setThrustData([]);
    setPropData([]);
    setLatest(null);
    setFlightId(DEFAULT_FLIGHT_ID);
    tickCountRef.current = 0;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    simRef.current = null;
  }, []);

  const handleStart = useCallback(() => {
    if (running) return;
    resetState();

    const sim = new RocketSimulation(DEFAULT_FLIGHT_ID, simParams);
    simRef.current = sim;
    setRunning(true);

    let t = 0;
    intervalRef.current = setInterval(() => {
      if (t > FLIGHT_DURATION_MS) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setRunning(false);
        return;
      }
      const { telemetry, events: newEvs } = sim.tick(t);
      pushTelemetry(telemetry, newEvs);
      t += TICK_MS;
    }, TICK_MS);
  }, [running, pushTelemetry, resetState, simParams]);

  const handleStop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  }, []);

  const handleReset = useCallback(() => {
    resetState();
  }, [resetState]);

  const handleToggleMode = useCallback(() => {
    resetState();
    lastPhaseRef.current = null;
    setMode((m) => (m === "sim" ? "live" : "sim"));
  }, [resetState]);

  // Live mode: update from stream
  useEffect(() => {
    if (mode !== "live" || !liveStream.latest) return;

    const t = liveStream.latest;
    setLatest(t);
    setTPlusMs(t.tPlusMs);
    setFlightId(t.flightId);

    // Generate event when phase changes
    if (t.phase && t.phase !== lastPhaseRef.current) {
      const event: SimEvent = {
        tPlusMs: t.tPlusMs,
        label: t.phase,
      };
      setEvents((prev) => [...prev, event]);
      lastPhaseRef.current = t.phase;
    }

    tickCountRef.current++;
    if (tickCountRef.current % CHART_SAMPLE_INTERVAL === 0) {
      const pt = { tPlusMs: t.tPlusMs };
      setAltData((prev) => [...prev, { ...pt, value: t.altitudeM }]);
      setVelData((prev) => [...prev, { ...pt, value: t.velocityMS }]);
      setThrustData((prev) => [...prev, { ...pt, value: t.thrustN }]);
      setPropData((prev) => [...prev, { ...pt, value: t.propellantKg }]);
    }
  }, [mode, liveStream.latest]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Status Bar - always visible in live mode */}
      {mode === "live" && (
        <StatusBar
          status={liveStream.status}
          lastMessageTime={liveStream.lastMessageTime}
          tPlusMs={liveStream.tPlusMs}
          flightId={liveStream.flightId}
          messagesPerSecond={liveStream.messagesPerSecond}
          noTelemetryWarning={liveStream.noTelemetryWarning}
        />
      )}

      <div className="flex flex-col gap-3 p-3 md:p-4">
        <MissionHeader
          flightId={flightId}
          tPlusMs={tPlusMs}
          running={running}
          mode={mode}
          connected={mode === "live" ? liveStream.status === "connected" : false}
          onStart={handleStart}
          onStop={handleStop}
          onReset={handleReset}
          onToggleMode={handleToggleMode}
        />

        {/* Simulation Parameters - only shown in sim mode */}
        {mode === "sim" && (
          <SimulationConfig
            params={simParams}
            onParamsChange={setSimParams}
            disabled={running}
          />
        )}

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
          {/* Rocket Trajectory Visualization */}
          <div className="lg:col-span-1">
            <RocketTrajectory
              altitudeM={latest?.altitudeM ?? 0}
              maxAltitude={180000}
              phase={flightStatus(tPlusMs)}
            />
          </div>

          {/* Telemetry Charts */}
          <div className="lg:col-span-2 grid grid-cols-1 gap-3 md:grid-cols-2">
            <TelemetryChart
              title="Altitude"
              unit="m"
              color="hsl(187 80% 48%)"
              data={altData}
              currentValue={latest?.altitudeM ?? 0}
              description="Height above Earth's surface. The rocket aims to reach ~180km for orbital insertion."
            />
            <TelemetryChart
              title="Velocity"
              unit="m/s"
              color="hsl(142 70% 49%)"
              data={velData}
              currentValue={latest?.velocityMS ?? 0}
              description="Vertical speed of the rocket. Orbital velocity is approximately 7,800 m/s (28,000 km/h)."
            />
            <TelemetryChart
              title="Thrust"
              unit="N"
              color="hsl(38 92% 50%)"
              data={thrustData}
              currentValue={latest?.thrustN ?? 0}
              description="Upward force generated by rocket engines. Stage 1 produces ~7.6MN, Stage 2 ~934kN."
            />
            <TelemetryChart
              title="Propellant"
              unit="kg"
              color="hsl(0 84% 60%)"
              data={propData}
              currentValue={latest?.propellantKg ?? 0}
              description="Remaining fuel mass. Stage 1 starts with 287 tons, Stage 2 with 75 tons of propellant."
            />
          </div>
        </div>

        <EventLog events={events} />

        <footer className="flex items-center justify-center gap-2 pb-2 text-center font-mono text-[10px] text-muted-foreground">
          <span className="font-semibold">Rocket Flight Digital Twin</span>
          <span>•</span>
          <span>made with ❤️ by Javiera Laso</span>
          <span>|</span>
          <span>
            {mode === "sim"
              ? "Simulation Mode"
              : `Live - ${liveStream.status === "connected" ? "Connected" : liveStream.status === "reconnecting" ? "Reconnecting..." : "Disconnected"}`}
          </span>
        </footer>
      </div>
    </div>
  );
}