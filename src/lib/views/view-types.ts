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
