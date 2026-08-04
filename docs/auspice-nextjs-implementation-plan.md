# Embedding Auspice / Nextstrain in a React + Next.js App

A code-level build guide for standing up the Nextstrain viewer in a Next.js App
Router application (React 19, TypeScript). Verified against `auspice@2.73.0` and
the working legacy implementation in `BV-BRC-Web`.

**Companions, not duplicates:**
- `docs/auspice-nextstrain-availability.md` (this repo) — *why* Auspice shows up
  for only 3 taxa, and what the data limits are. Read first for context.
- `dxkb-fork/docs/auspice-integration-plan.md` — the decisions/phases/acceptance
  document. Read for the *why not*, the approval gates, and the test matrix.

This guide is the **how**: the files to add and what goes in them. Where it
diverges from the plan doc, §10 says so explicitly.

Snippets assume the `dxkb-fork` conventions (pnpm, `src/app`, `@/` alias,
TanStack Query, Vitest) and are written against its existing phylogeny module.
Adapt paths freely; the logic is portable.

---

## 0. What you're building

```
Taxon page (React 19)
  └─ viral tree picker → user clicks a "Nextstrain" card
       └─ <iframe src="/nextstrain-viewer/Influenza-A-Virus/H3N2/HA">
            └─ Auspice SPA (React 16, own bundle, served from /dist/*)
                 └─ GET /api/charon/getDataset?prefix=nextstrain-viewer/Influenza-A-Virus/H3N2/HA
                      └─ your route handler → reads <DATASET_DIR>/Influenza-A-Virus_H3N2_HA.json
```

Four moving parts: **a build step**, **a static shell + rewrite**, **three
Charon route handlers**, **one iframe branch in the existing picker**.

---

## 1. Constraints you don't get to choose

Learn these before designing anything; each one has already burned someone.

**1. Auspice cannot be imported as a React component.** `auspice@2.73.0` depends
on `react@^16.8.6`, `react-dom@^16.8.6`, `styled-components@^4`, and
`react-hot-loader`. It ships as a webpack app, not a library — its package
`main` exports exactly two Node helpers (`convertFromV1`, `parseNarrativeFile`),
no components. Against React 19 this is not a "try harder" situation. **Use an
iframe.**

**2. Asset `publicPath` is hardcoded to `/dist/`.** From
`auspice/webpack.config.js`:

```js
output: {
  path: outputPath,
  filename: `auspice.[name].bundle.[contenthash].js`,
  publicPath: "/dist/"        // not configurable via --extend
}
```

The built `index.html` references `/dist/auspice.*.js` **absolutely**. Either
serve your bundles at the root `/dist/`, or add a rewrite. There is no config
knob. (`serverAddress` *is* configurable — see §5.)

**3. The client derives its dataset prefix from `window.location.pathname`.**
`auspice/src/actions/loadData.js`:

```js
export const loadJSONs = ({url = window.location.pathname, ...} = {}) => { … }
```

So a viewer at `/nextstrain-viewer/Influenza-A-Virus/H3N2/HA` asks for
`?prefix=nextstrain-viewer/Influenza-A-Virus/H3N2/HA` — **including the mount
segment**. Your handler must strip it. This is not optional and not a bug.

**4. Do NOT reuse `auspice/cli/server/getDataset`.** Its
`redirectIfDatapathMatchFound` does nearest-prefix matching. Verified against
the legacy server:

```
GET /charon/getDataset?prefix=Influenza-A-Virus/H5N1/HA
  → 302 → prefix=/Influenza-A-Virus/H3N2/Concat
  → 200, title "H3N2 Influenza Phylogeny"
```

**A request for H5N1 silently returns H3N2.** For a scientific tool this is the
single most dangerous behavior in the stack. Write your own exact-match
resolver (§4). It's ~40 lines.

**5. Node runtime, not Edge.** The dataset resolver touches `fs`. Every Charon
route needs `export const runtime = "nodejs"`.

---

## 2. Files you will add

