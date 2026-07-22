import { buildOrganismNavItems } from "@/components/organisms/shared/default-nav-items";
import type { OrganismLandingView } from "@/components/organisms/types";

import { OverviewView } from "../views/overview";

export const bacteriaNavItems: OrganismLandingView[] = buildOrganismNavItems({
  overview: { Component: OverviewView },
});
