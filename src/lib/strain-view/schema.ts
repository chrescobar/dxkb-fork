import { z } from "zod";

const scalar = z.union([z.string(), z.number(), z.boolean()]);
const stringList = z.union([z.string(), z.array(z.string())]);

export const strainViewRecordSchema = z.looseObject({
  id: z.string().min(1),
  taxon_id: scalar.optional(),
  taxon_lineage_ids: z.union([scalar, z.array(scalar)]).optional(),
  taxon_lineage_names: stringList.optional(),
  strain: z.string().optional(),
  genome_ids: z.array(z.string()).optional(),
  genbank_accessions: z.array(z.string()).optional(),
  "1_pb2": z.array(z.string()).optional(),
  "2_pb1": z.array(z.string()).optional(),
  "3_pa": z.array(z.string()).optional(),
  "4_ha": z.array(z.string()).optional(),
  "5_np": z.array(z.string()).optional(),
  "6_na": z.array(z.string()).optional(),
  "7_mp": z.array(z.string()).optional(),
  "8_ns": z.array(z.string()).optional(),
  s: z.array(z.string()).optional(),
  m: z.array(z.string()).optional(),
  l: z.array(z.string()).optional(),
  other_segments: z.array(z.string()).optional(),
});

export type StrainViewRecord = z.infer<typeof strainViewRecordSchema>;
