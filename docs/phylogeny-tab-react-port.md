# Porting the BV-BRC "Phylogeny" Taxon-View Tab to React / Next.js

A build guide for recreating the Taxon-View **Phylogeny** tab — bacterial
single-tree + viral multi-tree faceted picker — in `dxkb-fork`.

> **Renderer decision (2026-07-29).** The production tree boundary is
> `ArchaeopteryxPhylogeny`. It lazy-loads Archaeopteryx and its legacy browser
> dependencies, passes phyloXML directly to the library, and bridges its imperative
> selected-node event into React state. The integration deliberately supports one
> active viewer, matching Archaeopteryx's singleton runtime, and disables database
> access, downloads, and subtree deletion for a safer embedded experience.

> **Revision note.** This guide was corrected after a verification pass against
> the real npm tarballs and both repos (file:line-checked). Key corrections
> from the first draft, so nobody re-trusts the old claims:
> - the `phyloxml` package has **no `getRoot()`**; the root clade is
>   `phylogeny.children[0]`, and `confidences`/`taxonomies` are **arrays**,
>   properties use **`applies_to`** (snake_case). §2.3.
> - **npm `archaeopteryx@1.8.1` does NOT expose `getSelectedNodes()` or the
>   `selected_nodes_changed_event`** — those exist only in the newer pinned
>   submodule this legacy repo vendors. Prototype B must vendor the submodule,
>   not `npm i archaeopteryx`. §5.
> - the target's manifest fetch **rejects the real flat manifest shape today**
>   (returns `null`), so viral gating is not actually live yet — the "one-line
>   wire-up" framing was wrong. §1.
> - the visx prototype must be a **phylogram** (x = cumulative branch length),
>   not a depth-based topology tree. §4.
> - bacterial and viral trees use **materially different** renderer configs and
>   interaction models — not one shared config. §0, §5.

**Target-repo status.** The "phylogeny" tab in `dxkb-fork` has its *gating
scaffolding* in place — tab key, predicate (`hasBacterialOrViralPhylogeny`),
disabled-tab UI, and a `fetchPhyloManifest()` call already wired into
`page.tsx`. What is **not** done: (a) the manifest fetch normalizer rejects the
real legacy shape, (b) `PHYLO_MANIFEST_URL` is unset, and (c) the view
`Component` is a placeholder. This guide covers all three. See §1 and §7.

---

## 0. What the current tab actually is

Source of truth in the legacy Dojo app — **two competing widget classes share
one tab slot**, not one class with a branch:

| Concern | Legacy file |
|---|---|
| Tab host, bacteria/virus context switch, manifest gate | `public/js/p3/widget/viewer/Taxonomy.js` |
| **Bacterial** tree widget (single tree, shown for any bacterium) | `public/js/p3/widget/Phylogeny.js` |
| **Viral** tree widget (multi-tree, manifest-gated) | `public/js/p3/widget/PhylogenyVirus.js` |
| Faceted card-picker (Strain / Viewer-type / Segment) for viral | `public/js/p3/widget/PhylogenyTreeCards.js` |
| Shared archaeopteryx wrapper (outbreaks *and* viral tab) | `public/js/p3/widget/outbreaks/OutbreaksPhylogenyTreeViewer.js` |
| Tree render engine (global `window.archaeopteryx`) | `public/js/archaeopteryx/archaeopteryx-js` (git submodule) |
| Vendored phyloXML parser | `public/js/archaeopteryx/archaeopteryx-js/archaeopteryx-dependencies/phyloxml.js` |

**Explicitly out of scope** (confirmed dead-end or unrelated):
`PhylogenyGene.js` + `PhylogeneticTree.js`/`PhylogeneticTree2.js`/`PhylogeneticTreeGene.js`
are Workspace job-result tree viewers reached from `WorkspaceBrowser.js`, not
from the Taxon View. `SFVT.js`'s tree code is dead/commented out.

### A correction to an earlier repo doc

An earlier doc characterized the bacterial tab as "computed on the fly." That's
wrong. **Bacterial trees and viral *archaeopteryx* trees are static,
pre-published phyloXML files** fetched from BV-BRC's content server. No job is
submitted in this code path. (Viral *Nextstrain* entries are the exception —
they are Auspice datasets addressed by route, not phyloXML files. See §3.4.)

### Bacterial vs. viral are NOT the same interaction model

This is the single most important structural fact, and the first draft got it
wrong by presenting selection/detail/actions as shared behavior. Verified:

| | **Bacterial** (`Phylogeny.js`) | **Viral** (`PhylogenyVirus.js`) |
|---|---|---|
| Tree count | always 1 | 1..many (card-picker) |
| `options.phylogram` | `true` (L146) | `true` (L207) |
| `settings.allowManualNodeSelection` | **`true`** (L188) | **absent** (no manual selection) |
| `options.showVisualizationsLegend` | **absent** | **`true`** (L212) |
| Node selection → detail | yes — reads `selected.name`, leaf-only, resolves genome/feature (L227-293, L451-495) | **no** manual-selection detail flow |
| Viral-only UI | — | user-guide button (L38-51), metadata download (L55-70), viewer title (L132), "← Back to trees" (`PhylogenyVirus.html:10`), Nextstrain iframe (L179) |

