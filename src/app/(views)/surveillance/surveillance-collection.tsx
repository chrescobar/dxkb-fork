"use client";

import { Microscope } from "lucide-react";
import {
  EntityViewShell,
  SurveillanceResourceCollection,
} from "@/components/views";
import type { CollectionState } from "@/lib/views/collection-state";

export function SurveillanceCollection({
  initialState,
}: {
  initialState: CollectionState;
}) {
  return (
    <EntityViewShell
      viewLabel="Surveillance View"
      title="Surveillance"
      tabs={[
        { key: "surveillance", label: "Surveillance", icon: <Microscope /> },
      ]}
      activeTab="surveillance"
      defaultTab="surveillance"
      layout="fill"
    >
      <SurveillanceResourceCollection
        initialState={initialState}
        keywordMode="loaded"
      />
    </EntityViewShell>
  );
}
