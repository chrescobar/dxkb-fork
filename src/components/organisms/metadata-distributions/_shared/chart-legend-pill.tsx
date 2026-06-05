import type { FocusEvent } from "react";

import { cn } from "@/lib/utils";

interface ChartLegendPillProps {
  label: string;
  color: string;
  active: boolean;
  dimmed?: boolean;
  variant?: "pill" | "row";
  ariaLabel?: string;
  ariaPressed?: boolean;
  children?: React.ReactNode;
  onActivate: () => void;
  onDeactivate: () => void;
  onFocus?: (event: FocusEvent<HTMLButtonElement>) => void;
  onClick?: () => void;
}

export function ChartLegendPill({
  label,
  color,
  active,
  dimmed = false,
  variant = "pill",
  ariaLabel,
  ariaPressed,
  children,
  onActivate,
  onDeactivate,
  onFocus,
  onClick,
}: ChartLegendPillProps) {
  const isPill = variant === "pill";
  return (
    <button
      type="button"
      aria-pressed={ariaPressed}
      aria-label={ariaLabel ?? label}
      data-active={active ? "true" : undefined}
      className={cn(
        "flex cursor-default items-center gap-1.5 text-[10px] transition-colors",
        isPill
          ? "rounded-full border px-2 py-0.5"
          : "w-full rounded px-1.5 py-0.5",
        dimmed
          ? isPill
            ? "border-border text-muted-foreground opacity-30"
            : "text-muted-foreground opacity-30"
          : active
            ? "text-foreground"
            : isPill
              ? "border-border text-muted-foreground"
              : "text-muted-foreground",
      )}
      style={
        active
          ? isPill
            ? {
                borderColor: color,
                backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
              }
            : {
                backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
              }
          : undefined
      }
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onFocus}
      onBlur={onDeactivate}
      onClick={onClick}
    >
      <span
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: color }}
        aria-hidden="true"
      />
      {children ?? label}
    </button>
  );
}
