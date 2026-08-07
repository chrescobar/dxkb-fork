"use client";

import { useQuery } from "@tanstack/react-query";

import {
  fetchBacterialTreeXml,
  fetchNextstrainInventory,
  fetchTreeXml,
  fetchViralFamilyBlock,
} from "@/lib/services/organisms/phylogeny";

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
