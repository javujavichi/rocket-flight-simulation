# Kafka Architecture and Concepts — Rocket Digital Twin Project

---

## Part 1 — The System in Kafka Terms

```
telemetry-flight-simulator  → Producer
rocket.telemetry.raw        → Topic
telemetry-processor           → Consumer + Producer
rocket.telemetry.v1         → Topic
realtime-gateway            → Consumer
Mission Control UI          → Final consumer (via WebSocket)
```

Kafka sits in the middle as the **source of truth**.

Kafka should be understood as a **durable event log**, not a traditional message queue.

### The Key Distinction

**Queue mindset**
> Message goes from A → B and disappears

**Kafka mindset**
> Message is written to a log and multiple services can read it independently

This is exactly what `telemetry-processor` and `realtime-gateway` do in this project.

---

## Part 2 — The 5 Kafka Concepts to Understand

These concepts are directly illustrated by this project's architecture.

---

### Concept 1: Topic = Append-only Log

In this project, the topics are:

```
rocket.telemetry.raw
rocket.telemetry.v1
```

Each topic represents a timeline of events:

```
offset 0: telemetry event
offset 1: telemetry event
offset 2: telemetry event
offset 3: telemetry event
...
```

**Important properties:**
- Events are immutable
- Events remain available after consumption
- Each consumer tracks its own position independently

This allows `telemetry-processor` to resume processing after restarts without data loss.

#### Exercise

Open Kafka UI at http://localhost:8080, navigate to `rocket.telemetry.raw`, and observe offsets increasing over time. This confirms the log-based nature of Kafka.

---

### Concept 2: Producer = Writes Events

In this project: `telemetry-flight-simulator = producer`

```javascript
producer.send({
  topic: "rocket.telemetry.raw",
  key: flightId,
  value: telemetryJson
})
```

**Producer responsibilities:**
- Serialize the event
- Assign the destination topic
- Optionally assign a key (used for partition routing)
- Send the event to the Kafka broker

Kafka then persists the event durably.

> **Critical principle:** Producers do NOT send events directly to consumers. Producers only write to Kafka. Consumers independently read from Kafka.

---

### Concept 3: Consumer = Reads Events

In this project:

```
telemetry-processor = consumer of rocket.telemetry.raw
realtime-gateway  = consumer of rocket.telemetry.v1
```

Consumers read events independently. Kafka tracks each consumer's progress using **offsets**.

```
telemetry-processor offset: 12345
realtime-gateway  offset: 12344
```

Each consumer maintains its own offset, enabling independent scaling, failure recovery, and replay.

---

### Concept 4: Consumer Group = Scaling and Isolation

Consumer groups isolate pipelines and enable parallel processing.

In this project:

```
groupId = telemetry-processor
groupId = realtime-gateway
```

This allows independent pipelines on the same topic:

```
rocket.telemetry.v1 topic
├─ telemetry-processor group  → persistence
├─ realtime-gateway group   → UI streaming
└─ prediction-service group → future analytics
```

Kafka delivers events independently to each group.

---

### Concept 5: Partition = Parallelism

Topics are split into partitions:

```
partition 0
partition 1
partition 2
```

In this project both topics have `partitions: 3` and use `flightId` as the message key. Events with the same key are always routed to the same partition, **guaranteeing ordering per flight**.

Kafka only guarantees ordering within a single partition — this is why the key design matters for telemetry correctness.

---

## Part 3 — Event Normalization Pattern

The `telemetry-processor` implements a critical Kafka pattern:

```
raw topic → processing → normalized topic
```

Also known as an **event-driven pipeline** or **stream processing pipeline**.

**Benefits:**
- Decouples producers and consumers
- Stabilizes downstream contracts
- Enables safe schema evolution
- Protects downstream services from breaking changes in the raw format

This architecture is widely used in financial trading systems, IoT telemetry pipelines, and aerospace platforms.

---

## Part 4 — Kafka as the System of Record

**Kafka is the system of record. Not the database.**

The database is a projection derived from Kafka.

```
rocket.telemetry.raw  = authoritative source of truth
telemetry-processor     = processor
Postgres              = query optimization layer
rocket.telemetry.v1   = normalized contract
```

This means the database can be rebuilt entirely by replaying events from Kafka. This is the foundation of **Event Sourcing**.

> Note: Kafka's default log retention is 7 days. Rebuilding the database from scratch is only possible within that window unless retention is extended.

---

## Part 5 — Hands-on Exercises

These exercises demonstrate Kafka's durability and scalability in practice.

---

### Exercise 1 — Stop telemetry-processor

```bash
docker compose stop telemetry-processor
```

**Result:**
- Kafka continues storing events in `rocket.telemetry.raw`
- Restarting `telemetry-processor` resumes processing from its last committed offset
- Database catches up automatically

**Demonstrates:** durability and offset tracking.

---

### Exercise 2 — Stop realtime-gateway

```bash
# Ctrl+C or:
docker compose stop realtime-gateway
```

**Result:**
- Kafka and `telemetry-processor` continue unaffected
- Restarting `realtime-gateway` resumes streaming to the UI
- No events are lost

**Demonstrates:** independent consumers.

---

### Exercise 3 — Inspect Offsets in Kafka UI

Open http://localhost:8080, navigate to a topic, and observe:
- Offsets increase continuously
- Events are distributed across 3 partitions

**Demonstrates:** append-only log behavior.

---

### Exercise 4 — Run Multiple telemetry-processor Instances

Start a second `telemetry-processor` instance. Kafka distributes the 3 partitions across both instances.

**Demonstrates:** horizontal scalability.

---

## Part 6 — Architectural Classification

This project implements:
- Event-driven architecture
- Stream processing pipeline
- Event normalization layer

These patterns appear in aerospace telemetry systems, financial trading systems, IoT platforms, and real-time analytics systems. This architecture reflects real production systems.

---

## Part 7 — Recommended Learning Order

Study Kafka concepts in this sequence:

1. Topics, partitions, offsets
2. Producer lifecycle
3. Consumer lifecycle
4. Consumer groups
5. Delivery guarantees (at-least-once, exactly-once)
6. Event-driven architecture patterns
7. Schema evolution

Avoid Kafka Streams and advanced stream processing until foundational concepts are mastered.

---

## Part 8 — The Most Important Mental Model

**Kafka is not a message queue. Kafka is a distributed append-only log.**

Services read from the log independently. This enables:

- **Replay** — reprocess historical events
- **Durability** — events survive consumer failures
- **Scalability** — add consumers without changing producers
- **Fault tolerance** — services recover to their last offset
- **Independent pipelines** — multiple consumers on the same topic