import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { GenomeViewRecord } from "@/lib/genome-view";
import { genomeFeatureRql } from "@/lib/views/child-resources";
import { featureListHref } from "@/lib/views/hrefs";

function display(value: unknown): string {
  if (value == null || value === "") return "Not available";
  if (Array.isArray(value)) return value.map((item) => String(item)).join(", ");
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    typeof value === "bigint"
  )
    return String(value);
  return JSON.stringify(value);
}

function Field({ label, value }: { label: string; value: unknown }) {
  if (value == null || value === "") return null;
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-0.5 wrap-break-word">{display(value)}</dd>
    </div>
  );
}

function FeatureCount({
  genomeId,
  label,
  type,
  value,
}: {
  genomeId: string;
  label: string;
  type?: string;
  value: unknown;
}) {
  if (value == null || value === "") return null;
  return (
    <div>
      <dt className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
        {label}
      </dt>
      <dd className="mt-0.5">
        <Link
          className="text-primary underline"
          href={featureListHref(genomeFeatureRql(genomeId, type))}
        >
          {display(value)}
        </Link>
      </dd>
    </div>
  );
}

function MetadataCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2">{children}</dl>
      </CardContent>
    </Card>
  );
}

export function GenomeOverview({ genome }: { genome: GenomeViewRecord }) {
  const cds = genome.cds ?? genome.patric_cds;
  return (
    <div className="grid gap-4 pb-6 xl:grid-cols-2">
      <MetadataCard title="Assembly summary">
        <Field label="Genome length" value={genome.genome_length} />
        <Field label="Contigs" value={genome.contigs} />
        <Field label="Chromosomes" value={genome.chromosomes} />
        <Field label="Plasmids" value={genome.plasmids} />
        <Field label="GC content" value={genome.gc_content} />
        <Field label="Assembly accession" value={genome.assembly_accession} />
        <Field label="GenBank accessions" value={genome.genbank_accessions} />
      </MetadataCard>
      <MetadataCard title="Quality and status">
        <Field label="Genome status" value={genome.genome_status} />
        <Field label="Genome quality" value={genome.genome_quality} />
        <Field label="Quality flags" value={genome.genome_quality_flags} />
        <Field label="CheckM completeness" value={genome.checkm_completeness} />
        <Field
          label="CheckM contamination"
          value={genome.checkm_contamination}
        />
      </MetadataCard>
      <MetadataCard title="Annotation summary">
        <FeatureCount
          genomeId={genome.genome_id}
          label="CDS"
          type="CDS"
          value={cds}
        />
        <FeatureCount
          genomeId={genome.genome_id}
          label="tRNA"
          type="tRNA"
          value={genome.trna}
        />
        <FeatureCount
          genomeId={genome.genome_id}
          label="rRNA"
          type="rRNA"
          value={genome.rrna}
        />
        <FeatureCount
          genomeId={genome.genome_id}
          label="Mature peptides"
          type="mat_peptide"
          value={genome.mat_peptide}
        />
      </MetadataCard>
      <MetadataCard title="Isolation and host">
        <Field label="Strain" value={genome.strain} />
        <Field label="Collection date" value={genome.collection_date} />
        <Field label="Collection year" value={genome.collection_year} />
        <Field label="Country" value={genome.isolation_country} />
        <Field
          label="Host"
          value={genome.host_common_name ?? genome.host_name}
        />
      </MetadataCard>
    </div>
  );
}
