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
  return views.some((view) => view.key === value);
}

export function OrganismLandingShell({
  config,
  views,
  activeViewKey,
  headerContent,
}: OrganismLandingShellProps) {
  const defaultView = config.defaultView ?? "overview";
  const resolvedKey = isOrganismViewKey(activeViewKey, views)
    ? activeViewKey
    : defaultView;
  const activeView = views.find((view) => view.key === resolvedKey) ?? views[0];
  const navItems: OrganismLandingNavItem[] = views.map(({ key, label, icon }) => ({
    key,
    label,
    icon,
  }));
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
