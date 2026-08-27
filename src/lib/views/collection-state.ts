import { rqlAnd, rqlEq, type SearchParamsRecord } from "./rql";

export interface CollectionStateOptions<Sort extends string = string> {
  defaultSort: Sort;
  sortAllowlist: readonly Sort[];
  friendlyFilters?: readonly string[];
  filterFieldMap?: Readonly<Record<string, string>>;
}

export interface CollectionState<Sort extends string = string> {
  keyword?: string;
  rql?: string;
  filters: Record<string, string[]>;
  page: number;
  sort: Sort;
}

export interface CollectionStateUpdate<Sort extends string = string> {
  keyword?: string | null;
  rql?: string | null;
  filters?: Readonly<Record<string, readonly string[] | null | undefined>>;
  page?: number;
  sort?: Sort;
}

const managedParams = new Set(["keyword", "rql", "page", "sort"]);

function optionalValue(
  params: SearchParamsRecord,
  name: string,
  rejectRepeated = false,
): string | undefined {
  const value = params[name];
  if (Array.isArray(value)) {
    if (rejectRepeated && value.length > 1) {
      throw new Error(`Repeated collection parameter: ${name}`);
    }
    return value[0] || undefined;
  }
  return value || undefined;
}

function values(params: SearchParamsRecord, name: string): string[] {
  const value = params[name];
  return [
    ...new Set(
      (Array.isArray(value) ? value : value ? [value] : []).filter(Boolean),
    ),
  ];
}

function parsePage(params: SearchParamsRecord): number {
  const rawPage = optionalValue(params, "page", true);
  if (rawPage === undefined) return 1;
  if (!/^[1-9]\d*$/.test(rawPage)) {
    throw new Error(`Invalid collection page: ${rawPage}`);
  }
  const page = Number(rawPage);
  if (!Number.isSafeInteger(page)) {
    throw new Error(`Invalid collection page: ${rawPage}`);
  }
  return page;
}

function validateSort<Sort extends string>(
  sort: string,
  options: CollectionStateOptions<Sort>,
): Sort {
  if (!options.sortAllowlist.includes(sort as Sort)) {
    throw new Error(`Invalid collection sort: ${sort}`);
  }
  return sort as Sort;
}

/** Parse and validate the URL-owned portion of collection state. */
export function parseCollectionState<Sort extends string>(
  params: SearchParamsRecord,
  options: CollectionStateOptions<Sort>,
): CollectionState<Sort> {
  const keyword = optionalValue(params, "keyword");
  const rql = optionalValue(params, "rql");
  const rawSort = optionalValue(params, "sort", true);
  const sort = validateSort(rawSort ?? options.defaultSort, options);
  const filters: Record<string, string[]> = {};

  // An explicit structural expression is authoritative. Keyword is deliberately
  // independent and may still be combined with it by the collection query.
  if (rql === undefined) {
    for (const name of options.friendlyFilters ?? []) {
      const selected = values(params, name);
      if (selected.length > 0) filters[name] = selected;
    }
  }

  return { keyword, rql, filters, page: parsePage(params), sort };
}

/** Validate a programmatic state and remove values omitted by the URL schema. */
export function canonicalizeCollectionState<Sort extends string>(
  state: CollectionState<Sort>,
  options: CollectionStateOptions<Sort>,
): CollectionState<Sort> {
  if (!Number.isSafeInteger(state.page) || state.page < 1) {
    throw new Error(`Invalid collection page: ${String(state.page)}`);
  }
  const sort = validateSort(state.sort, options);
  const keyword = state.keyword || undefined;
  const rql = state.rql || undefined;
  const filters: Record<string, string[]> = {};

  if (rql === undefined) {
    for (const name of options.friendlyFilters ?? []) {
      const selected = [...new Set(state.filters[name] ?? [])].filter(Boolean);
      if (selected.length > 0) filters[name] = selected;
    }
  }

  return { keyword, rql, filters, page: state.page, sort };
}

