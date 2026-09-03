"use client";

import { FlaskConical, TestTubes } from "lucide-react";
import { EntityViewShell, ExperimentResourceCollection } from "@/components/views";
import type { ExperimentCollectionTab } from "@/lib/experiment-view";
import type { CollectionState } from "@/lib/views/collection-state";
import { ExperimentBiosetCollection } from "./experiment-bioset-collection";

export function ExperimentCollection({
  initialState,
  activeTab,
}: {
  initialState: CollectionState;
  activeTab: ExperimentCollectionTab;
}) {
  return (
    <EntityViewShell
      viewLabel="Experiment View"
      title="Experiments"
      tabs={[
        { key: "experiments", label: "Experiments", icon: <FlaskConical /> },
        { key: "biosets", label: "Biosets", icon: <TestTubes /> },
      ]}
      activeTab={activeTab}
      defaultTab="experiments"
      layout="fill"
    >
      {activeTab === "biosets" ? (
        <ExperimentBiosetCollection experimentState={initialState} />
      ) : (
        <ExperimentResourceCollection
          initialState={initialState}
          keywordMode="refine"
        />
      )}
    </EntityViewShell>
  );
}
