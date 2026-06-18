import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";
import { buildOrganismNavItems } from "@/components/organisms/shared/default-nav-items";
import type { OrganismViewKey } from "@/components/organisms/types";

import { resolveTab } from "./tab";
import type { SearchParamsRecord } from "./rql";
import type { ViewTypeEntry } from "./view-types";

/** Validate an id per its kind. Returns the normalized id, or null if invalid. */
function validateId(id: string, kind: ViewTypeEntry["singular"]): string | null {
  if (!kind) return null;
  if (kind.idKind === "none") return id;
  if (kind.idKind === "int") {
    const n = Number(id);
    return Number.isInteger(n) && n > 0 ? id : null;
  }
  // string
  return id.length > 0 ? id : null;
}

/**
 * Render a singular view. Validates the id, guards list-only types, resolves the
 * active tab, then renders the landing shell. In the skeleton stage every type
 * except taxonomy renders placeholder views (no real fetch).
 */
export async function renderSingularShell(
  entry: ViewTypeEntry,
  id: string,
  searchParams: SearchParamsRecord,
): Promise<ReactElement> {
  // Skeleton stage: no data fetch happens yet (Task 14 wires taxonomy's real
  // fetcher here). The function is async so the route can await it uniformly and
  // so the future fetch is a drop-in; this resolved promise satisfies that
  // contract until then.
  await Promise.resolve();

  if (!entry.singular) notFound();
  const normalized = validateId(id, entry.singular);
  if (normalized === null) notFound();

  const views = buildOrganismNavItems();
  const tabParam = searchParams.tab;
  const activeTab = resolveTab(
    tabParam,
    views.map((v) => v.key),
    entry.singular.defaultTab,
  );

  // Skeleton-stage default tabs are all "overview", a valid OrganismViewKey. The cast is
  // localized here so the registry can hold defaultTab as a plain string.
  const defaultView = entry.singular.defaultTab as OrganismViewKey;

  return (
    <OrganismLandingShell
      config={{
        displayName: `${entry.label} ${normalized}`,
        taxonId: 0,
        accent: "all",
        defaultView,
        metadataFields: [],
      }}
      views={views}
      activeViewKey={activeTab}
    />
  );
}