/** Serialize only canonical collection parameters in stable schema order. */
export function serializeCollectionState<Sort extends string>(
  state: CollectionState<Sort>,
  options: CollectionStateOptions<Sort>,
): URLSearchParams {
  const canonical = canonicalizeCollectionState(state, options);
  const params = new URLSearchParams();
  if (canonical.keyword !== undefined) params.set("keyword", canonical.keyword);
  if (canonical.rql !== undefined) {
    params.set("rql", canonical.rql);
  } else {
    for (const [name, selected] of Object.entries(canonical.filters)) {
      for (const value of selected) params.append(name, value);
    }
  }
  if (canonical.page !== 1) params.set("page", String(canonical.page));
  if (canonical.sort !== options.defaultSort)
    params.set("sort", canonical.sort);
  return params;
}

/** Resolve structural filters to backend RQL without folding in keyword search. */
export function collectionStateToRql<Sort extends string>(
  state: CollectionState<Sort>,
  options: CollectionStateOptions<Sort>,
): string {
  const canonical = canonicalizeCollectionState(state, options);
  if (canonical.rql !== undefined) return canonical.rql;
  const clauses = Object.entries(canonical.filters).map(([name, selected]) => {
    const field = options.filterFieldMap?.[name] ?? name;
    const predicates = selected.map((value) => rqlEq(field, value));
    return predicates.length === 1
      ? predicates[0]
      : `or(${predicates.join(",")})`;
  });
  return clauses.length === 0 ? "" : rqlAnd(...clauses);
}

/** Canonicalize managed parameters while retaining unrelated URL state. */
export function canonicalizeCollectionSearchParams<Sort extends string>(
  params: SearchParamsRecord,
  options: CollectionStateOptions<Sort>,
): URLSearchParams {
  return mergeWithUnrelatedParams(
    params,
    serializeCollectionState(parseCollectionState(params, options), options),
    options,
  );
}

/** Apply a collection-state update, resetting pagination when query shape changes. */
export function updateCollectionSearchParams<Sort extends string>(
  params: SearchParamsRecord,
  update: CollectionStateUpdate<Sort>,
  options: CollectionStateOptions<Sort>,
): URLSearchParams {
  const current = parseCollectionState(params, options);
  const filterUpdates = update.filters ?? {};
  const filters = Object.fromEntries(
    [...Object.keys(current.filters), ...Object.keys(filterUpdates)].flatMap(
      (name) => {
        const value =
          name in filterUpdates ? filterUpdates[name] : current.filters[name];
        return value?.length ? [[name, [...value]]] : [];
      },
    ),
  );
  const next: CollectionState<Sort> = {
    ...current,
    keyword:
      update.keyword === null ? undefined : (update.keyword ?? current.keyword),
    rql: update.rql === null ? undefined : (update.rql ?? current.rql),
    filters,
    page: update.page ?? current.page,
    sort: update.sort ?? current.sort,
  };
  const canonicalNext = canonicalizeCollectionState(next, options);
  const queryChanged =
    current.keyword !== canonicalNext.keyword ||
    current.rql !== canonicalNext.rql ||
    current.sort !== canonicalNext.sort ||
    !sameFilters(current.filters, canonicalNext.filters);
  if (queryChanged) canonicalNext.page = 1;

  return mergeWithUnrelatedParams(
    params,
    serializeCollectionState(canonicalNext, options),
    options,
  );
}

function sameFilters(
  left: Record<string, string[]>,
  right: Record<string, string[]>,
): boolean {
  const leftEntries = Object.entries(left);
  return (
    leftEntries.length === Object.keys(right).length &&
    leftEntries.every(([name, value]) => {
      if (!Object.hasOwn(right, name)) return false;
      const other = right[name];
      return (
        value.length === other.length &&
        value.every((item, index) => other[index] === item)
      );
    })
  );
}

function mergeWithUnrelatedParams<Sort extends string>(
  source: SearchParamsRecord,
  collectionParams: URLSearchParams,
  options: CollectionStateOptions<Sort>,
): URLSearchParams {
  const result = new URLSearchParams();
  const managed = new Set([
    ...managedParams,
    ...(options.friendlyFilters ?? []),
  ]);
  for (const [name, value] of Object.entries(source)) {
    if (managed.has(name) || value === undefined) continue;
    for (const item of Array.isArray(value) ? value : [value])
      result.append(name, item);
  }
  collectionParams.forEach((value, name) => {
    result.append(name, value);
  });
  return result;
}
