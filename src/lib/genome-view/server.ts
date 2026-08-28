import { cache } from "react";
import { readSession } from "@/lib/auth/server/session";
import { ServerDataRepository } from "@/lib/data-api/repository";
import { genomeViewRecordSchema, type GenomeViewRecord } from "./schema";

export const getGenome = cache(
  async (genomeId: string): Promise<GenomeViewRecord | null> => {
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
    const result = await repository.member("genome", {
      operation: "member",
      id: genomeId,
    });
    return result.row ? genomeViewRecordSchema.parse(result.row) : null;
  },
);
