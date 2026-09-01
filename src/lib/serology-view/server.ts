import { cache } from "react";
import { readSession } from "@/lib/auth/server/session";
import { ServerDataRepository } from "@/lib/data-api/repository";
import { resolveCompoundSample } from "@/lib/views/compound-sample";
import { serologyViewRecordSchema, type SerologyViewRecord } from "./schema";

export type SerologyLookup =
  | { status: "unique"; record: SerologyViewRecord }
  | { status: "not-found" }
  | { status: "ambiguous"; testTypes: string[] };

type SerologyCollectionRepository = Pick<ServerDataRepository, "collection">;

export async function resolveSerology(
  repository: SerologyCollectionRepository,
  sampleIdentifier: string,
  testType?: string,
): Promise<SerologyLookup> {
  const result = await resolveCompoundSample(repository, {
    resource: "serology",
    sampleIdentifier,
    discriminatorField: "test_type",
    discriminator: testType,
    parseRecord: (row) => serologyViewRecordSchema.parse(row),
  });
  return result.status === "ambiguous"
    ? { status: "ambiguous", testTypes: result.discriminatorValues }
    : result;
}

export const getSerology = cache(
  async (
    sampleIdentifier: string,
    testType?: string,
  ): Promise<SerologyLookup> => {
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
    return resolveSerology(repository, sampleIdentifier, testType);
  },
);