```
auspice/
  config.json                       # build-time customisation (--extend)
  NavBar.jsx                        # optional
  Splash.jsx                        # optional
scripts/
  build-auspice.mjs                 # build + copy artifacts into public/
public/
  dist/                             # GENERATED — gitignore
  nextstrain-viewer.html            # GENERATED — gitignore
src/
  lib/phylogeny/
    nextstrain-dataset.ts           # identifier validation + path mapping
    dataset-store.ts                # server-only: inventory + exact resolve
  app/api/charon/
    getDataset/route.ts
    getAvailable/route.ts
    getNarrative/route.ts
  app/api/phylogeny/
    nextstrain-datasets/route.ts    # inventory for card gating
```

Add to `.gitignore`:

```gitignore
/public/dist/
/public/nextstrain-viewer.html
/.auspice-build/
```

---

## 3. Step 1 — pin and build Auspice

### 3.1 Install

```bash
pnpm add -D auspice@2.73.0
```

Pin exactly. Auspice's client-customisation API is explicitly documented as
unstable ("we recommend you pin your installation to a specific version").

### 3.2 Build-time config

`auspice/config.json`:

```json
{
  "serverAddress": "/api/charon",
  "browserTitle": "BV-BRC Nextstrain",
  "navbarComponent": "NavBar.jsx",
  "splashComponent": "Splash.jsx",
  "sidebarTheme": {
    "background": "#F2F2F2",
    "color": "#000",
    "selectedColor": "#015994",
    "font-family": "Roboto, sans-serif"
  },
  "mapTiles": {
    "api": "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
    "attribution": "&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors &copy; <a href='https://carto.com/attributions'>CARTO</a>",
    "mapboxWordmark": false
  }
}
```

Component paths are **relative to the config file**. Both components are
optional; the useful one is the splash, which by default renders a "dataset not
found" banner you don't want inside an embedded panel:

```jsx
// auspice/Splash.jsx — deliberately renders no error banner
import React from "react";

const Splash = () => (
  <div style={{ padding: 40, textAlign: "center", fontFamily: "Roboto, sans-serif" }}>
    <h1 style={{ fontSize: 24 }}>Select a tree to view</h1>
    <p style={{ color: "#555" }}>
      Choose a published phylogeny from the tree picker.
    </p>
  </div>
);

export default Splash;
```

Do **not** set `googleAnalyticsKey` (deprecated), `enableDatasetEditor`, or
`AUSPICE_ENABLE_SERVICE_WORKER` — the service worker claims an entire origin,
and you are mounting under a subpath.

### 3.3 Build script

`auspice build --extend <json>` writes `dist/` **and** `index.html` into the
current working directory. Run it in a scratch dir, then copy:

```js
// scripts/build-auspice.mjs
import { execFileSync } from "node:child_process";
import { cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const scratch = resolve(root, ".auspice-build");
const cli = resolve(root, "node_modules/auspice/auspice.js");

rmSync(scratch, { recursive: true, force: true });
mkdirSync(scratch, { recursive: true });

// `auspice build --extend X` outputs to cwd/dist and writes cwd/index.html
execFileSync(process.execPath, [cli, "build", "--extend", resolve(root, "auspice/config.json")], {
  cwd: scratch,
  stdio: "inherit",
});

rmSync(resolve(root, "public/dist"), { recursive: true, force: true });
cpSync(resolve(scratch, "dist"), resolve(root, "public/dist"), { recursive: true });
cpSync(resolve(root, "node_modules/auspice/favicon.png"), resolve(root, "public/auspice-favicon.png"));

// index.html hardcodes /favicon.png; repoint it so it can't collide with the app's own
const shell = readFileSync(resolve(scratch, "index.html"), "utf8")
  .replaceAll('href="/favicon.png"', 'href="/auspice-favicon.png"');
writeFileSync(resolve(root, "public/nextstrain-viewer.html"), shell);

rmSync(scratch, { recursive: true, force: true });
console.log("auspice: built to public/dist + public/nextstrain-viewer.html");
```

Wire it to run automatically. `prebuild` is a native npm/pnpm lifecycle hook —
no orchestration needed, and it fails the build if Auspice fails:

```json
{
  "scripts": {
    "build:auspice": "node scripts/build-auspice.mjs",
    "prebuild": "pnpm build:auspice",
    "build": "next build"
  }
}
```

