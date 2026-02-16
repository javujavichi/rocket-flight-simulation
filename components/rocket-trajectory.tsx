"use client";

import { useEffect, useRef } from "react";

interface RocketTrajectoryProps {
  altitudeM: number;
  maxAltitude?: number;
  phase: string;
}

export function RocketTrajectory({
  altitudeM,
  maxAltitude = 180000,
  phase,
}: RocketTrajectoryProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Calculate rocket position (0-1 normalized)
    const progress = Math.min(altitudeM / maxAltitude, 1);

    // Colors
    const spaceGradient = ctx.createLinearGradient(0, 0, 0, height);
    spaceGradient.addColorStop(0, "#0a0e27");
    spaceGradient.addColorStop(0.3, "#1a1f3a");
    spaceGradient.addColorStop(0.7, "#2a3f5f");
    spaceGradient.addColorStop(1, "#4a7ba7");

    // Draw background
    ctx.fillStyle = spaceGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw stars
    drawStars(ctx, width, height);

    // Earth position (bottom)
    const earthY = height - 60;
    const earthX = width / 2;

    // Target planet position (top)
    const targetY = 80;
    const targetX = width / 2;

    // Rocket position along trajectory
    const rocketY = earthY - (earthY - targetY) * progress;
    const rocketX = earthX;

    // Draw trajectory line
    ctx.strokeStyle = "rgba(99, 179, 237, 0.3)";
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(earthX, earthY);
    ctx.lineTo(targetX, targetY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Earth
    drawEarth(ctx, earthX, earthY);

    // Draw target planet
    drawTargetPlanet(ctx, targetX, targetY);

    // Draw rocket
    drawRocket(ctx, rocketX, rocketY, phase);

    // Draw thrust/exhaust if launching
    if (phase === "ASCENT" || phase === "LIFTOFF") {
      drawThrust(ctx, rocketX, rocketY);
    }

    // Draw labels
    ctx.font = "12px monospace";
    ctx.fillStyle = "#8b9dc3";
    ctx.textAlign = "center";
    ctx.fillText("Earth", earthX, earthY + 55);
    ctx.fillText("Target Orbit", targetX, targetY - 55);

    // Altitude indicator
    ctx.font = "14px monospace";
    ctx.fillStyle = "#63b3ed";
    ctx.textAlign = "left";
    ctx.fillText(
      `${(altitudeM / 1000).toFixed(1)} km`,
      rocketX + 25,
      rocketY + 5
    );
  }, [altitudeM, maxAltitude, phase]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Mission Trajectory
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          Phase: {phase}
        </span>
      </div>
      <div className="flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={400}
          height={500}
          className="rounded"
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </div>
      <div className="text-center text-xs text-muted-foreground">
        Live visualization of rocket position relative to Earth and target orbit
      </div>
    </div>
  );
}

