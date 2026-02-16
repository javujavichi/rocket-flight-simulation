Kafka Architecture and Concepts --- Rocket Digital Twin Project
=============================================================

* * * * *

Part 1 --- The System in Kafka Terms
==================================

`rocket-sim              → Producer
rocket.telemetry.raw    → Topic
telemetry-service       → Consumer + Producer
rocket.telemetry.v1     → Topic
realtime-gateway        → Consumer
Mission Control UI      → Final consumer (via WebSocket)`

Kafka sits in the middle as the **source of truth**.

Kafka should be understood as a **durable event log**, not a traditional message queue.

Important distinction
---------------------

**Queue mindset**

> Message goes from A → B and disappears

**Kafka mindset**

> Message is written to a log and multiple services can read it independently

This is exactly what the telemetry-service and realtime-gateway do in this project.

* * * * *

Part 2 --- The 5 Kafka Concepts to Understand
===========================================

These concepts are directly illustrated by this project's architecture.

* * * * *

Concept 1: Topic = Append-only Log
----------------------------------

In this project, the topics are:

`rocket.telemetry.raw
rocket.telemetry.v1`

Each topic represents a timeline of events:

`offset 0: telemetry event
offset 1: telemetry event
offset 2: telemetry event
offset 3: telemetry event
...`

Important properties
--------------------

-   Events are immutable

-   Events remain available after consumption

-   Each consumer tracks its own position independently

This allows services such as telemetry-service to resume processing after restarts without data loss.

Exercise
--------

Open Kafka UI:

`http://localhost:8080`

Navigate to:

`rocket.telemetry.raw`

Observe offsets increasing over time.

This confirms the log-based nature of Kafka.

* * * * *

Concept 2: Producer = Writes Events
-----------------------------------

In this project:

`rocket-sim = producer`

Example producer code:

`producer.send({
  topic: "rocket.telemetry.raw",
  key: flightId,
  value: telemetryJson
})`

Producer responsibilities
-------------------------

-   Serialize the event

-   Assign the destination topic

-   Optionally assign a key

-   Send the event to the Kafka broker

Kafka then persists the event durably.

Critical principle
------------------

Producers do NOT send events directly to consumers.

Producers only write to Kafka.

Consumers independently read from Kafka.

* * * * *

Concept 3: Consumer = Reads Events
----------------------------------

In this project:

`telemetry-service = consumer of rocket.telemetry.raw
realtime-gateway  = consumer of rocket.telemetry.v1`

Consumers read events independently.

Kafka tracks consumer progress using offsets.

Example:

`telemetry-service offset: 12345
realtime-gateway offset: 12344`

Each consumer maintains its own offset.

This enables independent scaling, failure recovery, and replay.

* * * * *

Concept 4: Consumer Group = Scaling and Isolation
-------------------------------------------------

Consumer groups isolate pipelines and enable parallel processing.

Example in this project:

`groupId = telemetry-service
groupId = realtime-gateway`

This allows independent pipelines such as:

`rocket.telemetry.v1 topic
├─ telemetry-service group → persistence
├─ realtime-gateway group → UI streaming
└─ prediction-service group → future analytics`

Kafka delivers events independently to each group.

* * * * *

Concept 5: Partition = Parallelism
----------------------------------

Topics are split into partitions:

`partition 0
partition 1
partition 2`

In this project:

`partitions: 3
key: flightId`

Events with the same key are sent to the same partition.

This guarantees ordering per flight.

Kafka guarantees ordering per partition.

This is essential for telemetry correctness.

* * * * *

Part 3 --- Telemetry Service and Event Normalization Pattern
==========================================================

The telemetry-service implements a critical Kafka pattern:

`raw topic → processing → normalized topic`

This pattern is known as:

-   Event-driven pipeline

-   Stream processing pipeline

Benefits
--------

-   Decouples producers and consumers

-   Stabilizes contracts

-   Enables safe schema evolution

-   Protects downstream services from breaking changes

This architecture is widely used in:

-   Financial trading systems

-   IoT telemetry pipelines

-   Aerospace telemetry platforms

* * * * *

Part 4 --- Kafka as the System of Record
======================================

In this architecture:

**Kafka is the system of record.**

Not the database.

The database is a projection derived from Kafka.

Pipeline overview:

`rocket.telemetry.raw  = authoritative source of truth
telemetry-service     = processor
Postgres              = query optimization layer
rocket.telemetry.v1   = normalized contract`

Databases can be rebuilt entirely from Kafka.

This is the foundation of Event Sourcing.

* * * * *

Part 5 --- Hands-on Exercises
===========================

These exercises demonstrate Kafka's durability and scalability.

* * * * *

Exercise 1 --- Stop telemetry-service
-----------------------------------

Result:

-   Kafka continues storing events

-   Restarting telemetry-service resumes processing from last offset

-   Database catches up automatically

This demonstrates durability and offset tracking.

* * * * *

Exercise 2 --- Stop realtime-gateway
----------------------------------

Result:

-   Kafka continues storing events

-   Restarting realtime-gateway resumes streaming to UI

-   No data is lost

This demonstrates independent consumers.

* * * * *

Exercise 3 --- Inspect offsets in Kafka UI
----------------------------------------

Navigate to topic messages and observe:

-   Offsets increase continuously

-   Partitions receive events

This demonstrates append-only log behavior.

* * * * *

Exercise 4 --- Run multiple telemetry-service instances
-----------------------------------------------------

Start multiple telemetry-service instances.

Kafka distributes partitions across instances.

This demonstrates horizontal scalability.

* * * * *

Part 6 --- Architectural Classification
=====================================

This project implements:

-   Event-driven architecture

-   Stream processing pipeline

-   Event normalization layer

These patterns are used in:

-   Aerospace telemetry systems

-   Financial trading systems

-   IoT platforms

-   Real-time analytics systems

This architecture reflects real production systems.

* * * * *

Part 7 --- Recommended Learning Order
===================================

To deepen Kafka knowledge, study topics in this sequence:

1.  Topics, partitions, offsets

2.  Producer lifecycle

3.  Consumer lifecycle

4.  Consumer groups

5.  Delivery guarantees (at-least-once, exactly-once)

6.  Event-driven architecture patterns

7.  Schema evolution

Avoid Kafka Streams and advanced stream processing until foundational concepts are mastered.

* * * * *

Part 8 --- The Most Important Mental Model
========================================

Kafka is not a message queue.

Kafka is a distributed append-only log.

Services read from the log independently.

This enables:

-   Replay

-   Durability

-   Scalability

-   Fault tolerance

-   Independent pipelines