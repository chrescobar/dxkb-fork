"use client";

import { AlbersUsa, CustomProjection, NaturalEarth } from "@visx/geo";
import { geoMercator } from "@visx/vendor/d3-geo";
import { Zoom } from "@visx/zoom";
import { Maximize2, Minus, Plus } from "lucide-react";
import {
  forwardRef,
  memo,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type RefObject,
  type PointerEvent as ReactPointerEvent,
} from "react";
import * as topojson from "topojson-client";

import { Button } from "@/components/ui/button";
import type { OrganismGeoDistribution } from "@/lib/services/organisms/types";

import {
  isUsaTopoName,
  lookupCountryCount,
  resolveCountryDataKey,
  type ColorScale,
} from "./color-scale";
import type { GeoMapState, GeoMapView } from "./types";

interface NamedFeatureProps {
  name?: string;
  NAME?: string;
}

type StateFeature = GeoJSON.Feature<GeoJSON.Geometry, NamedFeatureProps> & {
  id?: string | number;
};

type CountyFeature = StateFeature;
type CountryFeature = StateFeature;

export interface HoverPayload {
  view: GeoMapView;
  name: string;
  count: number;
  genera: Record<string, number>;
  hosts: Record<string, number>;
}

interface TopologyLike {
  type: "Topology";
  arcs: number[][][];
  objects: Record<string, unknown>;
}

export interface ChoroplethHandle {
  reset: () => void;
}

const mapHeight = 560;
const countyPadding = 48;

function featureName(feature: NamedFeatureProps | undefined): string {
  if (!feature) return "";
  return feature.name ?? feature.NAME ?? "";
}

// Detect features whose coordinates span the antimeridian (180°/-180° boundary).
// These features have both positive longitudes (> 0°) AND very-negative longitudes
// (< -160°), which only happens for things like Alaska's Aleutians West Census Area.
// Using them in geoMercator().fitExtent() produces a near-global bounding box, making
// the state drill-down map tiny and mis-positioned.
function crossesAntimeridian(feature: GeoJSON.Feature): boolean {
  let hasPositive = false;
  let hasVeryNegative = false;
  function scan(coords: unknown): void {
    if (!Array.isArray(coords)) return;
    if (typeof coords[0] === "number") {
      const lon = coords[0] as number;
      if (lon > 0) hasPositive = true;
      if (lon < -160) hasVeryNegative = true;
    } else {
      for (const c of coords) scan(c);
    }
  }
  const geom = feature.geometry as GeoJSON.Geometry & { coordinates?: unknown };
  if (geom?.coordinates) scan(geom.coordinates);
  return hasPositive && hasVeryNegative;
}

function extractFeatures(topo: TopologyLike, objectKey: string): StateFeature[] {
  const object = (topo.objects as Record<string, unknown>)[objectKey];
  if (!object) return [];
  const fc = topojson.feature(topo as never, object as never) as unknown as GeoJSON.FeatureCollection<
    GeoJSON.Geometry,
    NamedFeatureProps
  >;
  return fc.features as StateFeature[];
}

type HoverHandler = (payload: HoverPayload | null, event: ReactPointerEvent<SVGPathElement>) => void;

// ─── Memoized layer components ────────────────────────────────────────────────
// Each layer is wrapped in React.memo so path computation only runs when actual
// data changes, not on every zoom drag frame. The isDraggingRef lets handlers
// check drag state without the ref itself triggering re-renders.

interface LayerCommonProps {
  data: OrganismGeoDistribution;
  colorScale: ColorScale;
  isDraggingRef: RefObject<boolean>;
  onHoverChange: HoverHandler;
}

