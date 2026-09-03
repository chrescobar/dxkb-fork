"use client";

import { Shapes } from "lucide-react";
import {
  EntityViewShell,
  ProteinStructureResourceCollection,
} from "@/components/views";
import type { CollectionState } from "@/lib/views/collection-state";

export function ProteinStructureCollection({
  initialState,
}: {
  initialState: CollectionState;
}) {
  return (
    <EntityViewShell
      viewLabel="Protein Structure View"
      title="Protein Structures"
      tabs={[
        { key: "structures", label: "Protein Structures", icon: <Shapes /> },
      ]}
      activeTab="structures"
      defaultTab="structures"
      layout="fill"
    >
      <ProteinStructureResourceCollection
        initialState={initialState}
        keywordMode="refine"
      />
    </EntityViewShell>
  );
}
