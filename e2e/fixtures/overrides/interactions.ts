import type { JsonOverride } from "../../mocks/backends";

// In E2E, NEXT_PUBLIC_DATA_API=http://127.0.0.1:${E2E_PORT}/api/e2e-mock/data so all
// ppi fetches (count, rows) go through the loopback, not bv-brc.org.
const ppiLoopback = /\/api\/e2e-mock\/data\/ppi\//;
const ppiLoopbackCount = /\/api\/e2e-mock\/data\/ppi\/.*limit/;

export interface MockPpiRow {
  id: string;
  genome_id_a: string;
  genome_name_a: string;
  interactor_a: string;
  feature_id_a: string;
  refseq_locus_tag_a: string;
  gene_a: string;
  interactor_desc_a: string;
  genome_id_b: string;
  genome_name_b: string;
  interactor_b: string;
  feature_id_b: string;
  refseq_locus_tag_b: string;
  gene_b: string;
  interactor_desc_b: string;
  category: string;
  interaction_type: string[];
  detection_method: string[];
  evidence: string[];
  score: number;
}

/** Build `count` synthetic PPI rows for the Brucella melitensis (taxon 234) fixture. */
export function buildPpiRows(count: number): MockPpiRow[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `ppi-${String(i).padStart(4, "0")}`,
    genome_id_a: "224914.16",
    genome_name_a: "Brucella melitensis bv. 1 str. 16M [WGS]",
    interactor_a: `fig|224914.16.peg.${String(600 + i)}`,
    feature_id_a: `PATRIC.224914.16.feature-a-${String(i)}`,
    refseq_locus_tag_a: `BAWG_${String(1000 + i)}`,
    gene_a: "",
    interactor_desc_a: "6,7-dimethyl-8-ribityllumazine synthase",
    genome_id_b: "224914.16",
    genome_name_b: "Brucella melitensis bv. 1 str. 16M [WGS]",
    interactor_b: `fig|224914.16.peg.${String(2400 + i)}`,
    feature_id_b: `PATRIC.224914.16.feature-b-${String(i)}`,
    refseq_locus_tag_b: `BAWG_${String(2000 + i)}`,
    gene_b: "",
    interactor_desc_b: "CrcB protein",
    category: "PPI",
    interaction_type: ["predicted interaction"],
    detection_method: ["predictive text mining"],
    evidence: ["experimental"],
    score: 2.5316925,
  }));
}

/** Build the PPI count + row overrides for the e2e-mock data loopback. */
export function buildPpiOverrides(rows: MockPpiRow[]): JsonOverride[] {
  return [
    { url: ppiLoopbackCount, method: "GET", body: { response: { numFound: rows.length } } },
    { url: ppiLoopback, method: "GET", body: rows },
  ];
}
