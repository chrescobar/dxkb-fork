import { z } from "zod";

const scalar = z.union([z.string(), z.number()]);
const stringList = z.union([z.string(), z.array(z.string())]);

export const epitopeViewRecordSchema = z.looseObject({
  epitope_id: z.string().min(1),
  epitope_type: z.string().optional(),
  epitope_sequence: z.string().optional(),
  organism: z.string().optional(),
  taxon_id: scalar.optional(),
  taxon_lineage_ids: z.union([scalar, z.array(scalar)]).optional(),
  taxon_lineage_names: stringList.optional(),
  protein_name: z.string().optional(),
  protein_id: z.string().optional(),
  protein_accession: z.string().optional(),
  start: scalar.optional(),
  end: scalar.optional(),
  host_name: stringList.optional(),
  total_assays: scalar.optional(),
  assay_results: stringList.optional(),
  bcell_assays: scalar.optional(),
  tcell_assays: scalar.optional(),
  mhc_assays: scalar.optional(),
  comments: stringList.optional(),
  date_inserted: z.string().optional(),
});

export type EpitopeViewRecord = z.infer<typeof epitopeViewRecordSchema>;

export function isEpitopeId(value: string): boolean {
  return value.length > 0 && value.length <= 1_000;
}
