"use client";

import { DataRepository } from "@/lib/data-api";
import {
  featureCollectionOptions,
  featureCollectionProfile,
  type FeatureViewRecord,
} from "@/lib/feature-view";
import { useCollectionUrlState } from "@/hooks/views/use-collection-url-state";
import { ResourceCollection } from "./resource-collection";

const repository = new DataRepository();

interface FeatureResourceCollectionProps {
  baseRql?: string;
  enableFacets?: boolean;
  enableRowLinks?: boolean;
}

export function FeatureResourceCollection({
  baseRql,
  enableFacets = true,
  enableRowLinks = true,
}: FeatureResourceCollectionProps) {
  const [state, setState] = useCollectionUrlState(featureCollectionOptions);
  return (
    <ResourceCollection<FeatureViewRecord>
      profile={
        enableFacets
          ? featureCollectionProfile
          : { ...featureCollectionProfile, facets: undefined }
      }
      repository={repository}
      state={state}
      onStateChange={setState}
      baseRql={baseRql}
      enableRowLinks={enableRowLinks}
      showHeader={false}
    />
  );
}
