import type { OrganismLandingConfig } from "@/components/organisms/types";

export const bacteriaLandingConfig: OrganismLandingConfig = {
  displayName: "Bacteria",
  taxonId: 2,
  accent: "bacteria",
  defaultView: "overview",
  metadataFields: ["genus", "host_name", "isolation_country"],
};
