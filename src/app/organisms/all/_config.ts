import type { OrganismLandingConfig } from "@/components/organisms/types";

export const allOrganismsLandingConfig: OrganismLandingConfig = {
  displayName: "All Organisms",
  taxonId: 131567,
  accent: "all",
  defaultView: "overview",
  hideDisabledTabs: true,
  metadataFields: ["host_group", "isolation_country"],
};
