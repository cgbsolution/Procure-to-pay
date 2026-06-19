"use client";

import * as React from "react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/cn";

/** KPI stat card. */
export function StatCard({
  label, value, hint, icon, accent = "default",
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  accent?: "default" | "gold" | "danger" | "success" | "navy";
}) {
  const ring: Record<string, string> = {
    default: "", gold: "border-l-4 border-l-amber-400", danger: "border-l-4 border-l-rose-500",
    success: "border-l-4 border-l-emerald-500", navy: "border-l-4 border-l-indigo-500",
  };
  return (
    <Card className={cn("min-w-0 p-4", ring[accent])}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      </div>
      <div
        className="mt-1.5 truncate font-numeric text-xl font-semibold tracking-tight tabular-nums"
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </div>
      {hint && <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div>}
    </Card>
  );
}

export interface BarItem { label: string; value: number; display?: string }

/** Horizontal proportional bar list — for spend, ageing, breakdowns. */
export function BarList({
  items, color = "bg-primary", emptyLabel = "No data",
}: {
  items: BarItem[];
  color?: string;
  emptyLabel?: string;
}) {
  const max = Math.max(...items.map((i) => i.value), 1);
  if (items.length === 0) return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>;
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.label} className="space-y-1">
          <div className="flex items-baseline justify-between text-xs">
            <span className="font-medium">{it.label}</span>
            <span className="font-mono text-muted-foreground">{it.display ?? it.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className={cn("h-full rounded-full transition-all", color)}
              style={{ width: `${Math.max(2, (it.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Compact pill row showing a labelled count breakdown. */
export function CountPills({ items }: { items: { label: string; count: number; tone?: string }[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((it) => (
        <span key={it.label} className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
          it.tone ?? "bg-muted text-foreground")}>
          {it.label}
          <span className="font-mono font-semibold">{it.count}</span>
        </span>
      ))}
    </div>
  );
}
