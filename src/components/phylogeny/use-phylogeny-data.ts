"use client";

import { useQuery } from "@tanstack/react-query";

import { canonicalDatasetId } from "@/lib/phylogeny/nextstrain-dataset";
import {
  fetchBacterialTreeXml,
  fetchTreeXml,
  fetchViralFamilyBlock,
} from "@/lib/services/organisms/phylogeny";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function fetchNextstrainInventory(): Promise<Set<string>> {
  const response = await fetch("/api/phylogeny/nextstrain-datasets", {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Nextstrain inventory: ${String(response.status)}`);

  const value: unknown = await response.json();
  if (!isRecord(value) || !Array.isArray(value.ids)) {
    throw new Error("Nextstrain inventory has an invalid shape");
  }

  const ids = value.ids.map(id =>
    typeof id === "string" ? canonicalDatasetId(id) : null
  );
  if (ids.some(id => id === null)) {
    throw new Error("Nextstrain inventory contains an invalid identifier");
  }

  return new Set(ids as string[]);
}

export function useBacterialTreeXml(taxonId: number) {
  return useQuery({
    queryKey: ["phylogeny", "bacterial", taxonId],
    queryFn: () => fetchBacterialTreeXml(taxonId),
    staleTime: 60 * 60 * 1000,
  });
}

export function useViralFamily(taxonId: number) {
  return useQuery({
    queryKey: ["phylogeny", "viral-family", taxonId],
    queryFn: () => fetchViralFamilyBlock(taxonId),
    staleTime: 60 * 60 * 1000,
  });
}

export function useNextstrainInventory() {
  return useQuery({
    queryKey: ["phylogeny", "nextstrain-inventory"],
    queryFn: fetchNextstrainInventory,
    staleTime: 60 * 60 * 1000,
  });
}

export function useViralTreeXml(url: string | null) {
  return useQuery({
    queryKey: ["phylogeny", "viral-tree", url],
    queryFn: () => {
      if (!url) throw new Error("tree URL is required");
      return fetchTreeXml(url);
    },
    enabled: !!url,
    staleTime: 60 * 60 * 1000,
  });
}
