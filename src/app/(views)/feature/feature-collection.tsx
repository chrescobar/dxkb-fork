"use client";

import { Blocks } from "lucide-react";
import type { CollectionState } from "@/lib/views/collection-state";
import { EntityViewShell, FeatureResourceCollection } from "@/components/views";

interface FeatureCollectionProps {
  initialState: CollectionState;
}

export function FeatureCollection({
  initialState: _initialState,
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
      <FeatureResourceCollection initialState={_initialState} />
    </EntityViewShell>
  );
}
