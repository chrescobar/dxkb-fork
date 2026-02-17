"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { ServiceHeader } from "@/components/services/service-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataTable } from "@/components/containers/DataTable";
import { Search } from "lucide-react";
import { RequiredFormCardTitle } from "@/components/forms/required-form-components";
import { DialogInfoPopup } from "@/components/services/dialog-info-popup";
import { WorkspaceObjectSelector } from "@/components/workspace/workspace-object-selector";
import type { WorkspaceObject } from "@/lib/workspace-client";
import { SingleGenomeSelector } from "@/components/services/single-genome-selector";
import { JobParamsDialog } from "@/components/services/job-params-dialog";
import { Spinner } from "@/components/ui/spinner";

import { toast } from "sonner";
import { useServiceFormSubmission } from "@/hooks/services/use-service-form-submission";
import {
  similarGenomeFinderInfo,
  similarGenomeFinderSelectGenome,
} from "@/lib/services/service-info";
import {
  similarGenomeFinderFormSchema,
  DEFAULT_SIMILAR_GENOME_FINDER_FORM_VALUES,
  type SimilarGenomeFinderFormData,
} from "@/lib/forms/(genomics)/similar-genome-finder/similar-genome-finder-form-schema";
import { buildMinhashServicePayload } from "@/lib/forms/(genomics)/similar-genome-finder/similar-genome-finder-form-utils";
import { SimilarGenomeFinderAdvancedOptions } from "./similar-genome-finder-advanced-options";

const similarGenomeFinderTableColumns = [
  { id: "genome_id", label: "Genome ID" },
  { id: "genome_name", label: "Genome Name" },
  { id: "organism_name", label: "Organism" },
  { id: "genome_status", label: "Genome Status" },
  { id: "genome_quality", label: "Genome Quality" },
  { id: "distance", label: "Distance" },
  { id: "pvalue", label: "P Value" },
  { id: "counts", label: "K-mer Counts" },
] as const;

const quickReference =
  "https://www.bv-brc.org/docs/quick_references/services/similar_genome_finder_service.html";
const tutorial =
  "https://www.bv-brc.org/docs/tutorial/similar_genome_finder/similar_genome_finder.html";
const video =
  "https://youtube.com/playlist?list=PLWfOyhOW_OashHfld0w1DUkO7rQz6s8SA&si=Enh6GME_i4LMcXL8";

/** Result row shape for Similar Genome Finder (when result data is available) */
export interface SimilarGenomeFinderResultRow {
  genome_id: string;
  genome_name: string;
  organism_name: string;
  genome_status?: string;
  genome_quality?: string;
  distance: number;
  pvalue: number;
  /** K-mer counts; may be number or string (e.g. "0/1000") from Minhash */
  counts?: number | string;
}

/**
 * Convert columnar result { genome_id: [...], distance: [...] } to row array.
 */
function columnarToRows(result: Record<string, unknown>): unknown[] {
  const ids = result.genome_id ?? result.genomeId ?? result.id;
  const arr = Array.isArray(ids) ? ids : [];
  if (arr.length === 0) return [];
  const dist = (result.distance ?? result.dist) as unknown[] | undefined;
  const pval = (result.pvalue ?? result.p_value) as unknown[] | undefined;
  const cnt = (result.counts ?? result.kmer_count) as unknown[] | undefined;
  return arr.map((id, i) => ({
    genome_id: id,
    genome_name: (result.genome_name as unknown[])?.[i],
    organism_name: (result.organism_name as unknown[])?.[i],
    distance: dist?.[i],
    pvalue: pval?.[i],
    counts: cnt?.[i],
  }));
}

/**
 * Extract the hits array from Minhash JSON-RPC response.
 * Handles: { result: [...] }, { result: [ [ row1, row2, ... ] ] } (nested), columnar, or top-level array.
 */
