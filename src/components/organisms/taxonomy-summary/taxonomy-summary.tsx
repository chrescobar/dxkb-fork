import { Card } from "@/components/ui/card";
import { fetchOrganismSummary } from "@/lib/services/organisms/summary";
import { fetchOrganismTaxonomy } from "@/lib/services/organisms/taxonomy";
import { numberFormatter } from "@/lib/services/organisms/utils";

function formatCount(value: number | null): string {
  return value === null ? "-" : numberFormatter.format(value);
}

export async function TaxonomySummary({ taxonId }: { taxonId: number }) {
  // allSettled: failing one endpoint shouldn't blank the entire summary card.
  const [summaryResult, taxonResult] = await Promise.allSettled([
    fetchOrganismSummary(taxonId),
    fetchOrganismTaxonomy(taxonId),
  ]);

  const summary = summaryResult.status === "fulfilled" ? summaryResult.value : null;
  const taxon = taxonResult.status === "fulfilled" ? taxonResult.value : null;

  if (!summary && !taxon) {
    if (summaryResult.status === "rejected") throw summaryResult.reason;
    if (taxonResult.status === "rejected") throw taxonResult.reason;
  }

  const metrics: { label: string; value: string; description: string }[] = [
    { label: "Taxon ID", value: taxon ? String(taxon.taxonId) : String(taxonId), description: "NCBI taxonomy identifier" },
    { label: "Taxon Name", value: taxon?.taxonName ?? "-", description: "Scientific name of the taxon" },
    { label: "Taxon Rank", value: taxon?.taxonRank ?? "-", description: "Taxonomic rank" },
    { label: "Species", value: formatCount(summary?.uniqueSpecies ?? null), description: "Unique taxonomy species" },
    { label: "Genomes / Segments", value: formatCount(summary?.count ?? null), description: "Assembled genome records" },
    { label: "Protein Coding Genes (CDS)", value: formatCount(summary?.cds ?? null), description: "Coding sequences" },
    { label: "3D Protein Structures (PDB)", value: formatCount(summary?.pdb ?? null), description: "Protein structure links" },
  ];

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(8rem,1fr))] gap-1.5">
      {metrics.map((metric) => (
        <Card
          key={metric.label}
          className="min-w-0 gap-0 rounded-md px-2.5 py-1.5 shadow-none"
          title={metric.description}
        >
          <p className="text-muted-foreground text-[11px] font-bold uppercase tracking-wider">
            {metric.label}
          </p>
          <p
            className="text-lg leading-tight font-bold tracking-tight whitespace-nowrap"
            title={metric.value}
          >
            {metric.value}
          </p>
        </Card>
      ))}
    </div>
  );
}
