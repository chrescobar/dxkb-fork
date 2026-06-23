"use client";

import { useState, type ReactNode } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export function DetailCollapsibleSection({
  label,
  defaultExpanded = true,
  actions,
  variant = "default",
  children,
}: {
  label: string;
  defaultExpanded?: boolean;
  /** Optional action buttons rendered to the right of the label (outside the toggle button to avoid nesting) */
  actions?: ReactNode;
  /** "default" uses muted bg; "primary" uses the primary bg from search info panel */
  variant?: "default" | "primary";
  children: ReactNode;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const headerClass =
    variant === "primary"
      ? "border-x border-y border-primary bg-muted text-foreground cursor-pointer"
      : "bg-muted/60 hover:bg-muted";

  return (
    <div className="border-t">
      <div className={`flex w-full items-center ${headerClass}`}>
        <button
          onClick={() => { setExpanded((v) => !v); }}
          className="flex min-w-0 flex-1 items-center gap-2 px-2 py-1 text-left text-xs font-bold uppercase"
        >
          {expanded ? (
            <ChevronDown className="size-3.5 shrink-0" />
          ) : (
            <ChevronRight className="size-3.5 shrink-0" />
          )}
          {label}
        </button>
        {actions}
      </div>
      {expanded && children}
    </div>
  );
}
