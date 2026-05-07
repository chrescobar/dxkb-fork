import { Card } from "@/components/ui/card";
import { fetchOrganismSummary } from "@/lib/services/organisms/summary";
import type { OrganismSummary } from "@/lib/services/organisms/types";

const numberFormatter = new Intl.NumberFormat("en-US");

const summaryMetrics: {
  key: keyof OrganismSummary;
  label: string;
  description: string;
}[] = [
  { key: "count", label: "Genomes", description: "Assembled genome records" },
  {
    key: "uniqueFamily",
    label: "Families",
    description: "Unique taxonomy families",
  },
  {
    key: "uniqueGenus",
    label: "Genera",
    description: "Unique taxonomy genera",
  },
  {
    key: "uniqueSpecies",
    label: "Species",
    description: "Unique taxonomy species",
  },
  { key: "cds", label: "CDS", description: "Coding sequences" },
  {
    key: "matPeptide",
    label: "Mature Peptides",
    description: "Annotated mature peptides",
  },
  {
    key: "pdb",
    label: "PDB Structures",
    description: "Protein structure links",
  },
];

function formatCount(value: number | null): string {
  return value === null ? "-" : numberFormatter.format(value);
}

export async function DataSummary({ taxonId }: { taxonId: number }) {
  const summary = await fetchOrganismSummary(taxonId);

  return (
    <div className="grid grid-cols-[repeat(auto-fit,minmax(9.5rem,1fr))] gap-2">
      {summaryMetrics.map((metric) => {
        const formattedValue = formatCount(summary[metric.key]);

        return (
          <Card
            key={metric.key}
            data-testid={`organism-kpi-${metric.key}`}
            className="min-w-0 gap-0.5 rounded-md px-3 py-2.5"
            title={metric.description}
          >
            <p className="text-muted-foreground text-xs font-medium">
              {metric.label}
            </p>
            <p
              className="text-lg leading-tight font-semibold tracking-normal whitespace-nowrap"
              title={formattedValue}
            >
              {formattedValue}
            </p>
          </Card>
        );
      })}
    </div>
  );
}
