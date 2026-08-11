import type { OrganismLandingView } from "@/components/organisms/types";
import type { SearchParamsRecord } from "@/lib/views/rql";
import { firstSearchParam } from "@/lib/views/search-params";

export function resolveLandingTab(
  params: SearchParamsRecord | undefined,
  views: readonly OrganismLandingView[],
): { activeViewKey?: string; redirectToOverview: boolean } {
  const tab = firstSearchParam(params, "tab");
  const legacyView = firstSearchParam(params, "view");
  const requested = tab || legacyView;
  if (!requested) return { redirectToOverview: false };

  const available = views.some((view) => view.key === requested && view.enabled !== false);
  return available
    ? { activeViewKey: requested, redirectToOverview: false }
    : { redirectToOverview: true };
}
