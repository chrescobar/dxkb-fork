import { proteinFeatureRecordSchema } from "@/lib/data-api";
import { z } from "zod";

export const proteinFeatureViewRecordSchema = proteinFeatureRecordSchema.extend(
  {
    patric_id: z.string().optional(),
  },
);

export type ProteinFeatureViewRecord = z.infer<
  typeof proteinFeatureViewRecordSchema
>;
