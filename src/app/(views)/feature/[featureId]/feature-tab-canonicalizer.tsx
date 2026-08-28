"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { FeatureTab } from "@/lib/feature-view";

export function FeatureTabCanonicalizer({
  requestedTab,
  activeTab,
}: {
  requestedTab: string | string[] | undefined;
  activeTab: FeatureTab;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const requested = Array.isArray(requestedTab) ? requestedTab[0] : requestedTab;
    const canonical = activeTab === "overview" ? undefined : activeTab;
    if (requested === canonical && !Array.isArray(requestedTab)) return;
    const next = new URLSearchParams(searchParams.toString());
    next.delete("tab");
    if (canonical) next.set("tab", canonical);
    router.replace(next.size ? `${pathname}?${next}` : pathname, { scroll: false });
  }, [activeTab, pathname, requestedTab, router, searchParams]);
  return null;
}
