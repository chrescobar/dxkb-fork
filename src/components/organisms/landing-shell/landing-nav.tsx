"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

import type {
  OrganismLandingNavItem,
  OrganismViewKey,
} from "@/components/organisms/types";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
  const [isMac] = useState(() => /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent));

  const shortcutKey = isMac ? "⌘B" : "Ctrl+B";

  return (
    <nav
      aria-label="Organism views"
      className={cn(
        "bg-card text-card-foreground h-fit shrink-0 rounded-lg border shadow-sm transition-[width] duration-200 sticky top-4",
        collapsed ? "w-14" : "w-56",
      )}
    >
      <div className="flex items-center justify-between gap-2 p-2.5">
        {!collapsed && (
          <h2 className="text-muted-foreground truncate text-sm font-semibold">
            Views
          </h2>
        )}
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={
                  collapsed
                    ? "Expand organism navigation"
                    : "Collapse organism navigation"
                }
                onClick={onCollapseToggle}
                className={collapsed ? "mx-auto" : "ml-auto"}
              >
                {collapsed ? <ChevronRight /> : <ChevronLeft />}
              </Button>
            }
          />
          <TooltipContent side="right">
            {collapsed ? "Expand" : "Collapse"} ({shortcutKey})
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="flex flex-col gap-1 p-2.5 pt-0">
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
