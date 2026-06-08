import type { OrganismLandingConfig } from "@/components/organisms/types";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

const defaultMetadataFields = [
  "host_group",
  "isolation_country",
  "collection_year",
  "host_common_name",
  "isolation_source",
  "serovar",
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
    displayName: taxon?.taxonName ?? `Taxon ${taxonId}`,
    taxonId,
    accent: accentForLineage(taxon?.lineageNames ?? []),
    showAmr: showAmrForLineage(taxon?.lineageNames ?? []),
    defaultView: "overview",
    metadataFields: defaultMetadataFields,
  };
}
