import { cache } from "react";
import { readSession } from "@/lib/auth/server/session";
import { ServerDataRepository } from "@/lib/data-api/repository";
import { resolveCompoundSample } from "@/lib/views/compound-sample";
import {
  surveillanceViewRecordSchema,
  type SurveillanceViewRecord,
} from "./schema";

export type SurveillanceLookup =
  | { status: "unique"; record: SurveillanceViewRecord }
  | { status: "not-found" }
  | { status: "ambiguous"; testTypes: string[] };

type SurveillanceCollectionRepository = Pick<
  ServerDataRepository,
  "collection"
>;

export async function resolveSurveillance(
  repository: SurveillanceCollectionRepository,
  sampleIdentifier: string,
  pathogenTestType?: string,
): Promise<SurveillanceLookup> {
  const result = await resolveCompoundSample(repository, {
    resource: "surveillance",
    sampleIdentifier,
    discriminatorField: "pathogen_test_type",
    discriminator: pathogenTestType,
    parseRecord: (row) => surveillanceViewRecordSchema.parse(row),
  });
  return result.status === "ambiguous"
    ? { status: "ambiguous", testTypes: result.discriminatorValues }
    : result;
}

export const getSurveillance = cache(
  async (
    sampleIdentifier: string,
    pathogenTestType?: string,
  ): Promise<SurveillanceLookup> => {
    const session = await readSession();
    const baseUrl =
      process.env.DATA_API_URL ?? process.env.NEXT_PUBLIC_DATA_API;
    if (!baseUrl) throw new Error("DATA_API_URL is not configured.");
    const bypassCache =
      Boolean(session) || process.env.E2E_MOCK_ENABLED === "1";
    const repository = new ServerDataRepository({
      baseUrl,
      token: session?.token,
      cache: bypassCache ? "no-store" : "force-cache",
      revalidate: bypassCache ? undefined : 300,
    });
    return resolveSurveillance(repository, sampleIdentifier, pathogenTestType);
  },
);
