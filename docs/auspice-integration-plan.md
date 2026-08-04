# Auspice Integration Plan

## Status

**Approved and implemented on 2026-08-04. Deployment dataset provisioning and AGPL process remain operational release requirements.**

This plan adds [Auspice](https://docs.nextstrain.org/projects/auspice/en/latest/index.html) as the viewer for viral phylogeny records published as `nextstrain` datasets. It does not replace Archaeopteryx. Existing bacterial and viral phyloXML records continue to use Archaeopteryx.

## Goals

- Open currently disabled Nextstrain choices in an embedded Auspice viewer.
- Follow Auspice's supported standalone-client and Charon API architecture.
- Preserve the legacy BV-BRC route and data conventions where practical.
- Keep Auspice's React runtime isolated from the Next.js application's React runtime.
- Derive advertised viewer choices from published family data rather than a taxon allowlist.
- Enable a choice only when its exact Auspice dataset is available in the configured dataset store.
- Preserve current Archaeopteryx behavior.
- Package and verify Auspice in the standalone production deployment.

## Non-goals

- Replacing Archaeopteryx for phyloXML trees.
- Converting phyloXML to Auspice JSON in the browser or application server.
- Generating phylogenetic trees or Auspice datasets.
- Supporting Auspice narratives in the first release.
- Enabling the Auspice dataset editor, analytics, or service worker.
- Adding a hard-coded influenza, Filoviridae, or Orthoebolavirus allowlist.
- Reproducing the entire legacy BV-BRC action bar inside Auspice.

## Current Application Context

### Tab and data gating

The Phylogeny tab combines two independent paths:

- Bacterial taxa are enabled from lineage and use the dictionary-to-phyloXML flow.
- Viral taxa are enabled by exact taxon ID membership in the published viral manifest.

Relevant code:

- `src/lib/taxon-view/predicates.ts`
- `src/lib/taxon-view/phylo-manifest.ts`
- `src/app/(views)/taxonomy/[taxonId]/views/phylogeny.tsx`

The viral manifest controls whether the tab is available. It does not determine which viewer is available for each tree.

### Viral family records

The viral panel fetches:

```text
https://www.bv-brc.org/api/content/phyloxml_trees/families/<taxonId>/<taxonId>.json
```

Each group may publish two independent arrays:

```ts
interface PhyloGroup {
  key: string;
  title: string;
  archaeopteryx?: PhyloTreeRef[];
  nextstrain?: PhyloTreeRef[];
}
```

- `archaeopteryx[].path` is a phyloXML URL.
- `nextstrain[].path` is an Auspice dataset identifier such as `Influenza-A-Virus/H3N2/HA`.

These paths are different domain values and must not share URL-resolution behavior.

Relevant code:

- `src/lib/services/organisms/phylogeny.ts`
- `src/lib/phylogeny/viral-facets.ts`
- `src/components/phylogeny/viral-tree-picker.tsx`
- `src/components/phylogeny/viral-phylogeny-panel.tsx`

The current port parses and displays Nextstrain choices but deliberately marks them unavailable in `viral-tree-picker.tsx`. `viral-phylogeny-panel.tsx` only fetches and renders phyloXML choices.

## Legacy BV-BRC Findings

The legacy site uses separate viewer paths under one viral tree picker:

- Archaeopteryx choices load phyloXML into the existing viewer.
- Nextstrain choices create an iframe whose source is `/nextstrain-viewer/<dataset-id>`.
- The iframe hosts a standalone Auspice client.
- Auspice obtains data from the same origin through Charon endpoints.

The verified legacy flow for H3N2 HA is:

```text
/view/Taxonomy/2955291#view_tab=phylogenyVirus
  -> /nextstrain-viewer/Influenza-A-Virus/H3N2/HA
  -> /dist/auspice.*.js
  -> /charon/getDataset?prefix=nextstrain-viewer/Influenza-A-Virus/H3N2/HA
  -> /charon/getAvailable?prefix=nextstrain-viewer/Influenza-A-Virus/H3N2/HA
```

The proposed Next.js flow preserves the viewer and asset paths but namespaces the API:

```text
/taxonomy/2955291?tab=phylogeny
  -> /nextstrain-viewer/Influenza-A-Virus/H3N2/HA
  -> /dist/auspice.*.js
  -> /api/charon/getDataset?prefix=nextstrain-viewer/Influenza-A-Virus/H3N2/HA
  -> exact read of Influenza-A-Virus_H3N2_HA.json
```

The deployed legacy viewer reports Auspice `2.73.0` and retains the required "Powered by Nextstrain" attribution.

### Why Auspice is available only for some records

There are three data-driven eligibility levels:

1. The viral manifest decides whether a taxon has a Phylogeny tab.
2. A non-empty `nextstrain` array in that taxon's family JSON advertises a particular Auspice choice.
3. An exact matching v2 JSON file in the configured dataset store makes that advertised choice available.

Use these terms consistently:

- **Advertised:** a family JSON contains the `nextstrain` record.
- **Available:** the normalized dataset identifier resolves to an exact dataset in the configured store.
- **Renderable:** the resolved file is valid Auspice v2 JSON.

A phyloXML tree does not imply that an Auspice v2 dataset was generated. The Auspice resolver itself does not impose a taxonomic restriction, but the current integration is structurally viral-only: bacterial phylogenies use a separate manifest and an Archaeopteryx-only component path.

At the time of this investigation, all 154 manifest-listed family documents were scanned. Nextstrain records appeared only in:

| Taxon ID | Taxon | Advertised records |
| --- | --- | ---: |
| `11266` | Filoviridae | 2 |
| `2955291` | Influenza A virus | 9 |
| `3044781` | Orthoebolavirus | 2 |

These are 13 family entries but only 11 distinct dataset identifiers: Filoviridae and Orthoebolavirus advertise the same two `Orthoebolavirus` datasets.

For taxon `2955291`, H3N2 advertises nine Nextstrain datasets while H5N1 publishes only Archaeopteryx datasets. This is a publication difference, not a hard-coded viewer rule.

### Current dataset inconsistency

All nine advertised H3N2 routes load successfully from the local Charon service:

- `Influenza-A-Virus/H3N2/Concat`
- `Influenza-A-Virus/H3N2/PB2`
- `Influenza-A-Virus/H3N2/PB1`
- `Influenza-A-Virus/H3N2/PA`
- `Influenza-A-Virus/H3N2/HA`
- `Influenza-A-Virus/H3N2/NP`
- `Influenza-A-Virus/H3N2/NA`
- `Influenza-A-Virus/H3N2/M1`
- `Influenza-A-Virus/H3N2/NS1`

The advertised `Orthoebolavirus/100` and `Orthoebolavirus/500` routes return `404` from the local Charon service because their files are absent from the local dataset directory. The same identifiers return valid Auspice v2 datasets from `https://www.bv-brc.org/charon/getDataset`.

The legacy server reads datasets from `NEXTSTRAIN_DATASET_DIR`; it does not proxy ordinary dataset requests to the public BV-BRC Charon service. The family catalog and local dataset directory are maintained independently, with no built-in consistency check.

This inconsistency must be resolved, or missing datasets must be prevented from appearing as usable cards, before rollout is considered complete.

## Auspice Requirements

The plan is based on the official Auspice documentation:

- [Installation](https://docs.nextstrain.org/projects/auspice/en/latest/introduction/install.html)
- [How to run Auspice](https://docs.nextstrain.org/projects/auspice/en/latest/introduction/how-to-run.html)
- [Client customization](https://docs.nextstrain.org/projects/auspice/en/latest/customise-client/overview.html)
- [Client customization API](https://docs.nextstrain.org/projects/auspice/en/latest/customise-client/api.html)
- [Server overview](https://docs.nextstrain.org/projects/auspice/en/latest/server/overview.html)
- [Server API](https://docs.nextstrain.org/projects/auspice/en/latest/server/api.html)

Auspice `2.73.0` supports Node.js 20, 22, and 24. The project currently uses a supported Node.js version.

Auspice is designed as a standalone built client backed by three logical endpoints. Their prefix is configurable through `serverAddress`; this plan serves them under `/api/charon`:

- `/api/charon/getAvailable`
- `/api/charon/getDataset`
- `/api/charon/getNarrative`

Its required dataset is an Auspice v2 JSON document containing `version`, `meta`, and `tree`. Optional sidecars may be requested through the `type` query parameter.

Auspice is licensed under AGPL-3.0. Build-time customizations and source changes must be made publicly available as required by that license. The "Powered by Nextstrain" attribution should remain.

## Architecture Decision

### Use a standalone Auspice build in an iframe

Install a pinned Auspice version as a build dependency and deploy its generated client separately from the Next.js client bundle. Embed that client in a same-origin iframe.

Do not import Auspice as a React component. Auspice `2.73.0` includes its own React 16-era runtime and build system, while this application uses React 19. An iframe:

- prevents React and CSS collisions;
- follows the supported Auspice server model;
- matches the verified legacy deployment;
- provides a stable lifecycle boundary when switching trees;
- avoids adding Auspice's large dependency graph to normal Next.js pages.

### Preserve the viewer route and namespace the API

Use the verified viewer route:

```text
/nextstrain-viewer/<dataset-id>
```

Serve generated, content-hashed assets from root `/dist/`. Auspice `2.73.0` hardcodes webpack's `publicPath` to `/dist/`; build-time extensions cannot change it. Placing generated bundles in `public/dist/` satisfies this contract without an asset rewrite.

Use `serverAddress: "/api/charon"` in the Auspice build configuration. This differs from legacy root `/charon`, but maps directly to this repository's App Router conventions and avoids introducing a second top-level server namespace. The client requests:

```text
/api/charon/getDataset
/api/charon/getAvailable
/api/charon/getNarrative
```

The API namespace does not change the pathname-derived dataset prefix. A viewer at `/nextstrain-viewer/Influenza-A-Virus/H3N2/HA` still sends `prefix=nextstrain-viewer/Influenza-A-Virus/H3N2/HA`, and the handler must strip exactly one viewer mount segment.

### Keep dataset identifiers distinct from URLs

Add a validated Nextstrain dataset identifier type or helper. Do not run these identifiers through `resolvePhylogenyUrl()`, because that helper treats relative values as BV-BRC content URLs.

A valid initial identifier should:

- be a relative, slash-separated path;
- contain no scheme, host, query, fragment, backslash, control character, `.` segment, or `..` segment;
- preserve case because published identifiers are case-sensitive;
- be URL-encoded by segment when constructing the iframe URL;
- contain no underscore if the legacy path-to-filename mapping is retained.

The legacy disk mapping joins path segments with `_` and reverses listings by replacing `_` with `/`. An underscore inside a segment is therefore ambiguous. The first implementation will retain this mapping and reject underscores. No currently published identifier contains an underscore, so this is the smallest unambiguous design.

### Own datasets locally

The first implementation will use a deployment-owned dataset directory rather than proxying public BV-BRC Charon at request time. This matches the working legacy architecture and removes an external runtime dependency from every viewer load.

```text
NEXTSTRAIN_DATASET_DIR=/absolute/path/to/auspice-datasets
Influenza-A-Virus/H3N2/HA
  -> Influenza-A-Virus_H3N2_HA.json
```

The directory may be packaged with the deployment or mounted by deployment infrastructure, but it must be explicit, readable, and health-checked. An upstream proxy can be reconsidered later; it is not part of the initial implementation.

## Target File Layout

The implementation is expected to add or modify the following files:

```text
auspice/
  config.json
  NavBar.jsx                         # optional branding
  Splash.jsx                         # optional embedded empty state
scripts/
  build-auspice.mjs
public/
  dist/                              # generated; gitignored
  nextstrain-viewer.html             # generated; gitignored
  auspice-favicon.png                # generated or copied; gitignored
src/lib/phylogeny/
  nextstrain-dataset.ts              # client-safe identifier and filename rules
  dataset-store.ts                   # server-only inventory and exact reads
  __tests__/nextstrain-dataset.test.ts
src/app/api/charon/getDataset/route.ts
src/app/api/charon/getAvailable/route.ts
src/app/api/charon/getNarrative/route.ts
src/app/api/phylogeny/nextstrain-datasets/route.ts
src/components/phylogeny/
  viral-phylogeny-panel.tsx          # inventory query and iframe branch
  viral-tree-picker.tsx              # availability-gated cards
next.config.ts                       # SPA-shell rewrites
package.json                         # dependency and build lifecycle
.gitignore                           # generated Auspice output
```

The exact test-file split may follow repository conventions, but the runtime boundaries should remain: identifier helpers are client-safe, while filesystem access is isolated in a `server-only` module and Node.js route handlers.

## Implementation Phases

### Phase 1: Pin and configure Auspice

1. Add exact `auspice@2.73.0` as a development dependency with `pnpm add -D auspice@2.73.0`.
2. Do not rely on a globally installed executable or a version range. Auspice documents its client-customization API as unstable and recommends pinning.
3. Add `auspice/config.json` with:
   - `serverAddress: "/api/charon"`;
   - a BV-BRC browser title;
   - the existing BV-BRC-compatible sidebar colors and font;
   - CARTO/OpenStreetMap map tile URL and attribution;
   - optional custom navbar and splash component paths relative to the config file.
4. Keep "Powered by Nextstrain" attribution.
5. Do not set `googleAnalyticsKey`, `enableDatasetEditor`, or `AUSPICE_ENABLE_SERVICE_WORKER`.
6. If a custom splash is added, make it a neutral embedded state such as "Select a tree to view". Dataset failures must still be handled by the host panel or API and must not be hidden as a normal empty state.
7. Verify that pnpm resolves Auspice's own React 16, React DOM, styled-components, and hot-loader dependencies during the first build. Do not allow the build to resolve the application's React 19 runtime.
8. If pnpm's isolated layout prevents Auspice webpack resolution, use a small sibling build package with npm as the fallback. Do not change the entire repository to `node-linker=hoisted` without separate review.

### Phase 2: Build generated client assets

Add `scripts/build-auspice.mjs` with this deterministic sequence:

1. Resolve the repository root, Auspice CLI under `node_modules`, and a scratch directory such as `.auspice-build/`.
2. Delete and recreate the scratch directory.
3. invoke `node node_modules/auspice/auspice.js build --extend auspice/config.json` with the scratch directory as `cwd`.
4. Fail immediately when the CLI or webpack build fails.
5. Delete stale `public/dist/` before copying the new `dist/` output. This prevents orphaned hash bundles from accumulating.
6. Copy the generated `dist/` directory to `public/dist/`.
7. Copy Auspice's favicon to a non-conflicting path such as `public/auspice-favicon.png`.
8. Rewrite only the generated shell's favicon reference from `/favicon.png` to `/auspice-favicon.png`; do not rewrite `/dist/` bundle paths.
9. Write the shell as `public/nextstrain-viewer.html`.
10. Remove the scratch directory in success and failure cleanup.
11. Print the generated destinations for build diagnostics.

Add these generated paths to `.gitignore`:

```gitignore
/public/dist/
/public/nextstrain-viewer.html
/public/auspice-favicon.png
/.auspice-build/
```

Wire the build through package lifecycle scripts:

```json
{
  "scripts": {
    "build:auspice": "node scripts/build-auspice.mjs",
    "prebuild": "pnpm build:auspice",
    "build": "next build"
  }
}
```

If the repository later adds another `prebuild` responsibility, combine them in one explicit script rather than replacing this check.

Expected output is approximately 4.6 MB across content-hashed JavaScript chunks, fonts, and images:

```text
public/dist/auspice.runtime.bundle.<hash>.js
public/dist/auspice.polyfills.bundle.<hash>.js
public/dist/auspice.main.bundle.<hash>.js
public/dist/auspice.chunk.core-vendors.bundle.<hash>.js
public/dist/auspice.chunk.*.bundle.<hash>.js
public/dist/*.{woff,woff2,png}
public/nextstrain-viewer.html
```

The viewer HTML should be uncached or revalidated. Content-hashed `/dist/*` assets should receive long-lived immutable cache headers in production. Ensure `build-pm2` continues copying `public` into `.next/standalone/public`, so generated files are included in the standalone artifact.

### Phase 3: Serve the viewer shell with rewrites

Add `rewrites()` to `next.config.ts`:

```ts
async rewrites() {
  return [
    { source: "/nextstrain-viewer", destination: "/nextstrain-viewer.html" },
    { source: "/nextstrain-viewer/:path*", destination: "/nextstrain-viewer.html" },
  ];
}
```

This serves one generated SPA shell for every dataset path while preserving `window.location.pathname` for Auspice dataset selection. Use a rewrite rather than an App Router route that reads and returns the file manually.

Verification requirements:

1. `/nextstrain-viewer` and every nested viewer path return `public/nextstrain-viewer.html`.
2. `/dist/*` continues resolving from `public/dist/` and is not captured by the viewer rewrite.
3. A missing dataset still receives the shell, but the inventory-gated React UI should normally prevent users from opening it.
4. Direct viewer URLs remain useful for diagnostics and optional open-in-new-tab behavior.
5. `X-Frame-Options` and CSP `frame-ancestors` permit same-origin embedding.
6. CSP `script-src` and `connect-src` permit self-hosted `/dist` and `/api/charon` requests.
7. CSP `img-src` permits the configured CARTO tile hosts for map datasets.
8. The shell is not long-term cached; content-hashed bundles are immutable-cached.

### Phase 4: Implement dataset identifier contracts

Add `src/lib/phylogeny/nextstrain-dataset.ts` as a client-safe module with four focused operations:

1. `parseDatasetId(value)` validates and returns path segments.
2. `viewerUrl(datasetId)` encodes each segment and creates `/nextstrain-viewer/<id>`.
3. `datasetFilename(parts, sidecar?)` maps segments to the retained underscore filename convention.
4. `stripViewerPrefix(prefix)` removes leading slashes and exactly one `nextstrain-viewer/` mount segment.

Concrete validation contract:

- maximum identifier length: 256 characters;
- one to eight path segments;
- each segment starts alphanumeric and then contains only alphanumerics, dots, or dashes;
- no underscore, empty segment, slash within a segment, backslash, query, fragment, scheme, host, `.` or `..`;
- case is preserved and significant;
- leading and trailing slashes may be normalized, but repeated interior slashes are invalid;
- viewer URLs are encoded per segment, never by encoding the complete slash-separated string.

`stripViewerPrefix()` must strip exactly once. For example, `nextstrain-viewer/nextstrain-viewer/x` becomes `nextstrain-viewer/x`, not `x`.

### Phase 5: Implement the exact local dataset store

Add `src/lib/phylogeny/dataset-store.ts` and import `server-only` at its top. It must never be imported by client components.

The store should:

1. Read `NEXTSTRAIN_DATASET_DIR` and resolve it to an absolute path.
2. Throw a configuration error when the variable is unset. Do not convert this to an empty inventory.
3. Define the supported sidecars as `tip-frequencies`, `root-sequence`, and `measurements`.
4. Build and cache a `Promise<Set<string>>` inventory from main `.json` files, excluding recognized sidecar suffixes.
5. Clear the cached promise on inventory-read failure so a transient deployment mount problem can recover.
6. Export a test-only reset function for deterministic environment and filesystem tests.
7. Resolve main and sidecar filenames by exact identifier mapping.
8. Defend against path escape even after validation: verify the resolved target is below the configured directory and verify real paths so a symlink cannot escape the store.
9. Return `null` only for an absent exact dataset or sidecar.
10. Propagate store configuration and directory-read errors so routes can return `500` instead of misreporting `404`.
11. Read and return UTF-8 JSON text without converting or mutating the scientific dataset.

Do not import or wrap `auspice/cli/server/getDataset`. The exact store intentionally replaces its nearest-prefix redirect behavior.

### Phase 6: Implement Node.js API routes

All filesystem-backed handlers must export `runtime = "nodejs"`. Do not allow Next.js to select the Edge runtime.

#### `GET /api/charon/getDataset`

Add `src/app/api/charon/getDataset/route.ts` with this contract:

1. Require `prefix`; return `400` JSON when absent.
2. Treat a missing `type` or legacy `type=tree` as the main dataset.
3. Accept only `tip-frequencies`, `root-sequence`, or `measurements` for sidecars; return `400` for every other type.
4. Strip exactly one `nextstrain-viewer/` prefix and validate the resulting identifier.
5. Call the exact local store read; never call Auspice's server helper.
6. Return `404` JSON when the exact main dataset or requested sidecar is absent.
7. Return `500` with a generic `dataset store unavailable` response when configuration or directory access fails. Log the normalized identifier and server error without exposing filesystem paths to the client.
8. Return unmodified JSON text with `Content-Type: application/json`.
9. Start with `Cache-Control: public, max-age=300, stale-while-revalidate=3600`; adjust only if dataset publication semantics require stronger invalidation.
10. Never redirect.

This exact-match rule is a scientific correctness requirement. `Influenza-A-Virus/H5N1/HA` must return `404`; it must never display H3N2 through nearest-match fallback.

The handler must support:

```text
/api/charon/getDataset?prefix=nextstrain-viewer/Influenza-A-Virus/H3N2/HA
/api/charon/getDataset?prefix=nextstrain-viewer/Influenza-A-Virus/H3N2/HA&type=root-sequence
```

Sidecar `404`s are normal. Current datasets have no root-sequence, tip-frequency, or measurements files. Do not fabricate sidecars to suppress Auspice console output.

#### `GET /api/charon/getAvailable`

Add `src/app/api/charon/getAvailable/route.ts` and deliberately return:

```json
{
  "datasets": [],
  "narratives": []
}
```

Direct family cards choose datasets. Keeping this response empty suppresses Auspice's global dataset selector and second-tree/tanglegram picker.

#### `GET /api/charon/getNarrative`

Add `src/app/api/charon/getNarrative/route.ts` and return a controlled `501` JSON response. Narratives are out of scope, and this route must not expose filesystem lookup from an unvalidated path.

#### `GET /api/phylogeny/nextstrain-datasets`

Add a host-application inventory endpoint separate from Auspice's intentionally empty catalog:

1. Call the cached `availableDatasetIds()` store function.
2. Return `{ "ids": ["..."] }` on success.
3. Return `500` with a generic store-unavailable response on configuration or directory failure.
4. Export `runtime = "nodejs"`.
5. Do not return absolute paths, filenames, or sidecars.

This endpoint lets the picker fail closed: if inventory is unavailable, Nextstrain cards remain visible as advertised records but disabled; Archaeopteryx remains unaffected.

### Phase 7: Separate phylogeny reference semantics

1. Keep `PhyloTreeRef` if a shared display shape remains useful, but treat `path` according to the containing viewer type.
2. Use `viewerUrl()` from the client-safe identifier module for Nextstrain choices.
3. Continue resolving Archaeopteryx and metadata URLs through the existing URL policy.
4. Do not resolve a Nextstrain identifier against `https://www.bv-brc.org` as if it were a file URL.
5. Add explicit tests demonstrating the difference:

```text
Archaeopteryx:
https://www.bv-brc.org/api/content/phyloxml_trees/H3N2/segment_4_clade.xml

Nextstrain dataset ID:
Influenza-A-Virus/H3N2/HA

Auspice viewer URL:
/nextstrain-viewer/Influenza-A-Virus/H3N2/HA
```

### Phase 8: Load inventory and gate Nextstrain cards

Update `src/components/phylogeny/viral-phylogeny-panel.tsx` to query `/api/phylogeny/nextstrain-datasets` through TanStack Query:

1. Use a stable key such as `["phylogeny", "nextstrain-inventory"]`.
2. Validate the response shape before constructing a `Set<string>`.
3. Cache successful inventory for one hour; datasets are deployment artifacts, not rapidly changing user data.
4. Fail closed: pending or failed inventory means no Nextstrain identifier is considered available.
5. Do not block the viral family request or Archaeopteryx cards while inventory loads or fails.
6. Pass the availability set and inventory state into `ViralTreePicker`.

Update `src/components/phylogeny/viral-tree-picker.tsx`:

1. Replace the hardcoded `choice.viewer === "nextstrain"` unavailable rule with `choice.viewer === "nextstrain" && !availableIds.has(choice.ref.path)`.
2. Keep advertised-but-unavailable records visible and disabled so users can distinguish missing deployment data from an absent publication. Show concise text such as `Auspice dataset unavailable`.
3. Preserve card mouse and keyboard activation for available records.
4. Preserve the existing viewer facet and group/segment filters.
5. Use a clear viewer label. Recommended product label: `Auspice`, with supporting text `Nextstrain phylogenomic viewer`.
6. Keep metadata downloads independent from card activation.
7. Do not hide Archaeopteryx choices when both formats exist.
8. Do not issue one availability request per card.

This gating keeps the known missing `Orthoebolavirus/100` and `Orthoebolavirus/500` records visible but non-actionable until their files exist.

### Phase 9: Add the iframe viewer branch

Update `src/components/phylogeny/viral-phylogeny-panel.tsx`:

1. Derive `isNextstrain` from the selected choice.
2. Resolve `xmlUrl` only for Archaeopteryx choices. This keeps `useViralTreeXml()` disabled for Nextstrain and prevents an identifier from becoming a false BV-BRC URL.
3. Derive `auspiceUrl` with `viewerUrl(choice.ref.path)` only for Nextstrain choices.
4. For Archaeopteryx, preserve the existing loading, error, XML query, and `ArchaeopteryxPhylogeny` renderer.
5. For Nextstrain, show a `SectionError` if identifier validation unexpectedly fails.
6. Otherwise render an iframe with:
   - `key={auspiceUrl}` to force a clean SPA remount when the dataset changes;
   - `src={auspiceUrl}`;
   - `title={`Auspice phylogeny viewer for ${choice.ref.name}`}`;
   - full available width and flex height;
   - `min-height: 600px` for mobile stability;
   - no border.
7. Keep the viewer title and `Back to trees` button outside the iframe.
8. Do not add an iframe `sandbox` in the first release. `allow-scripts allow-same-origin` provides no meaningful isolation for a same-origin frame, while stricter policies may break downloads and navigation.
9. Load immediately after explicit card selection; do not add lazy loading.
10. Returning to the picker must unmount the iframe. Switching choices must create a new iframe and refetch the new dataset.
11. Consider `Open in new tab` later; it is not required for initial parity.

### Phase 10: Failure behavior

The legacy site allows a missing dataset to fall through to Auspice's empty splash page. The new implementation should provide clearer behavior.

1. Validate the selected dataset identifier before rendering the iframe.
2. Use `/api/phylogeny/nextstrain-datasets` to disable advertised records that have no exact dataset match. Do not preflight each card or dataset click when the cached inventory is healthy.
3. Distinguish:
   - invalid dataset identifier;
   - advertised family record with missing dataset;
   - exact dataset lookup redirected to a different identifier;
   - missing or unreadable dataset directory;
   - upstream timeout;
   - malformed Auspice JSON;
   - Auspice client asset failure.
4. Show an in-panel error with `Back to trees` still available.
5. Avoid silently presenting an empty global catalog for a selected tree.
6. Never fall back to a similarly named dataset.
7. Log enough server context to diagnose the dataset identifier without logging sensitive request data.
8. Resolve the local `Orthoebolavirus/100` and `Orthoebolavirus/500` gap before production acceptance, or prevent those unavailable records from being activated through the validated inventory.

## First-release Capability Boundaries

The current datasets and iframe architecture intentionally limit first-release behavior:

- The nine H3N2 datasets provide tree and map panels but no entropy panel, genotype coloring, or mutation display because they lack genome annotations and branch mutation sets.
- H3N2 is divergence-only in Auspice because internal nodes lack `num_date`; date animation, date-range inputs, and the divergence/time selector are not expected.
- No root-sequence, tip-frequency, or measurements sidecars are currently published.
- An empty `getAvailable` response means no dataset selector, narratives, second-tree picker, or tanglegram.
- The iframe has no selection synchronization with the surrounding Taxon View, no p3 topic-bus integration, and no add-selection-to-group action.
- Switching cards unmounts and recreates the iframe, which reboots the Auspice SPA and refetches the dataset.
- Nextstrain family records currently have no Archaeopteryx-style metadata tarball, so the surrounding metadata download action is absent for these choices.

These are accepted scope boundaries, not frontend defects. Tests must not require these capabilities. Producing time-resolved trees, mutation annotations, sidecars, or additional datasets is upstream data-production work.

Large-tree support is also not implied by installing the viewer. H5N1 segment 4 has approximately 13,207 annotated tips in a 59 MB phyloXML file, versus roughly 550 tips in each working H3N2 Auspice dataset. Any future H5N1 Auspice publication requires an explicit performance assessment and likely upstream subsampling; a direct conversion is out of scope.

## Testing Plan

### Unit tests

Add tests for:

- published identifiers such as `Influenza-A-Virus/H3N2/HA` and `/Orthoebolavirus/100/` are accepted and preserve case;
- maximum identifier length and segment count;
- rejection of absolute URLs, schemes, query strings, fragments, traversal, backslashes, repeated interior slashes, control characters, and underscores;
- exact filename mappings such as `Influenza-A-Virus_H3N2_HA.json` and `_root-sequence.json`;
- segment-wise viewer URL encoding;
- Charon prefix normalization with and without a leading slash;
- stripping exactly one `nextstrain-viewer/` prefix, including the double-prefix canary;
- exact store reads and symlink/path-escape rejection;
- inventory caching, retry after failure, and test reset;
- supported and unsupported sidecar types;
- family parsing with missing, empty, and populated `nextstrain` arrays;
- flattening and filtering mixed Archaeopteryx/Auspice choices;
- preservation of Archaeopteryx URL behavior.

### Route tests

Cover:

- successful exact v2 dataset response from a temporary dataset directory;
- `prefix` required and `type=tree` treated as the main dataset;
- local dataset directory unset, missing, and unreadable returns `500` rather than `404`;
- advertised dataset missing from disk returns `404` without redirect;
- `Influenza-A-Virus/H5N1/HA` specifically returns `404`, never `302` and never H3N2 content;
- duplicate family references can resolve to one exact dataset without duplicate inventory entries;
- malformed local JSON is caught by health/reconciliation validation before UI enablement;
- optional sidecar success and normal sidecar absence;
- unsupported sidecar type returns `400`;
- method restrictions;
- cache and content-type headers;
- malicious prefixes;
- empty `getAvailable` response shape;
- controlled `501` narrative rejection;
- inventory endpoint success, deduplication, and store-unavailable failure.

### Component tests

Cover:

- advertised and available Nextstrain cards are actionable;
- advertised but unavailable records remain visible and disabled;
- pending or failed inventory fails closed without disabling Archaeopteryx;
- no Nextstrain viewer is invented for an Archaeopteryx-only group;
- viewer labels and supporting text;
- iframe URL, key, title, and minimum height;
- XML is not fetched for a Nextstrain selection;
- Archaeopteryx still receives XML selections;
- back navigation unmounts the iframe;
- switching dataset IDs remounts the iframe;
- invalid identifiers show an error.

### End-to-end tests

Use representative datasets with mocked Charon responses for deterministic CI:

1. Taxon `2955291`, H3N2 HA:
   - choose Nextstrain/Auspice;
   - open the HA card;
   - assert the iframe route;
   - assert the dataset endpoint receives the normalized prefix;
   - assert a tree-and-map Auspice dataset renders;
   - return to the picker.
2. Taxon `2955291`, H5N1:
   - assert it remains Archaeopteryx-only.
3. Taxon `3044781` or `11266`:
   - assert a tree-only Auspice dataset renders without requiring a map panel.
4. Missing dataset:
   - assert a clear error rather than a misleading empty catalog.
5. Keyboard activation:
   - open a card with Enter and Space;
   - return focus predictably after leaving the viewer.
6. Responsive behavior:
   - desktop viewport;
   - mobile viewport near `390x844`;
   - no horizontal iframe overflow;
   - sufficient iframe height.
7. Runtime quality:
   - no React or hydration conflicts;
   - no unexpected console exceptions;
   - map tile requests are allowed when a map panel exists;
   - attribution and download controls remain present.

### Reconciliation check

Add a build/startup reconciliation command plus a scheduled smoke check:

1. Fetch the viral manifest.
2. Fetch each manifest taxon's family block.
3. Collect every `nextstrain[].path`, retaining taxon and group references for diagnostics.
4. Validate every identifier with the shared parser.
5. Compare distinct advertised IDs to `availableDatasetIds()`.
6. Open each available main file and minimally validate `version: "v2"`, `meta`, and `tree`.
7. Report missing files once per dataset ID while listing all referring taxa/groups.
8. Report unadvertised local main files as warnings, not failures, unless deployment policy says otherwise.
9. Always fail on an invalid, ambiguous, or malformed advertised dataset.
10. Handle an advertised-but-missing dataset according to the approved rollout policy:
    - **strict:** fail CI or deployment health;
    - **gated:** emit a prominent warning and verify the inventory endpoint leaves every referring card disabled.
11. Require direct route smoke checks for available records to return bare `200` with no redirect.

Today this check should report exactly two missing distinct identifiers: `Orthoebolavirus/100` and `Orthoebolavirus/500`. It also detects an unset `NEXTSTRAIN_DATASET_DIR` and filename-mapping drift.

## Build and Release Verification

Before release, run direct contract checks against the production-like server:

```bash
# Exact hit: 200 and an empty redirect URL.
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' \
  'http://localhost:3019/api/charon/getDataset?prefix=nextstrain-viewer/Influenza-A-Virus/H3N2/HA'

# Dangerous near miss: 404, never 302 and never H3N2.
curl -s -o /dev/null -w '%{http_code} %{redirect_url}\n' \
  'http://localhost:3019/api/charon/getDataset?prefix=nextstrain-viewer/Influenza-A-Virus/H5N1/HA'

# SPA shell is served at arbitrary valid route depth.
curl -s -o /dev/null -w '%{http_code}\n' \
  'http://localhost:3019/nextstrain-viewer/Influenza-A-Virus/H3N2/HA'
```

Then complete this checklist:

1. Run the Auspice build from a clean checkout.
2. Run `pnpm typecheck`.
3. Run `pnpm lint`.
4. Run relevant Vitest suites.
5. Run targeted Playwright phylogeny tests.
6. Run `pnpm build`.
7. Start and test the standalone production artifact, not only `next dev`.
8. Verify `/nextstrain-viewer/<dataset-id>` serves the viewer shell.
9. Verify all referenced `/dist` assets are included and cacheable.
10. Verify `NEXTSTRAIN_DATASET_DIR` is configured, readable, and included or mounted in the production environment when local ownership is selected.
11. Verify every advertised identifier has an exact dataset match and that no lookup redirects.
12. Verify `/api/charon` endpoints work behind the production reverse proxy.
13. Verify iframe headers permit same-origin embedding.
14. Verify production CSP permits configured map tiles.
15. Verify all advertised Nextstrain routes or explicitly gate unavailable records.
16. Verify the deployed Auspice version is the pinned version.
17. Complete AGPL source-availability and attribution review.

## Rollout Strategy

1. Land the pinned dependency, Auspice configuration, build script, generated-output ignores, and viewer rewrite. Verify the direct shell and bundles before adding API or UI behavior.
2. Land identifier and exact-store modules with unit tests. The H5N1-never-H3N2 regression test is a merge gate.
3. Land `/api/charon` and inventory routes. Verify local exact hits, missing exact IDs, sidecar absence, and store misconfiguration from a production-like Node process.
4. Package or mount the nine H3N2 datasets and configure an absolute `NEXTSTRAIN_DATASET_DIR` in every target environment.
5. Run reconciliation. Resolve the two Orthoebolavirus files or accept that their advertised cards will remain disabled.
6. Land inventory-gated picker behavior while keeping Nextstrain viewer opening disabled if a separate feature flag is desired.
7. Land the iframe branch and verify H3N2 HA end to end on desktop and mobile.
8. Enable available Nextstrain cards after standalone production verification succeeds.
9. Monitor `getDataset` `400`/`404`/`500` rates, inventory failures, viewer asset failures, and dataset load latency.
10. Keep Archaeopteryx unchanged where both formats are published.
11. Do not automatically substitute Archaeopteryx or another Auspice dataset when a selected dataset fails; report the failure and return control to the picker.

## Acceptance Criteria

The integration is complete when:

- Auspice is pinned and reproducibly built as part of the deployment.
- Auspice is isolated from the Next.js React runtime.
- `/nextstrain-viewer/<dataset-id>` rewrites to the generated shell and loads in a same-origin iframe.
- Generated `/dist` assets are present in the standalone artifact and served from the hardcoded root path.
- `/api/charon` handlers run in the Node.js runtime.
- The Charon boundary validates and normalizes dataset prefixes.
- Dataset lookup is exact and can never redirect to or return a different tree.
- `Influenza-A-Virus/H5N1/HA` returns `404` and never H3N2 content.
- The configured dataset directory fails health checks when unset, missing, or unreadable.
- The inventory endpoint exposes IDs only and fails closed when the store is unavailable.
- Advertised family records are checked against the dataset store before their cards are enabled.
- Optional dataset sidecars are handled intentionally.
- Available Nextstrain cards are keyboard and mouse actionable.
- Archaeopteryx behavior is unchanged.
- H3N2 tree-and-map data renders successfully.
- A non-influenza tree-only dataset renders successfully.
- Missing datasets show a clear application error.
- Desktop and mobile layouts work without horizontal iframe overflow.
- Production standalone packaging contains all Auspice assets.
- Attribution and AGPL obligations are satisfied.
- The current Orthoebolavirus local dataset discrepancy is resolved or explicitly gated.

## Approval Decisions

This revision selects the following technical defaults:

- local datasets through `NEXTSTRAIN_DATASET_DIR`;
- legacy underscore filename mapping with underscores rejected in identifiers;
- root `/dist` assets;
- namespaced `/api/charon` handlers;
- inventory-gated cards that remain visible but disabled when files are absent;
- exact local reads with no redirects.

Review should explicitly approve the remaining product and operational decisions:

1. **Viewer label:** `Auspice` versus legacy-facing `Nextstrain`.
2. **Dataset packaging:** commit/copy the nine H3N2 JSON files into this deployment artifact, or mount a separately managed dataset directory.
3. **Orthoebolavirus rollout:** supply the two missing files before release, or intentionally ship their four advertised card entries disabled.
4. **Reconciliation policy:** block production builds on remote family-catalog drift, or run the same check as a deployment/startup gate to avoid making builds depend on the content API.
5. **License process:** how the deployed Auspice build and customizations will be made publicly available under AGPL-3.0.

Implementation proceeded after approval. Deployments must configure `NEXTSTRAIN_DATASET_DIR`, select gated or strict reconciliation, and complete the AGPL source-availability process before release.
