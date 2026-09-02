"use client";

import { Waypoints } from "lucide-react";
import {
  EntityViewShell,
  ProteinFeatureResourceCollection,
} from "@/components/views";
import type { CollectionState } from "@/lib/views/collection-state";

export function DomainsAndMotifsCollection({
  initialState,
}: {
  initialState: CollectionState;
}) {
  return (
    <EntityViewShell
      viewLabel="Domains and Motifs View"
      title="Domains and Motifs"
      tabs={[
        {
          key: "proteinFeatures",
          label: "Domains and Motifs",
          icon: <Waypoints />,
        },
      ]}
      activeTab="proteinFeatures"
      defaultTab="proteinFeatures"
      layout="fill"
    >
      <ProteinFeatureResourceCollection
        initialState={initialState}
        keywordMode="refine"
      />
    </EntityViewShell>
  );
}
