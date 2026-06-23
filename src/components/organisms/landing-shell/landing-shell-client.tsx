"use client";

import { useHotkey } from "@tanstack/react-hotkeys";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { startTransition, useState, type ReactNode } from "react";

import { LandingNav } from "./landing-nav";
import { LandingMobileNav } from "./landing-mobile-nav";
import type {
  OrganismLandingNavItem,
  OrganismViewKey,
} from "@/components/organisms/types";

interface LandingShellClientProps {
  displayName: string;
  activeView: OrganismViewKey;
  defaultView: OrganismViewKey;
  navItems: readonly OrganismLandingNavItem[];
  headerContent?: ReactNode;
  children: ReactNode;
}

export function LandingShellClient({
  displayName,
  activeView: serverActiveView,
  defaultView,
  navItems,
  headerContent,
  children,
}: LandingShellClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [navCollapsed, setNavCollapsed] = useState(false);

  useHotkey("Mod+B", () => {
    startTransition(() => { setNavCollapsed((current) => !current); });
  });

  function handleViewChange(nextView: OrganismViewKey) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("view");
    if (nextView === defaultView) {
      params.delete("tab");
    } else {
      params.set("tab", nextView);
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  return (
    <div className="mx-auto flex w-full max-w-none flex-row gap-3 px-2 sm:px-3 lg:px-4">
      {/* Desktop rail — hidden below lg, where the mobile nav takes over. */}
      <div className="hidden lg:block">
        <LandingNav
          items={navItems}
          activeView={serverActiveView}
          collapsed={navCollapsed}
          onChange={handleViewChange}
          onCollapseToggle={() => {
            startTransition(() => { setNavCollapsed((current) => !current); });
          }}
        />
      </div>
      {/* Mobile nav — floating pill, fixed-position so it takes no flow space. */}
      <div className="lg:hidden">
        <LandingMobileNav
          items={navItems}
          activeView={serverActiveView}
          onChange={handleViewChange}
        />
      </div>
      <section className="min-w-0 flex-1">
        <div className="mb-4 flex items-center justify-between rounded-lg border bg-card px-5 py-3 shadow-sm">
          {headerContent ?? (
            <div>
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Organisms
              </p>
              <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
            </div>
          )}
        </div>
        {children}
      </section>
    </div>
  );
}
