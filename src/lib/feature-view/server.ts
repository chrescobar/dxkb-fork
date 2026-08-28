import { cache } from "react";
import { readSession } from "@/lib/auth/server/session";
import { ServerDataRepository } from "@/lib/data-api/repository";
import {
  featureViewRecordSchema,
  isPatricFeatureId,
  type FeatureViewRecord,
} from "./schema";

export interface FeatureLookup {
  feature: FeatureViewRecord | null;
  usedAlternateId: boolean;
}

export const getFeature = cache(async (featureId: string): Promise<FeatureLookup> => {
  const session = await readSession();
  const baseUrl = process.env.DATA_API_URL ?? process.env.NEXT_PUBLIC_DATA_API;
  if (!baseUrl) throw new Error("DATA_API_URL is not configured.");
  const bypassCache = Boolean(session) || process.env.E2E_MOCK_ENABLED === "1";
  const repository = new ServerDataRepository({
    baseUrl,
    token: session?.token,
    cache: bypassCache ? "no-store" : "force-cache",
    revalidate: bypassCache ? undefined : 300,
  });
  const usedAlternateId = isPatricFeatureId(featureId);
  const result = await repository.member("genome_feature", {
    operation: "member",
    id: featureId,
    idField: usedAlternateId ? "patric_id" : "feature_id",
  });
  return {
    feature: result.row ? featureViewRecordSchema.parse(result.row) : null,
    usedAlternateId,
  };
});
