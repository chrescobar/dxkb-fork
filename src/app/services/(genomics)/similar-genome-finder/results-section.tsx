"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DataTable } from "@/components/shared/data-table";
import type { SimilarGenomeFinderController } from "./use-similar-genome-finder-form";

const columns = [
  { id: "genome_id", label: "Genome ID" },
  { id: "genome_name", label: "Genome Name" },
  { id: "organism_name", label: "Organism" },
  { id: "genome_status", label: "Genome Status" },
  { id: "genome_quality", label: "Genome Quality" },
  { id: "distance", label: "Distance" },
  { id: "pvalue", label: "P Value" },
  { id: "counts", label: "K-mer Counts" },
] as const;

export function ResultsSection({
  controller,
}: {
  controller: SimilarGenomeFinderController;
}) {
  const { results, isSubmitting } = controller;
  return (
    <div className="mt-8">
      <Card>
        <CardHeader className="service-card-header">
          <CardTitle className="service-card-title">Results</CardTitle>
        </CardHeader>
        <CardContent className="service-card-content">
          <DataTable
            id="similar-genome-finder-results"
            data={results as unknown as Record<string, unknown>[]}
            columns={[...columns]}
            totalItems={results.length}
            resource="similar-genome-finder-results"
            isLoading={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
