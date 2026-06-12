import { buildOrganismNavItems } from "@/components/organisms/shared/default-nav-items";
import type {
  OrganismLandingConfig,
  OrganismLandingView,
  OrganismViewKey,
} from "@/components/organisms/types";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

import { makeOverviewView } from "../views/overview";

export function buildTaxonomyNavItems(
  config: OrganismLandingConfig,
  taxon: OrganismTaxonomy | null,
): OrganismLandingView[] {
  // Hide views that don't apply to the lineage. AMR Phenotypes is a bacteria
  // concept — keep it out of viral/fungal taxonomy pages so the sidebar reflects
  // real capabilities, not just planned ones.
  const exclude: OrganismViewKey[] = [];
  if (!config.showAmr) exclude.push("amr-phenotypes");

  return buildOrganismNavItems(
    {
      overview: {
        Component: makeOverviewView({
          config,
          taxon,
          showAmr: config.showAmr ?? false,
        }),
      },
    },
    { exclude },
  );
}
