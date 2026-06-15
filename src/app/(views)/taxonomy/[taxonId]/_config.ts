import { taxonomicDistributionSentinel } from "@/components/organisms/types";
import type { OrganismLandingConfig } from "@/components/organisms/types";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

const defaultMetadataFields = [
  "host_common_name",
  "host_group",
  "isolation_country",
  "isolation_source",
  taxonomicDistributionSentinel,
  "sequencing_centers",
  "collection_year",
];

function accentForLineage(
  lineageNames: readonly string[],
): OrganismLandingConfig["accent"] {
  if (lineageNames.includes("Viruses")) return "viruses";
  if (lineageNames.includes("Fungi")) return "fungi";
  if (lineageNames.includes("Bacteria")) return "bacteria";
  return "all";
}

function showAmrForLineage(lineageNames: readonly string[]): boolean {
  return lineageNames.includes("Bacteria");
}

export function buildTaxonomyConfig(
  taxonId: number,
  taxon: OrganismTaxonomy | null,
): OrganismLandingConfig {
  return {
    displayName: taxon?.taxonName ?? `Taxon ${String(taxonId)}`,
    taxonId,
    accent: accentForLineage(taxon?.lineageNames ?? []),
    showAmr: showAmrForLineage(taxon?.lineageNames ?? []),
    defaultView: "overview",
    metadataFields: defaultMetadataFields,
  };
}