Treat these as **two configs and two interaction contracts**, unified only at
the tab-key level. §5 gives both configs explicitly.

### Feature checklist (what "done" means)

Bacterial:
- [ ] single phyloXML tree from a taxon-keyed static dict
- [ ] manual leaf selection → detail panel (genome or feature leaves)
- [ ] leaf-name → genome/feature record resolution for toolbar actions
- [ ] SVG / Newick export, search, collapse/expand, coloring, legend

Viral:
- [ ] manifest-gated tab visibility (exact `taxon_id` match, no lineage inheritance)
- [ ] faceted card-picker (Strain / Viewer-type / Segment) — always, even for one tree
- [ ] per-card metadata download, region preview image, keyboard activation, empty state
- [ ] viewer title + "back to trees"
- [ ] archaeopteryx tree render (search/collapse/coloring/legend/export)
- [ ] Nextstrain entries — **out of scope**, disable or "not available" (§3.4)

---

## 1. The gating logic (scaffolding exists; not yet operational)

**Predicate** (`src/lib/taxon-view/predicates.ts`) — already shipped, unchanged:

```ts
export const isBacteria = (c: TabContext): boolean =>
  c.taxonomy.lineageNames.includes("Bacteria");

export const hasViralTree = (c: TabContext): boolean =>
  c.phyloManifest != null &&
  Object.prototype.hasOwnProperty.call(c.phyloManifest.trees, String(c.taxonomy.taxonId));

export const hasBacterialOrViralPhylogeny = (c: TabContext): boolean =>
  isBacteria(c) || hasViralTree(c);
```

> Note the input type: `isBacteria` takes a `TabContext`, not an
> `OrganismTaxonomy`, and there is **no** `isBacterial(taxon)` helper (the first
> draft invented one). Inside a view factory that only has an `OrganismTaxonomy`,
> branch with `taxon.lineageNames.includes("Bacteria")` directly. §3.1.

Bacterial gates on lineage only; viral gates on an **exact `taxon_id` key
match**, no inheritance — see `docs/taxon-view-tab-visibility.md §4.5`.

### The manifest is not accepted in its real shape today

`fetchPhyloManifest` (`src/lib/taxon-view/phylo-manifest.ts`) currently runs the
JSON through `parseManifest`, which **requires** a `{ trees: {...} }` object and
returns `null` for anything else:

```ts
function parseManifest(payload: unknown): PhyloManifest | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const trees = (payload as Record<string, unknown>).trees;
  if (!trees || typeof trees !== "object" || Array.isArray(trees)) return null;
  return { trees: trees as Record<string, unknown> };
}
```

