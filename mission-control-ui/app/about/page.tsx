"use client";

import { Rocket, LineChart, Database, Wifi, Heart, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold">
            <Rocket className="h-6 w-6" />
            Rocket Flight Digital Twin
          </Link>
          <Link
            href="/"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Dashboard
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="border-b border-border bg-gradient-to-b from-background to-card/50 py-12">
        <div className="container mx-auto px-4">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            About This Project
          </h1>
          <p className="max-w-3xl text-lg text-muted-foreground">
            A real-time digital twin system for simulating and monitoring rocket launches,
            demonstrating modern web technologies, distributed systems architecture, and
            physics-based simulation inspired by NASA's mission control systems.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Overview */}
        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold">Overview</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6">
              <Rocket className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">Physics Simulation</h3>
              <p className="text-sm text-muted-foreground">
                High-fidelity rocket trajectory modeling using Newtonian mechanics and real-world
                rocket parameters inspired by Falcon 9.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <LineChart className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">Live Telemetry</h3>
              <p className="text-sm text-muted-foreground">
                Real-time data streaming at 20 Hz with WebSocket connections, providing
                sub-second latency telemetry updates.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <Database className="mb-4 h-10 w-10 text-primary" />
              <h3 className="mb-2 text-xl font-semibold">Distributed Architecture</h3>
              <p className="text-sm text-muted-foreground">
                Microservices communicating via Apache Kafka, demonstrating scalable event-driven
                architecture patterns.
              </p>
            </div>
          </div>
        </section>

        {/* Technical Background */}
        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold">Technical Background</h2>
          
          <div className="space-y-8">
            <div>
              <h3 className="mb-3 text-2xl font-semibold">Rocket Physics Equations</h3>
              <p className="mb-4 text-muted-foreground">
                The simulation implements fundamental rocket dynamics based on Newton's laws of motion
                and gravitational physics, following principles derived from NASA's flight mechanics
                documentation.
              </p>
              
              <div className="space-y-6 rounded-lg border border-border bg-card p-6">
                <div>
                  <h4 className="mb-2 font-mono text-lg font-semibold text-cyan-400">
                    1. Thrust Force
                  </h4>
                  <div className="mb-2 rounded bg-muted p-3 font-mono text-sm">
                    F<sub>thrust</sub> = T<sub>max</sub> × θ(t)
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Where T<sub>max</sub> is maximum thrust (7.607 MN for Stage 1, 934 kN for Stage 2)
                    and θ(t) is the throttle setting (0-1).
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 font-mono text-lg font-semibold text-cyan-400">
                    2. Effective Gravitational Acceleration
                  </h4>
                  <div className="mb-2 rounded bg-muted p-3 font-mono text-sm">
                    g<sub>eff</sub> = g<sub>0</sub> × (R<sub>Earth</sub> / (R<sub>Earth</sub> + h))²
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Altitude-dependent gravity following the inverse-square law, where g<sub>0</sub> = 9.81 m/s²
                    and R<sub>Earth</sub> = 6,371 km.
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 font-mono text-lg font-semibold text-cyan-400">
                    3. Net Acceleration
                  </h4>
                  <div className="mb-2 rounded bg-muted p-3 font-mono text-sm">
                    a = (F<sub>thrust</sub> - m × g<sub>eff</sub>) / m
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Net acceleration from thrust force minus gravitational force, divided by total mass
                    (rocket body + propellant + payload).
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 font-mono text-lg font-semibold text-cyan-400">
                    4. Velocity Integration
                  </h4>
                  <div className="mb-2 rounded bg-muted p-3 font-mono text-sm">
                    v(t + Δt) = v(t) + a × Δt
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Velocity updated via Euler integration with Δt = 50ms timesteps.
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 font-mono text-lg font-semibold text-cyan-400">
                    5. Altitude Integration
                  </h4>
                  <div className="mb-2 rounded bg-muted p-3 font-mono text-sm">
                    h(t + Δt) = h(t) + v × Δt
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Altitude derived from velocity integration over time.
                  </p>
                </div>

                <div>
                  <h4 className="mb-2 font-mono text-lg font-semibold text-cyan-400">
                    6. Propellant Mass Flow
                  </h4>
                  <div className="mb-2 rounded bg-muted p-3 font-mono text-sm">
                    ṁ = (m<sub>prop,init</sub> / t<sub>burn</sub>) × θ(t)
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Mass flow rate proportional to throttle setting. Stage 1: 287.4 tons over 80s.
                    Stage 2: 75.2 tons over 177s.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-2xl font-semibold">Mission Parameters</h3>
              <p className="mb-4 text-muted-foreground">
                The simulation uses parameters inspired by SpaceX's Falcon 9 rocket, a two-stage
                orbital launch vehicle that has revolutionized space access.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-border bg-card p-4">
                  <h4 className="mb-3 font-semibold text-amber-400">Stage 1 (Booster)</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Max Thrust:</span>
                      <span className="font-mono">7.607 MN</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Propellant Mass:</span>
                      <span className="font-mono">287,400 kg</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Dry Mass:</span>
                      <span className="font-mono">25,600 kg</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Burn Time:</span>
                      <span className="font-mono">80 seconds</span>
                    </li>
                  </ul>
                </div>

                <div className="rounded-lg border border-border bg-card p-4">
                  <h4 className="mb-3 font-semibold text-blue-400">Stage 2 (Upper Stage)</h4>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Max Thrust:</span>
                      <span className="font-mono">934 kN</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Propellant Mass:</span>
                      <span className="font-mono">75,200 kg</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Dry Mass:</span>
                      <span className="font-mono">4,000 kg</span>
                    </li>
                    <li className="flex justify-between">
                      <span className="text-muted-foreground">Burn Time:</span>
                      <span className="font-mono">177 seconds</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-2xl font-semibold">Flight Phases</h3>
              <div className="space-y-3 rounded-lg border border-border bg-card p-6">
                <div className="flex gap-4">
                  <span className="font-mono text-sm text-cyan-400">T+00:00</span>
                  <div>
                    <strong>Liftoff</strong>
                    <p className="text-sm text-muted-foreground">
                      Ignition of 9 Merlin engines at 70% throttle, building to full thrust
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="font-mono text-sm text-cyan-400">T+00:55</span>
                  <div>
                    <strong>Max-Q</strong>
                    <p className="text-sm text-muted-foreground">
                      Point of maximum aerodynamic pressure, throttle reduced to 70%
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="font-mono text-sm text-cyan-400">T+01:20</span>
                  <div>
                    <strong>MECO (Main Engine Cutoff)</strong>
                    <p className="text-sm text-muted-foreground">
                      Stage 1 engines shut down at ~80km altitude
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="font-mono text-sm text-cyan-400">T+01:21</span>
                  <div>
                    <strong>Stage Separation</strong>
                    <p className="text-sm text-muted-foreground">
                      First stage separates from second stage
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="font-mono text-sm text-cyan-400">T+01:23</span>
                  <div>
                    <strong>SES-1 (Second Engine Start)</strong>
                    <p className="text-sm text-muted-foreground">
                      Upper stage engine ignites for orbital insertion burn
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <span className="font-mono text-sm text-cyan-400">T+04:20</span>
                  <div>
                    <strong>SECO (Second Engine Cutoff)</strong>
                    <p className="text-sm text-muted-foreground">
                      Orbit achieved at ~180km altitude, ~7,800 m/s orbital velocity
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Architecture */}
        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold">System Architecture</h2>
          
          <div className="mb-6 rounded-lg border border-border bg-card p-6">
            <div className="mb-6">
              <h3 className="mb-3 text-xl font-semibold">Three-Tier Distributed System</h3>
              <p className="text-muted-foreground">
                The application follows a microservices architecture pattern with event-driven
                communication, demonstrating professional software engineering practices.
              </p>
            </div>

            <div className="space-y-6">
              <div className="rounded-lg border-l-4 border-l-primary bg-muted/50 p-4">
                <h4 className="mb-2 font-semibold">1. Rocket Simulator (Node.js/TypeScript)</h4>
                <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Physics-based simulation engine with 50ms timesteps (20 Hz)</li>
                  <li>Publishes telemetry to Kafka topic: <code className="rounded bg-background px-1">rocket.telemetry.raw</code></li>
                  <li>Structured JSON logging with partition/offset tracking</li>
                  <li>Implements Tsiolkovsky rocket equation principles</li>
                </ul>
              </div>

              <div className="rounded-lg border-l-4 border-l-primary bg-muted/50 p-4">
                <h4 className="mb-2 font-semibold">2. Realtime Gateway (Node.js/TypeScript)</h4>
                <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Consumes from Kafka and broadcasts to WebSocket clients</li>
                  <li>Health monitoring endpoint at <code className="rounded bg-background px-1">/health</code></li>
                  <li>Tracks connection metrics, message rates, and Kafka offsets</li>
                  <li>Handles multiple concurrent client connections</li>
                </ul>
              </div>

              <div className="rounded-lg border-l-4 border-l-primary bg-muted/50 p-4">
                <h4 className="mb-2 font-semibold">3. Mission Control Dashboard (Next.js/React)</h4>
                <ul className="ml-6 list-disc space-y-1 text-sm text-muted-foreground">
                  <li>Real-time WebSocket client with automatic exponential backoff reconnection</li>
                  <li>Live status bar showing connection state, message rate, and health warnings</li>
                  <li>Animated rocket trajectory visualization using HTML5 Canvas</li>
                  <li>Recharts for telemetry graphing with 60 FPS updates</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold">Key Features</h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <Wifi className="h-5 w-5 text-green-500" />
                Real-Time Streaming
              </h3>
              <p className="text-sm text-muted-foreground">
                Sub-50ms latency telemetry updates via WebSocket with automatic reconnection
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <LineChart className="h-5 w-5 text-blue-500" />
                Interactive Charts
              </h3>
              <p className="text-sm text-muted-foreground">
                Live altitude, velocity, thrust, and propellant graphs with explanatory tooltips
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <Rocket className="h-5 w-5 text-amber-500" />
                Visual Trajectory
              </h3>
              <p className="text-sm text-muted-foreground">
                Animated rocket traveling from Earth to orbit with realistic physics
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-2 flex items-center gap-2 font-semibold">
                <Database className="h-5 w-5 text-purple-500" />
                Event Streaming
              </h3>
              <p className="text-sm text-muted-foreground">
                Apache Kafka for scalable, distributed event processing
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-2 font-semibold">Health Monitoring</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive observability with metrics, structured logs, and health endpoints
              </p>
            </div>

            <div className="rounded-lg border border-border bg-card p-4">
              <h3 className="mb-2 font-semibold">Auto-Reconnect</h3>
              <p className="text-sm text-muted-foreground">
                Exponential backoff reconnection strategy with connection state visualization
              </p>
            </div>
          </div>
        </section>

        {/* NASA References */}
        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold">NASA & Academic References</h2>
          
          <div className="space-y-4 rounded-lg border border-border bg-card p-6">
            <p className="text-muted-foreground">
              This project draws inspiration from NASA's mission control systems and incorporates
              fundamental aerospace engineering principles:
            </p>

            <ul className="ml-6 list-disc space-y-2 text-sm text-muted-foreground">
              <li>
                <strong>Rocket Propulsion:</strong> Based on Newton's Third Law and the Tsiolkovsky
                rocket equation, foundational to all modern spaceflight
              </li>
              <li>
                <strong>Orbital Mechanics:</strong> Follows Kepler's laws and gravitational physics
                as documented in NASA's{" "}
                <a
                  href="https://www.nasa.gov/stem-content/rocket-principles/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Rocket Principles Guide
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>
                <strong>Mission Control:</strong> UI design inspired by NASA Johnson Space Center's
                Mission Control Center (MCC)
              </li>
              <li>
                <strong>Telemetry Systems:</strong> Real-time monitoring patterns from NASA's Space
                Network and Tracking and Data Relay Satellite System (TDRSS)
              </li>
              <li>
                <strong>Flight Phases:</strong> Nomenclature (MECO, SECO, etc.) follows standard
                aerospace terminology used by NASA and commercial launch providers
              </li>
            </ul>

            <div className="mt-6 rounded-lg bg-muted p-4">
              <h4 className="mb-2 font-semibold">Educational Resources</h4>
              <ul className="space-y-1 text-sm">
                <li>
                  <a
                    href="https://www.nasa.gov/stem-ed-resources/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    NASA STEM Resources
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.nasa.gov/mission-pages/station/research/index.html"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    NASA Space Station Research
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.nasa.gov/specials/trackingevolution/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    NASA Tracking & Data Networks
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Technology Stack */}
        <section className="mb-16">
          <h2 className="mb-6 text-3xl font-bold">Technology Stack</h2>
          
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-xl font-semibold">Frontend</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  Next.js 15 (React 19, App Router)
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  TypeScript for type safety
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  Tailwind CSS for styling
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  Recharts for data visualization
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  HTML5 Canvas for animations
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  WebSocket API for real-time data
                </li>
              </ul>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-4 text-xl font-semibold">Backend</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  Node.js with TypeScript
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  Apache Kafka for event streaming
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  KafkaJS client library
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  WebSocket (ws) library
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  Docker & Docker Compose
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-primary"></span>
                  Structured JSON logging
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="mb-8">
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-8 text-center">
            <h2 className="mb-4 text-2xl font-bold">Ready to Launch?</h2>
            <p className="mb-6 text-muted-foreground">
              Experience real-time rocket telemetry monitoring with live data visualization
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-primary px-6 py-3 font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Rocket className="h-5 w-5" />
              Go to Mission Dashboard
            </Link>
          </div>
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <span className="font-semibold">Rocket Flight Digital Twin</span>
            <span>•</span>
            <span>made with</span>
            <Heart className="h-4 w-4 fill-red-500 text-red-500" />
            <span>by</span>
            <span className="font-semibold">Javiera Laso</span>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Powered by Next.js, Apache Kafka, and TypeScript
          </p>
        </div>
      </footer>
    </div>
  );
}