> **pnpm caveat.** Auspice's webpack config walks upward from its own
> `__dirname` looking for a single `node_modules` containing *all* of `react`,
> `react-hot-loader`, `@hot-loader/react-dom`, `regenerator-runtime`, `core-js`,
> `styled-components`. Under pnpm's isolated layout these all live in
> `.pnpm/auspice@2.73.0/node_modules/`, so it resolves Auspice's React 16 and
> not your React 19. Confirm on first build; if it errors on module resolution,
> the escape hatch is a tiny sibling package built with `npm` (or
> `node-linker=hoisted` in `.npmrc`).

Expected output — about **4.6 MB** across ~20 content-hashed files:

```
public/dist/auspice.runtime.bundle.<hash>.js
public/dist/auspice.polyfills.bundle.<hash>.js
public/dist/auspice.main.bundle.<hash>.js
public/dist/auspice.chunk.core-vendors.bundle.<hash>.js
public/dist/auspice.chunk.*.bundle.<hash>.js
public/dist/*.woff2 *.woff *.png
```

Everything under `public/` is served at the root, so `public/dist/x.js` lands at
`/dist/x.js` — which is exactly what constraint #2 demands. No rewrite needed
for assets.

If your deploy uses `output: "standalone"`, confirm your copy step already
includes `public`:

```json
"build-pm2": "next build && cp -r public .next/standalone/public && cp -r .next/static .next/standalone/.next/static"
```

---

## 4. Step 2 — dataset identifiers and the store

Two rules, one file each. Keep them apart: the identifier module is
client-safe, the store module is server-only.

### 4.1 The identifier is not a URL

`nextstrain[].path` values like `Influenza-A-Virus/H3N2/HA` are **dataset
identifiers**, while `archaeopteryx[].path` values are absolute phyloXML URLs.
If you run an identifier through a URL resolver it silently becomes
`https://www.bv-brc.org/Influenza-A-Virus/H3N2/HA` — a 404 that looks like a
network problem.

Underscores are banned because Auspice's on-disk mapping is
`parts.join("_")` — an underscore inside a segment is ambiguous on the way back
(`getAvailable.js` reverses with `split("_").join("/")`).

```ts
// src/lib/phylogeny/nextstrain-dataset.ts
/** One path segment: alphanumeric start, then alphanumerics / dot / dash.
 *  No underscore — the on-disk mapping joins segments with "_". */
const SEGMENT = /^[A-Za-z0-9][A-Za-z0-9.-]*$/;

/** Validate a published Nextstrain dataset identifier, e.g. "Influenza-A-Virus/H3N2/HA".
 *  Returns the segments, or null if the value is unusable. Case is significant. */
export function parseDatasetId(value: string): string[] | null {
  if (!value || value.length > 256) return null;
  const parts = value.replace(/^\/+/, "").replace(/\/+$/, "").split("/");
  if (parts.length === 0 || parts.length > 8) return null;
  if (!parts.every(part => SEGMENT.test(part) && part !== "." && part !== "..")) return null;
  return parts;
}

/** Iframe URL for a validated identifier. Encode per segment — never the whole string. */
export function viewerUrl(datasetId: string): string | null {
  const parts = parseDatasetId(datasetId);
  return parts && `/nextstrain-viewer/${parts.map(encodeURIComponent).join("/")}`;
}

/** Auspice's on-disk convention: segments joined with "_". Sidecars get a suffix. */
export function datasetFilename(parts: string[], sidecar?: string): string {
  return sidecar ? `${parts.join("_")}_${sidecar}.json` : `${parts.join("_")}.json`;
}

/** Auspice sends the viewer's full pathname as `prefix`. Strip exactly one mount segment. */
export function stripViewerPrefix(prefix: string): string {
  const trimmed = prefix.replace(/^\/+/, "");
  return trimmed.startsWith("nextstrain-viewer/")
    ? trimmed.slice("nextstrain-viewer/".length)
    : trimmed;
}
```

### 4.2 The store: exact match, path-escape proof, cached inventory

