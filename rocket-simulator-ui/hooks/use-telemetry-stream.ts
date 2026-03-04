"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TelemetryRaw } from "@/lib/telemetry-types";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

interface TelemetryStreamState {
  status: ConnectionStatus;
  latest: TelemetryRaw | null;
  lastMessageTime: string | null;
  messagesPerSecond: number;
  noTelemetryWarning: boolean;
  tPlusMs: number;
  flightId: string | null;
}

const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 10000]; // exponential backoff, max 10s
const NO_TELEMETRY_THRESHOLD_MS = 3000;
const RATE_WINDOW_MS = 5000;

export function useTelemetryStream(wsUrl: string): TelemetryStreamState {
  const [status, setStatus] = useState<ConnectionStatus>("reconnecting");
  const [latest, setLatest] = useState<TelemetryRaw | null>(null);
  const [lastMessageTime, setLastMessageTime] = useState<string | null>(null);
  const [messagesPerSecond, setMessagesPerSecond] = useState(0);
  const [noTelemetryWarning, setNoTelemetryWarning] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageTimestampsRef = useRef<number[]>([]);
  const noTelemetryCheckRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rateCalculatorRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isConnectingRef = useRef(false);

  const connect = useCallback(() => {
    // Prevent duplicate connections
    if (isConnectingRef.current || (wsRef.current && wsRef.current.readyState === WebSocket.OPEN)) {
      return;
    }

    isConnectingRef.current = true;

    // Clean up existing connection
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // Clear any pending reconnect timer
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    console.log(
      `[useTelemetryStream] Connecting to ${wsUrl} (attempt ${reconnectAttemptRef.current + 1})`
    );
    setStatus("reconnecting");

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[useTelemetryStream] Connected");
        setStatus("connected");
        reconnectAttemptRef.current = 0; // Reset backoff on successful connection
        isConnectingRef.current = false;
      };

      ws.onmessage = (event) => {
        try {
          const telemetry: TelemetryRaw = JSON.parse(event.data);
          const now = new Date().toISOString();

          setLatest(telemetry);
          setLastMessageTime(now);
          setNoTelemetryWarning(false);

          // Track message timestamp for rate calculation
          messageTimestampsRef.current.push(Date.now());
        } catch (err) {
          console.error("[useTelemetryStream] Failed to parse message:", err);
        }
      };

      ws.onerror = (error) => {
        console.error("[useTelemetryStream] WebSocket error:", error);
        console.error("[useTelemetryStream] Make sure the Realtime Gateway is running on port 4001");
        console.error("[useTelemetryStream] Try: cd realtime-gateway && pnpm dev");
      };

      ws.onclose = () => {
        console.log("[useTelemetryStream] Disconnected");
        setStatus("disconnected");
        wsRef.current = null;
        isConnectingRef.current = false;

        // Schedule reconnection with exponential backoff
        const delayIndex = Math.min(
          reconnectAttemptRef.current,
          RECONNECT_DELAYS.length - 1
        );
        const delay = RECONNECT_DELAYS[delayIndex];

        console.log(
          `[useTelemetryStream] Reconnecting in ${delay}ms (attempt ${reconnectAttemptRef.current + 1})`
        );

        reconnectTimerRef.current = setTimeout(() => {
          reconnectAttemptRef.current++;
          connect();
        }, delay);
      };
    } catch (err) {
      console.error("[useTelemetryStream] Failed to create WebSocket:", err);
      setStatus("disconnected");
      isConnectingRef.current = false;
    }
  }, [wsUrl]);

  // Initial connection
  useEffect(() => {
    connect();

    // Start rate calculator (update every 500ms)
    rateCalculatorRef.current = setInterval(() => {
      const now = Date.now();
      const timestamps = messageTimestampsRef.current;

      // Remove timestamps older than 5 seconds
      const recentTimestamps = timestamps.filter(
        (ts) => now - ts < RATE_WINDOW_MS
      );
      messageTimestampsRef.current = recentTimestamps;

      // Calculate messages per second
      const rate = recentTimestamps.length / (RATE_WINDOW_MS / 1000);
      setMessagesPerSecond(Math.round(rate * 10) / 10);
    }, 500);

    // Start no-telemetry checker (check every 500ms)
    noTelemetryCheckRef.current = setInterval(() => {
      if (!lastMessageTime) {
        setNoTelemetryWarning(false);
        return;
      }

      const now = Date.now();
      const lastMsgTime = new Date(lastMessageTime).getTime();
      const timeSinceLastMessage = now - lastMsgTime;

      setNoTelemetryWarning(timeSinceLastMessage > NO_TELEMETRY_THRESHOLD_MS);
    }, 500);

    // Cleanup on unmount
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }

      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }

      if (rateCalculatorRef.current) {
        clearInterval(rateCalculatorRef.current);
        rateCalculatorRef.current = null;
      }

      if (noTelemetryCheckRef.current) {
        clearInterval(noTelemetryCheckRef.current);
        noTelemetryCheckRef.current = null;
      }

      isConnectingRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl]); // Only reconnect when wsUrl changes

  return {
    status,
    latest,
    lastMessageTime,
    messagesPerSecond,
    noTelemetryWarning,
    tPlusMs: latest?.tPlusMs ?? 0,
    flightId: latest?.flightId ?? null,
  };
}
