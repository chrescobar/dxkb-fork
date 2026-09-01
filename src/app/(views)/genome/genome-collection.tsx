"use client";

import { Dna } from "lucide-react";
import { EntityViewShell, GenomeResourceCollection } from "@/components/views";
import { recentGenomeRql } from "@/lib/genome-view";
import type { CollectionState } from "@/lib/views/collection-state";

export function GenomeCollection({
  initialState,
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
      <GenomeResourceCollection
        baseRql={recentGenomeRql}
        initialState={initialState}
        keywordMode="refine"
      />
    </EntityViewShell>
  );
}
