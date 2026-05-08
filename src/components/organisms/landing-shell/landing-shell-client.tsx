"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { LandingNav } from "./landing-nav";
import type {
  OrganismLandingNavItem,
  OrganismViewKey,
} from "@/components/organisms/types";

const collapseStorageKey = "dxkb.organismLanding.navCollapsed";

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
  const hasLoadedNavPreference = useRef(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      hasLoadedNavPreference.current = true;
      setNavCollapsed(
        window.localStorage.getItem(collapseStorageKey) === "true",
      );
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hasLoadedNavPreference.current) {
      return;
    }
    window.localStorage.setItem(collapseStorageKey, String(navCollapsed));
  }, [navCollapsed]);

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
        <div className="bg-card mb-4 flex items-center justify-between rounded-lg border px-5 py-3 shadow-sm">
          <div>
            <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
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