const WorldCountriesLayer = memo(function WorldCountriesLayer({
  countryFeatures,
  scale,
  width,
  data,
  colorScale,
  isDraggingRef,
  onHoverChange,
  onSwitchToUs,
}: LayerCommonProps & {
  countryFeatures: CountryFeature[];
  scale: number;
  width: number;
  onSwitchToUs: () => void;
}) {
  return (
    <NaturalEarth<CountryFeature>
      data={countryFeatures}
      scale={scale}
      translate={[width / 2, mapHeight / 2]}
    >
      {({ features }) =>
        features.map(({ feature, path }, index) => {
          const name = featureName(feature.properties);
          const count = lookupCountryCount(name, data.countryData);
          const dataKey = resolveCountryDataKey(name, data.countryData) ?? name;
          const meta = data.countryMeta[dataKey];
          const interactable = isUsaTopoName(name);
          return (
            <path
              key={`${name}-${index}`}
              d={path ?? ""}
              fill={colorScale(count)}
              stroke="#94a3b8"
              strokeWidth={0.4}
              style={{ cursor: interactable ? "pointer" : "default" }}
              onPointerMove={(event) => {
                if (isDraggingRef.current) return;
                onHoverChange(
                  { view: "world", name, count, genera: meta?.genera ?? {}, hosts: meta?.hosts ?? {} },
                  event,
                );
              }}
              onPointerLeave={() => onHoverChange(null, {} as ReactPointerEvent<SVGPathElement>)}
              onClick={() => { if (interactable) onSwitchToUs(); }}
            />
          );
        })
      }
    </NaturalEarth>
  );
});

