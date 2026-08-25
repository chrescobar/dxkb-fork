import { fetchOrganismGeoDistribution } from "@/lib/services/organisms/geo-distribution";

import { GeoDistributionClient } from "./geo-distribution-client";
import type { GeoDistributionAccent } from "./types";

interface GeoDistributionProps {
  taxonId: number;
  accent: GeoDistributionAccent;
}

export async function GeoDistribution({ taxonId, accent }: GeoDistributionProps) {
  const data = await fetchOrganismGeoDistribution(taxonId);

  return <GeoDistributionClient key={taxonId} data={data} accent={accent} />;
}
