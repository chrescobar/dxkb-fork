// Raw taxonomy doc as returned by the Data API /taxonomy/ resource.
// Indexable so it satisfies InfoPanel's Record<string, unknown> selectedRow contract.
export interface TaxonRecord extends Record<string, unknown> {
  taxon_id: string | number;
  taxon_name: string;
  taxon_rank: string;
  parent_id?: number;
  genomes?: number;
}

// Strain is the leaf rank — no expand toggle, never fetches children (legacy parity).
export function isLeaf(record: TaxonRecord): boolean {
  return record.taxon_rank === "strain";
}

// Rank → Badge color classes for the tree's Rank column. Lookup-map pattern mirrors
// statusConfig in src/lib/jobs/constants.ts. Coarse major-rank tint; unknown ranks
// (and "no rank") fall back to rankBadgeDefault.
export const rankBadgeDefault = "bg-slate-100 text-slate-600 border-slate-200";
export const rankConfig: Record<string, string> = {
  superkingdom: "bg-purple-100 text-purple-700 border-purple-200",
  kingdom: "bg-purple-100 text-purple-700 border-purple-200",
  phylum: "bg-indigo-100 text-indigo-700 border-indigo-200",
  class: "bg-blue-100 text-blue-700 border-blue-200",
  order: "bg-cyan-100 text-cyan-700 border-cyan-200",
  family: "bg-teal-100 text-teal-700 border-teal-200",
  genus: "bg-emerald-100 text-emerald-700 border-emerald-200",
  species: "bg-amber-100 text-amber-700 border-amber-200",
  serotype: "bg-rose-100 text-rose-700 border-rose-200",
  subtype: "bg-rose-100 text-rose-700 border-rose-200",
  strain: "bg-orange-100 text-orange-700 border-orange-200",
};

// Content-Range header looks like "items 0-25/126"; the trailing number is the total.
// Returns null when absent/unparseable so callers can fall back to page length.
export function parseContentRangeTotal(header: string | null): number | null {
  if (!header) return null;
  const total = Number(header.split("/")[1]);
  return Number.isFinite(total) ? total : null;
}
