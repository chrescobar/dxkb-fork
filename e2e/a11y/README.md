# a11y Suite Runbook

Accessibility tests for DXKB — WCAG 2.1 Level AA gate.

## Quick start

```bash
pnpm build               # required before any a11y run
pnpm a11y                # full chromium-deep sweep (all specs)
pnpm a11y:routes         # broad route sweep only
pnpm a11y:deep           # deep tier (interaction states)
pnpm a11y:keyboard       # keyboard / focus / no-trap tests
pnpm a11y:primitives     # Vitest browser-mode primitive isolation
pnpm a11y:tripwire       # webkit + firefox cross-engine smoke
pnpm a11y:motion         # prefers-reduced-motion assertion
```

## Architecture

| File | Purpose |
|---|---|
| `gate.ts` | Block/warn classifier — single source of truth for severity rules |
| `baseline.ts` + `baseline.generated.ts` | Per-route baseline suppression (ticketed, maxNodes) |
| `axe-scan.ts` | AxeBuilder factory: tag set, vendor exclusions, formatters |
| `settle.ts` | `awaitSettled()` — networkidle + fonts.ready + zero-skeleton |
| `theme.ts` | `forEachTheme()` — light/dark in-test loop |
| `routes.ts` | Route entry types + full 58-route table (Phase 2) |
| `report.ts` | Scan record accumulator; Phase 5 adds artifact file output |

## Gate rules

```
block if:  (tier == core  && impact in {moderate, serious, critical})
        || (any tier      && impact == critical)
warn  otherwise
```

**Core tags** (blocking tier): `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`
**Extra tags** (warn tier): `best-practice`, `wcag22aa`
**Excluded**: `experimental`

## Baseline

`baseline.generated.ts` holds per-route suppressions for known structural violations:

```ts
{
  "route-name": {
    "dxkb-light": { "rule-id": { maxNodes: N, ticket: "DXKBCORE-xxx" } },
    "dxkb-dark":  { "rule-id": { maxNodes: N, ticket: "DXKBCORE-xxx" } },
  }
}
```

Rules:
- **Critical violations may NEVER be baselined.**
- Every entry requires a `ticket` reference.
- The `"*"` wildcard route applies to all routes lacking a specific entry.
- Run `pnpm a11y:baseline:update` (Phase 2) to regenerate counts from a live run.

## Adding a new route

Phase 2 populates `routes.ts` with all 58 routes. Until then, add entries to the
inline `routes` array in `routes-sweep.spec.ts`.

## Vendor widgets

Molstar, CodeMirror, and visx SVG internals are excluded via `vendorExclusions` in
`axe-scan.ts`. The wrapping element (e.g. `[data-molstar-viewer]`) must still carry
an accessible name — tested separately in `deep-tier.spec.ts`.

## CI

`pnpm-a11y.yml` runs four parallel jobs (one per spec file). All jobs block merging
to `main` on failure. Report artifacts are uploaded per job (14-day retention).
