// src/lib/taxon-view/predicates.ts
import type { TabContext } from "./tab-context";

// ── organism-kind: "what IS this organism?" (lineage_names) ────────────────
export const isBacteria = (c: TabContext): boolean =>
  c.taxonomy.lineageNames.includes("Bacteria");

// Kingdom predicates for the "neither bacterium nor virus" branch (doc §7.5).
// Building blocks for future per-kingdom tab gates; not yet wired into
// gatesByKey (tab assignments pending product sign-off — see phase-2 plan).
export const isFungi = (c: TabContext): boolean =>
  c.taxonomy.lineageNames.includes("Fungi");

export const isArchaea = (c: TabContext): boolean =>
  c.taxonomy.lineageNames.includes("Archaea");

/**
 * Segmented-genome viruses get a Strains tab. Influenza & relatives sit under
 * the family Orthomyxoviridae; the bunyavirus side keys on the CLASS
 * Bunyaviricetes — NOT the order Bunyavirales. After NCBI's reorg these split:
 * Rift Valley fever (class Bunyaviricetes) matches; Lassa (order Bunyavirales,
 * class Ellioviricetes) does not. See doc §5. Changing either token changes
 * coverage — the predicates.test.ts canary pins this intentionally.
 */
export const hasStrains = (c: TabContext): boolean =>
  c.taxonomy.lineageNames.includes("Orthomyxoviridae") ||
  c.taxonomy.lineageNames.includes("Bunyaviricetes");

// ── curated cohort: "did we BUILD a product for it?" (committed lists) ──────
export const hasSfvt = (c: TabContext): boolean =>
  c.taxonomy.lineageIds.some((id) => c.curatedLists.sfvtTaxonIds.has(id));

export const hasSurveillance = (c: TabContext): boolean =>
  c.taxonomy.lineageNames.some((n) => c.curatedLists.surveillanceLineageNames.has(n));

export const hasSerology = (c: TabContext): boolean =>
  c.taxonomy.lineageNames.some((n) => c.curatedLists.serologyLineageNames.has(n));

// ── data availability: "does the artifact EXIST now?" (remote manifest) ────
/** Exact taxon_id match against the published-tree manifest. Does NOT inherit. */
export const hasViralTree = (c: TabContext): boolean =>
  c.phyloManifest != null &&
  Object.prototype.hasOwnProperty.call(c.phyloManifest.trees, String(c.taxonomy.taxonId));

/** Phylogeny is one label over two gates: bacterial (computed) OR viral (manifest). */
export const hasBacterialOrViralPhylogeny = (c: TabContext): boolean =>
  isBacteria(c) || hasViralTree(c);