function extractMinhashArray(payload: unknown): unknown[] {
  if (!payload || typeof payload !== "object") return [];
  const obj = payload as Record<string, unknown>;
  const result = obj.result;
  if (Array.isArray(result)) {
    // Minhash returns result: [ [ row1, row2, ... ] ] — one outer array containing the rows array
    if (result.length === 1 && Array.isArray(result[0])) return result[0] as unknown[];
    return result;
  }
  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;
    if (Array.isArray(r.data)) return r.data;
    if (Array.isArray(r.hits)) return r.hits;
    if (Array.isArray(r.results)) return r.results;
    if (Array.isArray(r[0])) return (result as unknown) as unknown[];
    if (Array.isArray(r.genome_id ?? r.genomeId)) return columnarToRows(r);
    const values = Object.values(r);
    if (values.length > 0 && Array.isArray(values[0])) return values.flat() as unknown[];
  }
  if (Array.isArray(obj.data)) return obj.data;
  if (Array.isArray(obj.hits)) return obj.hits;
  if (Array.isArray(obj.results)) return obj.results;
  if (Array.isArray(obj.genome_id ?? obj.genomeId)) return columnarToRows(obj);
  return [];
}

/** Parse a numeric value from number or string (e.g. Minhash array row values). */
function parseNum(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

/** Parse counts: keep number, keep string as-is (e.g. "0/1000" for K-mer display), or numeric string as number. */
function parseCounts(v: unknown): number | string | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    if (v.includes("/")) return v;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}

/** Minhash JSON-RPC returns { result: [...] }. Extract rows with genome_id and metrics. */
function parseMinhashResultPayload(payload: unknown): SimilarGenomeFinderResultRow[] {
  const arr = extractMinhashArray(payload);
  return arr.map((item): SimilarGenomeFinderResultRow => {
    const row = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const get = (...keys: string[]) => {
      for (const k of keys) {
        const v = row[k];
        if (v !== undefined && v !== null) return v;
      }
      return undefined;
    };
    // Support array rows: [genome_id, distance, pvalue, count] or similar (values may be strings)
    const arrRow = Array.isArray(item) ? item : [];
    const genomeId =
      get("genome_id", "genomeId", "genome ID", "id", "ref", "reference") ??
      (arrRow[0] !== undefined ? String(arrRow[0]) : "");
    const distanceVal = get("distance") ?? arrRow[1];
    const pvalueVal = get("pvalue", "p_value") ?? arrRow[2];
    const countsVal = get("counts", "kmer_count") ?? arrRow[3];
    return {
      genome_id: String(genomeId),
      genome_name: String(get("genome_name", "genomeName", "genome name") ?? ""),
      organism_name: String(get("organism_name", "organismName", "organism name", "organism") ?? ""),
      distance: parseNum(distanceVal),
      pvalue: parseNum(pvalueVal),
      counts: parseCounts(countsVal),
    };
  });
}

/** Build table rows by merging Minhash metrics with BV-BRC genome API response (genome_name, organism). */
function mergeGenomeResults(
  minhashRows: SimilarGenomeFinderResultRow[],
  genomeApiResults: Record<string, string>[],
): SimilarGenomeFinderResultRow[] {
  const byId = new Map<string, Record<string, string>>();
  for (const row of genomeApiResults) {
    const id = row.genome_id;
    if (id) byId.set(String(id).trim(), row);
  }
  const get = (row: Record<string, string>, ...keys: string[]) => {
    for (const k of keys) {
      const v = row[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v);
    }
    return "";
  };

  return minhashRows.map((m) => {
    const genome = m.genome_id ? byId.get(m.genome_id.trim()) : undefined;
    return {
      ...m,
      genome_name: genome
        ? get(genome, "genome_name", "genome name")
        : m.genome_name,
      organism_name: genome
        ? get(genome, "species", "organism_name", "organism name", "taxon_lineage_names", "genome_name")
        : m.organism_name,
      genome_status: genome ? get(genome, "genome_status") : undefined,
      genome_quality: genome ? get(genome, "genome_quality") : undefined,
    };
  });
}

