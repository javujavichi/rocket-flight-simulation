export interface TelemetryRaw {
  eventId: string;
  flightId: string;
  ts: string;
  tPlusMs: number;
  stage: number;
  altitudeM: number;
  verticalVelocityMS: number;
  thrustN: number;
  propellantKg: number;
  throttle: number;
}

const G = 9.81;
const R_EARTH = 6_371_000;

const S1_MAX_THRUST = 7_607_000;
const S1_PROPELLANT_INIT = 287_400;
const S1_DRY_MASS = 25_600;
const S1_BURN_END_MS = 80_000;

const S2_MAX_THRUST = 934_000;
const S2_PROPELLANT_INIT = 75_200;
const S2_DRY_MASS = 4_000;
const S2_PAYLOAD = 5_500;
const S2_IGNITION_MS = 83_000;
const S2_BURN_END_MS = 260_000;

export class RocketSimulation {
  private altitudeM = 0;
  private velocityMS = 0;
  private s1Propellant = S1_PROPELLANT_INIT;
  private s2Propellant = S2_PROPELLANT_INIT;
  private lastTMs = 0;
  private flightId: string;

  constructor(flightId: string) {
    this.flightId = flightId;
  }

  tick(tPlusMs: number): TelemetryRaw {
    const dt = Math.max(0, (tPlusMs - this.lastTMs) / 1000);
    this.lastTMs = tPlusMs;

    let stage = 1;
    let throttle = 0;
    let thrustN = 0;
    let propellantKg: number;
    let totalMass: number;

    if (tPlusMs < S1_BURN_END_MS) {
      stage = 1;
      throttle = stage1Throttle(tPlusMs);
      thrustN = S1_MAX_THRUST * throttle;
      const burnRate = (S1_PROPELLANT_INIT / (S1_BURN_END_MS / 1000)) * throttle;
      this.s1Propellant = Math.max(0, this.s1Propellant - burnRate * dt);
      propellantKg = this.s1Propellant + this.s2Propellant;
      totalMass =
        S1_DRY_MASS + this.s1Propellant + S2_DRY_MASS + this.s2Propellant + S2_PAYLOAD;
    } else if (tPlusMs < S2_IGNITION_MS) {
      stage = 1;
      throttle = 0;
      thrustN = 0;
      propellantKg = this.s2Propellant;
      totalMass = S2_DRY_MASS + this.s2Propellant + S2_PAYLOAD;
    } else if (tPlusMs < S2_BURN_END_MS) {
      stage = 2;
      throttle = stage2Throttle(tPlusMs);
      thrustN = S2_MAX_THRUST * throttle;
      const burnRate =
        (S2_PROPELLANT_INIT / ((S2_BURN_END_MS - S2_IGNITION_MS) / 1000)) * throttle;
      this.s2Propellant = Math.max(0, this.s2Propellant - burnRate * dt);
      propellantKg = this.s2Propellant;
      totalMass = S2_DRY_MASS + this.s2Propellant + S2_PAYLOAD;
    } else {
      stage = 2;
      throttle = 0;
      thrustN = 0;
      propellantKg = this.s2Propellant;
      totalMass = S2_DRY_MASS + this.s2Propellant + S2_PAYLOAD;
    }

    const gEff = G * Math.pow(R_EARTH / (R_EARTH + this.altitudeM), 2);
    const acc = (thrustN - totalMass * gEff) / totalMass;
    this.velocityMS += acc * dt;
    this.altitudeM += this.velocityMS * dt;

    if (this.altitudeM < 0) {
      this.altitudeM = 0;
      this.velocityMS = 0;
    }

    return {
      eventId: `${this.flightId}-${tPlusMs}`,
      flightId: this.flightId,
      ts: new Date().toISOString(),
      tPlusMs,
      stage,
      altitudeM: Math.round(this.altitudeM * 100) / 100,
      verticalVelocityMS: Math.round(this.velocityMS * 100) / 100,
      thrustN: Math.round(thrustN),
      propellantKg: Math.round(propellantKg * 100) / 100,
      throttle: Math.round(throttle * 1000) / 1000,
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

function stage2Throttle(ms: number): number {
  const t = (ms - S2_IGNITION_MS) / 1000;
  if (t < 3) return t / 3;
  if (ms > S2_BURN_END_MS - 5_000) return 0.5;
  return 1.0;
}
