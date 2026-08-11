import type { OrganismLandingView } from "@/components/organisms/types";

interface LandingRequestParams {
  tab?: string | string[];
  view?: string | string[];
}

export function resolveLandingTab(
  params: LandingRequestParams | undefined,
  views: readonly OrganismLandingView[],
): { activeViewKey?: string; redirectToOverview: boolean } {
  const tab = Array.isArray(params?.tab) ? params.tab[0] : params?.tab;
  const legacyView = Array.isArray(params?.view) ? params.view[0] : params?.view;
  const requested = tab || legacyView;
  if (!requested) return { redirectToOverview: false };

  const available = views.some((view) => view.key === requested && view.enabled !== false);
  return available
    ? { activeViewKey: requested, redirectToOverview: false }
    : { redirectToOverview: true };
}
