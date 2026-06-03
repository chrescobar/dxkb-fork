import type { OrganismLandingConfig } from "@/components/organisms/types";

export const brucellaTaxonomyConfig: OrganismLandingConfig = {
  displayName: "Brucella",
  taxonId: 234,
  accent: "bacteria",
  defaultView: "overview",
  metadataFields: ["host_name", "isolation_country", "isolation_source"],
};
