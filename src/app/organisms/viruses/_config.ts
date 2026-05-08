import type { OrganismLandingConfig } from "@/components/organisms/types";

export const virusesLandingConfig: OrganismLandingConfig = {
  displayName: "Viruses",
  taxonId: 10239,
  pubmedTerm: "Viruses",
  accent: "viruses",
  defaultView: "overview",
  metadataFields: ["family", "host_name", "isolation_country"],
  externalTools: [
    {
      label: "BEI Resources",
      href: "https://www.beiresources.org/Catalog.aspx?f_instockflag=In+Stock%23~%23Temporarily+Out+of+Stock&q=Viruses",
      description:
        "Reference reagents, organisms, and materials for infectious disease research.",
    },
  ],
};
