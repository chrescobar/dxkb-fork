import { buildOrganismNavItems } from "@/components/organisms/shared/default-nav-items";
import type { OrganismLandingView } from "@/components/organisms/types";

import { OverviewView } from "../views/overview";

export const allNavItems: OrganismLandingView[] = buildOrganismNavItems({
  overview: { Component: OverviewView },
  // All-organisms surface uses bare placeholder labels (no helper text).
  phylogeny: { description: undefined },
  taxonomy: { description: undefined },
  genomes: { description: undefined },
});
