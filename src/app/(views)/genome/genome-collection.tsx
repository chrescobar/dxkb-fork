"use client";

import { Dna } from "lucide-react";
import type { CollectionState } from "@/lib/views/collection-state";
import { EntityViewShell, GenomeResourceCollection } from "@/components/views";

export function GenomeCollection({
  initialState: _initialState,
}: {
  initialState: CollectionState;
}) {
  return (
    <EntityViewShell
      viewLabel="Genome View"
      title="Genomes"
      tabs={[{ key: "genomes", label: "Genomes", icon: <Dna /> }]}
      activeTab="genomes"
      defaultTab="genomes"
      layout="fill"
    >
      <GenomeResourceCollection />
    </EntityViewShell>
  );
}
