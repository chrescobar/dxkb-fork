"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { MouseEvent, ReactNode } from "react";

import type {
  OrganismLandingNavItem,
  OrganismViewKey,
} from "@/components/organisms/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface HorizontalLandingShellClientProps {
  displayName: string;
  activeView: OrganismViewKey;
  defaultView: OrganismViewKey;
  navItems: readonly OrganismLandingNavItem[];
  children: ReactNode;
}

export function HorizontalLandingShellClient({
  displayName,
  activeView: serverActiveView,
  defaultView,
  navItems,
  children,
}: HorizontalLandingShellClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function isKnownView(value: unknown): value is OrganismViewKey {
    return (
      typeof value === "string" && navItems.some((item) => item.key === value)
    );
  }

  function handleViewChange(nextValue: unknown) {
    if (!isKnownView(nextValue)) {
      return;
    }

    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (nextValue === defaultView) {
      params.delete("view");
    } else {
      params.set("view", nextValue);
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }

  function handleTabsClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const tab = target.closest<HTMLElement>("[data-view-key]");
    handleViewChange(tab?.dataset.viewKey);
  }

  return (
    <div className="mx-auto flex w-full max-w-none flex-col gap-4 px-2 sm:px-3 lg:px-4">
      <section className="min-w-0 flex-1">
        <Tabs
          value={serverActiveView}
          onValueChange={handleViewChange}
          className="gap-4"
        >
          <div className="bg-card mb-4 flex flex-col gap-3 rounded-lg border px-5 py-3 shadow-sm">
            <div>
              <p className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
                Organisms
              </p>
              <h1 className="text-2xl font-bold tracking-tight">
                {displayName}
              </h1>
            </div>
            <div className="overflow-x-auto pb-1">
              <TabsList
                variant="line"
                aria-label={`${displayName} views`}
                onClickCapture={handleTabsClick}
                className="h-auto w-max justify-start rounded-none p-0"
              >
                {navItems.map((item) => (
                  <TabsTrigger
                    key={item.key}
                    value={item.key}
                    data-view-key={item.key}
                    className="flex-none gap-1 px-2 py-1.5"
                  >
                    <span>{item.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>
          <TabsContent value={serverActiveView} className="mt-0">
            {children}
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}
