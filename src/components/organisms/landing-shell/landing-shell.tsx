import type { ReactNode } from "react";

import { LandingShellClient } from "./landing-shell-client";
import type {
  OrganismLandingConfig,
  OrganismLandingNavItem,
  OrganismLandingView,
  OrganismViewKey,
} from "@/components/organisms/types";

interface OrganismLandingShellProps {
  config: OrganismLandingConfig;
  views: readonly OrganismLandingView[];
  activeViewKey?: string;
  headerContent?: ReactNode;
}

function isOrganismViewKey(
  value: string | undefined,
  views: readonly OrganismLandingView[],
): value is OrganismViewKey {
  return views.some((view) => view.key === value && view.enabled !== false);
}

export function OrganismLandingShell({
  config,
  views,
  activeViewKey,
  headerContent,
}: OrganismLandingShellProps) {
  const defaultView = config.defaultView ?? "overview";
  // When hideDisabledTabs is set, drop disabled views entirely (hard-hide);
  // otherwise keep them so they render greyed/disabled (default).
  const visibleViews = config.hideDisabledTabs
    ? views.filter((view) => view.enabled !== false)
    : views;
  const requestedKey = isOrganismViewKey(activeViewKey, visibleViews) ? activeViewKey : defaultView;
  // requestedKey may still point at a disabled view (when it falls back to a
  // disabled defaultView), so require enabled here and fall back to the first
  // enabled view, then to visibleViews[0] as a last resort.
  const activeView =
    visibleViews.find((view) => view.key === requestedKey && view.enabled !== false) ??
    visibleViews.find((view) => view.enabled !== false) ??
    visibleViews[0];
  const navItems: OrganismLandingNavItem[] = visibleViews.map(
    ({ key, label, icon, enabled, disabledReason }) => ({
      key,
      label,
      icon,
      enabled,
      disabledReason,
    }),
  );
  const ActiveViewComponent = activeView.Component;

  return (
    <LandingShellClient
      displayName={config.displayName}
      activeView={activeView.key}
      defaultView={defaultView}
      navItems={navItems}
      headerContent={headerContent}
    >
      <ActiveViewComponent />
    </LandingShellClient>
  );
}