```ts
// src/lib/phylogeny/dataset-store.ts
import "server-only";
import { readdir, readFile, realpath } from "node:fs/promises";
import { resolve, sep } from "node:path";

import { datasetFilename, parseDatasetId } from "./nextstrain-dataset";

export const SIDECARS = ["tip-frequencies", "root-sequence", "measurements"] as const;
export type Sidecar = (typeof SIDECARS)[number];

function datasetDir(): string {
  const dir = process.env.NEXTSTRAIN_DATASET_DIR;
  // Fail loudly. The legacy server logs one warning and serves an empty catalog,
  // which is indistinguishable from "no data published" — see availability doc §4.
  if (!dir) throw new Error("NEXTSTRAIN_DATASET_DIR is not set");
  return resolve(dir);
}

let inventory: Promise<Set<string>> | null = null;

/** Identifiers with a readable v2 file on disk. Cached; call reset in tests. */
export function availableDatasetIds(): Promise<Set<string>> {
  inventory ??= readdir(datasetDir())
    .then(files => new Set(
      files
        .filter(f => f.endsWith(".json") && !SIDECARS.some(s => f.endsWith(`_${s}.json`)))
        .map(f => f.slice(0, -".json".length).split("_").join("/")),
    ))
    .catch((error: unknown) => {
      inventory = null;                       // allow retry after a transient failure
      throw error;
    });
  return inventory;
}

export function resetDatasetInventory(): void {
  inventory = null;
}

/** Exact-match read. Returns null when absent — NEVER a near-miss dataset. */
export async function readDataset(datasetId: string, sidecar?: Sidecar): Promise<string | null> {
  const parts = parseDatasetId(datasetId);
  if (!parts) return null;

  const dir = datasetDir();
  const target = resolve(dir, datasetFilename(parts, sidecar));

  // Belt and braces: the regex already excludes "/" and ".."; this catches symlinks out of the dir.
  if (!target.startsWith(dir + sep)) return null;
  try {
    if (!(await realpath(target)).startsWith((await realpath(dir)) + sep)) return null;
    return await readFile(target, "utf8");
  } catch {
    return null;
  }
}
```

---

## 5. Step 3 — the Charon route handlers

Auspice calls three endpoints under whatever `serverAddress` you configured.
With `"serverAddress": "/api/charon"`, App Router file paths map one-to-one.

### 5.1 `getDataset`

```ts
// src/app/api/charon/getDataset/route.ts
import { NextRequest, NextResponse } from "next/server";

import { readDataset, SIDECARS, type Sidecar } from "@/lib/phylogeny/dataset-store";
import { stripViewerPrefix } from "@/lib/phylogeny/nextstrain-dataset";

export const runtime = "nodejs";      // fs access

function isSidecar(value: string | null): value is Sidecar {
  return value !== null && (SIDECARS as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;

  const prefix = params.get("prefix");
  if (!prefix) return NextResponse.json({ error: "prefix is required" }, { status: 400 });

  // "tree" is a legacy no-op alias for the main dataset.
  const type = params.get("type");
  const sidecar = type === null || type === "tree" ? undefined : type;
  if (sidecar !== undefined && !isSidecar(sidecar)) {
    return NextResponse.json({ error: `unsupported type '${sidecar}'` }, { status: 400 });
  }

  const datasetId = stripViewerPrefix(prefix);

  let body: string | null;
  try {
    body = await readDataset(datasetId, sidecar);
  } catch (error) {
    // Only thrown for store misconfiguration (unset/unreadable dir) — that's a 500, not a 404.
    console.error(`charon/getDataset: store unavailable for '${datasetId}':`, error);
    return NextResponse.json({ error: "dataset store unavailable" }, { status: 500 });
  }

  // 404, never a redirect. Auspice's own resolver would substitute a nearest match here.
  if (body === null) {
    return NextResponse.json({ error: `dataset '${datasetId}' not found` }, { status: 404 });
  }

  return new NextResponse(body, {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
    },
  });
}
```

Sidecar 404s are **normal**. None of the current BV-BRC datasets publish
`root-sequence`, `tip-frequencies`, or `measurements`; Auspice requests them
speculatively, logs a console warning, and renders fine. Don't fabricate them.

### 5.2 `getAvailable`

```ts
// src/app/api/charon/getAvailable/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Deliberately empty. Cards link to datasets directly, and an empty catalog
 *  suppresses Auspice's own dataset selector and second-tree/tanglegram picker
 *  (see auspice/src/components/controls/choose-second-tree.js). */
export function GET() {
  return NextResponse.json({ datasets: [], narratives: [] });
}
```

### 5.3 `getNarrative`

