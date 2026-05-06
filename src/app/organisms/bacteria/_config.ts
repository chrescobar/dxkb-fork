import type { OrganismLandingConfig } from "@/components/organisms/types";

export const bacteriaLandingConfig: OrganismLandingConfig = {
  displayName: "Bacteria",
  taxonId: 2,
  pubmedTerm: "Bacteria",
  accent: "bacteria",
  defaultView: "overview",
  metadataFields: ["genus", "host_name", "isolation_country"],
  externalTools: [
    {
      label: "BEI Resources",
      href: "https://www.beiresources.org/",
      description: "Reference reagents, organisms, and materials for infectious disease research.",
    },
  ],
};
