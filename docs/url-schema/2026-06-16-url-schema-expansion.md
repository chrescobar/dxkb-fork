# URL Schema Expansion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the legacy BV-BRC `/view/{ViewType}/...#view_tab=` URL scheme with a consistent `dxkb.org/{segment}[/{id}]?tab=` schema across all view types, plus the App Router routing skeleton, a data-driven view registry, and redirects.

**Architecture:** 20 legacy view types collapse to 10 lowercase-kebab route segments (bare segment = list, `+id` = singular). A data-only `viewRegistry` is the single enumerable source of truth; thin per-folder page handlers delegate to shared `renderListShell` / `renderSingularShell`. List queries accept friendly named params plus a `?rql=` escape hatch, translated to RQL. Redirects run in `src/proxy.ts` (Next 16 middleware) for path/query, with a client `LegacyHashAdapter` for the hash→`?tab=` stage.

**Tech Stack:** Next.js 16 (App Router, RSC), TypeScript, Vitest 4 + jsdom, Testing Library, Tailwind v4, existing `OrganismLandingShell`.

**Design spec:** `docs/url-schema/2026-06-16-url-schema-design.md`
**Legacy reference:** `docs/url-schema/bvbrc-view-types-url-parameters.md`

---

## File Structure

**New files (logic — `src/lib/views/`):**
- `view-types.ts` — `ViewTypeEntry`, `SingularSpec`, `ListSpec` types + `isViewSegment` guard.
- `view-registry.ts` — the 10-entry `viewRegistry` table + derived helpers (`viewSegments`, `legacyToSegment`).
- `rql.ts` — `friendlyParamsToRql()`, `resolveListQuery()` (friendly + `?rql=` precedence).
- `tab.ts` — `resolveTab()` (validate `?tab=` against a type's tabs, else default).
- `legacy-redirect.ts` — `mapLegacyViewPath()` (pure: legacy `/view/*` URL parts → new path/query).
- `render-list.tsx` — `renderListShell(entry, searchParams)`.
- `render-singular.tsx` — `renderSingularShell(entry, id, searchParams)`.
- `legacy-hash-adapter.tsx` — client component, hash `#view_tab=`→`?tab=`.
- `placeholder-list.tsx` — shared placeholder grid for list views (skeleton stage).

**New route folders (`src/app/(views)/`):** one `page.tsx` per segment; `[idParam]/page.tsx` for the 6 with singulars. Full matrix in Task 13.

**Modified files:**
- `src/proxy.ts` + `src/__tests__/proxy.test.ts` — add `(views)` `view`→`tab` redirect and legacy `/view/*` redirect; extend matcher.
- `src/app/(views)/taxonomy/[taxonId]/page.tsx` + test — migrate `view`→`tab`, route via registry.
- `src/components/organisms/landing-shell/landing-shell-client.tsx` + test — `view`→`tab` param.
- `src/app/(views)/layout.tsx` — mount `LegacyHashAdapter`. **Note:** this layout does not exist yet (only `taxonomy/layout.tsx` does); Task 12 creates it.
- `src/app/organisms/all/page.tsx`, `src/app/organisms/bacteria/page.tsx`, `src/app/organisms/viruses/page.tsx` — `view`→`tab` param read.

---

## Conventions for every task

- Run a single test file: `pnpm test -- <path>` (Vitest). Run all: `pnpm test`.
- Before any commit in a task: `pnpm lint && pnpm typecheck` must pass.
- `camelCase` for all constants (project rule). No `eslint-disable`.
- Commit messages follow Conventional Commits.
- Do NOT push or open PRs (project rule: changes reviewed manually).

---

## Task 1: View type definitions

**Files:**
- Create: `src/lib/views/view-types.ts`
- Test: `src/lib/views/__tests__/view-types.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/views/__tests__/view-types.test.ts
import { isViewSegment, type ViewRegistry } from "../view-types";

// Inline fixture so this task has no dependency on view-registry.ts (created in Task 2).
const fixture = {
  genome: {
    segment: "genome",
    label: "Genome",
    list: { endpoint: "genome", defaultTab: "genomes", friendlyParams: ["keyword"] },
  },
} satisfies ViewRegistry;

describe("isViewSegment", () => {
  it("returns true for a real segment", () => {
    expect(isViewSegment("genome", fixture)).toBe(true);
  });
  it("returns false for an unknown segment", () => {
    expect(isViewSegment("not-a-view", fixture)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/views/__tests__/view-types.test.ts`
Expected: FAIL — cannot find module `../view-types`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/views/view-types.ts

/** How a singular entity id is validated before fetch. "none" = id-less (protein-structure). */
export type IdKind = "int" | "string" | "none";

export interface SingularSpec {
  /** Dynamic route folder name, e.g. "genomeId" → app/(views)/genome/[genomeId]. */
  idParam: string;
  idKind: IdKind;
  /** Tab used when ?tab= is absent. */
  defaultTab: string;
}

export interface ListSpec {
  /** BV-BRC data endpoint name, e.g. "genome". */
  endpoint: string;
  /** Tab used when ?tab= is absent (differs from singular default per legacy doc). */
  defaultTab: string;
  /** Friendly query param names accepted and translated to RQL. */
  friendlyParams: readonly string[];
}

export interface ViewTypeEntry {
  /** Route folder + URL identity (lowercase kebab). */
  segment: string;
  label: string;
  /** Legacy BV-BRC singular view name, e.g. "Genome" (redirect source). */
  legacySingular?: string;
  /** Legacy BV-BRC list view name, e.g. "GenomeList" (redirect source). */
  legacyList?: string;
  /** searchtype id from constants/searchInfo.ts (for the deferred search repoint). */
  searchType?: string;
  /** Omitted ⇒ list-only type (strain, domains-and-motifs, experiment). */
  singular?: SingularSpec;
  list: ListSpec;
}

export type ViewRegistry = Record<string, ViewTypeEntry>;

export function isViewSegment(value: string, registry: ViewRegistry): boolean {
  return Object.prototype.hasOwnProperty.call(registry, value);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/views/__tests__/view-types.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/views/view-types.ts src/lib/views/__tests__/view-types.test.ts
git commit -m "feat(views): add view type definitions and segment guard"
```

---

## Task 2: The view registry (the 10-entry table)

**Files:**
- Create: `src/lib/views/view-registry.ts`
- Test: `src/lib/views/__tests__/view-registry.test.ts`

Default tabs are taken from `docs/url-schema/bvbrc-view-types-url-parameters.md` (singular default `overview`; list defaults per type).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/views/__tests__/view-registry.test.ts
import { viewRegistry, viewSegments, legacyToSegment } from "../view-registry";

describe("viewRegistry", () => {
  it("has exactly 10 segments", () => {
    expect(viewSegments).toHaveLength(10);
  });

  it("keys each entry by its own segment", () => {
    for (const [key, entry] of Object.entries(viewRegistry)) {
      expect(entry.segment).toBe(key);
    }
  });

  it("marks strain, domains-and-motifs, experiment as list-only (no singular)", () => {
    expect(viewRegistry.strain.singular).toBeUndefined();
    expect(viewRegistry["domains-and-motifs"].singular).toBeUndefined();
    expect(viewRegistry.experiment.singular).toBeUndefined();
  });

  it("gives protein-structure an id-less singular", () => {
    expect(viewRegistry["protein-structure"].singular?.idKind).toBe("none");
  });

  it("uses int id kind for taxonomy", () => {
    expect(viewRegistry.taxonomy.singular?.idKind).toBe("int");
  });

  it("maps every legacy name to a unique existing segment", () => {
    const names = Object.values(viewRegistry).flatMap((e) =>
      [e.legacySingular, e.legacyList].filter(Boolean) as string[],
    );
    expect(new Set(names).size).toBe(names.length); // unique
    for (const name of names) {
      expect(legacyToSegment[name]).toBeDefined();
      expect(viewRegistry[legacyToSegment[name]]).toBeDefined();
    }
  });

  it("reverse-maps a known legacy name", () => {
    expect(legacyToSegment.GenomeList).toBe("genome");
    expect(legacyToSegment.Taxonomy).toBe("taxonomy");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/views/__tests__/view-registry.test.ts`
Expected: FAIL — cannot find module `../view-registry`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/views/view-registry.ts
import type { ViewRegistry, ViewTypeEntry } from "./view-types";

export const viewRegistry = {
  taxonomy: {
    segment: "taxonomy",
    label: "Taxonomy",
    legacySingular: "Taxonomy",
    legacyList: "TaxonList",
    searchType: "taxonomy",
    singular: { idParam: "taxonId", idKind: "int", defaultTab: "overview" },
    list: { endpoint: "taxonomy", defaultTab: "taxons", friendlyParams: ["keyword", "taxon_id"] },
  },
  genome: {
    segment: "genome",
    label: "Genome",
    legacySingular: "Genome",
    legacyList: "GenomeList",
    searchType: "genome",
    singular: { idParam: "genomeId", idKind: "string", defaultTab: "overview" },
    list: { endpoint: "genome", defaultTab: "genomes", friendlyParams: ["keyword", "taxon_id"] },
  },
  feature: {
    segment: "feature",
    label: "Feature",
    legacySingular: "Feature",
    legacyList: "FeatureList",
    searchType: "genome_feature",
    singular: { idParam: "featureId", idKind: "string", defaultTab: "overview" },
    list: { endpoint: "genome_feature", defaultTab: "overview", friendlyParams: ["keyword", "genome_id"] },
  },
  epitope: {
    segment: "epitope",
    label: "Epitope",
    legacySingular: "Epitope",
    legacyList: "EpitopeList",
    searchType: "epitope",
    singular: { idParam: "epitopeId", idKind: "string", defaultTab: "overview" },
    list: { endpoint: "epitope", defaultTab: "epitope", friendlyParams: ["keyword", "taxon_id"] },
  },
  surveillance: {
    segment: "surveillance",
    label: "Surveillance",
    legacySingular: "Surveillance",
    legacyList: "SurveillanceList",
    searchType: "surveillance",
    singular: { idParam: "sampleId", idKind: "string", defaultTab: "overview" },
    list: { endpoint: "surveillance", defaultTab: "surveillance", friendlyParams: ["keyword", "pathogen_test_type"] },
  },
  serology: {
    segment: "serology",
    label: "Serology",
    legacySingular: "Serology",
    legacyList: "SerologyList",
    searchType: "serology",
    singular: { idParam: "sampleId", idKind: "string", defaultTab: "overview" },
    list: { endpoint: "serology", defaultTab: "serology", friendlyParams: ["keyword", "test_type"] },
  },
  strain: {
    segment: "strain",
    label: "Strain",
    legacyList: "StrainList",
    searchType: "strain",
    list: { endpoint: "strain", defaultTab: "strain", friendlyParams: ["keyword", "taxon_id"] },
  },
  "domains-and-motifs": {
    segment: "domains-and-motifs",
    label: "Domains and Motifs",
    legacyList: "DomainsAndMotifsList",
    searchType: "protein_feature",
    list: { endpoint: "protein_feature", defaultTab: "proteinFeatures", friendlyParams: ["keyword", "genome_id"] },
  },
  "protein-structure": {
    segment: "protein-structure",
    label: "Protein Structures",
    legacySingular: "ProteinStructure",
    legacyList: "ProteinStructureList",
    searchType: "protein_structure",
    singular: { idParam: "accession", idKind: "none", defaultTab: "overview" },
    list: { endpoint: "protein_structure", defaultTab: "structures", friendlyParams: ["keyword", "taxon_id"] },
  },
  experiment: {
    segment: "experiment",
    label: "Experiment",
    legacyList: "ExperimentList",
    searchType: "experiment",
    list: { endpoint: "experiment", defaultTab: "experiments", friendlyParams: ["keyword", "taxon_id"] },
  },
} satisfies ViewRegistry;

export const viewSegments = Object.keys(viewRegistry);

/** Legacy BV-BRC view name → new segment. Derived so it cannot drift from routes. */
export const legacyToSegment: Record<string, string> = Object.fromEntries(
  Object.values(viewRegistry as ViewRegistry).flatMap((entry: ViewTypeEntry) =>
    [entry.legacySingular, entry.legacyList]
      .filter((name): name is string => Boolean(name))
      .map((name) => [name, entry.segment]),
  ),
);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/views/__tests__/view-registry.test.ts`
Expected: PASS (all 7 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/views/view-registry.ts src/lib/views/__tests__/view-registry.test.ts
git commit -m "feat(views): add data-only view registry with legacy reverse-map"
```

---

## Task 3: RQL query translation

**Files:**
- Create: `src/lib/views/rql.ts`
- Test: `src/lib/views/__tests__/rql.test.ts`

`resolveListQuery` takes the URL search params object Next gives a page (`Record<string, string | string[] | undefined>`) plus the type's `friendlyParams`, and returns a single RQL string (or empty string). Precedence: explicit `?rql=` wins; else compose allowed friendly params with `and(...)`.

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/views/__tests__/rql.test.ts
import { friendlyParamsToRql, resolveListQuery } from "../rql";

describe("friendlyParamsToRql", () => {
  it("maps keyword to keyword()", () => {
    expect(friendlyParamsToRql({ keyword: "influenza" }, ["keyword"])).toBe("keyword(influenza)");
  });
  it("maps a scalar field to eq()", () => {
    expect(friendlyParamsToRql({ taxon_id: "1763" }, ["taxon_id"])).toBe("eq(taxon_id,1763)");
  });
  it("composes multiple params with and()", () => {
    const out = friendlyParamsToRql({ keyword: "flu", taxon_id: "1763" }, ["keyword", "taxon_id"]);
    expect(out).toBe("and(keyword(flu),eq(taxon_id,1763))");
  });
  it("ignores params not in the allow-list", () => {
    expect(friendlyParamsToRql({ evil: "x", keyword: "flu" }, ["keyword"])).toBe("keyword(flu)");
  });
  it("returns empty string when nothing matches", () => {
    expect(friendlyParamsToRql({}, ["keyword"])).toBe("");
  });
});

describe("resolveListQuery", () => {
  it("prefers explicit rql over friendly params", () => {
    const out = resolveListQuery({ rql: "eq(public,false)", keyword: "flu" }, ["keyword"]);
    expect(out).toBe("eq(public,false)");
  });
  it("falls back to friendly params when no rql", () => {
    expect(resolveListQuery({ keyword: "flu" }, ["keyword"])).toBe("keyword(flu)");
  });
  it("takes the first value when a param repeats", () => {
    expect(resolveListQuery({ keyword: ["a", "b"] }, ["keyword"])).toBe("keyword(a)");
  });
  it("returns empty string for empty input", () => {
    expect(resolveListQuery({}, ["keyword"])).toBe("");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/views/__tests__/rql.test.ts`
Expected: FAIL — cannot find module `../rql`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/views/rql.ts

export type SearchParamsRecord = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

/** Build an RQL string from allow-listed friendly params. `keyword` → keyword(), others → eq(). */
export function friendlyParamsToRql(
  params: SearchParamsRecord,
  allowed: readonly string[],
): string {
  const clauses: string[] = [];
  for (const name of allowed) {
    const raw = firstValue(params[name]);
    if (raw === undefined || raw === "") continue;
    clauses.push(name === "keyword" ? `keyword(${raw})` : `eq(${name},${raw})`);
  }
  if (clauses.length === 0) return "";
  if (clauses.length === 1) return clauses[0];
  return `and(${clauses.join(",")})`;
}

/** Resolve a list view's RQL: explicit ?rql= wins; otherwise compose friendly params. */
export function resolveListQuery(
  params: SearchParamsRecord,
  allowed: readonly string[],
): string {
  const rql = firstValue(params.rql);
  if (rql !== undefined && rql !== "") return rql;
  return friendlyParamsToRql(params, allowed);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/views/__tests__/rql.test.ts`
Expected: PASS (all 9 assertions).

- [ ] **Step 5: Commit**

```bash
git add src/lib/views/rql.ts src/lib/views/__tests__/rql.test.ts
git commit -m "feat(views): add friendly-param and rql query translation"
```

---

## Task 4: Tab resolution

**Files:**
- Create: `src/lib/views/tab.ts`
- Test: `src/lib/views/__tests__/tab.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/views/__tests__/tab.test.ts
import { resolveTab } from "../tab";

describe("resolveTab", () => {
  const valid = ["overview", "genomes", "features"];
  it("returns the requested tab when valid", () => {
    expect(resolveTab("genomes", valid, "overview")).toBe("genomes");
  });
  it("returns the default when the tab is missing", () => {
    expect(resolveTab(undefined, valid, "overview")).toBe("overview");
  });
  it("returns the default when the tab is not in the valid set", () => {
    expect(resolveTab("bogus", valid, "overview")).toBe("overview");
  });
  it("takes the first value when given an array", () => {
    expect(resolveTab(["features", "genomes"], valid, "overview")).toBe("features");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/views/__tests__/tab.test.ts`
Expected: FAIL — cannot find module `../tab`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/views/tab.ts

/** Validate a requested ?tab= against the set valid for a view; fall back to the default. */
export function resolveTab(
  requested: string | string[] | undefined,
  validTabs: readonly string[],
  defaultTab: string,
): string {
  const value = Array.isArray(requested) ? requested[0] : requested;
  if (value && validTabs.includes(value)) return value;
  return defaultTab;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/views/__tests__/tab.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/views/tab.ts src/lib/views/__tests__/tab.test.ts
git commit -m "feat(views): add tab resolution helper"
```

---

## Task 5: Legacy `/view/*` path mapping (pure)

**Files:**
- Create: `src/lib/views/legacy-redirect.ts`
- Test: `src/lib/views/__tests__/legacy-redirect.test.ts`

`mapLegacyViewPath` takes a pathname and a raw query string (no leading `?`) and returns the new `{ pathname, search }` (or `null` if not mappable). Hash is NOT handled here (server cannot read it — Task 11 handles hash client-side).

- [ ] **Step 1: Write the failing test**

```ts
// src/lib/views/__tests__/legacy-redirect.test.ts
import { mapLegacyViewPath } from "../legacy-redirect";

describe("mapLegacyViewPath", () => {
  it("maps a singular legacy path", () => {
    expect(mapLegacyViewPath("/view/Genome/59201.7581", "")).toEqual({
      pathname: "/genome/59201.7581",
      search: "",
    });
  });
  it("maps a list legacy path with raw RQL into ?rql=", () => {
    expect(mapLegacyViewPath("/view/GenomeList/", "eq(taxon_id,1763)")).toEqual({
      pathname: "/genome",
      search: "rql=eq(taxon_id%2C1763)",
    });
  });
  it("maps TaxonList to the taxonomy segment", () => {
    expect(mapLegacyViewPath("/view/TaxonList/", "eq(taxon_lineage_ids,1763)")).toEqual({
      pathname: "/taxonomy",
      search: "rql=eq(taxon_lineage_ids%2C1763)",
    });
  });
  it("preserves a named query param (surveillance)", () => {
    expect(
      mapLegacyViewPath("/view/Surveillance/ISDN123456", "pathogen_test_type=Influenza%20A"),
    ).toEqual({
      pathname: "/surveillance/ISDN123456",
      search: "pathogen_test_type=Influenza+A",
    });
  });
  it("returns null for an unknown legacy view name", () => {
    expect(mapLegacyViewPath("/view/Nonsense/1", "")).toBeNull();
  });
  it("returns null for a non-/view path", () => {
    expect(mapLegacyViewPath("/genome/123", "")).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/views/__tests__/legacy-redirect.test.ts`
Expected: FAIL — cannot find module `../legacy-redirect`.

- [ ] **Step 3: Write minimal implementation**

```ts
// src/lib/views/legacy-redirect.ts
import { legacyToSegment, viewRegistry } from "./view-registry";

export interface MappedPath {
  pathname: string;
  search: string;
}

/**
 * Map a legacy BV-BRC /view/* request (path + raw query string, no leading "?")
 * to the new schema. Returns null if the path is not a mappable /view/* URL.
 * Hash is intentionally NOT handled here (the server cannot read it).
 */
export function mapLegacyViewPath(pathname: string, rawSearch: string): MappedPath | null {
  const parts = pathname.split("/").filter(Boolean); // ["view", "Genome", "59201.7581"]
  if (parts.length < 2 || parts[0] !== "view") return null;

  const legacyName = parts[1];
  const segment = legacyToSegment[legacyName];
  if (!segment) return null;

  const entry = viewRegistry[segment];
  const idParts = parts.slice(2); // remaining path segments after the view name
  const isList = legacyName === entry.legacyList;

  if (isList || idParts.length === 0) {
    // List view: the legacy raw query string is an RQL expression (if present).
    if (!rawSearch) return { pathname: `/${segment}`, search: "" };
    // If it already looks like key=value named params, pass through; else treat as RQL.
    const looksNamed = /^[A-Za-z_][A-Za-z0-9_]*=/.test(rawSearch);
    if (looksNamed) {
      return { pathname: `/${segment}`, search: new URLSearchParams(rawSearch).toString() };
    }
    // encodeURIComponent (not URLSearchParams) keeps RQL parens literal and only
    // encodes the comma, which round-trips cleanly and stays readable.
    return { pathname: `/${segment}`, search: `rql=${encodeURIComponent(rawSearch)}` };
  }

  // Singular view: keep the id in the path, preserve named query params verbatim.
  const id = idParts.join("/");
  const search = rawSearch ? new URLSearchParams(rawSearch).toString() : "";
  return { pathname: `/${segment}/${id}`, search };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/views/__tests__/legacy-redirect.test.ts`
Expected: PASS. (Note: `URLSearchParams` encodes `,`→`%2C` and `%20`→`+`; the test expectations reflect this.)

- [ ] **Step 5: Commit**

```bash
git add src/lib/views/legacy-redirect.ts src/lib/views/__tests__/legacy-redirect.test.ts
git commit -m "feat(views): add pure legacy /view path mapping"
```

---

## Task 6: Placeholder list component

**Files:**
- Create: `src/lib/views/placeholder-list.tsx`
- Test: `src/lib/views/__tests__/placeholder-list.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/lib/views/__tests__/placeholder-list.test.tsx
import { render, screen } from "@testing-library/react";
import { PlaceholderList } from "../placeholder-list";

describe("PlaceholderList", () => {
  it("shows the label and the resolved RQL", () => {
    render(<PlaceholderList label="Genome" rql="keyword(flu)" />);
    expect(screen.getByText(/Genome list/i)).toBeInTheDocument();
    expect(screen.getByText("keyword(flu)")).toBeInTheDocument();
  });
  it("shows an all-records hint when rql is empty", () => {
    render(<PlaceholderList label="Genome" rql="" />);
    expect(screen.getByText(/all records/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/views/__tests__/placeholder-list.test.tsx`
Expected: FAIL — cannot find module `../placeholder-list`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/lib/views/placeholder-list.tsx

interface PlaceholderListProps {
  label: string;
  rql: string;
}

/** Skeleton-stage stand-in for a real data grid. Replaced per-type in the data phase. */
export function PlaceholderList({ label, rql }: PlaceholderListProps) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <h2 className="text-lg font-semibold">{label} list</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Results grid coming soon. Active filter:{" "}
        {rql ? <code className="font-mono">{rql}</code> : <span>all records</span>}
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/views/__tests__/placeholder-list.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/views/placeholder-list.tsx src/lib/views/__tests__/placeholder-list.test.tsx
git commit -m "feat(views): add placeholder list component"
```

---

## Task 7: `renderListShell`

**Files:**
- Create: `src/lib/views/render-list.tsx`
- Test: `src/lib/views/__tests__/render-list.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/lib/views/__tests__/render-list.test.tsx
import { render, screen } from "@testing-library/react";
import { renderListShell } from "../render-list";
import { viewRegistry } from "../view-registry";

describe("renderListShell", () => {
  it("renders the placeholder with the resolved rql from friendly params", () => {
    render(renderListShell(viewRegistry.genome, { keyword: "influenza" }));
    expect(screen.getByText("keyword(influenza)")).toBeInTheDocument();
  });
  it("honors the rql escape hatch", () => {
    render(renderListShell(viewRegistry.genome, { rql: "eq(public,false)" }));
    expect(screen.getByText("eq(public,false)")).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/views/__tests__/render-list.test.tsx`
Expected: FAIL — cannot find module `../render-list`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/lib/views/render-list.tsx
import type { ReactElement } from "react";

import { PlaceholderList } from "./placeholder-list";
import { resolveListQuery, type SearchParamsRecord } from "./rql";
import type { ViewTypeEntry } from "./view-types";

/** Render a list view: translate the query to RQL, then render the (placeholder) grid. */
export function renderListShell(
  entry: ViewTypeEntry,
  searchParams: SearchParamsRecord,
): ReactElement {
  const rql = resolveListQuery(searchParams, entry.list.friendlyParams);
  return <PlaceholderList label={entry.label} rql={rql} />;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/views/__tests__/render-list.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/views/render-list.tsx src/lib/views/__tests__/render-list.test.tsx
git commit -m "feat(views): add renderListShell"
```

---

## Task 8: `renderSingularShell` — id validation + list-only guard

**Files:**
- Create: `src/lib/views/render-singular.tsx`
- Test: `src/lib/views/__tests__/render-singular.test.tsx`

This shell validates the id and guards list-only types. For the skeleton, only `taxonomy` fetches real data; all other singulars render a placeholder via `OrganismLandingShell`. To keep this task focused and testable, the shell accepts an optional injected `fetcher`; the taxonomy route supplies the real one (Task 14). When no fetcher is given, it renders the placeholder landing shell.

- [ ] **Step 1: Write the failing test**

```tsx
// src/lib/views/__tests__/render-singular.test.tsx
import { renderSingularShell } from "../render-singular";
import { viewRegistry } from "../view-registry";

const { notFoundSpy } = vi.hoisted(() => ({
  notFoundSpy: vi.fn(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

vi.mock("next/navigation", () => ({
  notFound: () => notFoundSpy(),
}));

describe("renderSingularShell id validation", () => {
  beforeEach(() => { notFoundSpy.mockClear(); });

  it("calls notFound for a list-only type", async () => {
    await expect(
      renderSingularShell(viewRegistry.strain, "anything", {}),
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(notFoundSpy).toHaveBeenCalled();
  });

  it("calls notFound for a non-integer id when idKind is int", async () => {
    await expect(
      renderSingularShell(viewRegistry.taxonomy, "not-a-number", {}),
    ).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("calls notFound for a zero/negative int id", async () => {
    await expect(renderSingularShell(viewRegistry.taxonomy, "0", {})).rejects.toThrow("NEXT_NOT_FOUND");
    await expect(renderSingularShell(viewRegistry.taxonomy, "-5", {})).rejects.toThrow("NEXT_NOT_FOUND");
  });

  it("calls notFound for an empty string id when idKind is string", async () => {
    await expect(renderSingularShell(viewRegistry.genome, "", {})).rejects.toThrow("NEXT_NOT_FOUND");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/views/__tests__/render-singular.test.tsx`
Expected: FAIL — cannot find module `../render-singular`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/lib/views/render-singular.tsx
import { notFound } from "next/navigation";
import type { ReactElement } from "react";

import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";
import { buildOrganismNavItems } from "@/components/organisms/shared/default-nav-items";
import type { OrganismViewKey } from "@/components/organisms/types";

import { resolveTab } from "./tab";
import type { SearchParamsRecord } from "./rql";
import type { ViewTypeEntry } from "./view-types";

/** Validate an id per its kind. Returns the normalized id, or null if invalid. */
function validateId(id: string, kind: ViewTypeEntry["singular"]): string | null {
  if (!kind) return null;
  if (kind.idKind === "none") return id;
  if (kind.idKind === "int") {
    const n = Number(id);
    return Number.isInteger(n) && n > 0 ? id : null;
  }
  // string
  return id.length > 0 ? id : null;
}

/**
 * Render a singular view. Validates the id, guards list-only types, resolves the
 * active tab, then renders the landing shell. In the skeleton stage every type
 * except taxonomy renders placeholder views (no real fetch).
 */
export async function renderSingularShell(
  entry: ViewTypeEntry,
  id: string,
  searchParams: SearchParamsRecord,
): Promise<ReactElement> {
  if (!entry.singular) notFound();
  const normalized = validateId(id, entry.singular);
  if (normalized === null) notFound();

  const views = buildOrganismNavItems();
  const tabParam = searchParams.tab;
  const activeTab = resolveTab(
    tabParam,
    views.map((v) => v.key),
    entry.singular.defaultTab,
  );

  // Skeleton-stage default tabs are all "overview", a valid OrganismViewKey. The cast is
  // localized here so the registry can hold defaultTab as a plain string.
  const defaultView = entry.singular.defaultTab as OrganismViewKey;

  return (
    <OrganismLandingShell
      config={{
        displayName: `${entry.label} ${normalized}`,
        taxonId: 0,
        accent: "all",
        defaultView,
        metadataFields: [],
      }}
      views={views}
      activeViewKey={activeTab}
    />
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/views/__tests__/render-singular.test.tsx`
Expected: PASS (4 assertions). Note: the placeholder render path is exercised by route tests in later tasks; these tests target the validation/guard logic.

- [ ] **Step 5: Commit**

```bash
git add src/lib/views/render-singular.tsx src/lib/views/__tests__/render-singular.test.tsx
git commit -m "feat(views): add renderSingularShell with id validation and list-only guard"
```

---

## Task 9: Migrate `?view=` → `?tab=` in landing shell client

**Files:**
- Modify: `src/components/organisms/landing-shell/landing-shell-client.tsx:39-48`
- Test: `src/components/organisms/landing-shell/__tests__/` (add or extend — check for an existing client test first)

- [ ] **Step 1: Write the failing test**

Create `src/components/organisms/landing-shell/__tests__/landing-shell-client.test.tsx` (if one already exists, add these cases to it):

```tsx
import { render, screen } from "@testing-library/react";

const pushSpy = vi.fn();
const searchParamsRef = { current: new URLSearchParams() };

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushSpy }),
  usePathname: () => "/taxonomy/234",
  useSearchParams: () => searchParamsRef.current,
}));

vi.mock("@tanstack/react-hotkeys", () => ({ useHotkey: () => {} }));

import { LandingShellClient } from "../landing-shell-client";

const navItems = [
  { key: "overview", label: "Overview", icon: null },
  { key: "genomes", label: "Genomes", icon: null },
] as const;

beforeEach(() => {
  pushSpy.mockClear();
  searchParamsRef.current = new URLSearchParams();
});

it("pushes ?tab= when selecting a non-default view", async () => {
  render(
    <LandingShellClient
      displayName="Brucella"
      activeView="overview"
      defaultView="overview"
      navItems={navItems}
    >
      <div />
    </LandingShellClient>,
  );
  screen.getByRole("button", { name: "Genomes" }).click();
  expect(pushSpy).toHaveBeenCalledWith("/taxonomy/234?tab=genomes");
});

it("omits the param when selecting the default view", async () => {
  searchParamsRef.current = new URLSearchParams("tab=genomes");
  render(
    <LandingShellClient
      displayName="Brucella"
      activeView="genomes"
      defaultView="overview"
      navItems={navItems}
    >
      <div />
    </LandingShellClient>,
  );
  screen.getByRole("button", { name: "Overview" }).click();
  expect(pushSpy).toHaveBeenCalledWith("/taxonomy/234");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/components/organisms/landing-shell/__tests__/landing-shell-client.test.tsx`
Expected: FAIL — push called with `?view=genomes`, not `?tab=genomes`.

- [ ] **Step 3: Write minimal implementation**

In `landing-shell-client.tsx`, replace the two `"view"` literals in `handleViewChange`:

```tsx
  function handleViewChange(nextView: OrganismViewKey) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextView === defaultView) {
      params.delete("tab");
    } else {
      params.set("tab", nextView);
    }
    const queryString = params.toString();
    router.push(queryString ? `${pathname}?${queryString}` : pathname);
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/components/organisms/landing-shell/__tests__/landing-shell-client.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/organisms/landing-shell/landing-shell-client.tsx src/components/organisms/landing-shell/__tests__/landing-shell-client.test.tsx
git commit -m "refactor(views): switch tab param from view to tab in landing shell client"
```

---

## Task 10: Migrate `?view=` → `?tab=` in the three organism/taxonomy pages

**Files:**
- Modify: `src/app/(views)/taxonomy/[taxonId]/page.tsx:15-29`
- Modify: `src/app/organisms/all/page.tsx:9-18`
- Modify: `src/app/organisms/bacteria/page.tsx`, `src/app/organisms/viruses/page.tsx` (same `view`→`tab` read)
- Modify: `src/app/(views)/taxonomy/[taxonId]/__tests__/page.test.tsx` (update `view:` → `tab:` in the 11 cases)

- [ ] **Step 1: Update the taxonomy page test to use `tab`**

In `page.test.tsx`, replace every `searchParams: Promise.resolve({ view: "..." })` with `{ tab: "..." }`. Example:

```tsx
  it("renders the taxonomy stub view when tab=taxonomy", async () => {
    const node = await TaxonomyPage({
      params: Promise.resolve({ taxonId: "234" }),
      searchParams: Promise.resolve({ tab: "taxonomy" }),
    });
    render(node);
    expect(screen.getByText(/Taxonomy browsing is stubbed/)).toBeInTheDocument();
  });
```

(Apply the same `view`→`tab` rename to all 11 cases that pass a `view` key.)

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- "src/app/(views)/taxonomy/[taxonId]/__tests__/page.test.tsx"`
Expected: FAIL — the page still reads `searchParams.view`, so `tab=` is ignored and the wrong (default) view renders.

- [ ] **Step 3: Update the three pages to read `tab`**

In `taxonomy/[taxonId]/page.tsx`:

```tsx
interface TaxonomyPageProps {
  params: Promise<{ taxonId: string }>;
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
}
```
and
```tsx
  const resolvedSearchParams = await searchParams;
  const tabParam = resolvedSearchParams?.tab;
  const activeViewKey = Array.isArray(tabParam) ? tabParam[0] : tabParam;
```

In `organisms/all/page.tsx` (and identically in `bacteria/page.tsx`, `viruses/page.tsx`):

```tsx
interface AllOrganismsPageProps {
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
}

export default async function AllOrganismsPage({ searchParams }: AllOrganismsPageProps) {
  const resolvedSearchParams = await searchParams;
  const tabParam = resolvedSearchParams?.tab;
  const activeViewKey = Array.isArray(tabParam) ? tabParam[0] : tabParam;
  // ...unchanged below
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- "src/app/(views)/taxonomy/[taxonId]/__tests__/page.test.tsx"`
Expected: PASS (all 11). Also run `pnpm test -- src/app/organisms` if those pages have tests.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(views)/taxonomy" src/app/organisms
git commit -m "refactor(views): read tab param instead of view in organism pages"
```

---

## Task 11: `view`→`tab` redirect + legacy `/view/*` redirect in proxy

**Files:**
- Modify: `src/proxy.ts`
- Test: `src/__tests__/proxy.test.ts`

- [ ] **Step 1: Write the failing test**

Add to `src/__tests__/proxy.test.ts` (reuse the existing `buildRequest`/`getRedirectLocation` helpers in that file):

```ts
describe("view→tab redirect", () => {
  it("redirects ?view= to ?tab= on a (views) route", () => {
    const request = buildRequest("/taxonomy/234?view=genomes");
    const response = proxy(request);
    expect(response.status).toBe(308);
    const loc = getRedirectLocation(response);
    expect(loc.pathname).toBe("/taxonomy/234");
    expect(loc.searchParams.get("tab")).toBe("genomes");
    expect(loc.searchParams.get("view")).toBeNull();
  });
});

describe("legacy /view/* redirect", () => {
  it("redirects a singular legacy path", () => {
    const request = buildRequest("/view/Genome/59201.7581");
    const response = proxy(request);
    expect(response.status).toBe(308);
    expect(getRedirectLocation(response).pathname).toBe("/genome/59201.7581");
  });
  it("redirects a list legacy path into ?rql=", () => {
    const request = buildRequest("/view/GenomeList/?eq(taxon_id,1763)");
    const response = proxy(request);
    expect(response.status).toBe(308);
    const loc = getRedirectLocation(response);
    expect(loc.pathname).toBe("/genome");
    expect(loc.searchParams.get("rql")).toBe("eq(taxon_id,1763)");
  });
  it("passes through an unknown legacy view name (no redirect)", () => {
    const request = buildRequest("/view/Nonsense/1");
    const response = proxy(request);
    expect(response.status).not.toBe(308);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/__tests__/proxy.test.ts`
Expected: FAIL — proxy does not yet handle these paths (no redirect / wrong status).

- [ ] **Step 3: Implement the redirects in `proxy.ts`**

Add imports at the top:

```ts
import { mapLegacyViewPath } from "@/lib/views/legacy-redirect";
import { viewSegments } from "@/lib/views/view-registry";
```

At the **start** of the `proxy` function body (before the auth checks), add:

```ts
  // 1. Legacy /view/* → new schema (path + query only; hash handled client-side).
  if (pathname.startsWith("/view/")) {
    const mapped = mapLegacyViewPath(pathname, search.startsWith("?") ? search.slice(1) : search);
    if (mapped) {
      const url = new URL(mapped.pathname, request.url);
      url.search = mapped.search;
      return NextResponse.redirect(url, 308);
    }
  }

  // 2. Internal ?view= → ?tab= on (views) routes.
  const firstSegment = pathname.split("/").filter(Boolean)[0];
  if (firstSegment && viewSegments.includes(firstSegment)) {
    const viewValue = request.nextUrl.searchParams.get("view");
    if (viewValue !== null) {
      const url = new URL(request.url);
      url.searchParams.delete("view");
      url.searchParams.set("tab", viewValue);
      return NextResponse.redirect(url, 308);
    }
  }
```

Then extend the matcher so these paths reach the middleware:

```ts
export const config = {
  matcher: [
    "/api/protected/:path*",
    "/services/:path*",
    "/workspace/:path*",
    "/jobs/:path*",
    "/settings/:path*",
    "/viewer/:path*",
    "/view/:path*",
    "/taxonomy/:path*",
    "/genome/:path*",
    "/feature/:path*",
    "/epitope/:path*",
    "/surveillance/:path*",
    "/serology/:path*",
    "/strain/:path*",
    "/domains-and-motifs/:path*",
    "/protein-structure/:path*",
    "/experiment/:path*",
  ],
};
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test -- src/__tests__/proxy.test.ts`
Expected: PASS (new cases + all existing auth cases still green).

- [ ] **Step 5: Commit**

```bash
git add src/proxy.ts src/__tests__/proxy.test.ts
git commit -m "feat(views): add view→tab and legacy /view redirects in proxy"
```

---

## Task 12: `LegacyHashAdapter` + `(views)` layout

**Files:**
- Create: `src/lib/views/legacy-hash-adapter.tsx`
- Create: `src/app/(views)/layout.tsx`
- Test: `src/lib/views/__tests__/legacy-hash-adapter.test.tsx`

**Note:** `src/app/(views)/layout.tsx` does not exist yet — only `src/app/(views)/taxonomy/layout.tsx` does. The new route-group layout wraps all `(views)` routes and mounts the adapter. Keep the existing `taxonomy/layout.tsx` (it adds the Navbar/Footer); the group layout only adds the adapter, which renders nothing.

- [ ] **Step 1: Write the failing test**

```tsx
// src/lib/views/__tests__/legacy-hash-adapter.test.tsx
import { render } from "@testing-library/react";

const replaceStateSpy = vi.fn();

beforeEach(() => {
  replaceStateSpy.mockClear();
  window.history.replaceState = replaceStateSpy as unknown as typeof window.history.replaceState;
});

import { LegacyHashAdapter } from "../legacy-hash-adapter";

it("rewrites #view_tab= to ?tab= via replaceState", () => {
  window.location.hash = "#view_tab=features";
  render(<LegacyHashAdapter />);
  expect(replaceStateSpy).toHaveBeenCalled();
  const url = String(replaceStateSpy.mock.calls[0][2]);
  expect(url).toContain("tab=features");
  expect(url).not.toContain("view_tab");
});

it("does nothing when there is no legacy hash", () => {
  window.location.hash = "";
  render(<LegacyHashAdapter />);
  expect(replaceStateSpy).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- src/lib/views/__tests__/legacy-hash-adapter.test.tsx`
Expected: FAIL — cannot find module `../legacy-hash-adapter`.

- [ ] **Step 3: Write minimal implementation**

```tsx
// src/lib/views/legacy-hash-adapter.tsx
"use client";

import { useEffect } from "react";

/**
 * Legacy BV-BRC put the active tab in the URL hash (#view_tab=x), which the server
 * cannot read. After a legacy /view/* link is server-redirected (Task 11), this client
 * component rewrites any leftover #view_tab= (and #filter=) into the new ?tab= query
 * param via history.replaceState — no reload.
 */
export function LegacyHashAdapter() {
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const hashParams = new URLSearchParams(hash);
    const tab = hashParams.get("view_tab");
    const filter = hashParams.get("filter");
    if (tab === null && filter === null) return;

    const url = new URL(window.location.href);
    if (tab !== null) url.searchParams.set("tab", tab);
    if (filter !== null && filter !== "false") url.searchParams.set("filter", filter);
    url.hash = "";
    window.history.replaceState(window.history.state, "", url.toString());
  }, []);

  return null;
}
```

```tsx
// src/app/(views)/layout.tsx
import type { ReactNode } from "react";

import { LegacyHashAdapter } from "@/lib/views/legacy-hash-adapter";

export default function ViewsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <LegacyHashAdapter />
      {children}
    </>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- src/lib/views/__tests__/legacy-hash-adapter.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/views/legacy-hash-adapter.tsx "src/app/(views)/layout.tsx" src/lib/views/__tests__/legacy-hash-adapter.test.tsx
git commit -m "feat(views): add legacy hash adapter and (views) group layout"
```

---

## Task 13: Scaffold the route folders (9 new segments)

**Files (create all):** one list `page.tsx` per segment + one singular `[idParam]/page.tsx` for segments that have a singular. `taxonomy` is handled separately in Task 14 (it already exists).

Singular id-param folder names come from the registry `singular.idParam`:
- `genome` → `[genomeId]`, `feature` → `[featureId]`, `epitope` → `[epitopeId]`,
  `surveillance` → `[sampleId]`, `serology` → `[sampleId]`.
- List-only (no `[id]` folder): `strain`, `domains-and-motifs`, `experiment`.
- `protein-structure` → single `page.tsx` only (id-less singular handled by `?accession`/`?path`; see Step for it).

- [ ] **Step 1: Write a smoke test for the new list + singular routes**

```tsx
// src/app/(views)/__tests__/scaffold-routes.test.tsx
import { render, screen } from "@testing-library/react";

const { notFoundSpy } = vi.hoisted(() => ({
  notFoundSpy: vi.fn(() => { throw new Error("NEXT_NOT_FOUND"); }),
}));

// The singular render path mounts OrganismLandingShell → LandingShellClient, which uses
// these navigation hooks; mock them as the taxonomy page test does.
vi.mock("next/navigation", () => ({
  notFound: () => notFoundSpy(),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn() }),
  usePathname: () => "/genome/59201.7581",
  useSearchParams: () => new URLSearchParams(),
  redirect: vi.fn(),
}));

// LandingShellClient also calls useHotkey; stub it so the render path doesn't throw.
vi.mock("@tanstack/react-hotkeys", () => ({ useHotkey: () => {} }));

import GenomeListPage from "../genome/page";
import GenomePage from "../genome/[genomeId]/page";
import StrainListPage from "../strain/page";

beforeEach(() => { notFoundSpy.mockClear(); });

it("genome list renders the placeholder with friendly rql", async () => {
  render(await GenomeListPage({ searchParams: Promise.resolve({ keyword: "flu" }) }));
  expect(screen.getByText("keyword(flu)")).toBeInTheDocument();
});

it("genome singular renders for a dotted id", async () => {
  render(await GenomePage({
    params: Promise.resolve({ genomeId: "59201.7581" }),
    searchParams: Promise.resolve({}),
  }));
  expect(screen.getByText(/Genome 59201\.7581/)).toBeInTheDocument();
});

it("strain list renders (list-only type)", async () => {
  render(await StrainListPage({ searchParams: Promise.resolve({ keyword: "H1N1" }) }));
  expect(screen.getByText("keyword(H1N1)")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- "src/app/(views)/__tests__/scaffold-routes.test.tsx"`
Expected: FAIL — the route modules don't exist yet.

- [ ] **Step 3: Create the list pages (one per segment)**

For each segment in `genome, feature, epitope, surveillance, serology, strain, domains-and-motifs, experiment`, create `src/app/(views)/<segment>/page.tsx`. Use the segment's registry key. Template (shown for `genome`; change the two identifiers for each):

```tsx
// src/app/(views)/genome/page.tsx
import { renderListShell } from "@/lib/views/render-list";
import { viewRegistry } from "@/lib/views/view-registry";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GenomeListPage({ searchParams }: PageProps) {
  return renderListShell(viewRegistry.genome, await searchParams);
}
```

Per-segment substitutions for the list pages:

| file | function name | registry access |
|---|---|---|
| `genome/page.tsx` | `GenomeListPage` | `viewRegistry.genome` |
| `feature/page.tsx` | `FeatureListPage` | `viewRegistry.feature` |
| `epitope/page.tsx` | `EpitopeListPage` | `viewRegistry.epitope` |
| `surveillance/page.tsx` | `SurveillanceListPage` | `viewRegistry.surveillance` |
| `serology/page.tsx` | `SerologyListPage` | `viewRegistry.serology` |
| `strain/page.tsx` | `StrainListPage` | `viewRegistry.strain` |
| `domains-and-motifs/page.tsx` | `DomainsAndMotifsListPage` | `viewRegistry["domains-and-motifs"]` |
| `experiment/page.tsx` | `ExperimentListPage` | `viewRegistry.experiment` |

- [ ] **Step 4: Create the singular pages (5 segments with singulars)**

For each of `genome, feature, epitope, surveillance, serology`, create `src/app/(views)/<segment>/[<idParam>]/page.tsx`. Template (shown for `genome`):

```tsx
// src/app/(views)/genome/[genomeId]/page.tsx
import { renderSingularShell } from "@/lib/views/render-singular";
import { viewRegistry } from "@/lib/views/view-registry";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ genomeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GenomePage({ params, searchParams }: PageProps) {
  const { genomeId } = await params;
  return renderSingularShell(viewRegistry.genome, genomeId, await searchParams);
}
```

Per-segment substitutions for the singular pages:

| file | function name | id param destructure | registry access |
|---|---|---|---|
| `genome/[genomeId]/page.tsx` | `GenomePage` | `genomeId` | `viewRegistry.genome` |
| `feature/[featureId]/page.tsx` | `FeaturePage` | `featureId` | `viewRegistry.feature` |
| `epitope/[epitopeId]/page.tsx` | `EpitopePage` | `epitopeId` | `viewRegistry.epitope` |
| `surveillance/[sampleId]/page.tsx` | `SurveillancePage` | `sampleId` | `viewRegistry.surveillance` |
| `serology/[sampleId]/page.tsx` | `SerologyPage` | `sampleId` | `viewRegistry.serology` |

- [ ] **Step 5: Create the protein-structure dual-mode page**

```tsx
// src/app/(views)/protein-structure/page.tsx
import { renderListShell } from "@/lib/views/render-list";
import { renderSingularShell } from "@/lib/views/render-singular";
import { viewRegistry } from "@/lib/views/view-registry";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProteinStructurePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const accession = Array.isArray(params.accession) ? params.accession[0] : params.accession;
  const path = Array.isArray(params.path) ? params.path[0] : params.path;
  // id-less singular: accession or workspace path present
  if (accession || path) {
    return renderSingularShell(viewRegistry["protein-structure"], accession ?? path ?? "", params);
  }
  return renderListShell(viewRegistry["protein-structure"], params);
}
```

- [ ] **Step 6: Run the scaffold smoke test**

Run: `pnpm test -- "src/app/(views)/__tests__/scaffold-routes.test.tsx"`
Expected: PASS (3 assertions).

- [ ] **Step 7: Typecheck + commit**

```bash
pnpm typecheck
git add "src/app/(views)/genome" "src/app/(views)/feature" "src/app/(views)/epitope" "src/app/(views)/surveillance" "src/app/(views)/serology" "src/app/(views)/strain" "src/app/(views)/domains-and-motifs" "src/app/(views)/protein-structure" "src/app/(views)/experiment" "src/app/(views)/__tests__"
git commit -m "feat(views): scaffold list and singular routes for 9 view segments"
```

---

## Task 14: Route taxonomy through the registry + add the taxonomy list page

**Files:**
- Create: `src/app/(views)/taxonomy/page.tsx` (the list view — currently missing)
- Modify: `src/app/(views)/taxonomy/[taxonId]/page.tsx` (keep its real fetch; ensure `?tab=` is what it reads — already done in Task 10)
- Test: `src/app/(views)/taxonomy/__tests__/list-page.test.tsx`

The taxonomy **singular** keeps its bespoke real-data page (it has `fetchOrganismTaxonomy` + breadcrumb + AMR logic — do not collapse it into `renderSingularShell`). We only add the missing **list** page so `/taxonomy?...` works like the other list routes.

- [ ] **Step 1: Write the failing test**

```tsx
// src/app/(views)/taxonomy/__tests__/list-page.test.tsx
import { render, screen } from "@testing-library/react";
import TaxonomyListPage from "../page";

it("renders the taxonomy list placeholder with friendly rql", async () => {
  render(await TaxonomyListPage({ searchParams: Promise.resolve({ keyword: "brucella" }) }));
  expect(screen.getByText("keyword(brucella)")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test -- "src/app/(views)/taxonomy/__tests__/list-page.test.tsx"`
Expected: FAIL — `../page` does not exist (only `[taxonId]/page.tsx` does).

- [ ] **Step 3: Create the taxonomy list page**

```tsx
// src/app/(views)/taxonomy/page.tsx
import { renderListShell } from "@/lib/views/render-list";
import { viewRegistry } from "@/lib/views/view-registry";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TaxonomyListPage({ searchParams }: PageProps) {
  return renderListShell(viewRegistry.taxonomy, await searchParams);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test -- "src/app/(views)/taxonomy/__tests__/list-page.test.tsx"`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(views)/taxonomy/page.tsx" "src/app/(views)/taxonomy/__tests__/list-page.test.tsx"
git commit -m "feat(views): add taxonomy list route via registry"
```

---

## Task 15: Full verification pass

**Files:** none (verification only).

- [ ] **Step 1: Lint**

Run: `pnpm lint`
Expected: no errors. If `react-hooks/incompatible-library` fires on `LegacyHashAdapter`, add `"use no memo";` as the first statement in the component body and extend the silence list in `eslint.config.mjs` per `AGENTS.md`.

- [ ] **Step 2: Typecheck**

Run: `pnpm typecheck`
Expected: clean (`tsc --noEmit`).

- [ ] **Step 3: Full unit suite**

Run: `pnpm test`
Expected: all green, including the migrated taxonomy and proxy suites.

- [ ] **Step 4: Build**

Run: `pnpm build`
Expected: success; the new `(views)` routes appear in the route manifest.

- [ ] **Step 5: Manual smoke (dev server)**

Run: `pnpm dev`, then check:
- `http://localhost:3019/genome?keyword=influenza` → placeholder list shows `keyword(influenza)`.
- `http://localhost:3019/genome/59201.7581?tab=features` → singular placeholder, dotted id intact.
- `http://localhost:3019/taxonomy/234?view=genomes` → 308-redirects to `?tab=genomes`.
- `http://localhost:3019/view/Genome/59201.7581` → redirects to `/genome/59201.7581`.
- `http://localhost:3019/strain/anything` → 404 (list-only type).

- [ ] **Step 6: Commit (if any lint/use-no-memo fixes were made)**

```bash
git add -A
git commit -m "chore(views): verification fixes for url schema skeleton"
```

---

## Out of Scope (documented in spec §8 — do NOT implement here)

- Real per-type list data-fetch + grids.
- Real singular data-fetch for the 9 non-taxonomy types.
- Search-bar / command-palette repoint to the new List views (registry `searchType` is ready).
- `sitemap.xml`, JSON-LD, SSG/ISR per type.

Each has next-step guidance in the spec. Pick them up as separate plans after this skeleton merges.
