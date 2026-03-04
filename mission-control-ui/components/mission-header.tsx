"use client";

import { formatTPlus, flightStatus } from "@/lib/telemetry-types";

interface MissionHeaderProps {
  flightId: string;
  tPlusMs: number;
  running: boolean;
  mode: "sim" | "live";
  connected: boolean;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onToggleMode: () => void;
}

import Link from "next/link";
import {
  Play,
  Square,
  RotateCcw,
  Info,
  Radio,
  FlaskConical,
} from "lucide-react";

export function MissionHeader({
  flightId,
  tPlusMs,
  running,
  mode,
  connected,
  onStart,
  onStop,
  onReset,
  onToggleMode,
}: MissionHeaderProps) {
  const status = flightStatus(tPlusMs);

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-card px-5 py-3">
      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="h-6 w-6 text-primary"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
            <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
            <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
            <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
          </svg>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            Mission Control
          </h1>
        </div>

        <div className="hidden items-center gap-4 sm:flex">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Flight
            </span>
            <span className="font-mono text-sm text-foreground">{flightId}</span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Clock
            </span>
            <span className="font-mono text-sm tabular-nums text-foreground">
              {formatTPlus(tPlusMs)}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Status
            </span>
            <span className="font-mono text-sm text-primary">{status}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Navigation Group */}
        <Link
          href="/about"
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          title="About this project"
        >
          <Info className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">About</span>
        </Link>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Mode Switcher Group */}
        <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
          <button
            onClick={onToggleMode}
            disabled={mode === "sim"}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-all ${
              mode === "sim"
                ? "bg-secondary text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Simulation mode - Run physics simulation locally"
          >
            <FlaskConical className="h-3.5 w-3.5" />
            <span>Simulation</span>
          </button>
          <button
            onClick={onToggleMode}
            disabled={mode === "live"}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs transition-all ${
              mode === "live"
                ? "bg-secondary text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
            title="Live mode - Stream real-time data from Kafka"
          >
            <Radio className="h-3.5 w-3.5" />
            <span>Live</span>
            {mode === "live" && (
              <span
                className={`inline-block h-1.5 w-1.5 rounded-full ${
                  connected ? "bg-green-500 animate-pulse" : "bg-destructive"
                }`}
              />
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* Controls Group */}
        <div className="flex items-center gap-2">
          {mode === "sim" ? (
            <>
              {running ? (
                <button
                  onClick={onStop}
                  className="flex items-center gap-1.5 rounded-md bg-destructive px-4 py-1.5 font-mono text-xs font-semibold text-destructive-foreground shadow-sm transition-all hover:opacity-90"
                  title="Stop the running simulation"
                >
                  <Square className="h-3.5 w-3.5" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={onStart}
                  className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 font-mono text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90"
                  title="Start simulation"
                >
                  <Play className="h-3.5 w-3.5" />
                  <span>Launch</span>
                </button>
              )}
              <button
                onClick={onReset}
                disabled={running}
                className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                title="Reset simulation data"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </>
          ) : (
            <button
              onClick={onReset}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 font-mono text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              title="Clear accumulated telemetry data"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Clear Data</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
