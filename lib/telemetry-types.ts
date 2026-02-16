export interface TelemetryRaw {
  eventId: string;
  flightId: string;
  ts: string;
  tPlusMs: number;
  stage: number;
  altitudeM: number;
  velocityMS: number;
  thrustN: number;
  propellantKg: number;
  throttle: number;
  phase?: string;
}

export interface SimEvent {
  tPlusMs: number;
  label: string;
}

export function formatTPlus(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  const sign = ms >= 0 ? "+" : "-";
  return `T${sign}${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function flightStatus(tPlusMs: number): string {
  if (tPlusMs < 0) return "PRE-LAUNCH";
  if (tPlusMs < 80_000) return "STAGE 1 BURN";
  if (tPlusMs < 83_000) return "STAGE SEPARATION";
  if (tPlusMs < 260_000) return "STAGE 2 BURN";
  if (tPlusMs < 262_000) return "SECO";
  return "ORBIT ACHIEVED";
}