The **real** legacy manifest at
`https://www.bv-brc.org/api/content/phyloxml_trees/manifest.json` is a **flat**
object: `{ "2955291": "Alphainfluenzavirus influenzae", ... }` (key = taxon_id,
value = family-name string — confirmed by `Taxonomy.js` `manifest.hasOwnProperty(taxon_id)`
and `TaxonomyTreeGrid.js`'s tooltip use of the value). A flat object has no
`trees` key, so `parseManifest` returns `null` → viral tab stays disabled.

**Fix — normalize at the boundary (this IS the "leave type/predicate untouched"
decision).** `parseManifest` *is* the fetch boundary; extend it to wrap a flat
map. The `PhyloManifest` type and `hasViralTree` predicate stay exactly as-is:

```ts
function parseManifest(payload: unknown): PhyloManifest | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const obj = payload as Record<string, unknown>;
  // Already-wrapped shape (kept for forward-compat / tests):
  if (obj.trees && typeof obj.trees === "object" && !Array.isArray(obj.trees)) {
    return { trees: obj.trees as Record<string, unknown> };
  }
  // Real legacy shape: a flat { [taxonId]: familyName } map → wrap it.
  return { trees: obj };
}
```

Then set the URL (fetch is fail-open: unset ⇒ `emptyManifest`, error ⇒ `null`):
```
PHYLO_MANIFEST_URL=https://www.bv-brc.org/api/content/phyloxml_trees/manifest.json
```

After both changes, `hasViralTree` fires for known taxa (e.g. `2955291`). Add a
unit test on the flat-shape normalization (§8) — it's the one place a shape
regression would silently disable every viral tab.

> On "fail-open": the *page* stays up if the manifest fetch fails, but the viral
> *tab* is then disabled — effectively fail-**closed** for the tab. Worth saying
> plainly so nobody debugs a "missing" tab that's actually a manifest timeout.

---

## 2. Data layer (shared fetching — build once)

Share the *fetching and URL resolution*, not a parsed model. Prototype A parses
phyloXML into a typed React shape; Prototype B hands the raw XML to
archaeopteryx's own parser. Forcing both through one reduced object is pointless
and lossy — so the shared unit is the XML text + its source URL.

### 2.1 Bacterial: single static tree

Legacy fetch chain (`Phylogeny.js:347-363`):

1. `GET .../api/content/bvbrc_phylogeny_tab/taxon_tree_dict.json?version=<cachebust>`
   → flat dict `{ [taxonId]: "<phyloxml filename>" }`.
2. If `taxonId` is a key: `GET .../bvbrc_phylogeny_tab/phyloxml/<filename>?version=<cachebust>`
   → the phyloXML text.
3. If not a key: "no tree currently available" — client-side, **after** the tab
   is already shown. Every bacterium gets the tab; not every one has a tree.

Cache the dict independently of the per-taxon tree (the dict is global and
large; re-fetching it per taxon navigation is wasteful), and check `response.ok`
so a fetch failure is distinguishable from "no entry":

```ts
// lib/services/organisms/phylogeny.ts
const DICT_URL = "https://www.bv-brc.org/api/content/bvbrc_phylogeny_tab/taxon_tree_dict.json";
const TREE_BASE = "https://www.bv-brc.org/api/content/bvbrc_phylogeny_tab/phyloxml/";

let dictPromise: Promise<Record<string, string>> | null = null; // ponytail: module-level memo; TanStack Query also caches client-side
function fetchTreeDict(): Promise<Record<string, string>> {
  return (dictPromise ??= fetch(DICT_URL).then((r) => {
    if (!r.ok) { dictPromise = null; throw new Error(`tree dict: ${r.status}`); }
    return r.json();
  }));
}

/** null = valid dict but no entry for this taxon (render empty state, not error). */
export async function fetchBacterialTreeXml(taxonId: number): Promise<string | null> {
  const filename = (await fetchTreeDict())[String(taxonId)];
  if (!filename) return null;
  const res = await fetch(TREE_BASE + filename);
  if (!res.ok) throw new Error(`tree fetch: ${res.status}`);
  return res.text();
}
```

Error semantics to preserve: dict-with-no-entry → `null` (empty state);
dict fetch failure → throw; tree fetch failure → throw; malformed XML → parse
error (§2.3).

### 2.2 Viral: manifest → family block → card-pick → tree

Once `hasViralTree` passes, fetch the per-taxon family block:

```
GET https://www.bv-brc.org/api/content/phyloxml_trees/families/<taxonId>/<taxonId>.json
```

Data shape actually consumed (`PhylogenyTreeCards.js:136-174, 521-527`) — note
there is **no `id` field** (an earlier review claimed one; verified absent):

```ts
export interface PhyloTreeRef {
  name: string;
  definition?: string;
  path: string;      // absolute URL, or "/"-relative to https://www.bv-brc.org
  metadata?: string; // same resolution; presence enables a per-card download link
  region?: string;   // e.g. "usa" | "global" → drives the card preview image
}
export interface PhyloGroup {
  key: string;
  title: string;
  archaeopteryx?: PhyloTreeRef[];
  nextstrain?: PhyloTreeRef[];
}
export interface PhyloFamilyBlock {
  order?: string[];      // display order of group keys
  groups: PhyloGroup[];
}
```

`path`/`metadata` resolve against `https://www.bv-brc.org` when they start with
`/`, else used as-is. React keys: derive from `path` (unique per ref); don't
assume an `id`.

> **Always route through the picker.** Legacy has **no single-tree bypass** —
> `setTreeData` unconditionally calls `_ensureCards()` → `_showCards()`
> (`PhylogenyVirus.js:105-108`). If you choose to auto-open the sole tree of a
> one-tree block, that is an **intentional UX divergence**, not legacy parity —
> label it as such and still provide a way back to the picker. (Whether
> one-tree blocks are "common" was never verified; don't assume it.)

### 2.3 phyloXML → typed tree (Prototype A only)

Prototype A needs a typed tree; Prototype B uses archaeopteryx's parser and
skips this. Install the standalone parser (same lineage as the vendored one,
depends only on `sax`):

```bash
pnpm add phyloxml sax
```

**Correct API usage** (the first draft used a nonexistent `getRoot()` and wrong
field names — verified against the tarball):

- `phyloXml.parse(xml, opts)` returns an **array** of phylogeny objects (plain
  objects, not class instances). There is **no `getRoot()`**.
- The root clade is `phylogenies[0].children[0]`.
- Clade fields are snake_case: `name`, `branch_length` (number). Confidence and
  taxonomy on a clade are **arrays**: `confidences: [{ value, type }]`,
  `taxonomies: [{ scientific_name, ... }]`. Clade properties are
  `properties: [{ ref, value, applies_to }]` (**`applies_to`**, not `appliesTo`).
- No TypeScript types ship — add a `declare module "phyloxml"` shim.

```ts
// lib/phylogeny/phyloxml.ts
import { phyloXml } from "phyloxml"; // + a declare module "phyloxml" { export const phyloXml: any } shim

export interface PhyloNode {
  id: string;                      // stable, path-derived (source data has no id)
  name?: string;
  branchLength: number;            // 0 when absent
  cumulativeBranchLength: number;  // root→node sum, drives phylogram x-position
  confidence?: number;            // first of confidences[]
  scientificName?: string;         // first of taxonomies[].scientific_name
  properties: Array<{ ref: string; value: string; appliesTo: string }>;
  children: PhyloNode[];
}

export function parsePhyloXml(xml: string): PhyloNode {
  const phylogenies = phyloXml.parse(xml, { trim: true, normalize: true });
  const root = phylogenies?.[0]?.children?.[0];
  if (!root) throw new Error("phyloXML: no root clade");
  return toNode(root, "0", 0);
}

function toNode(c: any, id: string, parentCumulative: number): PhyloNode {
  const branchLength = typeof c.branch_length === "number" ? c.branch_length : 0;
  const cumulativeBranchLength = parentCumulative + branchLength;
  return {
    id,
    name: c.name,
    branchLength,
    cumulativeBranchLength,
    confidence: c.confidences?.[0]?.value,
    scientificName: c.taxonomies?.[0]?.scientific_name,
    properties: (c.properties ?? []).map((p: any) => ({
      ref: p.ref, value: p.value, appliesTo: p.applies_to,
    })),
    children: (c.children ?? []).map((child: any, i: number) =>
      toNode(child, `${id}.${i}`, cumulativeBranchLength)),
  };
}
```

`cumulativeBranchLength` and the path-derived `id` are the two fields the visx
renderer can't work correctly without (phylogram scaling and stable
collapse/React keys respectively). This transform is the one piece of real new
parsing logic — cover it with a unit test (§8).

**Why phyloXML, not Newick:** `DXKBCORE-139-organism-views-plan.md` "PR15" specs
`newick-js`. That's a mismatch — legacy tree *files* are phyloXML, carrying the
`confidences`, `taxonomies`, and arbitrary `properties` that drive per-clade
coloring, none of which Newick can represent. Treat this as a correction to PR15.

---

## 3. Shared UI shell (renderer-agnostic)

### 3.1 One view factory, branch internally

```tsx
// views/phylogeny.tsx  — server-callable factory, no 'use client'
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import type { PhyloManifest } from "@/lib/taxon-view/tab-context";

export function makePhylogenyView({ taxon, phyloManifest }: {
  taxon: OrganismTaxonomy | null;
  phyloManifest: PhyloManifest | null;
}) {
  function PhylogenyView() {
    if (!taxon) return null;
    // No isBacterial() helper exists; branch on lineage directly.
    return taxon.lineageNames.includes("Bacteria")
      ? <BacterialPhylogenyPanel taxonId={taxon.taxonId} />
      : <ViralPhylogenyPanel taxonId={taxon.taxonId} />;
  }
  return PhylogenyView;
}
```

### 3.2 SSR/CSR

No `next/dynamic` in this codebase; none needed. Keep `phylogeny.tsx` a plain
factory; push `'use client'` down to `BacterialPhylogenyPanel` /
`ViralPhylogenyPanel`, mirroring `taxonomy-tree-panel.tsx`. (This also keeps
`window`/`document` access out of any server-rendered path — see the loader
caveat in §5.2.)

### 3.3 Client data fetching

TanStack Query, colocated hooks (per `use-taxon-children.ts` precedent):

```ts
// components/phylogeny/use-bacterial-tree.ts   (raw XML; parse in the visx renderer)
export function useBacterialTreeXml(taxonId: number) {
  return useQuery({
    queryKey: ["phylogeny", "bacterial", taxonId],
    queryFn: () => fetchBacterialTreeXml(taxonId),
  });
}

// components/phylogeny/use-viral-family.ts
export function useViralFamily(taxonId: number) {
  return useQuery({
    queryKey: ["phylogeny", "viral-family", taxonId],
    queryFn: () => fetchViralFamilyBlock(taxonId),
  });
}

// Fetch a specific tree's XML, keyed by resolved URL so switching cards can't
// mix up responses:
export function useViralTreeXml(url: string | null) {
  return useQuery({
    queryKey: ["phylogeny", "viral-tree", url],
    queryFn: () => fetchTreeXml(url!),
    enabled: !!url,
  });
}
```

Viral panel state is a small explicit machine so "back to trees" and rapid card
switches are unambiguous:

```ts
type ViralState =
  | { mode: "picker" }
  | { mode: "archaeopteryx"; ref: PhyloTreeRef }
  | { mode: "nextstrain"; ref: PhyloTreeRef };
```

### 3.4 The shell + the viral card-picker

**What the house components actually give you** (verified — don't over-claim):

- `GenomeShell` (`src/components/genome/genome-shell.tsx`) renders **center
  content + a vertical action strip + a resizable right panel**. It does **not**
  provide a top toolbar, a left legend region, or a card-picker overlay — build
  those inside `children`.
- `InfoPanel` (`src/components/detail-panel/info-panel.tsx`) switches on fixed
  API record types (`genome`, `genome_feature`, `taxonomy`, …). It **cannot**
  render an arbitrary parsed clade. It's reusable only once a selected leaf is
  resolved to a genome/`genome_feature` record (bacterial path). For raw clade
  attributes, use a small dedicated detail component.

So the realistic layout: `GenomeShell` for the center/right split; a plain
toolbar bar and legend you render yourself inside the center pane.

**Card-picker — full fidelity** (`PhylogenyTreeCards.js`). Facets are
**conditional**, not always three:

- **Strain** — one option per group (`key`/`title`) + an "All strains" control.
- **Viewer type** — shown **only when both** archaeopteryx and nextstrain refs
  remain (`arcTotal > 0 && nxtTotal > 0`, L366) + "All viewers".
- **Segment** — shown **only when >1 segment** remains (L409) + "All segments";
  multi-select.
- After any change, **prune** now-invalid selected facet values (`_pruneSelections`,
  L274-323), then recompute cross-facet counts (a plain counting reduction).

**Segment parsing** — full rules (L21-29), not just the regex:

```ts
function parseSegment(name: string): string | null {
  if (!name) return null;
  if (/all\s+concat/i.test(name)) return "All";      // "All concatenated" → All
  const m = /\(([^)]+)\)/.exec(name);                // grab parenthesized text
  return m ? m[1].split(/[,\s]+/)[0].trim() : null;  // first token only
}
// "segment 7 (M1, M2)" → "M1";  "segment 8 (NS1, NEP)" → "NS1"
```

Sort segments by fixed priority `All, PB2, PB1, PA, HA, NP, NA, M1, NS1`.

**Card + panel features to port** (all verified present): collapsible filter
panel (L115-124); individually collapsible facet sections (L129-130);
region-specific preview image (`region === 'usa' ? usa.png : global.png`,
L528-530); per-card metadata download `<a href={metadata} target="_blank">`
with click `stopPropagation` (L541-549); keyboard activation (`tabIndex:0` +
Enter/Space, L535/563/575); empty-filter state "No trees found for the selected
filters." (L488-492); viewer title + "← Back to trees".

**Nextstrain — out of scope, and it's not phyloXML.** Legacy routes
`section === 'Nextstrain'` refs to an **iframe** at `'/nextstrain-viewer/' + url`
(`PhylogenyVirus.js:141,179`) — a locally-hosted Auspice build, never fetched or
parsed as a tree. `dxkb-fork` does **not** list `auspice` as a dependency
(verified — the first draft claimed it did), and has no `/nextstrain-viewer`
route. For a Nextstrain-only card, disable the Viewer-type option or show "not
yet available." Because "full fidelity" and "Nextstrain disabled" are in
tension, state the scope explicitly: **this port is archaeopteryx-only on the
viral side**; the Viewer facet exists but its Nextstrain branch is stubbed.

---

## 4. PROTOTYPE A — `@visx/hierarchy` (a real phylogram)

**Goal:** fresh, React-idiomatic build, matching PR15's intent and the house
`@visx/*` family (`@visx/zoom`, `@visx/shape`, `@visx/group`, `@visx/responsive`,
`@visx/tooltip` are already installed).

### 4.1 Install

```bash
pnpm add @visx/hierarchy   # phyloxml + sax already added in §2.3
```

Only `@visx/hierarchy` is missing (`@visx/zoom/shape/group/responsive/tooltip`
present at `^4.0.0`). It pulls in `d3-hierarchy` only — no jQuery, no full d3.

### 4.2 Phylogram layout — do NOT use depth-based positioning

The first draft rendered a topology tree (`node.y` = depth). Legacy sets
`phylogram=true`; a phylogram's **horizontal** position must reflect
**cumulative branch length**, or it misrepresents evolutionary distance. Use
d3-hierarchy for vertical layout (leaf ordering / even spacing) and override
horizontal from `cumulativeBranchLength`:

```ts
import { hierarchy } from "@visx/hierarchy";
import { scaleLinear } from "@visx/scale";

const root = hierarchy<PhyloNode>(parsed, (d) => d.children);
const maxCum = Math.max(...root.descendants().map((n) => n.data.cumulativeBranchLength), 0);
const xScale = scaleLinear({ domain: [0, maxCum || 1], range: [0, innerWidth] });
// vertical: use <Cluster> (leaves aligned) or <Tree> for node.x (the cross-axis),
// but take the horizontal coordinate from xScale(node.data.cumulativeBranchLength),
// NOT from the layout's depth axis.
```

Also required, and missing from the first draft:
- **stable keys** — key nodes/links by `node.data.id` (path-derived), not array
  index, or collapse/expand corrupts the diagram.
- **branch-length fallbacks** — `branchLength = 0` when absent; guard `maxCum`
  against 0; handle a tree with no lengths at all (degenerate to even spacing).
- **coloring** — map a chosen clade `property.ref` (or `scientificName`) to a
  color scale; the first draft's `RANK_COLOR` was empty and mislabeled.

### 4.3 Responsive + accessible canvas

Fixed `800×600` conflicts with `layout: "fill"`, the resizable side panel, and
mobile. Wrap in `ParentSize` (from the already-installed `@visx/responsive`) and
reuse the `Zoom` render-prop wiring proven in
`src/components/organisms/geo-distribution/choropleth-svg.tsx`
(`zoom.containerRef`, `zoom.toString()`, `zoom.scale()`/`zoom.reset()` for
+/−/reset buttons). Add: minimum usable size, resize-aware zoom, keyboard-
selectable nodes or an accessible leaf list, and text-overflow handling for
dense trees.

### 4.4 DIY vs. free

| Legacy feature | visx approach |
|---|---|
| Pan/zoom | `@visx/zoom` — proven in-repo, low effort |
| Node click/hover → selection/tooltip | `onClick` + `@visx/tooltip` — low |
| Coloring by clade property | DIY — map `properties`/`scientificName` to a scale — low-med |
| Collapse/expand | DIY — `collapsed` set keyed by `node.data.id`, filter before `hierarchy()` — med |
| Search | DIY — filter descendants by name, highlight — med |
| Legend | DIY — small component off the same scale — low |
| SVG export | DIY — `XMLSerializer` + `Blob`/`URL.createObjectURL` — low-med |
| Newick export | DIY — walk `PhyloNode` → Newick string — low-med |
| **Phylogram scaling** | **DIY — the branch-length x-scale above; not a layout flag** — med |
| Radial layout | **Not a `size={[360,r]}` swap** — needs polar→Cartesian coords, radial link geometry, label rotation/alignment, adjusted hit-areas and zoom bounds. Defer, or scope explicitly — med-high |

### 4.5 Effort: **MEDIUM–HIGH.** More new code than first estimated (phylogram
scaling, stable ids, responsive/a11y, real coloring), but fully typed,
theme-native, and matches the house direction.

---

## 5. PROTOTYPE B — archaeopteryx (vendor the submodule, NOT npm 1.8.1)

**Goal:** one-to-one port — search, collapse, per-property coloring, legend,
SVG/Newick export all built in.

### 5.1 Source: the pinned submodule, not the npm package

**Verified:** `npm archaeopteryx@1.8.1` (2019) does **not** contain
`getSelectedNodes()` or the `selected_nodes_changed_event` — the exact APIs a
faithful port depends on. Those exist only in the **newer pinned revision this
repo vendors** as a submodule:

- `getSelectedNodes()` → `public/js/archaeopteryx/archaeopteryx-js/archaeopteryx.js:8518`
  (`return Array.from(_selectedNodes)` — **node objects**)
- `selected_nodes_changed_event` dispatched at `archaeopteryx.js:4759` (and 4774)
- 7-arg `launch(id, phylo, options, settings, nodeVisualizations, nodeLabels, specialVisualizations)`
  at `archaeopteryx.js:3734`

So `pnpm add archaeopteryx` would ship a renderer that **can't report
selection**. Instead, **vendor the submodule's built files** into
`dxkb-fork/public/vendor/` (copy from this repo's
`public/js/archaeopteryx/archaeopteryx-js/`), or publish that pinned revision to
an internal registry. This is the honest source for a fidelity comparison.

### 5.2 Loading — a global-namespace script bundle, complete deps

archaeopteryx is a top-level IIFE that ends with `window.archaeopteryx = ...`
and assumes `d3`, jQuery, and jQuery-UI are already on `window`; its phyloXML
parser (browser mode) assumes `sax`; its export path assumes `canvg`/`rgbcolor`/
`stackblur`/`FileSaver`. The first draft's 5-script loader **omitted most of
these** — the real legacy bundle (`public/js/bundle/make_bundle2.sh`) concatenates,
in order: `d3.v3.min.js, sax.js, jquery-ui.js, FileSaver.js, phyloxml.js,
rgbcolor.js, stackblur.js, canvg.js, forester.js, archaeopteryx.js` (+
`jquery-ui.css` loaded separately; note the bundle does **not** include jQuery
itself — the legacy page supplies it globally, so **you must add jQuery here**).

Load order that satisfies the dependencies (jQuery first; sax before phyloxml;
export libs before archaeopteryx):

```
jquery-1.12.4.min.js → jquery-ui.js → d3.v3.min.js → sax.js → phyloxml.js →
forester.js → rgbcolor.js → stackblur.js → canvg.js → FileSaver.js →
archaeopteryx.js   (+ <link> jquery-ui.css)
```

**SSR-safe loader** — the first draft read `window` during render
(`useState(!!window.archaeopteryx)`), which throws under prerender/SSR. Read it
only in an effect, and let a rejected load retry:

```tsx
// components/phylogeny/archaeopteryx/load-archaeopteryx.ts
"use client";
import { useEffect, useState } from "react";

const SCRIPTS = [
  "/vendor/archaeopteryx/jquery-1.12.4.min.js",
  "/vendor/archaeopteryx/jquery-ui.js",
  "/vendor/archaeopteryx/d3.v3.min.js",
  "/vendor/archaeopteryx/sax.js",
  "/vendor/archaeopteryx/phyloxml.js",
  "/vendor/archaeopteryx/forester.js",
  "/vendor/archaeopteryx/rgbcolor.js",
  "/vendor/archaeopteryx/stackblur.js",
  "/vendor/archaeopteryx/canvg.js",
  "/vendor/archaeopteryx/FileSaver.js",
  "/vendor/archaeopteryx/archaeopteryx.js",
];

let loadPromise: Promise<void> | null = null;
const loadScript = (src: string) => new Promise<void>((res, rej) => {
  const s = document.createElement("script");
  s.src = src; s.async = false; // preserve execution order
  s.onload = () => res(); s.onerror = () => rej(new Error(`load ${src}`));
  document.body.appendChild(s);
});

export function useArchaeopteryx() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    if ((window as any).archaeopteryx) { setReady(true); return; }
    if (!loadPromise) {
      loadPromise = SCRIPTS.reduce(
        (p, src) => p.then(() => loadScript(src)),
        Promise.resolve(),
      ).catch((e) => { loadPromise = null; throw e; }); // allow retry
    }
    loadPromise.then(() => setReady(true)).catch(() => setReady(false));
  }, []);
  return ready;
}
```

Stage the files via a `postinstall`/prebuild copy into `public/vendor/`. Also
load `jquery-ui.css` (via `<link>` or `next/head`) or the controls render
unstyled. **License/security note:** this ships jQuery 1.12 (2016) and d3 v3
(2015) to every user who opens the tab — flag it for security review; they're
frozen and unpatched.

### 5.3 Canvas + the two real configs

`getSelectedNodes()` returns **node objects**, not ids — the first draft's
`.map(String)` would yield `"[object Object]"`. Filter to leaves and read
`.name` (matching `Phylogeny.js:227-239`). Bacterial and viral need **different**
configs:

```tsx
"use client";
import { useEffect, useRef } from "react";
import { useArchaeopteryx } from "./load-archaeopteryx";

// Bacterial: manual selection ON, no legend (matches Phylogeny.js:146,188)
const BACTERIAL = {
  options: { phylogram: true },
  settings: { allowManualNodeSelection: true },
};
// Viral: legend ON, no manual selection (matches PhylogenyVirus.js:207,212)
const VIRAL = {
  options: { phylogram: true, showVisualizationsLegend: true },
  settings: {},
};

export function PhylogenyTreeArchaeopteryx({ xml, mode, onSelectLeaves }: {
  xml: string;
  mode: "bacterial" | "viral";
  onSelectLeaves: (leafNames: string[]) => void;
}) {
  const ready = useArchaeopteryx();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ready || !ref.current) return;
    const ax = (window as any).archaeopteryx;
    const forester = (window as any).forester;
    const cfg = mode === "bacterial" ? BACTERIAL : VIRAL;

    const tree = ax.parsePhyloXML(xml);
    // Viral coloring/legend: collect property refs and pass as nodeVisualizations.
    const nodeVis = mode === "viral" ? forester.collectPropertyRefs(tree, "node", true) : {};
    ax.launch(`#${ref.current.id}`, tree, cfg.options, cfg.settings, nodeVis, {}, {});

    const onChange = () => {
      const leaves = (ax.getSelectedNodes() as any[]).filter((n) => !n.children);
      onSelectLeaves(leaves.map((n) => n.name).filter(Boolean));
    };
    document.addEventListener("selected_nodes_changed_event", onChange);
    return () => document.removeEventListener("selected_nodes_changed_event", onChange);
  }, [ready, xml, mode, onSelectLeaves]);

  return <div id="phylogram-mount" ref={ref} style={{ width: "100%", height: "100%" }} />;
}
```

> Selection classification (genome vs feature, feature→genome resolution) is a
> **bacterial-only** concern (`Phylogeny.js:451-495`) — do it in the React
> toolbar after `onSelectLeaves`, not in the renderer. Viral has no manual-
> selection flow.

**Remount/cleanup:** archaeopteryx builds its own control DOM (`controls0`/
`controls1`) and document-level listeners. On tree switch or unmount, ensure the
mount node is cleared and the event listener removed (above) so you don't leak
duplicate controls — verify this explicitly (§8), it's the likeliest B-only bug.

### 5.4 Free vs. DIY

| Feature | archaeopteryx |
|---|---|
| Pan/zoom, collapse/expand, search | **free** — built-in control chrome |
| Coloring by property | **free** — `forester.collectPropertyRefs` → `nodeVisualizations` |
| Legend | **free** — `options.showVisualizationsLegend` (OPTIONS, not settings) |
| SVG/Newick export | **free** — built-in buttons (needs canvg/FileSaver loaded, §5.2) |
| Selection → React | DIY bridge (above), leaf-only, read `.name` |
| Genome/feature resolution + toolbar actions | DIY, bacterial-only |
| Theming vs shadcn/Tailwind | DIY & **hard** — jQuery-UI-styled controls clash |

### 5.5 Effort: **LOW–MEDIUM logic, MEDIUM–HIGH integration.** Features are
built-in, but sourcing the right build, staging ~10 vendor files with correct
order, SSR-safe loading, remount cleanup, and CSS reconciliation are real,
ongoing costs.

---

## 6. Decision matrix

| Dimension | A: `@visx/hierarchy` | B: archaeopteryx (submodule) |
|---|---|---|
| Fidelity | rebuild interactions | **1:1**, controls included |
| React-idiomatic | **yes** | no — global namespace, imperative DOM |
| Dependency freshness | d3-hierarchy (current), typed | d3 v3 + jQuery 1.12 (frozen, unpatched) |
| Matches house `@visx/*` | **yes** | no |
| Matches PR15 | **yes** (with phyloXML correction) | no |
| Search/collapse/color/export | DIY | **free** |
| Phylogram | DIY branch-length scale | **free** (`phylogram:true`) |
| Theming | **native** | fights jQuery-UI styles |
| Source risk | none | must vendor pinned build; npm 1.8.1 is unusable |
| Security surface | small | ships jQuery 1.12 + d3 v3 to users |

---

## 7. Build order (spike thin, then build the winner once)

Don't fully build both — you'd re-implement search/collapse/export/shell twice.
The real uncertainty isn't "can visx draw nodes," it's whether the vendored
archaeopteryx loads and cleans up inside Next.js. So:

1. **Fixtures.** Save real trees locally for tests: one bacterial (genome-leaf),
   one bacterial (feature-leaf if available), one single-tree viral, one
   multi-segment viral. Fetch live once from bv-brc.org, then commit — don't
   depend on the network in tests.
2. **Manifest normalizer (§1)** + `PHYLO_MANIFEST_URL`; unit-test the flat-shape
   wrap; confirm `hasViralTree` fires for `2955291`.
3. **Shared fetch layer (§2)** + the phyloXML→`PhyloNode` transform (§2.3), unit-
   tested (leaf count, branch lengths, cumulative sums, property mapping).
4. **Two thin spikes** under isolated routes (`/prototypes/phylogeny-visx`,
   `/prototypes/phylogeny-archaeopteryx`), each proving the same **renderer
   contract**, nothing more:
   `{ xml, mode, onSelectLeaves }` → renders, resizes, searches, collapses,
   colors by one property, exports Newick+SVG, and **remounts/switches trees
   without leaking controls**. Let each spike use its own native controls — a
   shared toolbar here would hide B's integration cost.
5. **Choose** on that evidence.
6. **Build once:** viral card-picker (§3.4), bacterial selection→genome/feature
   resolution→`InfoPanel`, toolbar actions, the production panel.
7. **Wire the tab.** With the §1 fix landed and a renderer chosen, add the
   override:

```tsx
// src/app/(views)/taxonomy/[taxonId]/_components/nav-items.tsx
import { makePhylogenyView } from "../views/phylogeny";
// ...
return resolveTabs(ctx, {
  // ...existing overrides unchanged...
  phylogeny: { Component: makePhylogenyView({ taxon, phyloManifest: manifest }), layout: "fill" },
});
```

(`manifest` already flows into `buildTaxonomyNavItems` — no new plumbing.)

---

## 8. Testing (focused — not a 40-case matrix)

The high-value, cheap checks that catch the failure modes verified above:

**Unit (pure logic — write these first):**
- manifest normalizer: flat `{id: name}` → `{trees: {id: name}}`; already-wrapped
  passes through; junk → `null`.
- `parsePhyloXml`: leaf count; `branch_length` captured; `cumulativeBranchLength`
  sums root→leaf; `properties[].appliesTo` mapped from `applies_to`; missing
  lengths → 0.
- `parseSegment`: `"All concatenated"→"All"`, `"segment 7 (M1, M2)"→"M1"`,
  `"segment 8 (NS1, NEP)"→"NS1"`, no-paren → `null`.
- facet counts + `_pruneSelections` behavior on a multi-tree fixture.

**Component:**
- bacterial: dict-hit renders; dict-miss → empty state (not error); tree-fetch
  failure → error state.
- viral: family loads → picker; Viewer facet hidden when only archaeopteryx refs;
  Segment facet hidden when ≤1 segment; card→viewer→back.

**Renderer contract (both spikes, same suite):** renders bacterial + viral
fixtures; resize doesn't corrupt; search highlights a known leaf; collapse hides
descendants without dropping source data; **remount/tree-switch leaves no
duplicate controls or listeners**; Newick export reparses to the same leaf count.

---

## Appendix: legacy → new module map

| Legacy | New |
|---|---|
| `Taxonomy.js` manifest gate | `phylo-manifest.ts` (normalizer fix, §1) + `predicates.ts` (unchanged) |
| `Phylogeny.js` dict→file chain | `lib/services/organisms/phylogeny.ts::fetchBacterialTreeXml` (§2.1) |
| `Phylogeny.js` selection→genome/feature resolve | bacterial toolbar, React-side (§5.3 note) |
| `PhylogenyVirus.js` family-block consumption + state | `ViralPhylogenyPanel` + `ViralState` (§3.3) |
| `PhylogenyTreeCards.js` facets/counting/cards | card-picker component (§3.4) |
| `OutbreaksPhylogenyTreeViewer.js` | A: not needed · B: `PhylogenyTreeArchaeopteryx` (§5.3) |
| vendored `phyloxml.js` | A: `phyloxml` npm (§2.3) · B: bundled in vendor (§5.2) |
| legacy `ActionBar` selection actions | React toolbar; `InfoPanel` only for resolved genome/feature records (§3.4) |
| Nextstrain iframe (`/nextstrain-viewer/`) | **not ported** — no dxkb equivalent, no `auspice` dep (§3.4) |
