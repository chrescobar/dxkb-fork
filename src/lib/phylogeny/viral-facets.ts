import type { PhyloFamilyBlock, PhyloTreeRef } from "@/lib/services/organisms/phylogeny";

export type PhyloViewer = "archaeopteryx" | "nextstrain";

export interface ViralTreeChoice {
  groupKey: string;
  groupTitle: string;
  viewer: PhyloViewer;
  segment: string | null;
  ref: PhyloTreeRef;
}

export interface ViralFilters {
  strain: string | null;
  viewer: PhyloViewer | null;
  segments: Set<string>;
}

const segmentOrder = ["All", "PB2", "PB1", "PA", "HA", "NP", "NA", "M1", "NS1"];

export function parseSegment(name: string): string | null {
  if (!name) return null;
  if (/all\s+concat/i.test(name)) return "All";
  const match = /\(([^)]+)\)/.exec(name);
  return match ? match[1].split(/[,\s]+/)[0].trim() || null : null;
}

export function flattenViralTrees(block: PhyloFamilyBlock): ViralTreeChoice[] {
  const rank = new Map((block.order ?? []).map((key, index) => [key, index]));
  return [...block.groups]
    .sort((a, b) => (rank.get(a.key) ?? Number.MAX_SAFE_INTEGER) - (rank.get(b.key) ?? Number.MAX_SAFE_INTEGER))
    .flatMap(group => [
      ...(group.archaeopteryx ?? []).map(ref => ({
        groupKey: group.key,
        groupTitle: group.title,
        viewer: "archaeopteryx" as const,
        segment: parseSegment(ref.name),
        ref,
      })),
      ...(group.nextstrain ?? []).map(ref => ({
        groupKey: group.key,
        groupTitle: group.title,
        viewer: "nextstrain" as const,
        segment: parseSegment(ref.name),
        ref,
      })),
    ]);
}

export function filterViralTrees(trees: ViralTreeChoice[], filters: ViralFilters): ViralTreeChoice[] {
  return trees.filter(tree =>
    (!filters.strain || tree.groupKey === filters.strain) &&
    (!filters.viewer || tree.viewer === filters.viewer) &&
    (filters.segments.size === 0 || (!!tree.segment && filters.segments.has(tree.segment)))
  );
}

export function pruneViralFilters(trees: ViralTreeChoice[], filters: ViralFilters): ViralFilters {
  const strain = filters.strain && trees.some(tree => tree.groupKey === filters.strain)
    ? filters.strain
    : null;
  const strainTrees = trees.filter(tree => !strain || tree.groupKey === strain);
  const viewer = filters.viewer && strainTrees.some(tree => tree.viewer === filters.viewer)
    ? filters.viewer
    : null;
  const relevant = strainTrees.filter(tree => !viewer || tree.viewer === viewer);
  const validSegments = new Set(relevant.map(tree => tree.segment).filter((value): value is string => !!value));
  return {
    strain,
    viewer,
    segments: new Set([...filters.segments].filter(segment => validSegments.has(segment))),
  };
}

/**
 * Counts for each facet option, cascading strain -> viewer -> segment to match
 * pruneViralFilters. A zero count means the option is a dead end and should be
 * disabled. Strain is intentionally counted against every tree so choosing a
 * viewer can never lock a strain out — the cascade relaxes the viewer instead.
 */
export function viralFacetCounts(trees: ViralTreeChoice[], filters: ViralFilters) {
  const strainTrees = trees.filter(tree => !filters.strain || tree.groupKey === filters.strain);
  const viewerTrees = strainTrees.filter(tree => !filters.viewer || tree.viewer === filters.viewer);
  return {
    allStrains: trees.length,
    allViewers: strainTrees.length,
    strain: (key: string) => trees.filter(tree => tree.groupKey === key).length,
    viewer: (value: PhyloViewer) => strainTrees.filter(tree => tree.viewer === value).length,
    segment: (segment: string) => viewerTrees.filter(tree => tree.segment === segment).length,
  };
}

export function sortedSegments(trees: ViralTreeChoice[]): string[] {
  return [...new Set(trees.map(tree => tree.segment).filter((value): value is string => !!value))]
    .sort((a, b) => {
      const left = segmentOrder.indexOf(a);
      const right = segmentOrder.indexOf(b);
      if (left === -1 && right === -1) return a.localeCompare(b);
      if (left === -1) return 1;
      if (right === -1) return -1;
      return left - right;
    });
}
