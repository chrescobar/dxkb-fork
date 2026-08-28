"use client";

import { Blocks } from "lucide-react";
import type { CollectionState } from "@/lib/views/collection-state";
import { EntityViewShell, FeatureResourceCollection } from "@/components/views";

export function FeatureCollection({
  initialState: _initialState,
}: {
  initialState: CollectionState;
}) {
  return (
    <EntityViewShell
      viewLabel="Feature View"
      title="Features"
      tabs={[{ key: "features", label: "Features", icon: <Blocks /> }]}
      activeTab="features"
      defaultTab="features"
      layout="fill"
    >
      <FeatureResourceCollection />
    </EntityViewShell>
  );
}