function drawStars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number
) {
  ctx.fillStyle = "#ffffff";
  const starCount = 50;
  for (let i = 0; i < starCount; i++) {
    const x = (i * 137.5) % width; // Pseudo-random but consistent
    const y = (i * 219.3) % height;
    const size = (i % 3) * 0.5 + 0.5;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawEarth(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const radius = 40;

  // Earth glow
  const glowGradient = ctx.createRadialGradient(x, y, radius, x, y, radius + 15);
  glowGradient.addColorStop(0, "rgba(99, 179, 237, 0.3)");
  glowGradient.addColorStop(1, "rgba(99, 179, 237, 0)");
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(x, y, radius + 15, 0, Math.PI * 2);
  ctx.fill();

  // Earth body
  const earthGradient = ctx.createRadialGradient(
    x - 10,
    y - 10,
    5,
    x,
    y,
    radius
  );
  earthGradient.addColorStop(0, "#4a9eff");
  earthGradient.addColorStop(0.5, "#2563eb");
  earthGradient.addColorStop(1, "#1e40af");
  ctx.fillStyle = earthGradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Continents (simplified)
  ctx.fillStyle = "#34d399";
  ctx.beginPath();
  ctx.arc(x - 10, y - 5, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x + 15, y + 10, 8, 0, Math.PI * 2);
  ctx.fill();

  // Atmosphere rim
  ctx.strokeStyle = "rgba(147, 197, 253, 0.5)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function drawTargetPlanet(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const radius = 30;

  // Planet glow
  const glowGradient = ctx.createRadialGradient(x, y, radius, x, y, radius + 10);
  glowGradient.addColorStop(0, "rgba(251, 146, 60, 0.3)");
  glowGradient.addColorStop(1, "rgba(251, 146, 60, 0)");
  ctx.fillStyle = glowGradient;
  ctx.beginPath();
  ctx.arc(x, y, radius + 10, 0, Math.PI * 2);
  ctx.fill();

  // Planet body
  const planetGradient = ctx.createRadialGradient(
    x - 8,
    y - 8,
    5,
    x,
    y,
    radius
  );
  planetGradient.addColorStop(0, "#fb923c");
  planetGradient.addColorStop(0.5, "#ea580c");
  planetGradient.addColorStop(1, "#c2410c");
  ctx.fillStyle = planetGradient;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  // Surface details
  ctx.fillStyle = "rgba(180, 83, 9, 0.5)";
  ctx.beginPath();
  ctx.arc(x + 10, y - 8, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - 12, y + 5, 8, 0, Math.PI * 2);
  ctx.fill();

  // Orbital path hint
  ctx.strokeStyle = "rgba(251, 146, 60, 0.3)";
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.arc(x, y, radius + 20, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawRocket(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  phase: string
) {
  const width = 12;
  const height = 30;

  // Rocket body gradient
  const rocketGradient = ctx.createLinearGradient(
    x - width / 2,
    y,
    x + width / 2,
    y
  );
  rocketGradient.addColorStop(0, "#6b7280");
  rocketGradient.addColorStop(0.5, "#e5e7eb");
  rocketGradient.addColorStop(1, "#6b7280");

  // Rocket body
  ctx.fillStyle = rocketGradient;
  ctx.fillRect(x - width / 2, y - height / 2, width, height);

  // Nose cone
  ctx.fillStyle = "#ef4444";
  ctx.beginPath();
  ctx.moveTo(x, y - height / 2 - 8);
  ctx.lineTo(x - width / 2, y - height / 2);
  ctx.lineTo(x + width / 2, y - height / 2);
  ctx.closePath();
  ctx.fill();

  // Fins
  ctx.fillStyle = "#374151";
  ctx.beginPath();
  ctx.moveTo(x - width / 2, y + height / 2 - 5);
  ctx.lineTo(x - width / 2 - 6, y + height / 2);
  ctx.lineTo(x - width / 2, y + height / 2);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(x + width / 2, y + height / 2 - 5);
  ctx.lineTo(x + width / 2 + 6, y + height / 2);
  ctx.lineTo(x + width / 2, y + height / 2);
  ctx.closePath();
  ctx.fill();

  // Window
  ctx.fillStyle = "#3b82f6";
  ctx.beginPath();
  ctx.arc(x, y - 8, 3, 0, Math.PI * 2);
  ctx.fill();

  // Rocket glow when active
  if (phase === "ASCENT" || phase === "LIFTOFF") {
    ctx.strokeStyle = "rgba(251, 191, 36, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, height / 2 + 3, 0, Math.PI * 2);
    ctx.stroke();
  }
}

function drawThrust(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const exhaustHeight = 20;

  // Thrust gradient
  const thrustGradient = ctx.createLinearGradient(x, y + 15, x, y + 15 + exhaustHeight);
  thrustGradient.addColorStop(0, "rgba(251, 191, 36, 0.9)");
  thrustGradient.addColorStop(0.5, "rgba(249, 115, 22, 0.6)");
  thrustGradient.addColorStop(1, "rgba(239, 68, 68, 0.1)");

  // Main exhaust
  ctx.fillStyle = thrustGradient;
  ctx.beginPath();
  ctx.moveTo(x - 5, y + 15);
  ctx.lineTo(x - 3, y + 15 + exhaustHeight);
  ctx.lineTo(x + 3, y + 15 + exhaustHeight);
  ctx.lineTo(x + 5, y + 15);
  ctx.closePath();
  ctx.fill();

  // Exhaust flicker
  ctx.fillStyle = "rgba(251, 191, 36, 0.7)";
  ctx.beginPath();
  ctx.moveTo(x - 4, y + 15);
  ctx.lineTo(x - 2, y + 15 + exhaustHeight - 5);
  ctx.lineTo(x + 2, y + 15 + exhaustHeight - 5);
  ctx.lineTo(x + 4, y + 15);
  ctx.closePath();
  ctx.fill();
}
