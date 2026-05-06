import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchOrganismSummary } from "@/lib/services/organisms/summary";
import type { OrganismSummary } from "@/lib/services/organisms/types";

const numberFormatter = new Intl.NumberFormat("en-US");

const summaryMetrics: {
  key: keyof OrganismSummary;
  label: string;
  description: string;
}[] = [
  { key: "count", label: "Genomes", description: "Assembled genome records" },
  { key: "uniqueFamily", label: "Families", description: "Unique taxonomy families" },
  { key: "uniqueGenus", label: "Genera", description: "Unique taxonomy genera" },
  { key: "uniqueSpecies", label: "Species", description: "Unique taxonomy species" },
  { key: "cds", label: "CDS", description: "Coding sequences" },
  { key: "matPeptide", label: "Mature Peptides", description: "Annotated mature peptides" },
  { key: "pdb", label: "PDB Structures", description: "Protein structure links" },
];

function formatCount(value: number | null): string {
  return value === null ? "-" : numberFormatter.format(value);
}

export async function DataSummary({ taxonId }: { taxonId: number }) {
  const summary = await fetchOrganismSummary(taxonId);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
      {summaryMetrics.map((metric) => (
        <Card
          key={metric.key}
          data-testid={`organism-kpi-${metric.key}`}
          className="rounded-lg"
        >
          <CardHeader>
            <CardDescription>{metric.label}</CardDescription>
            <CardTitle className="text-2xl font-semibold tracking-normal">
              {formatCount(summary[metric.key])}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs leading-5 text-muted-foreground">
              {metric.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
