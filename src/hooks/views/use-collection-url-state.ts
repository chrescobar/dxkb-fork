"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type {
  CollectionState,
  CollectionStateOptions,
} from "@/lib/views/collection-state";
import {
  canonicalizeCollectionSearchParams,
  parseCollectionState,
  serializeCollectionState,
} from "@/lib/views/collection-state";
import type { SearchParamsRecord } from "@/lib/views/rql";

function searchParamsRecord(params: URLSearchParams): SearchParamsRecord {
  const result: SearchParamsRecord = {};
  for (const key of new Set(params.keys())) {
    const selected = params.getAll(key);
    result[key] = selected.length === 1 ? selected[0] : selected;
  }
  return result;
}

export function useCollectionUrlState<Sort extends string>(
  options: CollectionStateOptions<Sort>,
): [CollectionState<Sort>, (state: CollectionState<Sort>) => void] {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const current = searchParamsRecord(
    new URLSearchParams(searchParams.toString()),
  );
  const state = parseCollectionState(current, options);

  const setState = (next: CollectionState<Sort>) => {
    const collectionParams = serializeCollectionState(next, options);
    const merged = new URLSearchParams(searchParams.toString());
    for (const name of [
      "keyword",
      "refine",
      "rql",
      "page",
      "sort",
      ...(options.friendlyFilters ?? []),
    ]) {
      merged.delete(name);
    }
    collectionParams.forEach((value, name) => {
      merged.append(name, value);
    });
    router.push(merged.size ? `${pathname}?${merged}` : pathname, {
      scroll: false,
    });
  };

  const canonical = canonicalizeCollectionSearchParams(current, options);
  const canonicalSearch = canonical.toString();
  const currentSearch = searchParams.toString();
  useEffect(() => {
    if (canonicalSearch !== currentSearch) {
      router.replace(
        canonicalSearch ? `${pathname}?${canonicalSearch}` : pathname,
        {
          scroll: false,
        },
      );
    }
  }, [canonicalSearch, currentSearch, pathname, router]);

  return [state, setState];
}
