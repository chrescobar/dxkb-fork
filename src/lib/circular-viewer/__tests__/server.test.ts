vi.mock("server-only", () => ({}));

import { describe, expect, it, vi } from "vitest";
import type { ServerDataRepository } from "@/lib/data-api/repository";
import { maxContigs } from "../contract";
import {
  contigLengthsClause,
  contigSequencesClause,
  contigsClause,
  customTrackFilter,
  featurePresetFilters,
  featureTrackClause,
  gcResult,
  parseCustomQuery,
  parseTrackQuery,
  readContigs,
  readGc,
  readSpecialtyTrack,
  specialtyGenesClause,
  toCircularFeature,
} from "../server";

function fakeRepository(answers: {
  ranged?: Record<string, Record<string, unknown>[]>;
  selected?: (ids: string[]) => Record<string, unknown>[];
}) {
  const rangedRows = vi.fn((resource: string) =>
    Promise.resolve({ rows: answers.ranged?.[resource] ?? [], headers: new Headers() }),
  );
  const execute = vi.fn((_resource: string, request: { ids: string[] }) =>
    Promise.resolve({ rows: answers.selected?.(request.ids) ?? [] }),
  );
  return {
    repository: { rangedRows, execute } as unknown as ServerDataRepository,
    rangedRows,
    execute,
  };
}

const row = (featureId: string, start: number) => ({
  feature_id: featureId,
  accession: "NC_000962",
  start,
  end: start + 99,
  strand: "+",
  feature_type: "CDS",
  patric_id: `fig|83332.12.peg.${String(start)}`,
});

describe("circular viewer clauses", () => {
  it("reads a preset track as legacy addFeatureTrack did, quoting the + strand", () => {
    expect(featureTrackClause("83332.12", featurePresetFilters["cds-forward"])).toBe(
      "and(eq(genome_id,83332.12),ne(feature_type,source),and(eq(annotation,PATRIC),eq(feature_type,CDS),eq(strand,%22%2B%22)))" +
        "&select(feature_id,patric_id,accession,start,end,strand,feature_type,product,gene,refseq_locus_tag,protein_id,na_length,aa_length)" +
        "&sort(+accession,+start)",
    );
    expect(featurePresetFilters["non-cds"]).toBe(
      "and(eq(annotation,PATRIC),ne(feature_type,CDS))",
    );
  });

  it("names a specialty-gene property as a quoted phrase", () => {
    expect(specialtyGenesClause("83332.12", "Antibiotic Resistance")).toBe(
      "and(eq(genome_id,83332.12),eq(property,%22Antibiotic%20Resistance%22))&select(id,feature_id)",
    );
  });

  it("builds a custom track from type, strand and a Solr-style keyword", () => {
    expect(
      customTrackFilter({ type: "Miscellaneous", strand: "reverse", keyword: "transposon OR transposase" }),
    ).toBe(
      "and(eq(annotation,PATRIC),not(in(feature_type,(CDS,*RNA,source))),eq(strand,%22-%22),or(keyword(transposon),keyword(transposase)))",
    );
    expect(customTrackFilter({ type: "RNA", strand: "both", keyword: "ribosomal" })).toBe(
      "and(eq(annotation,PATRIC),eq(feature_type,*RNA),keyword(ribosomal))",
    );
  });

  it("reads sequences by accession, as legacy did", () => {
    expect(contigsClause("83332.12")).toBe(
      "eq(genome_id,83332.12)&select(sequence_id,accession,length,gc_content,topology,sequence_type)&sort(+accession)",
    );
  });
});

describe("circular viewer request parsing", () => {
  const params = (query: string) => new URLSearchParams(query);

  it("accepts a known preset and rejects others", () => {
    expect(parseTrackQuery(params("genomeId=83332.12&preset=amr"))).toEqual({
      genomeId: "83332.12",
      preset: "amr",
    });
    expect(() => parseTrackQuery(params("genomeId=83332.12&preset=essential"))).toThrow(
      "preset must be one of cds-forward, cds-reverse, non-cds, amr, vf, transporter, drug-target.",
    );
    expect(() => parseTrackQuery(params("genomeId=coli&preset=amr"))).toThrow(
      "genomeId must be a genome id such as 83332.12.",
    );
  });

  it("requires a keyword with a searchable word, and word strands", () => {
    expect(
      parseCustomQuery(params("genomeId=1.1&type=CDS&strand=forward&keyword=+secretion+")),
    ).toEqual({ genomeId: "1.1", type: "CDS", strand: "forward", keyword: "secretion" });
    expect(() => parseCustomQuery(params("genomeId=1.1&type=CDS&strand=both&keyword=%22%22"))).toThrow(
      "keyword must contain a word to search for.",
    );
    expect(() => parseCustomQuery(params("genomeId=1.1&type=CDS&strand=%2B&keyword=x"))).toThrow(
      "strand must be one of both, forward, reverse.",
    );
  });
});

