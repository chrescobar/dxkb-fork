"use client";

import { Dna } from "lucide-react";
import { EntityViewShell, GenomeResourceCollection } from "@/components/views";
import { genomeBaseRql } from "@/lib/genome-view";
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
        baseRql={genomeBaseRql(initialState)}
        initialState={initialState}
        keywordMode="refine"
      />
    </EntityViewShell>
  );
}
