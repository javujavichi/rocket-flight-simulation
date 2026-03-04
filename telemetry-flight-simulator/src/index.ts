import { Kafka, Partitioners } from "kafkajs";
import { v4 as uuidv4 } from "uuid";
import { RocketSimulation } from "./simulation.js";

const KAFKA_BOOTSTRAP_SERVERS = process.env.KAFKA_BOOTSTRAP_SERVERS ?? "localhost:9092";
const KAFKA_BROKERS = KAFKA_BOOTSTRAP_SERVERS.split(",");
const KAFKA_TOPIC = process.env.KAFKA_TOPIC ?? "rocket.telemetry.raw";
const TICK_MS = 50;
const FLIGHT_DURATION_MS = 280_000;
const DELAY_BETWEEN_FLIGHTS_MS = 10_000; // 10 seconds between flights

function log(level: string, msg: string, data?: Record<string, any>) {
  const entry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...data,
  };
  console.log(JSON.stringify(entry));
}

async function main(): Promise<void> {
  log("info", "rocket_sim_starting", {
    kafkaBootstrap: KAFKA_BOOTSTRAP_SERVERS,
    kafkaTopic: KAFKA_TOPIC,
    tickMs: TICK_MS,
    durationMs: FLIGHT_DURATION_MS,
    delayBetweenFlights: DELAY_BETWEEN_FLIGHTS_MS,
  });

  const kafka = new Kafka({
    clientId: "telemetry-flight-simulator",
    brokers: KAFKA_BROKERS,
    retry: { retries: 10, initialRetryTime: 1000 },
  });

  const producer = kafka.producer({
    createPartitioner: Partitioners.DefaultPartitioner,
  });

  try {
    await producer.connect();
    log("info", "kafka_producer_connected", { brokers: KAFKA_BROKERS });
  } catch (err: any) {
    log("error", "kafka_connect_failed", { error: err.message });
    process.exit(1);
  }

  let isRunning = true;

  process.on("SIGINT", async () => {
    log("info", "rocket_sim_shutting_down");
    isRunning = false;
    await producer.disconnect();
    process.exit(0);
  });

  // Continuously run flights with delay between them
  while (isRunning) {
    await runFlight(producer);
    
    if (isRunning) {
      log("info", "waiting_between_flights", { delaySec: DELAY_BETWEEN_FLIGHTS_MS / 1000 });
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_FLIGHTS_MS));
    }
  }
}

async function runFlight(producer: any): Promise<void> {
  const flightId = `FLT-${uuidv4().slice(0, 8).toUpperCase()}`;

  log("info", "flight_starting", { flightId });

  const sim = new RocketSimulation(flightId);
  let tPlusMs = 0;
  let messageCount = 0;
  let lastLogTime = Date.now();

  return new Promise((resolve) => {
    const interval = setInterval(async () => {
      if (tPlusMs > FLIGHT_DURATION_MS) {
        log("info", "flight_complete", {
          flightId,
          tPlusMs,
          totalMessages: messageCount,
        });
        clearInterval(interval);
        resolve();
        return;
      }

      const telemetry = sim.tick(tPlusMs);
      messageCount++;

    try {
      const result = await producer.send({
        topic: KAFKA_TOPIC,
        messages: [
          {
            key: flightId,
            value: JSON.stringify(telemetry),
          },
        ],
      });

      // Log once per second (not every message)
      const now = Date.now();
      if (now - lastLogTime >= 1000) {
        const partition = result[0]?.partition ?? -1;
        const offset = result[0]?.baseOffset ?? "-1";

        log("info", "producing", {
          flightId,
          tPlusMs,
          tPlusSec: (tPlusMs / 1000).toFixed(1),
          altitudeM: Math.round(telemetry.altitudeM),
          velocityMS: Math.round(telemetry.verticalVelocityMS),
          thrustN: Math.round(telemetry.thrustN),
          propellantKg: Math.round(telemetry.propellantKg),
          stage: telemetry.stage,
          throttle: telemetry.throttle,
          partition,
          offset,
          messageCount,
        });

        lastLogTime = now;
      }
    } catch (err: any) {
      log("error", "kafka_send_error", { error: err.message, flightId, tPlusMs });
    }

    tPlusMs += TICK_MS;
    }, TICK_MS);
  });
}

main().catch((err) => {
  log("error", "rocket_sim_fatal_error", {
    error: err.message,
    stack: err.stack,
  });
  process.exit(1);
});
