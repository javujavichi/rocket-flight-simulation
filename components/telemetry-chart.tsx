"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { formatTPlus } from "@/lib/telemetry-types";

interface ChartPoint {
  tPlusMs: number;
  value: number;
}

interface TelemetryChartProps {
  title: string;
  unit: string;
  data: ChartPoint[];
  color: string;
  currentValue: number;
  description?: string;
}

export function TelemetryChart({
  title,
  unit,
  data,
  color,
  currentValue,
  description,
}: TelemetryChartProps) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
        <span className="font-mono text-sm" style={{ color }}>
          {formatNumber(currentValue)} {unit}
        </span>
      </div>
      {description && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          {description}
        </p>
      )}
      <div className="h-[160px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient
                id={`grad-${title}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(220 15% 18%)"
              vertical={false}
            />
            <XAxis
              dataKey="tPlusMs"
              tickFormatter={formatTPlus}
              tick={{ fontSize: 10, fill: "hsl(215 15% 55%)" }}
              stroke="hsl(220 15% 18%)"
              interval="preserveStartEnd"
              minTickGap={50}
            />
            <YAxis
              tick={{ fontSize: 10, fill: "hsl(215 15% 55%)" }}
              stroke="hsl(220 15% 18%)"
              tickFormatter={formatCompact}
              width={52}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              fill={`url(#grad-${title})`}
              isAnimationActive={false}
              dot={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(2) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return n.toFixed(1);
}

function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (Math.abs(n) >= 1_000) return (n / 1_000).toFixed(0) + "k";
  return String(Math.round(n));
}
