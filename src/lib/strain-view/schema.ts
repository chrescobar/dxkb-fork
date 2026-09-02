import { strainRecordSchema } from "@/lib/data-api";
import { z } from "zod";

const scalar = z.union([z.string(), z.number(), z.boolean()]);

export const strainViewRecordSchema = strainRecordSchema.extend({
  taxon_id: scalar.optional(),
  taxon_lineage_ids: z.union([scalar, z.array(scalar)]).optional(),
});

export type StrainViewRecord = z.infer<typeof strainViewRecordSchema>;
