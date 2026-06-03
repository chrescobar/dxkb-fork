"use client";

import { numberFormatter } from "@/lib/services/organisms/utils";

import type { HoverPayload } from "./choropleth-svg";

interface MapTooltipProps {
  data: HoverPayload;
}

const maxBreakdownItems = 3;

function topItems(record: Record<string, number>): [string, number][] {
  return Object.entries(record)
    .filter(([, value]) => value > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxBreakdownItems);
}

function percent(part: number, total: number): string {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

export function MapTooltip({ data }: MapTooltipProps) {
  const total = data.count;
  const genera = topItems(data.genera);
  const hosts = topItems(data.hosts);

  return (
    <div className="text-foreground min-w-[180px] max-w-[260px] text-xs">
      <div className="font-semibold text-sm">{data.name || "Unknown"}</div>
      <div className="text-muted-foreground tabular-nums">
        {numberFormatter.format(total)} {total === 1 ? "genome" : "genomes"}
      </div>
      {genera.length > 0 && (
        <div className="border-border/40 mt-2 border-t pt-2">
          <div className="text-muted-foreground mb-1 text-[10px] font-semibold uppercase tracking-wide">
            Top Genera
          </div>
          {genera.map(([name, value]) => (
            <div key={name} className="flex justify-between gap-2 tabular-nums">
              <span className="italic truncate">{name}</span>
              <span className="text-muted-foreground shrink-0">
                {numberFormatter.format(value)} ({percent(value, total)})
              </span>
            </div>
          ))}
        </div>
      )}
      {hosts.length > 0 && (
        <div className="border-border/40 mt-2 border-t pt-2">
          <div className="text-muted-foreground mb-1 text-[10px] font-semibold uppercase tracking-wide">
            Top Hosts
          </div>
          {hosts.map(([name, value]) => (
            <div key={name} className="flex justify-between gap-2 tabular-nums">
              <span className="truncate">{name}</span>
              <span className="text-muted-foreground shrink-0">
                {numberFormatter.format(value)} ({percent(value, total)})
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
