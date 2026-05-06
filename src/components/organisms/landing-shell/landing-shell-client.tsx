"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { LandingNav } from "./landing-nav";
import type { OrganismLandingNavItem, OrganismViewKey } from "@/components/organisms/types";

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

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setNavCollapsed(window.localStorage.getItem(collapseStorageKey) === "true");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
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
    <div className="mx-auto flex w-full max-w-[1600px] gap-4 px-4">
      <LandingNav
        items={navItems}
        activeView={serverActiveView}
        collapsed={navCollapsed}
        onChange={handleViewChange}
        onCollapseToggle={() => setNavCollapsed((current) => !current)}
      />
      <section className="min-w-0 flex-1">
        <div className="mb-6 rounded-lg border bg-card p-5 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Organisms</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-normal">
            {displayName}
          </h1>
        </div>
        {children}
      </section>
    </div>
  );
}
