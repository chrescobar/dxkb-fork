import { Card, CardContent } from "@/components/ui/card";
import { fetchOrganismGeoDistribution } from "@/lib/services/organisms/geo-distribution";

import { GeoDistributionClient } from "./geo-distribution-client";
import type { GeoDistributionAccent } from "./types";

interface GeoDistributionProps {
  taxonId: number;
  accent: GeoDistributionAccent;
}

export async function GeoDistribution({ taxonId, accent }: GeoDistributionProps) {
  const data = await fetchOrganismGeoDistribution(taxonId);

  if (data.maxCount === 0) {
    return (
      <Card className="rounded-lg" size="sm">
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No geographic distribution data is available for this taxon.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <GeoDistributionClient key={taxonId} data={data} accent={accent} />
  );
}
