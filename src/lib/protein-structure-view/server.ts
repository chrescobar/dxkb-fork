import { readSession } from "@/lib/auth/server/session";
import { ServerDataRepository } from "@/lib/data-api/repository";
import {
  proteinStructureViewRecordSchema,
  type ProteinStructureViewRecord,
} from "./schema";

export interface ProteinStructureLookup {
  accession: string;
  metadata: ProteinStructureViewRecord | null;
  error?: string;
}

export async function getProteinStructures(
  accessions: readonly string[],
): Promise<ProteinStructureLookup[]> {
  const session = await readSession();
  const baseUrl = process.env.DATA_API_URL ?? process.env.NEXT_PUBLIC_DATA_API;
  if (!baseUrl) {
    return accessions.map((accession) => ({
      accession,
      metadata: null,
      error: "DATA_API_URL is not configured.",
    }));
  }
  const bypassCache = Boolean(session) || process.env.E2E_MOCK_ENABLED === "1";
  const repository = new ServerDataRepository({
    baseUrl,
    token: session?.token,
    cache: bypassCache ? "no-store" : "force-cache",
    revalidate: bypassCache ? undefined : 300,
  });

  return Promise.all(
    accessions.map(async (accession): Promise<ProteinStructureLookup> => {
      try {
        const result = await repository.member("protein_structure", {
          operation: "member",
          id: accession,
        });
        return {
          accession,
          metadata: result.row
            ? proteinStructureViewRecordSchema.parse(result.row)
            : null,
        };
      } catch (error) {
        return {
          accession,
          metadata: null,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );
}
