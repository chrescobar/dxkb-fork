"use client";

import { Activity } from "lucide-react";
import { EntityViewShell, EpitopeResourceCollection } from "@/components/views";
import type { CollectionState } from "@/lib/views/collection-state";

export function EpitopeCollection({ initialState }: { initialState: CollectionState }) {
  return (
    <EntityViewShell
      viewLabel="Epitope View"
      title="Epitopes"
      tabs={[{ key: "epitopes", label: "Epitopes", icon: <Activity /> }]}
      activeTab="epitopes"
      defaultTab="epitopes"
      layout="fill"
    >
      <EpitopeResourceCollection initialState={initialState} />
    </EntityViewShell>
  );
}
