"use client";

import { Blocks } from "lucide-react";
import { EntityViewShell, FeatureResourceCollection } from "@/components/views";
import { recentGenomeFeatureRql } from "@/lib/feature-view";
import type { CollectionState } from "@/lib/views/collection-state";

interface FeatureCollectionProps {
  initialState: CollectionState;
}

export function FeatureCollection({
  initialState,
}: FeatureCollectionProps) {
  return (
    <EntityViewShell
      viewLabel="Feature View"
      title="Features"
      tabs={[{ key: "features", label: "Features", icon: <Blocks /> }]}
      activeTab="features"
      defaultTab="features"
      layout="fill"
    >
      <FeatureResourceCollection
        baseRql={recentGenomeFeatureRql}
        initialState={initialState}
        keywordMode="refine"
      />
    </EntityViewShell>
  );
}
