import { Kafka } from "kafkajs";
import { WebSocketServer, WebSocket } from "ws";
import http from "http";

const KAFKA_BOOTSTRAP_SERVERS = process.env.KAFKA_BOOTSTRAP_SERVERS ?? "localhost:9092";
const KAFKA_BROKERS = KAFKA_BOOTSTRAP_SERVERS.split(",");
const KAFKA_TOPIC = process.env.KAFKA_TOPIC ?? "rocket.telemetry.v1";
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID ?? "realtime-gateway";
const PORT = Number(process.env.PORT ?? 4001);

const clients = new Set<WebSocket>();

// Metrics tracking
const metrics = {
  startTime: Date.now(),
  kafka: {
    connected: false,
    lastMessageTs: null as string | null,
    lastOffset: null as string | null,
    lastPartition: null as number | null,
    messageTimestamps: [] as number[],
  },
};

function log(level: string, msg: string, data?: Record<string, any>) {
  const entry = {
    level,
    msg,
    ts: new Date().toISOString(),
    ...data,
  };
  console.log(JSON.stringify(entry));
}

function getMetrics() {
  const now = Date.now();
  const uptimeSeconds = Math.floor((now - metrics.startTime) / 1000);

  // Calculate messages in last 5s
  const fiveSecondsAgo = now - 5000;
  const recentMessages = metrics.kafka.messageTimestamps.filter(
    (ts) => ts > fiveSecondsAgo
  );
  metrics.kafka.messageTimestamps = recentMessages; // Clean up old timestamps

  const messagesInLast5s = recentMessages.length;
  const messagesPerSecond = messagesInLast5s / 5;

  return {
    status: "ok",
    kafka: {
      connected: metrics.kafka.connected,
      topic: KAFKA_TOPIC,
      groupId: KAFKA_GROUP_ID,
      lastMessageTs: metrics.kafka.lastMessageTs,
      lastOffset: metrics.kafka.lastOffset,
      lastPartition: metrics.kafka.lastPartition,
      messagesInLast5s,
      messagesPerSecond: Math.round(messagesPerSecond * 10) / 10,
    },
    ws: {
      clients: clients.size,
    },
    uptimeSeconds,
  };
}

async function main(): Promise<void> {
  log("info", "gateway_starting", {
    kafkaBootstrap: KAFKA_BOOTSTRAP_SERVERS,
    kafkaTopic: KAFKA_TOPIC,
    kafkaGroupId: KAFKA_GROUP_ID,
    wsPort: PORT,
  });

  // Create HTTP server for health endpoint
  const server = http.createServer((req, res) => {
    if (req.url === "/health" && req.method === "GET") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(getMetrics(), null, 2));
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
    }
  });

  // WebSocket server
  const wss = new WebSocketServer({ server, path: "/ws" });

  wss.on("connection", (ws, req) => {
    const ip = req.socket.remoteAddress ?? "unknown";
    clients.add(ws);
    log("info", "ws_client_connected", { ip, totalClients: clients.size });

    ws.on("close", () => {
      clients.delete(ws);
      log("info", "ws_client_disconnected", { totalClients: clients.size });
    });

    ws.on("error", (err) => {
      log("error", "ws_client_error", { error: err.message });
      clients.delete(ws);
    });
  });

  server.listen(PORT, () => {
    log("info", "http_server_started", {
      port: PORT,
      healthEndpoint: `http://localhost:${PORT}/health`,
      wsEndpoint: `ws://localhost:${PORT}/ws`,
    });
  });

  // Kafka consumer
  const kafka = new Kafka({
    clientId: "realtime-gateway",
    brokers: KAFKA_BROKERS,
    retry: { retries: 10, initialRetryTime: 1000 },
  });

  const consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });

  try {
    await consumer.connect();
    metrics.kafka.connected = true;
    log("info", "kafka_connected", { brokers: KAFKA_BROKERS });
  } catch (err: any) {
    log("error", "kafka_connect_failed", { error: err.message });
    process.exit(1);
  }

  await consumer.subscribe({ topic: KAFKA_TOPIC, fromBeginning: false });
  log("info", "kafka_subscribed", { topic: KAFKA_TOPIC });

  let messageCount = 0;
  let lastLogTime = Date.now();

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const value = message.value?.toString();
      if (!value) return;

      messageCount++;
      const now = Date.now();

      // Update metrics
      metrics.kafka.lastMessageTs = new Date().toISOString();
      metrics.kafka.lastOffset = message.offset;
      metrics.kafka.lastPartition = partition;
      metrics.kafka.messageTimestamps.push(now);

      // Parse telemetry for logging
      let telemetry: any = {};
      try {
        telemetry = JSON.parse(value);
      } catch {
        // Ignore parse errors for logging
      }

      // Log every second (not every message)
      if (now - lastLogTime >= 1000) {
        log("debug", "kafka_message", {
          flightId: telemetry.flightId,
          tPlusMs: telemetry.tPlusMs,
          partition,
          offset: message.offset,
          messageCount,
          clients: clients.size,
        });
        lastLogTime = now;
      }

      // Broadcast to WebSocket clients
      const dead: WebSocket[] = [];
      for (const ws of clients) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(value);
        } else {
          dead.push(ws);
        }
      }
      for (const ws of dead) {
        clients.delete(ws);
      }
    },
  });

  process.on("SIGINT", async () => {
    log("info", "gateway_shutting_down", {});
    metrics.kafka.connected = false;
    await consumer.disconnect();
    server.close();
    process.exit(0);
  });
}

main().catch((err) => {
  log("error", "gateway_fatal_error", { error: err.message, stack: err.stack });
  process.exit(1);
});
