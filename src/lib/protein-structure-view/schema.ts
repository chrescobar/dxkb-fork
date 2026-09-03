import { proteinStructureRecordSchema } from "@/lib/data-api";
import { z } from "zod";

export const proteinStructureViewRecordSchema = proteinStructureRecordSchema;

export type ProteinStructureViewRecord = z.infer<
  typeof proteinStructureViewRecordSchema
>;