```ts
// src/app/api/charon/getNarrative/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

/** Narratives are out of scope. Return a controlled refusal rather than
 *  exposing a filesystem lookup keyed on an unvalidated request path. */
export function GET() {
  return NextResponse.json({ error: "narratives are not supported" }, { status: 501 });
}
```

### 5.4 Inventory, for gating the cards

The Auspice-facing `getAvailable` stays empty, so your own UI needs a separate
read of the inventory:

```ts
// src/app/api/phylogeny/nextstrain-datasets/route.ts
import { NextResponse } from "next/server";

import { availableDatasetIds } from "@/lib/phylogeny/dataset-store";

export const runtime = "nodejs";

export async function GET() {
  try {
    return NextResponse.json({ ids: [...(await availableDatasetIds())] });
  } catch (error) {
    console.error("nextstrain inventory unavailable:", error);
    return NextResponse.json({ error: "dataset store unavailable" }, { status: 500 });
  }
}
```

---

## 6. Step 4 — serve the viewer shell

The SPA needs its `index.html` returned for **every** path under the mount so
client-side routing works. A native rewrite covers it — no route handler:

```ts
// next.config.ts
const nextConfig: NextConfig = {
  // …existing config…
  async rewrites() {
    return [
      // Every viewer path serves the same SPA shell; Auspice reads the pathname itself.
      { source: "/nextstrain-viewer", destination: "/nextstrain-viewer.html" },
      { source: "/nextstrain-viewer/:path*", destination: "/nextstrain-viewer.html" },
    ];
  },
};
```

Default `rewrites()` runs *after* the filesystem check, so `public/dist/*` still
resolves normally.

**Headers to verify in your proxy / CSP:**

| Concern | Requirement |
|---|---|
| `X-Frame-Options` / `frame-ancestors` | must permit **same-origin** framing |
| `script-src` / `connect-src` | `'self'` covers `/dist` and `/api/charon` |
| `img-src` | must include the `mapTiles` host (`*.basemaps.cartocdn.com`) for map panels |
| Cache | shell `no-cache`; `/dist/*` is content-hashed → `immutable` |

---

## 7. Step 5 — wire the React side

Two edits to the existing picker/panel. Everything else stays.

### 7.1 Enable the cards, gated on real availability

In `viral-tree-picker.tsx`, replace the hardcoded stub:

```diff
-const unavailable = choice.viewer === "nextstrain";
+const unavailable = choice.viewer === "nextstrain" && !availableIds.has(choice.ref.path);
```

with `availableIds` supplied by the panel:

```tsx
// in viral-phylogeny-panel.tsx
const inventory = useQuery({
  queryKey: ["phylogeny", "nextstrain-inventory"],
  queryFn: async (): Promise<{ ids: string[] }> => {
    const response = await fetch("/api/phylogeny/nextstrain-datasets");
    if (!response.ok) throw new Error(`inventory: ${String(response.status)}`);
    return response.json() as Promise<{ ids: string[] }>;
  },
  staleTime: 60 * 60 * 1000,
});

// Fail closed: an unreachable inventory disables Nextstrain cards rather than
// opening iframes that will 404. Archaeopteryx cards are unaffected.
const availableIds = new Set(inventory.data?.ids ?? []);
```

This is what keeps the known-bad `Orthoebolavirus/100` and `/500` references
(advertised in the manifest, absent from disk — see the availability doc §3.4)
from rendering as clickable cards.

### 7.2 Branch the viewer

`viral-phylogeny-panel.tsx` currently assumes phyloXML. Split on `choice.viewer`
so the XML query never fires for a Nextstrain selection:

```tsx
const isNextstrain = choice?.viewer === "nextstrain";

// Only Archaeopteryx choices resolve to a phyloXML URL; a dataset id is not a URL.
const xmlUrl = choice && !isNextstrain ? resolvePhylogenyUrl(choice.ref.path) : null;
const tree = useViralTreeXml(xmlUrl);            // `enabled: !!url` keeps this inert

const auspiceUrl = isNextstrain && choice ? viewerUrl(choice.ref.path) : null;
```

and render:

