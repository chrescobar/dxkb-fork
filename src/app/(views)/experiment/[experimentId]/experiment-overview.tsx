import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ExperimentViewRecord } from "@/lib/experiment-view";
import { experimentHref, genomeHref } from "@/lib/views/hrefs";

function display(value: unknown): string {
  if (Array.isArray(value)) return value.map(String).join(", ");
  if (value == null || value === "") return "Not available";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean" || typeof value === "bigint") return String(value);
  return JSON.stringify(value) || "Not available";
}

function Field({ label, value }: { label: string; value: unknown }) {
  if (value == null || value === "") return null;
  return <div><dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt><dd className="mt-0.5 wrap-break-word">{display(value)}</dd></div>;
}

function MetadataCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent><dl className="grid gap-4 sm:grid-cols-2">{children}</dl></CardContent></Card>;
}

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function repositoryHref(repository: string | undefined, identifier: string | undefined) {
  if (!repository || !identifier) return undefined;
  switch (repository.trim().toUpperCase()) {
    case "GEO": return `https://www.ncbi.nlm.nih.gov/geo/query/acc.cgi?acc=${encodeURIComponent(identifier)}`;
    case "ARRAYEXPRESS": return `https://www.ebi.ac.uk/biostudies/arrayexpress/studies/${encodeURIComponent(identifier)}`;
    default: return undefined;
  }
}

export function ExperimentOverview({ experiment }: { experiment: ExperimentViewRecord }) {
  const genomeId = first(experiment.genome_id);
  const publicHref = repositoryHref(experiment.public_repository, experiment.public_identifier);
  return (
    <div className="grid gap-4 pb-6 xl:grid-cols-2">
      <MetadataCard title="Study">
        <Field label="Study name" value={experiment.study_name} />
        <Field label="Study title" value={experiment.study_title} />
        <Field label="Description" value={experiment.study_description} />
        <Field label="Principal investigator" value={experiment.study_pi} />
        <Field label="Institution" value={experiment.study_institution} />
      </MetadataCard>
      <MetadataCard title="Experiment">
        <Field label="Experiment ID" value={experiment.exp_id} />
        <Field label="Name" value={experiment.exp_name} />
        <Field label="Title" value={experiment.exp_title} />
        <Field label="Description" value={experiment.exp_description} />
        <Field label="Point of contact" value={experiment.exp_poc} />
        <Field label="Experimenters" value={experiment.experimenters} />
        <Field label="Type" value={experiment.exp_type} />
        <Field label="Measurement technique" value={experiment.measurement_technique} />
      </MetadataCard>
      <MetadataCard title="Repository and publication">
        <Field label="Public repository" value={experiment.public_repository} />
        {experiment.public_identifier && <div><dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Public identifier</dt><dd className="mt-0.5">{publicHref ? <a className="inline-flex items-center gap-1 text-primary underline" href={publicHref} target="_blank" rel="noopener noreferrer">{experiment.public_identifier}<ExternalLink className="size-3" aria-hidden="true" /></a> : experiment.public_identifier}</dd></div>}
        {experiment.pmid != null && <div><dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">PubMed</dt><dd className="mt-0.5"><a className="inline-flex items-center gap-1 text-primary underline" href={`https://pubmed.ncbi.nlm.nih.gov/${encodeURIComponent(String(experiment.pmid))}/`} target="_blank" rel="noopener noreferrer">{display(experiment.pmid)}<ExternalLink className="size-3" aria-hidden="true" /></a></dd></div>}
      </MetadataCard>
      <MetadataCard title="Organism and treatment">
        <Field label="Organism" value={experiment.organism} />
        <Field label="Strain" value={experiment.strain} />
        {genomeId && <div><dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Genome</dt><dd className="mt-0.5"><Link className="text-primary underline" href={genomeHref(genomeId)}>{genomeId}</Link></dd></div>}
        <Field label="Treatment type" value={experiment.treatment_type} />
        <Field label="Treatment name" value={experiment.treatment_name} />
        <Field label="Treatment amount" value={experiment.treatment_amount} />
        <Field label="Treatment duration" value={experiment.treatment_duration} />
      </MetadataCard>
      <MetadataCard title="Samples and biosets">
        <Field label="Samples" value={experiment.samples} />
        {experiment.biosets != null && <div><dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">Biosets</dt><dd className="mt-0.5"><Link className="text-primary underline" href={`${experimentHref(experiment.exp_id)}?tab=biosets`}>{display(experiment.biosets)}</Link></dd></div>}
      </MetadataCard>
      <MetadataCard title="Additional metadata">
        <Field label="Date added" value={experiment.date_inserted} />
        <Field label="Additional metadata" value={experiment.additional_metadata} />
      </MetadataCard>
    </div>
  );
}
