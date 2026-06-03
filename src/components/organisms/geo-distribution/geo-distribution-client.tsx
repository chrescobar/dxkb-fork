"use client";

import { TooltipWithBounds, useTooltip } from "@visx/tooltip";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import * as topojson from "topojson-client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { OrganismGeoDistribution } from "@/lib/services/organisms/types";

import {
  ChoroplethSvg,
  type ChoroplethHandle,
  type HoverPayload,
} from "./choropleth-svg";
import { ColorLegend } from "./color-legend";
import { makeColorScale } from "./color-scale";
import { MapControls } from "./map-controls";
import { MapTooltip } from "./map-tooltip";
import type { GeoDistributionAccent, GeoMapState, GeoMapView } from "./types";

interface GeoDistributionClientProps {
  data: OrganismGeoDistribution;
  accent: GeoDistributionAccent;
}

interface TopologyLike {
  type: "Topology";
  arcs: number[][][];
  objects: Record<string, unknown>;
}

const tooltipOffset = 14;

export function GeoDistributionClient({ data, accent }: GeoDistributionClientProps) {
  const [mapState, setMapState] = useState<GeoMapState>({
    view: "us",
    selectedStateFips: null,
    selectedStateName: null,
  });

  const [countyTopo, setCountyTopo] = useState<TopologyLike | null>(null);
  const [countyTopoError, setCountyTopoError] = useState<string | null>(null);
  const [worldTopo, setWorldTopo] = useState<TopologyLike | null>(null);
  const [worldTopoError, setWorldTopoError] = useState<string | null>(null);
  const [worldTopoLoading, setWorldTopoLoading] = useState(false);
  const worldFetchStartedRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const choroplethRef = useRef<ChoroplethHandle>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/maps/counties-10m.json")
      .then((response) => {
        if (!response.ok) throw new Error(`counties-10m: ${response.status}`);
        return response.json() as Promise<TopologyLike>;
      })
      .then((topo) => {
        if (!cancelled) setCountyTopo(topo);
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setCountyTopoError(error instanceof Error ? error.message : String(error));
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Lazy-load the world topo only when the user first opens the world view.
  useEffect(() => {
    if (mapState.view !== "world" || worldFetchStartedRef.current) return;
    worldFetchStartedRef.current = true;
    setWorldTopoLoading(true);
    let cancelled = false;
    fetch("/maps/countries-110m.json")
      .then((response) => {
        if (!response.ok) throw new Error(`countries-110m: ${response.status}`);
        return response.json() as Promise<TopologyLike>;
      })
      .then((topo) => {
        if (!cancelled) {
          setWorldTopo(topo);
          setWorldTopoLoading(false);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setWorldTopoError(error instanceof Error ? error.message : String(error));
          setWorldTopoLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [mapState.view]);

  const stateOptions = useMemo(() => {
    if (!countyTopo) return [];
    const object = countyTopo.objects.states as unknown;
    if (!object) return [];
    const fc = topojson.feature(countyTopo as never, object as never) as unknown as GeoJSON.FeatureCollection<
      GeoJSON.Geometry,
      { name?: string }
    >;
    return fc.features
      .map((feature) => ({
        fips: String((feature as { id?: string | number }).id ?? "").padStart(2, "0"),
        name: feature.properties?.name ?? "",
      }))
      .filter((option) => option.fips && option.name)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [countyTopo]);

  const colorScale = useMemo(() => makeColorScale(data.maxCount, accent), [data.maxCount, accent]);

  const {
    tooltipOpen,
    tooltipLeft,
    tooltipTop,
    tooltipData,
    showTooltip,
    hideTooltip,
  } = useTooltip<HoverPayload>();

  const handleViewChange = useCallback((view: GeoMapView) => {
    setMapState((prev) => {
      if (view === "us") {
        return { view: "us", selectedStateFips: null, selectedStateName: null };
      }
      if (view === "world") {
        return { view: "world", selectedStateFips: null, selectedStateName: null };
      }
      // view === "state" — keep existing selection if present, else stay on us
      if (prev.selectedStateFips) {
        return { ...prev, view: "state" };
      }
      return prev;
    });
    hideTooltip();
    choroplethRef.current?.reset();
  }, [hideTooltip]);

  const handleSelectState = useCallback(
    (fips: string, name: string) => {
      setMapState({ view: "state", selectedStateFips: fips, selectedStateName: name });
      hideTooltip();
      choroplethRef.current?.reset();
    },
    [hideTooltip],
  );

  const handleClearState = useCallback(() => {
    setMapState({ view: "us", selectedStateFips: null, selectedStateName: null });
    hideTooltip();
    choroplethRef.current?.reset();
  }, [hideTooltip]);

  const handleHoverChange = useCallback(
    (payload: HoverPayload | null, event: ReactPointerEvent<SVGPathElement>) => {
      if (!payload) {
        hideTooltip();
        return;
      }
      const container = containerRef.current;
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const left = event.clientX - rect.left + tooltipOffset;
      const top = event.clientY - rect.top + tooltipOffset;
      showTooltip({ tooltipData: payload, tooltipLeft: left, tooltipTop: top });
    },
    [hideTooltip, showTooltip],
  );

  const helperMessage = useMemo(() => {
    if (mapState.view === "world" && Object.keys(data.countryData).length === 0) {
      return "No country-level data for this taxon.";
    }
    if (mapState.view === "us" && Object.keys(data.stateData).length === 0) {
      return "No US state-level data for this taxon.";
    }
    if (mapState.view === "state" && mapState.selectedStateFips && Object.keys(data.countyData).length === 0) {
      return "No county-level data for this taxon.";
    }
    return null;
  }, [mapState, data]);

  return (
    <Card className="rounded-lg" size="sm">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 pb-3">
        <CardTitle className="text-lg!">Geographic Distribution</CardTitle>
        <MapControls
          mapState={mapState}
          stateOptions={stateOptions}
          onViewChange={handleViewChange}
          onSelectState={handleSelectState}
          onClearState={handleClearState}
        />
      </CardHeader>
      <CardContent className="relative">
        <div ref={containerRef} className="relative">
          <ChoroplethSvg
            ref={choroplethRef}
            data={data}
            colorScale={colorScale}
            mapState={mapState}
            onSelectState={handleSelectState}
            onSwitchToUs={() => handleViewChange("us")}
            worldTopo={worldTopo}
            worldTopoLoading={worldTopoLoading}
            worldTopoError={worldTopoError}
            countyTopo={countyTopo}
            countyTopoError={countyTopoError}
            onHoverChange={handleHoverChange}
            onLeaveMap={hideTooltip}
          />
          {tooltipOpen && tooltipData && (
            <TooltipWithBounds
              left={tooltipLeft}
              top={tooltipTop}
              unstyled
              className="bg-popover text-popover-foreground pointer-events-none absolute z-10 rounded-md border p-2 shadow-md"
            >
              <MapTooltip data={tooltipData} />
            </TooltipWithBounds>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <span className="text-muted-foreground text-xs">
            {helperMessage}
          </span>
          <ColorLegend maxCount={data.maxCount} accent={accent} />
        </div>
      </CardContent>
    </Card>
  );
}