const UsStatesLayer = memo(function UsStatesLayer({
  stateFeatures,
  scale,
  width,
  data,
  colorScale,
  isDraggingRef,
  onHoverChange,
  onSelectState,
}: LayerCommonProps & {
  stateFeatures: StateFeature[];
  scale: number;
  width: number;
  onSelectState: (fips: string, name: string) => void;
}) {
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
            <path
              key={`${name}-${index}`}
              d={path ?? ""}
              fill={colorScale(count)}
              stroke="#94a3b8"
              strokeWidth={0.5}
              style={{ cursor: "pointer" }}
              onPointerMove={(event) => {
                if (isDraggingRef.current) return;
                onHoverChange(
                  { view: "us", name, count, genera: meta?.genera ?? {}, hosts: meta?.hosts ?? {} },
                  event,
                );
              }}
              onPointerLeave={() => onHoverChange(null, {} as ReactPointerEvent<SVGPathElement>)}
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

interface CountiesLayerProps extends LayerCommonProps {
  countyFeatures: CountyFeature[];
  fitBoundsFeatures: CountyFeature[];
  fitExtent: [[number, number], [number, number]];
}

const StateCountiesLayer = memo(function StateCountiesLayer({
  countyFeatures,
  fitBoundsFeatures,
  fitExtent,
  data,
  colorScale,
  isDraggingRef,
  onHoverChange,
}: CountiesLayerProps) {
  const projection = useCallback(() => geoMercator(), []);

  return (
    <CustomProjection<CountyFeature>
      data={countyFeatures}
      projection={projection}
      fitExtent={[fitExtent, { type: "FeatureCollection", features: fitBoundsFeatures } as never]}
    >
      {({ features }) =>
        features.map(({ feature, path }, index) => {
          const name = featureName(feature.properties);
          const count = data.countyData[name] ?? 0;
          const meta = data.countyMeta[name];
          return (
            <path
              key={`${name}-${feature.id ?? index}`}
              d={path ?? ""}
              fill={colorScale(count)}
              stroke="#94a3b8"
              strokeWidth={0.3}
              onPointerMove={(event) => {
                if (isDraggingRef.current) return;
                onHoverChange(
                  { view: "state", name, count, genera: meta?.genera ?? {}, hosts: meta?.hosts ?? {} },
                  event,
                );
              }}
              onPointerLeave={() => onHoverChange(null, {} as ReactPointerEvent<SVGPathElement>)}
            />
          );
        })
      }
    </CustomProjection>
  );
});

// ─── Main component ────────────────────────────────────────────────────────────

interface ChoroplethSvgProps {
  data: OrganismGeoDistribution;
  colorScale: ColorScale;
  mapState: GeoMapState;
  onSelectState: (fips: string, name: string) => void;
  onSwitchToUs: () => void;
  worldTopo: TopologyLike | null;
  worldTopoLoading: boolean;
  worldTopoError: string | null;
  countyTopo: TopologyLike | null;
  countyTopoError: string | null;
  onHoverChange: HoverHandler;
  onLeaveMap: () => void;
}

export const ChoroplethSvg = forwardRef<ChoroplethHandle, ChoroplethSvgProps>(function ChoroplethSvg(
  {
    data,
    colorScale,
    mapState,
    onSelectState,
    onSwitchToUs,
    worldTopo,
    worldTopoLoading,
    worldTopoError,
    countyTopo,
    countyTopoError,
    onHoverChange,
    onLeaveMap,
  }: ChoroplethSvgProps,
  ref,
) {
  const [width, setWidth] = useState(800);
  const isDraggingRef = useRef(false);
  const zoomImperativeRef = useRef<{
    reset: () => void;
    scale: (args: { scaleX: number; scaleY: number }) => void;
  } | null>(null);
  const resizeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstObservationRef = useRef(true);

  const setContainer = useCallback((node: HTMLDivElement | null) => {
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect?.width;
      if (!next || next <= 0) return;
      // Fire immediately on first observation so initial render has correct width.
      // Debounce all subsequent events so the SVG doesn't re-render on every frame
      // of a CSS width transition (e.g. collapsing the nav sidebar).
      if (isFirstObservationRef.current) {
        isFirstObservationRef.current = false;
        setWidth(next);
        return;
      }
      if (resizeTimerRef.current) clearTimeout(resizeTimerRef.current);
      resizeTimerRef.current = setTimeout(() => setWidth(next), 20);
    });
    ro.observe(node);
  }, []);

  useImperativeHandle(ref, () => ({
    reset: () => zoomImperativeRef.current?.reset(),
  }));

  const stateFeatures = useMemo<StateFeature[]>(() => {
    if (!countyTopo) return [];
    return extractFeatures(countyTopo, "states");
  }, [countyTopo]);

  const countryFeatures = useMemo<CountryFeature[]>(() => {
    if (!worldTopo) return [];
    return extractFeatures(worldTopo, "countries");
  }, [worldTopo]);

  const countyFeatures = useMemo<CountyFeature[]>(() => {
    const fips = mapState.selectedStateFips;
    if (!countyTopo || !fips) return [];
    const all = extractFeatures(countyTopo, "counties");
    return all.filter((feature) => String(feature.id ?? "").startsWith(fips));
  }, [countyTopo, mapState.selectedStateFips]);

  // Features used only for fitExtent bounds — excludes any that cross the antimeridian
  // (e.g. Alaska's Aleutians West Census Area) which otherwise produce a near-global
  // bounding box that makes the drill-down map tiny and mis-positioned.
  const countyFitFeatures = useMemo<CountyFeature[]>(() => {
    if (countyFeatures.length === 0) return countyFeatures;
    const safe = countyFeatures.filter((f) => !crossesAntimeridian(f));
    return safe.length > 0 ? safe : countyFeatures;
  }, [countyFeatures]);

  const countyFitExtent = useMemo<[[number, number], [number, number]] | null>(() => {
    if (countyFeatures.length === 0) return null;
    return [
      [countyPadding, countyPadding],
      [Math.max(width - countyPadding, countyPadding + 1), mapHeight - countyPadding],
    ];
  }, [countyFeatures.length, width]);

  // AlbersUsa standard: scale=1070 at translate [487,305] fits US in ~960×600.
  // Tie to mapHeight so the full US (including Alaska/Hawaii insets) fits vertically.
  const albersScale = mapHeight * 1.55;
  const worldScale = Math.min(width / 6.3, mapHeight * 0.29);

  return (
    <div
      ref={setContainer}
      className="bg-muted/30 relative w-full overflow-hidden rounded-md flex items-center justify-center"
      style={{ height: mapHeight }}
      onPointerLeave={onLeaveMap}
    >
      <Zoom<SVGSVGElement>
        width={width}
        height={mapHeight}
        scaleXMin={0.6}
        scaleXMax={10}
        scaleYMin={0.6}
        scaleYMax={10}
      >
        {(zoom) => {
          // Update ref every frame — no setState so no re-render cascade.
          isDraggingRef.current = zoom.isDragging;
          zoomImperativeRef.current = { reset: zoom.reset, scale: zoom.scale };

          return (
            <>
              <svg
                width={width}
                height={mapHeight}
                ref={zoom.containerRef}
                role="img"
                aria-label="Genome distribution map"
                style={{ flexShrink: 0, cursor: zoom.isDragging ? "grabbing" : "grab", touchAction: "none" }}
                onWheel={(event) => {
                  event.preventDefault();
                  const next = event.deltaY < 0 ? 1.15 : 1 / 1.15;
                  zoom.scale({ scaleX: next, scaleY: next });
                }}
              >
                <g transform={zoom.toString()}>
                  {mapState.view === "world" && (
                    worldTopoLoading ? null :
                    worldTopoError ? null :
                    countryFeatures.length > 0 ? (
                      <WorldCountriesLayer
                        countryFeatures={countryFeatures}
                        scale={worldScale}
                        width={width}
                        data={data}
                        colorScale={colorScale}
                        isDraggingRef={isDraggingRef}
                        onHoverChange={onHoverChange}
                        onSwitchToUs={onSwitchToUs}
                      />
                    ) : null
                  )}

                  {mapState.view === "us" && !countyTopoError && stateFeatures.length > 0 && (
                    <UsStatesLayer
                      stateFeatures={stateFeatures}
                      scale={albersScale}
                      width={width}
                      data={data}
                      colorScale={colorScale}
                      isDraggingRef={isDraggingRef}
                      onHoverChange={onHoverChange}
                      onSelectState={onSelectState}
                    />
                  )}

                  {mapState.view === "state" && !countyTopoError && countyFeatures.length > 0 && countyFitExtent && (
                    <StateCountiesLayer
                      countyFeatures={countyFeatures}
                      fitBoundsFeatures={countyFitFeatures}
                      fitExtent={countyFitExtent}
                      data={data}
                      colorScale={colorScale}
                      isDraggingRef={isDraggingRef}
                      onHoverChange={onHoverChange}
                    />
                  )}
                </g>
              </svg>

              {/* Overlay messages rendered outside the zoom SVG */}
              {mapState.view === "world" && worldTopoLoading && (
                <div className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
                  Loading world map…
                </div>
              )}
              {mapState.view === "world" && worldTopoError && (
                <div className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
                  Could not load world map data.
                </div>
              )}
              {mapState.view === "us" && countyTopoError && (
                <div className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
                  Could not load US map data.
                </div>
              )}
              {mapState.view === "state" && !countyTopoError && (countyFeatures.length === 0 || !countyFitExtent) && (
                <div className="text-muted-foreground pointer-events-none absolute inset-0 flex items-center justify-center text-sm">
                  Select a state to drill into county-level data.
                </div>
              )}

              <div className="absolute right-3 bottom-3 flex flex-col gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Zoom in"
                  className="shadow-sm"
                  onClick={() => zoom.scale({ scaleX: 1.4, scaleY: 1.4 })}
                >
                  <Plus />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Zoom out"
                  className="shadow-sm"
                  onClick={() => zoom.scale({ scaleX: 1 / 1.4, scaleY: 1 / 1.4 })}
                >
                  <Minus />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Reset zoom"
                  className="shadow-sm"
                  onClick={() => zoom.reset()}
                >
                  <Maximize2 />
                </Button>
              </div>
            </>
          );
        }}
      </Zoom>
    </div>
  );
});
