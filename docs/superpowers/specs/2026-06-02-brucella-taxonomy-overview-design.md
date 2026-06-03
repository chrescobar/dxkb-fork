# Brucella Taxonomy Overview Page — Design Spec

**Date:** 2026-06-02  
**Branch:** DXKBCORE-159  

---

## Goal

Add an Overview page for Brucella accessible at `/taxonomy/234`. Clicking "Brucella" in the bacteria landing page's Featured Genera grid navigates to this internal route instead of the external BV-BRC URL.

---

## Route

`src/app/(views)/taxonomy/[taxonId]/`

Dynamic segment so the URL `/taxonomy/234` is served. The page config is hardcoded for Brucella (taxon 234) — a proper lookup system will be added in a follow-up.

---

## Architecture

Mirrors the existing `organisms/bacteria` pattern exactly:

```
src/app/(views)/taxonomy/
  layout.tsx                          ← Navbar + Footer (mirrors organisms/layout.tsx)
  [taxonId]/
    _config.ts                        ← Hardcoded Brucella config
    _components/
      nav-items.tsx                   ← Same tabs as bacteria; all placeholder except Overview
    views/
      overview.tsx                    ← DataSummary + MetadataDistributions
    page.tsx                          ← Reads taxonId from params, renders OrganismLandingShell
```

---

## Config (`_config.ts`)

```ts
export const brucellaTaxonomyConfig: OrganismLandingConfig = {
  displayName: "Brucella",
  taxonId: 234,
  accent: "bacteria",
  defaultView: "overview",
  metadataFields: ["host_name", "isolation_country", "isolation_source"],
};
```

The `taxonId` from the URL param is passed separately to the data-fetching components (`DataSummary`, `MetadataDistributions`). The config's `taxonId` is used as a fallback and for consistency.

---

## Page (`page.tsx`)

- Reads `taxonId` from `params` (async, App Router style)
- Passes the config and nav items to `OrganismLandingShell`
- Marks `dynamic = "force-dynamic"` (same as other organism pages)

---

## Overview View

- `DataSummary` (genome stats KPI cards) — wrapped in `Suspense` + `withSectionError`
- `MetadataDistributions` (donut charts for host, country, isolation source) — wrapped in `Suspense` + `withSectionError`
- No `FeaturedOrganismsGrid` — Brucella is genus-level, not a superkingdom

---

## Nav Items

Same 16 tabs as `organisms/bacteria` (Overview, Phylogeny, Taxonomy, Genomes, AMR Phenotypes, Sequences, Features, Proteins, Protein Structures, Specialty Genes, Domains and Motifs, Epitopes, Pathways, Subsystems, Experiments, Interactions). All tabs except Overview use `makePlaceholderView`.

---

## Link Update

`src/components/organisms/genera-grid/featured-genera-data.ts`:

- Change Brucella entry from `href: "https://www.bv-brc.org/view/Taxonomy/234#view_tab=overview"` → `href: "/taxonomy/234"`
- All other genera remain external links (unchanged)

---

## Out of Scope

- Generic taxon lookup (display name, metadata fields from an API or config map)
- Any view other than Overview (all others are placeholder stubs)
- Updating any other genera's hrefs
