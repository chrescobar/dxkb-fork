import { buildOrganismNavItems } from "@/components/organisms/shared/default-nav-items";
import type { OrganismLandingConfig, OrganismLandingView } from "@/components/organisms/types";

import { makeOverviewView } from "../views/overview";

export function buildTaxonomyNavItems(
  config: OrganismLandingConfig,
  showSerotype: boolean,
): OrganismLandingView[] {
  return buildOrganismNavItems({
    overview: { Component: makeOverviewView({ config, showSerotype }) },
  });
}
