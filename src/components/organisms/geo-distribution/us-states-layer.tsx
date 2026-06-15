"use client";

import { AlbersUsa } from "@visx/geo";
import { memo, type RefObject } from "react";

import type { OrganismGeoDistribution } from "@/lib/services/organisms/types";

import {
  ChoroplethPath,
  type HoverEnter,
  type HoverLeave,
} from "./choropleth-path";
import type { ColorScale } from "./color-scale";
import { mapHeight } from "./map-constants";
import { featureName, type StateFeature } from "./topology-utils";

interface UsStatesLayerProps {
  stateFeatures: StateFeature[];
  scale: number;
  width: number;
  data: OrganismGeoDistribution;
  colorScale: ColorScale;
  isDraggingRef: RefObject<boolean>;
  onHoverEnter: HoverEnter;
  onHoverLeave: HoverLeave;
  onSelectState: (fips: string, name: string) => void;
}

export const UsStatesLayer = memo(function UsStatesLayer({
  stateFeatures,
  scale,
  width,
  data,
  colorScale,
  isDraggingRef,
  onHoverEnter,
  onHoverLeave,
  onSelectState,
}: UsStatesLayerProps) {
  return (
    <AlbersUsa<StateFeature>
      data={stateFeatures}
      scale={scale}
      translate={[width / 2, mapHeight / 2]}
    >
      {({ features }) =>
        features.map(({ feature, path }, index) => {
          const name = featureName(feature.properties);
          const count = data.stateData[name] ?? 0;
          const meta = data.stateMeta[name];
          return (
            <ChoroplethPath
              key={`${name}-${String(index)}`}
              pathD={path ?? ""}
              fill={colorScale(count)}
              strokeWidth={0.75}
              cursor="pointer"
              isDraggingRef={isDraggingRef}
              payload={{ view: "us", name, count, genera: meta.genera, hosts: meta.hosts }}
              onHoverEnter={onHoverEnter}
              onHoverLeave={onHoverLeave}
              onClick={() => {
                const fips = String(feature.id ?? "").padStart(2, "0");
                if (fips) onSelectState(fips, name);
              }}
            />
          );
        })
      }
    </AlbersUsa>
  );
});
