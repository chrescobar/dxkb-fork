"use client";

import { DataRepository } from "@/lib/data-api";
import {
  genomeCollectionOptions,
  genomeCollectionProfile,
  type GenomeViewRecord,
} from "@/lib/genome-view";
import { useCollectionUrlState } from "@/hooks/views/use-collection-url-state";
import { ResourceCollection } from "./resource-collection";

const repository = new DataRepository();

interface GenomeResourceCollectionProps {
  baseRql?: string;
  enableRowLinks?: boolean;
}

export function GenomeResourceCollection({
  baseRql,
  enableRowLinks = true,
}: GenomeResourceCollectionProps) {
  const [state, setState] = useCollectionUrlState(genomeCollectionOptions);

  return (
    <ResourceCollection<GenomeViewRecord>
      profile={genomeCollectionProfile}
      repository={repository}
      state={state}
      onStateChange={setState}
      baseRql={baseRql}
      enableRowLinks={enableRowLinks}
      showHeader={false}
    />
  );
}
