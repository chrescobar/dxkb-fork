import type { OrganismLandingConfig } from "@/components/organisms/types";

export const virusesLandingConfig: OrganismLandingConfig = {
  displayName: "Viruses",
  taxonId: 10239,
  accent: "viruses",
  defaultView: "overview",
  hideDisabledTabs: true,
  metadataFields: ["family", "host_group", "isolation_country"],
};
