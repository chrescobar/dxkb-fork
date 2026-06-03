"use client";

import { AlbersUsa, CustomProjection, NaturalEarth } from "@visx/geo";
import { geoMercator } from "@visx/vendor/d3-geo";
import { Zoom } from "@visx/zoom";
import { Maximize2, Minus, Plus } from "lucide-react";
import {
  forwardRef,
  useCallback,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
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
  onHoverChange: (
    payload: HoverPayload | null,
    event: ReactPointerEvent<SVGPathElement>,
  ) => void;
  onLeaveMap: () => void;
}

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

const mapHeight = 480;
const padding = 16;

function featureName(feature: NamedFeatureProps | undefined): string {
  if (!feature) return "";
  return feature.name ?? feature.NAME ?? "";
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
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  const zoomImperativeRef = useRef<{
    reset: () => void;
    scale: (args: { scaleX: number; scaleY: number }) => void;
  } | null>(null);

  // ResizeObserver via callback ref so we attach exactly once
  const setContainer = useCallback((node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect?.width;
      if (next && next > 0) setWidth(next);
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

  const countyProjection = useCallback(() => {
    return geoMercator();
  }, []);

  const countyFitExtent = useMemo<
    [[number, number], [number, number]] | null
  >(() => {
    if (countyFeatures.length === 0) return null;
    return [
      [padding, padding],
      [Math.max(width - padding, padding + 1), mapHeight - padding],
    ];
  }, [countyFeatures.length, width]);

  const renderBody = () => {
    if (mapState.view === "world") {
      if (worldTopoLoading) {
        return (
          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
            Loading world map…
          </div>
        );
      }
      if (worldTopoError) {
        return (
          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
            Could not load world map data.
          </div>
        );
      }
      if (countryFeatures.length === 0) return null;
      return (
        <NaturalEarth<CountryFeature>
          data={countryFeatures}
          scale={width / 6.3}
          translate={[width / 2, mapHeight / 2 + 30]}
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
                  stroke="var(--border)"
                  strokeWidth={0.4}
                  style={{ cursor: interactable ? "pointer" : "default" }}
                  onPointerMove={(event) =>
                    onHoverChange(
                      {
                        view: "world",
                        name,
                        count,
                        genera: meta?.genera ?? {},
                        hosts: meta?.hosts ?? {},
                      },
                      event,
                    )
                  }
                  onPointerLeave={() => onHoverChange(null, {} as ReactPointerEvent<SVGPathElement>)}
                  onClick={() => {
                    if (interactable) onSwitchToUs();
                  }}
                />
              );
            })
          }
        </NaturalEarth>
      );
    }

    if (mapState.view === "us") {
      if (countyTopoError) {
        return (
          <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
            Could not load US map data.
          </div>
        );
      }
      if (stateFeatures.length === 0) return null;
      return (
        <AlbersUsa<StateFeature>
          data={stateFeatures}
          scale={width * 1.2}
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
                  stroke="var(--border)"
                  strokeWidth={0.5}
                  style={{ cursor: "pointer" }}
                  onPointerMove={(event) =>
                    onHoverChange(
                      {
                        view: "us",
                        name,
                        count,
                        genera: meta?.genera ?? {},
                        hosts: meta?.hosts ?? {},
                      },
                      event,
                    )
                  }
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
    }

    // state view
    if (countyTopoError) {
      return (
        <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
          Could not load US map data.
        </div>
      );
    }
    if (countyFeatures.length === 0 || !countyFitExtent) {
      return (
        <div className="text-muted-foreground absolute inset-0 flex items-center justify-center text-sm">
          Select a state to drill into county-level data.
        </div>
      );
    }
    return (
      <CustomProjection<CountyFeature>
        data={countyFeatures}
        projection={countyProjection}
        fitExtent={[countyFitExtent, { type: "FeatureCollection", features: countyFeatures } as never]}
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
                stroke="var(--border)"
                strokeWidth={0.3}
                onPointerMove={(event) =>
                  onHoverChange(
                    {
                      view: "state",
                      name,
                      count,
                      genera: meta?.genera ?? {},
                      hosts: meta?.hosts ?? {},
                    },
                    event,
                  )
                }
                onPointerLeave={() => onHoverChange(null, {} as ReactPointerEvent<SVGPathElement>)}
              />
            );
          })
        }
      </CustomProjection>
    );
  };

  return (
    <div
      ref={setContainer}
      className="bg-muted/30 relative w-full overflow-hidden rounded-md"
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
          zoomImperativeRef.current = {
            reset: zoom.reset,
            scale: zoom.scale,
          };
          return (
            <>
              <svg
                width={width}
                height={mapHeight}
                ref={zoom.containerRef}
                role="img"
                aria-label="Genome distribution map"
                style={{ cursor: zoom.isDragging ? "grabbing" : "grab", touchAction: "none" }}
                onWheel={(event) => {
                  event.preventDefault();
                  const next = event.deltaY < 0 ? 1.15 : 1 / 1.15;
                  zoom.scale({ scaleX: next, scaleY: next });
                }}
              >
                <g transform={zoom.toString()}>{renderBody()}</g>
              </svg>
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
