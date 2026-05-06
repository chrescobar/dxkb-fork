"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import type { OrganismLandingNavItem, OrganismViewKey } from "@/components/organisms/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LandingNavProps {
  items: readonly OrganismLandingNavItem[];
  activeView: OrganismViewKey;
  collapsed: boolean;
  onChange: (view: OrganismViewKey) => void;
  onCollapseToggle: () => void;
}

export function LandingNav({
  items,
  activeView,
  collapsed,
  onChange,
  onCollapseToggle,
}: LandingNavProps) {
  return (
    <nav
      aria-label="Organism views"
      className={cn(
        "sticky top-4 h-fit shrink-0 rounded-lg border bg-card text-card-foreground shadow-sm transition-[width] duration-200",
        collapsed ? "w-[4.5rem]" : "w-64",
      )}
    >
      <div className="flex items-center justify-between gap-2 p-3">
        {!collapsed && (
          <h2 className="truncate text-sm font-semibold text-muted-foreground">
            Views
          </h2>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={collapsed ? "Expand organism navigation" : "Collapse organism navigation"}
          onClick={onCollapseToggle}
          className={collapsed ? "mx-auto" : "ml-auto"}
        >
          {collapsed ? <ChevronRight /> : <ChevronLeft />}
        </Button>
      </div>
      <div className="flex flex-col gap-1 p-3 pt-0">
        {items.map((item) => {
          const isActive = item.key === activeView;
          return (
            <Button
              key={item.key}
              type="button"
              variant={isActive ? "secondary" : "ghost"}
              aria-current={isActive ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              onClick={() => onChange(item.key)}
              className={cn(
                "justify-start",
                collapsed && "justify-center px-0",
                isActive && "font-semibold",
              )}
            >
              <span aria-hidden="true" className="flex shrink-0 items-center">
                {item.icon}
              </span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Button>
          );
        })}
      </div>
    </nav>
  );
}
