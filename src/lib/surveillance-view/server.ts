import { cache } from "react";
import { readSession } from "@/lib/auth/server/session";
import { eq } from "@/lib/data-api";
import { ServerDataRepository } from "@/lib/data-api/repository";
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
  const predicates = [
    eq("surveillance", "sample_identifier", sampleIdentifier),
  ];
  if (pathogenTestType) {
    predicates.push(eq("surveillance", "pathogen_test_type", pathogenTestType));
  }
  const result = await repository.collection("surveillance", {
    operation: "collection",
    rql:
      predicates.length === 1 ? predicates[0] : `and(${predicates.join(",")})`,
    page: 1,
    pageSize: 2,
    facets: ["pathogen_test_type"],
  });
  const records = result.rows.map((row) =>
    surveillanceViewRecordSchema.parse(row),
  );
  if (result.total === 0 || records.length === 0)
    return { status: "not-found" };
  if (result.total === 1 && records.length === 1) {
    return { status: "unique", record: records[0] };
  }
  const testTypes = (result.facets.pathogen_test_type ?? [])
    .filter(({ count }) => count === 1)
    .map(({ value }) => String(value))
    .filter((value, index, values) => values.indexOf(value) === index)
    .sort();
  return { status: "ambiguous", testTypes };
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
