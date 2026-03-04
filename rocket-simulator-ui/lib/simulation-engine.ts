import type { TelemetryRaw, SimEvent } from "./telemetry-types";

const G = 9.81;
const R_EARTH = 6_371_000;

export interface SimulationParams {
  s1MaxThrust: number;
  s1Propellant: number;
  s1DryMass: number;
  s1BurnDuration: number;
  s2MaxThrust: number;
  s2Propellant: number;
  s2DryMass: number;
  s2Payload: number;
  s2IgnitionTime: number;
  s2BurnDuration: number;
}

export const DEFAULT_PARAMS: SimulationParams = {
  s1MaxThrust: 7_607_000,
  s1Propellant: 287_400,
  s1DryMass: 25_600,
  s1BurnDuration: 80_000,
  s2MaxThrust: 934_000,
  s2Propellant: 75_200,
  s2DryMass: 4_000,
  s2Payload: 5_500,
  s2IgnitionTime: 83_000,
  s2BurnDuration: 260_000,
};

const EVENTS: SimEvent[] = [
  { tPlusMs: 0, label: "LIFTOFF" },
  { tPlusMs: 10_000, label: "THROTTLE UP - FULL POWER" },
  { tPlusMs: 55_000, label: "MAX-Q - THROTTLE DOWN" },
  { tPlusMs: 70_000, label: "THROTTLE UP" },
  { tPlusMs: 80_000, label: "MECO - MAIN ENGINE CUTOFF" },
  { tPlusMs: 81_000, label: "STAGE SEPARATION" },
  { tPlusMs: 83_000, label: "SES-1 - SECOND ENGINE START" },
  { tPlusMs: 260_000, label: "SECO-1 - SECOND ENGINE CUTOFF" },
  { tPlusMs: 262_000, label: "ORBIT INSERTION CONFIRMED" },
];

export class RocketSimulation {
  private altitudeM = 0;
  private velocityMS = 0;
  private s1Propellant: number;
  private s2Propellant: number;
  private lastTMs = 0;
  private flightId: string;
  private eventIndex = 0;
  private params: SimulationParams;

  constructor(flightId: string, params: SimulationParams = DEFAULT_PARAMS) {
    this.flightId = flightId;
    this.params = params;
    this.s1Propellant = params.s1Propellant;
    this.s2Propellant = params.s2Propellant;
  }

  reset(): void {
    this.altitudeM = 0;
    this.velocityMS = 0;
    this.s1Propellant = this.params.s1Propellant;
    this.s2Propellant = this.params.s2Propellant;
    this.lastTMs = 0;
    this.eventIndex = 0;
  }

  tick(tPlusMs: number): { telemetry: TelemetryRaw; events: SimEvent[] } {
    const dt = Math.max(0, (tPlusMs - this.lastTMs) / 1000);
    this.lastTMs = tPlusMs;

    let stage = 1;
    let throttle = 0;
    let thrustN = 0;
    let propellantKg: number;
    let totalMass: number;

    const { s1MaxThrust, s1Propellant, s1DryMass, s1BurnDuration } = this.params;
    const { s2MaxThrust, s2Propellant, s2DryMass, s2Payload, s2IgnitionTime, s2BurnDuration } = this.params;

    if (tPlusMs < s1BurnDuration) {
      stage = 1;
      throttle = stage1Throttle(tPlusMs);
      thrustN = s1MaxThrust * throttle;
      const burnRate = (s1Propellant / (s1BurnDuration / 1000)) * throttle;
      this.s1Propellant = Math.max(0, this.s1Propellant - burnRate * dt);
      propellantKg = this.s1Propellant + this.s2Propellant;
      totalMass =
        s1DryMass + this.s1Propellant + s2DryMass + this.s2Propellant + s2Payload;
    } else if (tPlusMs < s2IgnitionTime) {
      stage = 1;
      throttle = 0;
      thrustN = 0;
      propellantKg = this.s2Propellant;
      totalMass = s2DryMass + this.s2Propellant + s2Payload;
    } else if (tPlusMs < s2BurnDuration) {
      stage = 2;
      throttle = stage2Throttle(tPlusMs, s2IgnitionTime);
      thrustN = s2MaxThrust * throttle;
      const burnRate =
        (s2Propellant / ((s2BurnDuration - s2IgnitionTime) / 1000)) * throttle;
      this.s2Propellant = Math.max(0, this.s2Propellant - burnRate * dt);
      propellantKg = this.s2Propellant;
      totalMass = s2DryMass + this.s2Propellant + s2Payload;
    } else {
      stage = 2;
      throttle = 0;
      thrustN = 0;
      propellantKg = this.s2Propellant;
      totalMass = s2DryMass + this.s2Propellant + s2Payload;
    }

    const gEff = G * Math.pow(R_EARTH / (R_EARTH + this.altitudeM), 2);
    const acc = (thrustN - totalMass * gEff) / totalMass;
    this.velocityMS += acc * dt;
    this.altitudeM += this.velocityMS * dt;

    if (this.altitudeM < 0) {
      this.altitudeM = 0;
      this.velocityMS = 0;
    }

    const newEvents: SimEvent[] = [];
    while (
      this.eventIndex < EVENTS.length &&
      EVENTS[this.eventIndex].tPlusMs <= tPlusMs
    ) {
      newEvents.push(EVENTS[this.eventIndex]);
      this.eventIndex++;
    }

    return {
      telemetry: {
        eventId: `${this.flightId}-${tPlusMs}`,
        flightId: this.flightId,
        ts: new Date().toISOString(),
        tPlusMs,
        stage,
        altitudeM: round2(this.altitudeM),
        velocityMS: round2(this.velocityMS),
        thrustN: Math.round(thrustN),
        propellantKg: round2(propellantKg),
        throttle: Math.round(throttle * 1000) / 1000,
      },
      events: newEvents,
    };
  }
}

function stage1Throttle(ms: number): number {
  const t = ms / 1000;
  if (t < 3) return 0.7 + 0.3 * (t / 3);
  if (t < 55) return 1.0;
  if (t < 70) return 0.7;
  return 1.0;
}

function stage2Throttle(ms: number, s2IgnitionMs: number): number {
  const t = (ms - s2IgnitionMs) / 1000;
  if (t < 3) return t / 3;
  if (ms > 260_000 - 5_000) return 0.5;
  return 1.0;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
