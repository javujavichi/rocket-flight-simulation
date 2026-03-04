"use client";

import { AlertCircle, Wifi, WifiOff, Activity } from "lucide-react";
import type { ConnectionStatus } from "@/hooks/use-telemetry-stream";
import { formatTPlus } from "@/lib/telemetry-types";

interface StatusBarProps {
  status: ConnectionStatus;
  lastMessageTime: string | null;
  tPlusMs: number;
  flightId: string | null;
  messagesPerSecond: number;
  noTelemetryWarning: boolean;
}

export function StatusBar({
  status,
  lastMessageTime,
  tPlusMs,
  flightId,
  messagesPerSecond,
  noTelemetryWarning,
}: StatusBarProps) {
  const statusConfig = {
    connected: {
      label: "Connected",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      icon: Wifi,
    },
    reconnecting: {
      label: "Reconnecting",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      icon: Activity,
    },
    disconnected: {
      label: "Disconnected",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      icon: WifiOff,
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div className="relative w-full border-b border-border bg-card">
      <div className="flex flex-wrap items-center gap-3 px-4 py-2 text-xs md:text-sm">
        {/* Connection Status */}
        <div
          className={`flex items-center gap-2 rounded-md px-3 py-1.5 ${config.bgColor}`}
        >
          <StatusIcon className={`h-4 w-4 ${config.color}`} />
          <span className={`font-medium ${config.color}`}>
            {config.label}
          </span>
        </div>

        {/* Flight ID */}
        {flightId && (
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-muted-foreground">Flight:</span>
            <span className="font-mono font-medium">{flightId}</span>
          </div>
        )}

        {/* T+ Time */}
        {flightId && (
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-muted-foreground">Mission Time:</span>
            <span className="font-mono font-medium">{formatTPlus(tPlusMs)}</span>
          </div>
        )}

        {/* Last Message Time */}
        {lastMessageTime && (
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-muted-foreground">Last Update:</span>
            <span className="font-mono text-xs">
              {new Date(lastMessageTime).toLocaleTimeString("en-US", {
                hour12: false,
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
              .{new Date(lastMessageTime).getMilliseconds().toString().padStart(3, "0")}
            </span>
          </div>
        )}

        {/* Message Rate */}
        {status === "connected" && (
          <div className="flex items-center gap-2 rounded-md bg-secondary px-3 py-1.5">
            <span className="text-muted-foreground">Rate:</span>
            <span className="font-mono font-medium">
              {messagesPerSecond.toFixed(1)} msg/s
            </span>
          </div>
        )}

        {/* No Telemetry Warning */}
        {noTelemetryWarning && status === "connected" && (
          <div className="flex items-center gap-2 rounded-md bg-yellow-500/10 px-3 py-1.5">
            <AlertCircle className="h-4 w-4 text-yellow-500" />
            <span className="font-medium text-yellow-500">
              No telemetry received
            </span>
          </div>
        )}

        {/* Spacer to push help text to the right on larger screens */}
        <div className="hidden flex-1 md:block" />

        {/* Help Text */}
        <div className="text-muted-foreground">
          {status === "disconnected" && "Attempting to reconnect..."}
          {status === "reconnecting" && "Establishing connection..."}
          {status === "connected" && !flightId && "Waiting for telemetry..."}
        </div>
      </div>
    </div>
  );
}