export default function SimilarGenomeFinderServicePage() {
  const form = useForm<SimilarGenomeFinderFormData>({
    resolver: zodResolver(similarGenomeFinderFormSchema),
    defaultValues: DEFAULT_SIMILAR_GENOME_FINDER_FORM_VALUES,
    mode: "onChange",
  });

  const [showAdvanced, setShowAdvanced] = useState(false);
  const [results, setResults] = useState<SimilarGenomeFinderResultRow[]>([]);

  const onSuccess = () => {
    form.reset(DEFAULT_SIMILAR_GENOME_FINDER_FORM_VALUES);
    setShowAdvanced(false);
    setResults([]);
  };

  const {
    handleSubmit,
    showParamsDialog,
    setShowParamsDialog,
    currentParams,
    serviceName,
    isSubmitting,
  } = useServiceFormSubmission<SimilarGenomeFinderFormData>({
    serviceName: "SimilarGenomeFinder",
    displayName: "Similar Genome Finder",
    transformParams: (data) =>
      buildMinhashServicePayload(data) as unknown as Record<string, unknown>,
    onSuccess,
    onSubmit: async (data) => {
      try {
        const payload = buildMinhashServicePayload(data);
        const res = await fetch("/api/services/minhash", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = await res.json().catch(() => ({}));
        const errorMessage =
          typeof result.error === "string"
            ? result.error
            : result.error && typeof result.error === "object"
              ? "message" in result.error
                ? String((result.error as { message?: unknown }).message)
                : JSON.stringify(result.error)
              : null;
        if (!res.ok) {
          throw new Error(
            errorMessage || "Minhash service request failed",
          );
        }
        if (result.error != null && result.error !== "" && result.error !== false) {
          throw new Error(
            errorMessage ?? "Service returned an error",
          );
        }
        let minhashRows = parseMinhashResultPayload(result);
        let genomeIds = minhashRows
          .map((r) => r.genome_id?.trim())
          .filter(Boolean) as string[];

        // Fallback: if Minhash returned rows but no genome_id in them, try to get IDs from raw payload
        if (minhashRows.length > 0 && genomeIds.length === 0 && result && typeof result === "object") {
          const raw = result as Record<string, unknown>;
          const res = raw.result;
          if (res && typeof res === "object") {
            const r = res as Record<string, unknown>;
            const idList = (r.genome_id ?? r.genomeId ?? r.id ?? raw.genome_ids) as unknown;
            const ids = Array.isArray(idList)
              ? (idList as unknown[]).map((x) => (x !== null && x !== undefined ? String(x).trim() : "")).filter(Boolean)
              : [];
            if (ids.length >= minhashRows.length) {
              genomeIds = ids.slice(0, minhashRows.length) as string[];
              minhashRows = minhashRows.map((row, i) => ({ ...row, genome_id: genomeIds[i] ?? row.genome_id }));
            }
          }
        }

        let rows: SimilarGenomeFinderResultRow[];
        if (genomeIds.length > 0) {
          try {
            const genomeRes = await fetch("/api/services/genome/website-query", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ genome_ids: genomeIds }),
            });
            const genomeData = await genomeRes.json().catch(() => ({}));
            if (!genomeRes.ok) {
              rows = minhashRows;
              toast.info("Results loaded; genome details could not be fetched.", {
                closeButton: true,
              });
            } else {
              const rawResults = Array.isArray(genomeData.results)
                ? genomeData.results
                : [];
              const genomeResults: Record<string, string>[] = rawResults.map(
                (r: unknown) =>
                  r && typeof r === "object"
                    ? (Object.fromEntries(
                        Object.entries(r as Record<string, unknown>).map(([k, v]) => [
                          k,
                          v !== null && v !== undefined ? String(v) : "",
                        ]),
                      ) as Record<string, string>)
                    : ({} as Record<string, string>),
              );
              rows = mergeGenomeResults(minhashRows, genomeResults);
            }
          } catch {
            rows = minhashRows;
            toast.info("Results loaded; genome details could not be fetched.", {
              closeButton: true,
            });
          }
        } else {
          rows = minhashRows;
        }

        setResults(rows);
        toast.success("Similar Genome Finder completed successfully!", {
          description:
            rows.length > 0
              ? `Results returned from Minhash service (${rows.length} genome${rows.length === 1 ? "" : "s"})`
              : "Results returned from Minhash service",
          closeButton: true,
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Submission failed";
        toast.error("Submission failed", {
          description: message,
          closeButton: true,
        });
        throw err;
      }
    },
  });

  const handleReset = () => {
    form.reset(DEFAULT_SIMILAR_GENOME_FINDER_FORM_VALUES);
    setShowAdvanced(false);
    setResults([]);
  };

  return (
    <section>
      <ServiceHeader
        title="Similar Genome Finder"
        description="The Similar Genome Finder Service will find similar public genomes in BV-BRC or compute genome distance estimation using Mash/MinHash. It returns a set of genomes matching the specified similarity criteria."
        infoPopupTitle={similarGenomeFinderInfo.title}
        infoPopupDescription={similarGenomeFinderInfo.description}
        quickReferenceGuide={quickReference}
        tutorial={tutorial}
        instructionalVideo={video}
      />

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="grid grid-cols-1 gap-6 md:grid-cols-12"
        >
          {/* Select a Genome */}
          <div className="md:col-span-12">
            <Card>
              <CardHeader className="service-card-header">
                <RequiredFormCardTitle className="service-card-title">
                  Select a Genome
                  <DialogInfoPopup
                    title={similarGenomeFinderSelectGenome.title}
                    description={similarGenomeFinderSelectGenome.description}
                    sections={similarGenomeFinderSelectGenome.sections}
                  />
                </RequiredFormCardTitle>
              </CardHeader>
              <CardContent className="service-card-content space-y-6">
                <FormField
                  control={form.control}
                  name="selectedGenomeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="service-card-label">
                        Search by Genome Name or Genome ID
                      </FormLabel>
                      <FormControl>
                        <SingleGenomeSelector
                          placeholder="e.g. Mycobacterium tuberculosis H37Rv"
                          value={field.value ?? ""}
                          onChange={(value) => {
                            field.onChange(value);
                            if (value?.trim()) {
                              form.setValue("fasta_file", "", {
                                shouldValidate: true,
                              });
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="fasta_file"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="service-card-label">
                        Or Upload FASTA/FASTQ
                      </FormLabel>
                      <FormControl>
                        <WorkspaceObjectSelector
                          types={["contigs", "reads"]}
                          placeholder="Select a FASTA/FASTQ file..."
                          value={field.value ?? ""}
                          onObjectSelect={(object: WorkspaceObject) => {
                            field.onChange(object.path);
                            form.setValue("selectedGenomeId", "", {
                              shouldValidate: true,
                            });
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <SimilarGenomeFinderAdvancedOptions
                  control={form.control}
                  open={showAdvanced}
                  onOpenChange={setShowAdvanced}
                />
              </CardContent>
            </Card>
          </div>

          {/* Form controls */}
          <div className="md:col-span-12">
            <div className="service-form-controls">
              <Button type="button" variant="outline" onClick={handleReset}>
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || !form.formState.isValid}
              >
                {isSubmitting ? (
                  <Spinner className="mr-2 h-4 w-4" />
                ) : null}
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </form>
      </Form>

      {/* Results (DataTable) */}
      <div className="mt-8">
        <Card>
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">Results</CardTitle>
          </CardHeader>
          <CardContent className="service-card-content">
            <DataTable
              id="similar-genome-finder-results"
              data={results as unknown as Record<string, unknown>[]}
              columns={[...similarGenomeFinderTableColumns]}
              totalItems={results.length}
              resource="similar-genome-finder-results"
              isLoading={isSubmitting}
            />
          </CardContent>
        </Card>
      </div>

      <JobParamsDialog
        open={showParamsDialog}
        onOpenChange={setShowParamsDialog}
        params={currentParams}
        serviceName={serviceName}
      />
    </section>
  );
}
