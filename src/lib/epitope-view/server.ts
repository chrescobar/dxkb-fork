import { cache } from "react";
import { readSession } from "@/lib/auth/server/session";
import { ServerDataRepository } from "@/lib/data-api/repository";
import { epitopeViewRecordSchema, type EpitopeViewRecord } from "./schema";

export const getEpitope = cache(async (epitopeId: string): Promise<EpitopeViewRecord | null> => {
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
  const result = await repository.member("epitope", {
    operation: "member",
    id: epitopeId,
  });
  return result.row ? epitopeViewRecordSchema.parse(result.row) : null;
});
