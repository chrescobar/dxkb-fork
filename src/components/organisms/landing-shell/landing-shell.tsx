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
  const requestedKey = isOrganismViewKey(activeViewKey, views) ? activeViewKey : defaultView;
  // requestedKey may still point at a disabled view (when it falls back to a
  // disabled defaultView), so require enabled here and fall back to the first
  // enabled view, then to views[0] as a last resort.
  const activeView =
    views.find((view) => view.key === requestedKey && view.enabled !== false) ??
    views.find((view) => view.enabled !== false) ??
    views[0];
  const navItems: OrganismLandingNavItem[] = views.map(
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
