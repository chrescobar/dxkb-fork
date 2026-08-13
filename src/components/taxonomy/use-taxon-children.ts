"use client";

import { useQuery } from "@tanstack/react-query";

import { parseContentRangeTotal, type TaxonRecord } from "./taxon-tree-types";

// One request per node, even for huge levels. The Data API returns 36k children
// in a single ~2.5s response (4.4 MB), whereas N sequential smaller pages cost N×
// that. Sized above the largest real taxon level (H1N1 subtype ≈ 35.9k) so the
// paging loop below never runs in practice — it stays only as a safety net.
const pageSize = 50000;

// ponytail: dot notation required — Next.js only inlines NEXT_PUBLIC_ vars at
// static call sites; bracket notation (e.g. getRequiredEnv) breaks client bundles.
const taxonomyBaseHeaders = {
  "Content-type": "application/rqlquery+x-www-form-urlencoded",
  Accept: "application/json",
};

function taxonomyEndpoint(query: string): string {
  const dataApi = process.env.NEXT_PUBLIC_DATA_API;
  if (!dataApi)
    throw new Error(
      "NEXT_PUBLIC_DATA_API environment variable is not configured",
    );
  return `${dataApi}/taxonomy/?${query}`;
}

/** React Query key for a node's children — shared by the single hook and the tree's useQueries. */
export function taxonChildrenKey(parentId: number) {
  return ["taxon-children", parentId] as const;
}

/**
 * Fetch ALL children of a taxon node, paging the Range header until the
 * Content-Range total is reached. Mirrors the legacy taxontree call:
 *   and(gt(genomes,1),eq(parent_id,ID))&sort(+taxon_name)
 * The gt(genomes,1) filter is replicated verbatim for byte-parity with legacy
 * (SOLR returns some genomes:1 strain rows anyway — that quirk is intentional).
 */
export async function fetchTaxonChildren(
  parentId: number,
): Promise<TaxonRecord[]> {
  const query = `and(gt(genomes,1),eq(parent_id,${String(parentId)}))&sort(+taxon_name)`;
  const url = taxonomyEndpoint(query);

  const rows: TaxonRecord[] = [];
  let start = 0;
  let total = Infinity;
  while (start < total) {
    const end = start + pageSize - 1;
    const res = await fetch(url, {
      headers: {
        ...taxonomyBaseHeaders,
        Range: `items=${String(start)}-${String(end)}`,
        "X-Range": `items=${String(start)}-${String(end)}`,
      },
    });
    if (!res.ok) {
      throw new Error(
        `taxonomy children ${String(parentId)}: ${String(res.status)} ${res.statusText}`,
      );
    }
    // No Content-Range → trust this single page and stop (total = prior count).
    total =
      parseContentRangeTotal(res.headers.get("Content-Range")) ?? rows.length;
    const page = (await res.json()) as TaxonRecord[];
    rows.push(...page);
    if (page.length === 0) break; // safety: stop if a page comes back empty
    start = rows.length;
  }
  return rows;
}

/** React Query key for a batch of nodes' child counts. Sorted so key is order-independent. */
export function taxonChildCountsKey(ids: number[]) {
  return [
    "taxon-child-counts",
    [...ids].sort((a, b) => a - b).join(","),
  ] as const;
}

/**
 * Child counts for many parents in ONE request via SOLR faceting. The Data API
 * exposes the counts in a `facet_counts` response header (CORS-exposed), so a
 * single Range:0-0 request answers "which of these nodes have sub-taxa, and how
 * many" — replacing the per-node prefetch fan-out that caused table lag. Uses the
 * same gt(genomes,1) filter as fetchTaxonChildren so counts match what expand shows.
 * Parents with 0 qualifying children are absent from the map (→ no expand arrow).
 */
export async function fetchTaxonChildCounts(
  parentIds: number[],
): Promise<Map<number, number>> {
  const counts = new Map<number, number>();
  if (parentIds.length === 0) return counts;

  const idList = parentIds.join(",");
  const query = `and(gt(genomes,1),in(parent_id,(${idList})))&facet((field,parent_id),(mincount,1))&limit(1)`;
  const res = await fetch(taxonomyEndpoint(query), {
    headers: {
      ...taxonomyBaseHeaders,
      Range: "items=0-0",
      "X-Range": "items=0-0",
    },
  });
  if (!res.ok) {
    throw new Error(
      `taxonomy child counts: ${String(res.status)} ${res.statusText}`,
    );
  }

  // Header: {"facet_fields":{"parent_id":["11320",138,"2955291",1]}} — a flat
  // [id, count, id, count, …] array. This response controls whether nodes are
  // interactive, so malformed data must fail rather than silently turn branches into leaves.
  const header = res.headers.get("facet_counts");
  if (!header) {
    throw new Error("taxonomy child counts: missing facet_counts header");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(header);
  } catch {
    throw new Error("taxonomy child counts: invalid facet_counts JSON");
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error("taxonomy child counts: missing facet_fields.parent_id");
  }
  const facetFields = (parsed as { facet_fields?: unknown }).facet_fields;
  if (typeof facetFields !== "object" || facetFields === null) {
    throw new Error("taxonomy child counts: missing facet_fields.parent_id");
  }
  const flat: unknown = (facetFields as { parent_id?: unknown }).parent_id;
  if (!Array.isArray(flat)) {
    throw new Error("taxonomy child counts: missing facet_fields.parent_id");
  }
  if (flat.length % 2 !== 0) {
    throw new Error("taxonomy child counts: expected parent/count pairs");
  }

  const values: unknown[] = flat;
  const requestedIds = new Set(parentIds);
  for (let index = 0; index < values.length; index += 2) {
    const rawParentId: unknown = values[index];
    const rawCount: unknown = values[index + 1];
    const parentId =
      (typeof rawParentId === "string" || typeof rawParentId === "number") &&
      String(rawParentId).trim() !== ""
        ? Number(rawParentId)
        : NaN;
    const count =
      (typeof rawCount === "string" || typeof rawCount === "number") &&
      String(rawCount).trim() !== ""
        ? Number(rawCount)
        : NaN;
    if (!Number.isInteger(parentId) || parentId <= 0) {
      throw new Error(
        `taxonomy child counts: invalid parent id ${String(rawParentId)}`,
      );
    }
    if (!Number.isInteger(count) || count < 0) {
      throw new Error(
        `taxonomy child counts: invalid child count ${String(rawCount)}`,
      );
    }
    if (!requestedIds.has(parentId)) {
      throw new Error(
        `taxonomy child counts: unexpected parent id ${String(parentId)}`,
      );
    }
    if (counts.has(parentId)) {
      throw new Error(
        `taxonomy child counts: duplicate parent id ${String(parentId)}`,
      );
    }
    counts.set(parentId, count);
  }
  return counts;
}

/** Batch child counts for the currently-visible collapsed nodes. Drives expand arrows. */
export function useTaxonChildCounts(ids: number[]) {
  return useQuery<Map<number, number>>({
    queryKey: taxonChildCountsKey(ids),
    enabled: ids.length > 0,
    staleTime: Infinity,
    queryFn: () => fetchTaxonChildCounts(ids),
  });
}
