import { z } from "zod";

const scalar = z.union([z.string(), z.number()]);
const stringList = z.union([z.string(), z.array(z.string())]);

export const featureViewRecordSchema = z.looseObject({
  feature_id: z.string().min(1),
  patric_id: z.string().optional(),
  genome_id: z.string().optional(),
  genome_name: z.string().optional(),
  taxon_id: scalar.optional(),
  taxon_lineage_ids: z.union([scalar, z.array(scalar)]).optional(),
  taxon_lineage_names: stringList.optional(),
  annotation: z.string().optional(),
  feature_type: z.string().optional(),
  sequence_id: z.string().optional(),
  accession: z.string().optional(),
  alt_locus_tag: z.string().optional(),
  refseq_locus_tag: z.string().optional(),
  protein_id: z.string().optional(),
  gene_id: scalar.optional(),
  uniprotkb_accession: z.string().optional(),
  pdb_accession: z.string().optional(),
  start: scalar.optional(),
  end: scalar.optional(),
  strand: z.string().optional(),
  location: z.string().optional(),
  segments: stringList.optional(),
  codon_start: scalar.optional(),
  na_length: scalar.optional(),
  aa_length: scalar.optional(),
  na_sequence_md5: z.string().optional(),
  aa_sequence_md5: z.string().optional(),
  gene: z.string().optional(),
  product: z.string().optional(),
  plfam_id: z.string().optional(),
  pgfam_id: z.string().optional(),
  sog_id: z.string().optional(),
  og_id: z.string().optional(),
  go: stringList.optional(),
  property: stringList.optional(),
  notes: stringList.optional(),
  date_inserted: z.string().optional(),
});

export type FeatureViewRecord = z.infer<typeof featureViewRecordSchema>;

export function isFeatureId(value: string): boolean {
  return value.length > 0 && value.length <= 1_000;
}

export function isPatricFeatureId(value: string): boolean {
  return /^fig\|.+/.test(value);
}
