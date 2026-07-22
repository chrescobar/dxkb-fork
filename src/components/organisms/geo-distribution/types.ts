import type { OrganismLandingConfig } from "@/components/organisms/types";

export type GeoDistributionAccent = OrganismLandingConfig["accent"];

export type GeoMapView = "world" | "us" | "state";

export interface GeoMapState {
  view: GeoMapView;
  selectedStateFips: string | null;
  selectedStateName: string | null;
}
