"use client";

import { useRef, useEffect } from "react";
import { formatTPlus } from "@/lib/telemetry-types";
import type { SimEvent } from "@/lib/telemetry-types";

interface EventLogProps {
  events: SimEvent[];
}

export function EventLog({ events }: EventLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [events.length]);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        Event Log
      </span>
      <div className="h-[140px] overflow-y-auto font-mono text-sm">
        {events.length === 0 && (
          <p className="text-muted-foreground">
            {"Awaiting launch sequence..."}
          </p>
        )}
        {events.map((ev, i) => (
          <div key={i} className="flex gap-3 py-0.5">
            <span className="shrink-0 text-muted-foreground">
              {formatTPlus(ev.tPlusMs)}
            </span>
            <span className="text-foreground">{ev.label}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