```tsx
{isNextstrain ? (
  auspiceUrl === null ? (
    <SectionError title="Tree unavailable" message="Invalid Nextstrain dataset identifier." />
  ) : (
    <iframe
      key={auspiceUrl}                    /* force a clean remount when switching trees */
      src={auspiceUrl}
      title={`Auspice phylogeny viewer for ${choice.ref.name}`}
      className="min-h-[600px] w-full flex-1 border-0"
    />
  )
) : (
  /* …existing ArchaeopteryxPhylogeny branch, unchanged… */
)}
```

Notes on the iframe:

- **No `sandbox` in the first release.** Auspice's downloads, external links, and
  map tiles all need testing before you can pick tokens that don't break it.
  `allow-scripts allow-same-origin` together is equivalent to no sandbox anyway
  for a same-origin frame, so it would buy nothing.
- `key={auspiceUrl}` is what unmounts and remounts on card switch. Without it,
  React reuses the element and the SPA keeps the old dataset.
- Keep the title bar and **Back to trees** button *outside* the iframe.
- Give it a real min-height. `h-full` inside a flex column collapses on mobile.

---

## 8. Step 6 — leave one runnable check

The identifier/resolver path is the security- and correctness-critical part.
One small suite is enough:

```ts
// src/lib/phylogeny/__tests__/nextstrain-dataset.test.ts
import { describe, expect, it } from "vitest";

import { datasetFilename, parseDatasetId, stripViewerPrefix, viewerUrl }
  from "../nextstrain-dataset";

describe("parseDatasetId", () => {
  it("accepts published identifiers and preserves case", () => {
    expect(parseDatasetId("Influenza-A-Virus/H3N2/HA")).toEqual(["Influenza-A-Virus", "H3N2", "HA"]);
    expect(parseDatasetId("/Orthoebolavirus/100/")).toEqual(["Orthoebolavirus", "100"]);
  });

  it.each([
    ["https://evil.test/x", "absolute URL"],
    ["../../etc/passwd",    "traversal"],
    ["a/../b",              "embedded traversal"],
    ["Influenza_A/HA",      "underscore is ambiguous with the on-disk mapping"],
    ["a\\b",                "backslash"],
    ["a//b",                "empty segment"],
    ["a/b?c=1",             "query string"],
    ["",                    "empty"],
  ])("rejects %s (%s)", input => {
    expect(parseDatasetId(input)).toBeNull();
  });
});

describe("stripViewerPrefix", () => {
  it("strips exactly one mount segment", () => {
    expect(stripViewerPrefix("nextstrain-viewer/Influenza-A-Virus/H3N2/HA"))
      .toBe("Influenza-A-Virus/H3N2/HA");
    expect(stripViewerPrefix("/nextstrain-viewer/Orthoebolavirus/100"))
      .toBe("Orthoebolavirus/100");
    // a dataset legitimately named the same must not be double-stripped
    expect(stripViewerPrefix("nextstrain-viewer/nextstrain-viewer/x"))
      .toBe("nextstrain-viewer/x");
  });
});

it("maps identifiers to Auspice's on-disk filenames", () => {
  expect(datasetFilename(["Influenza-A-Virus", "H3N2", "HA"])).toBe("Influenza-A-Virus_H3N2_HA.json");
  expect(datasetFilename(["Influenza-A-Virus", "H3N2", "HA"], "root-sequence"))
    .toBe("Influenza-A-Virus_H3N2_HA_root-sequence.json");
});

it("encodes viewer URLs per segment", () => {
  expect(viewerUrl("Influenza-A-Virus/H3N2/HA")).toBe("/nextstrain-viewer/Influenza-A-Virus/H3N2/HA");
  expect(viewerUrl("../etc")).toBeNull();
});
```

Beyond this, the highest-value additional test is a route test asserting
`getDataset` returns **404 and not 302** for `Influenza-A-Virus/H5N1/HA` — that
is the regression that would reintroduce constraint #4.

---

## 9. Verification

Datasets: copy the nine H3N2 files from
`BV-BRC-Web/lib/auspice-datasets/` and point the env var at them.

```bash
export NEXTSTRAIN_DATASET_DIR=/abs/path/to/auspice-datasets
pnpm build:auspice && pnpm dev
```

