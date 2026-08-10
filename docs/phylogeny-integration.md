# Phylogeny integration

DXKB's taxonomy Phylogeny view supports two renderers. Archaeopteryx renders phyloXML directly in the application. Auspice is built as a separate same-origin client and runs in an iframe at `/nextstrain-viewer/<dataset-id>`.

## Data flow

Viral family JSON advertises Archaeopteryx and Nextstrain choices. Advertised Nextstrain choices are enabled when `/api/phylogeny/nextstrain-datasets` confirms that the corresponding BV-BRC dataset exists, or when an optional local fallback contains a renderable copy. Inventory loading or failure is shown separately from confirmed dataset absence.

Auspice calls the local Charon-compatible routes under `/api/charon`, which fetch from BV-BRC first and fall back to the optional local store when the remote dataset is missing or unavailable. Dataset IDs are canonical slash-separated identifiers; main files in the fallback directory use the same segments joined by underscores and a `.json` suffix. Sidecars use the supported `_tip-frequencies`, `_root-sequence`, and `_measurements` suffixes. Because those suffixes are indistinguishable from a real final ID segment of the same name, `tip-frequencies`, `root-sequence`, and `measurements` are reserved and rejected as a dataset ID's final segment (`parseDatasetId`/`canonicalDatasetId`) — a main dataset must not be named after a sidecar.

## Deployment

`NEXTSTRAIN_DATASET_DIR` is optional. Leave it unset for the default remote-only configuration. Set it to an absolute, readable directory only when the deployment should use local datasets as a fallback for BV-BRC misses or outages. A configured but unreadable directory is treated as a deployment error.

When a local fallback is provisioned, run `pnpm check:nextstrain-datasets`. It reconciles family advertisements with the exact validation policy used by runtime inventory, including filename validity, sidecar exclusion, realpath containment, regular-file status, JSON parsing, and supported Auspice v2 shapes. Use `--strict` when missing advertised fallback datasets must fail a deployment gate; unadvertised valid local datasets remain warnings.

`pnpm build:auspice` creates `public/dist` and `public/nextstrain-viewer.html`. The build retains third-party `.LICENSE.txt` notices and removes only unserved precompressed files and the copied `dist/index.html`. Its content hash covers the build script, Auspice config/navbar, package metadata, lockfile, and Auspice patches. Clean CI requires restored output or a cache keyed by those inputs before the local skip can save work.

Standalone deployments must include `public/dist`, `public/nextstrain-viewer.html`, `public/auspice-dark.css`, and `public/auspice-favicon.png`.

## Licensing and attribution

Auspice is AGPL-3.0. Releases must provide the corresponding Auspice source and DXKB build-time customizations as required by that license. Complete this source-availability review as a release requirement rather than assuming npm package availability alone is sufficient.

Keep the visible "Powered by Nextstrain" attribution and the configured CARTO/OpenStreetMap tile attribution. Retain generated third-party license notices unless legal review approves another distribution mechanism.

## References

- `src/lib/phylogeny/dataset-inventory.ts`: shared renderability policy
- `src/lib/phylogeny/dataset-store.ts`: runtime inventory cache and exact reads
- `scripts/check-nextstrain-datasets.ts`: deployment reconciliation
- `scripts/build-auspice.mjs`: client build and packaging
- `docs/bvbrc-auspice-nextstrain-integration.md`: dated legacy BV-BRC behavior and curated-data rationale
