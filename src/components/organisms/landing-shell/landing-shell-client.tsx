"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, type ReactNode } from "react";

import { LandingNav } from "./landing-nav";
import type {
  OrganismLandingNavItem,
  OrganismViewKey,
} from "@/components/organisms/types";

interface LandingShellClientProps {
  displayName: string;
  activeView: OrganismViewKey;
  defaultView: OrganismViewKey;
  navItems: readonly OrganismLandingNavItem[];
  children: ReactNode;
}

export function LandingShellClient({
  displayName,
  activeView: serverActiveView,
  defaultView,
  navItems,
  children,
}: LandingShellClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navCollapsed, setNavCollapsed] = useState(false);

  useHotkey("Mod+B", () => setNavCollapsed((current) => !current));

  function handleViewChange(nextView: OrganismViewKey) {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextView === defaultView) {
      params.delete("view");
    } else {
      params.set("view", nextView);
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  return (
    <div className="mx-auto flex w-full max-w-none flex-row gap-3 px-2 sm:px-3 lg:px-4">
      <LandingNav
        items={navItems}
        activeView={serverActiveView}
        collapsed={navCollapsed}
        onChange={handleViewChange}
        onCollapseToggle={() => setNavCollapsed((current) => !current)}
      />
      <section className="min-w-0 flex-1">
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-card px-5 py-3 shadow-sm">
          <div>
            <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Organisms
            </p>
            <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}