```bash
# exact hit → 200, no redirect
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' \
  'http://localhost:3019/api/charon/getDataset?prefix=nextstrain-viewer/Influenza-A-Virus/H3N2/HA'
# expect: 200 (empty redirect field)

# the dangerous case → must be 404, must NOT redirect
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' \
  'http://localhost:3019/api/charon/getDataset?prefix=nextstrain-viewer/Influenza-A-Virus/H5N1/HA'
# expect: 404

# shell serves for any depth
curl -s -o /dev/null -w '%{http_code}\n' \
  'http://localhost:3019/nextstrain-viewer/Influenza-A-Virus/H3N2/HA'
# expect: 200
```

Then in the browser: open the taxon page for `2955291`, filter Viewer →
Nextstrain, open **H3N2 segment 4 (HA)**, confirm a tree + map render with no
React/hydration errors in the console.

Pre-release checklist:

- [ ] `prebuild` runs from a clean checkout and fails the build on Auspice failure
- [ ] Deployed Auspice version matches the pin
- [ ] `NEXTSTRAIN_DATASET_DIR` set, readable, and packaged/mounted in production
- [ ] Every advertised `nextstrain[].path` resolves to exactly one file (§9.1)
- [ ] No dataset lookup returns 3xx
- [ ] `public/dist` present in the standalone artifact and `immutable`-cached
- [ ] CSP allows same-origin framing + the map tile host
- [ ] Desktop and ~390×844 mobile: no horizontal iframe overflow
- [ ] AGPL-3.0 source-availability review done; "Powered by Nextstrain" attribution intact

### 9.1 The drift check worth automating

The manifest and the dataset directory are maintained independently with no
consistency check. That single gap produces the live Orthoebolavirus 404s, and
it looks identical to an unset `NEXTSTRAIN_DATASET_DIR`. Reconcile them in CI or
at startup:

```ts
// pseudo — run against the 154 manifest taxa
for (const taxonId of Object.keys(manifest)) {
  const block = await fetchViralFamilyBlock(taxonId);
  for (const group of block.groups) {
    for (const ref of group.nextstrain ?? []) {
      if (!(await availableDatasetIds()).has(ref.path)) {
        report(`taxon ${taxonId} advertises missing dataset '${ref.path}'`);
      }
    }
  }
}
```

Today that reports exactly two: `Orthoebolavirus/100` and `Orthoebolavirus/500`.

---

## 10. What you will not get

Not defects — consequences of the published data and the iframe boundary. Don't
write tests that assume otherwise.

| Missing | Why | Fix lives where |
|---|---|---|
| Entropy panel, genotype coloring | datasets have no `genome_annotations`, zero branch mutations | upstream `augur` build |
| Time axis, date range, animation | `num_date` on all 550 tips but **no internal nodes incl. root** → Auspice computes `divOnly` | upstream (time-resolve the tree) |
| Tip-frequency / root-sequence / measurements panels | no sidecar files published | upstream |
| Dataset selector, narratives, tanglegram | `getAvailable` intentionally empty | product decision |
| Selection sync with the host page | iframe boundary | would need `postMessage` |
| Metadata download on Nextstrain cards | no `metadata` field on any `nextstrain[]` entry | manifest authoring |
| H5N1 in Auspice | 59 MB phyloXML / 13,207 tips vs ~550 in working datasets; Auspice has no virtualization | upstream subsampling |

---

## 11. Divergences from `auspice-integration-plan.md`

The plan is explicit that implementation stays paused pending approval. Two
places where this guide picks a concrete option — confirm or override:

**1. `serverAddress: "/api/charon"` instead of root `/charon`.** The plan
recommends root for legacy parity. This guide namespaces it because it is one
config line, it maps cleanly onto App Router file paths, and it matches the
existing `src/app/api/` convention. Root `/charon` also works — just drop
`serverAddress` from the config and move the handlers to `src/app/charon/`.
Note this does **not** apply to `/dist`, which is not configurable (§1.2).

**2. Underscores rejected rather than re-encoded.** The plan offers "reject
underscores" or "adopt a collision-free encoding". This guide rejects, because
no published identifier contains one and rejecting is a regex versus a new
encoding scheme on both sides. Revisit if a publisher needs underscores.

Still open, and unaffected by this guide: viewer label (`Auspice` vs
`Nextstrain`), local dataset directory vs proxying the public BV-BRC Charon
service, and the AGPL source-availability process.