describe("circular viewer reads", () => {
  it("maps rows and drops unreadable ones", () => {
    expect(toCircularFeature(row("F1", 10))).toEqual({
      featureId: "F1",
      accession: "NC_000962",
      start: 10,
      end: 109,
      strand: "+",
      featureType: "CDS",
      patricId: "fig|83332.12.peg.10",
    });
    expect(toCircularFeature({ feature_id: "F2", accession: "A", start: 0, end: 5 })).toBeNull();
  });

  it("marks more than 1,000 sequences as truncated", async () => {
    const rows = Array.from({ length: maxContigs + 1 }, (_, index) => ({
      sequence_id: `s${String(index)}`,
      accession: `A${String(index)}`,
      length: 100,
    }));
    const { repository, rangedRows } = fakeRepository({ ranged: { genome_sequence: rows } });
    const result = await readContigs(repository, "1.1");
    expect(result.truncated).toBe(true);
    expect(result.contigs).toHaveLength(maxContigs);
    expect(rangedRows).toHaveBeenCalledWith("genome_sequence", contigsClause("1.1"), 0, maxContigs + 1, undefined);
  });

  it("reads each specialty gene's feature once, 500 ids per request", async () => {
    const spRows = Array.from({ length: 501 }, (_, index) => ({ id: `r${String(index)}`, feature_id: `F${String(index)}` }));
    // A second source listing the first gene again.
    spRows.push({ id: "dup", feature_id: "F0" });
    const { repository, execute } = fakeRepository({
      ranged: { sp_gene: spRows },
      selected: (ids) => ids.map((id, index) => row(id, 1000 - index)),
    });
    const result = await readSpecialtyTrack(repository, "1.1", "Virulence Factor");
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute.mock.calls.map(([, request]) => request.ids.length)).toEqual([500, 1]);
    expect(result.features).toHaveLength(501);
    expect(result.features[0].start).toBeLessThanOrEqual(result.features[1].start);
    expect(result.truncated).toBe(false);
  });

  it("fails a specialty track whose feature read answers no rows, rather than drawing it empty", async () => {
    const { repository, execute } = fakeRepository({ ranged: { sp_gene: [{ id: "a", feature_id: "F1" }] } });
    execute.mockResolvedValueOnce({ row: null } as never);
    await expect(readSpecialtyTrack(repository, "1.1", "Transporter")).rejects.toMatchObject({
      status: 502,
      code: "malformed_response",
    });
  });

  it("refuses a genome over the GC limit from its lengths, before reading any sequence", async () => {
    const rangedRows = vi.fn(() =>
      Promise.resolve({ rows: [{ sequence_id: "s1", accession: "A", length: 5 }, { sequence_id: "s2", accession: "B", length: 4 }], headers: new Headers() }),
    );
    const repository = { rangedRows } as unknown as ServerDataRepository;
    await expect(readGc(repository, "1.1", undefined, 8)).rejects.toMatchObject({
      status: 422,
      code: "genome_too_long",
      message: "Genome 1.1 is 9 bp long, more than the 8 bp the Circular Viewer's GC tracks read.",
    });
    expect(rangedRows).toHaveBeenCalledTimes(1);
    expect(rangedRows).toHaveBeenCalledWith("genome_sequence", contigLengthsClause("1.1"), 0, maxContigs, undefined);
  });

  it("reads the sequences once their lengths fit the GC limit", async () => {
    const rangedRows = vi.fn((_resource: string, clause: string) =>
      Promise.resolve({
        rows:
          clause === contigLengthsClause("1.1")
            ? [{ sequence_id: "s1", accession: "A", length: 4 }]
            : [{ sequence_id: "s1", accession: "A", sequence: "GGCC" }],
        headers: new Headers(),
      }),
    );
    const repository = { rangedRows } as unknown as ServerDataRepository;
    expect(await readGc(repository, "1.1", undefined, 8)).toEqual({
      windowSize: 20,
      contigs: [{ accession: "A", length: 4, gc: [1], skew: [0] }],
    });
    expect(rangedRows.mock.calls.map(([, clause]) => clause)).toEqual([
      contigLengthsClause("1.1"),
      contigSequencesClause("1.1"),
    ]);
  });

  it("computes GC windows with the genome-wide window size, and refuses an oversized genome", () => {
    expect(gcResult("1.1", [{ accession: "A", sequence: "GGCC" }])).toEqual({
      windowSize: 20,
      contigs: [{ accession: "A", length: 4, gc: [1], skew: [0] }],
    });
    expect(() => gcResult("1.1", [{ accession: "A", sequence: "GGCCAATT" }], 4)).toThrow(
      "Genome 1.1 is 8 bp long, more than the 4 bp the Circular Viewer's GC tracks read.",
    );
  });
});
