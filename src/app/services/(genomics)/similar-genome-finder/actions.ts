"use server";

import { headers } from "next/headers";
import { requireAuthSession } from "@/lib/auth/server/route";
import { buildMinhashServicePayload } from "@/lib/forms/(genomics)/similar-genome-finder/similar-genome-finder-form-utils";
import type { SimilarGenomeFinderFormData } from "@/lib/forms/(genomics)/similar-genome-finder/similar-genome-finder-form-schema";
import {
  parseMinhashResultPayload,
  mergeGenomeResults,
  type SimilarGenomeFinderResultRow,
} from "@/lib/forms/(genomics)/similar-genome-finder/similar-genome-finder-result-utils";

export interface SubmitSimilarGenomesResult {
  success: true;
  rows: SimilarGenomeFinderResultRow[];
}

export interface SubmitSimilarGenomesError {
  success: false;
  error: string;
}

export type SubmitSimilarGenomesResponse =
  SubmitSimilarGenomesResult | SubmitSimilarGenomesError;

async function getBaseUrl(): Promise<string> {
  const headersList = await headers();
  const host =
    headersList.get("x-forwarded-host") ??
    headersList.get("host") ??
    "localhost:3000";
  const proto =
    headersList.get("x-forwarded-proto") ??
    (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

function extractMinhashError(result: unknown): string | null {
  if (result == null || typeof result !== "object") return null;
  const err = (result as Record<string, unknown>).error;
  if (typeof err === "string") return err;
  if (err && typeof err === "object" && "message" in err) {
    return String((err as { message?: unknown }).message);
  }
  if (err != null) return JSON.stringify(err);
  return null;
}

/**
 * Call the minhash API and return normalized { ok, error?, result? } with parsed error.
 */
async function fetchMinhashResults(
  baseUrl: string,
  token: string,
  payload: unknown,
): Promise<{ ok: true; result: unknown } | { ok: false; error: string }> {
  const res = await fetch(`${baseUrl}/api/services/minhash`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: token },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const result = await (res.json() as Promise<unknown>).catch(() => ({}));
    return {
      ok: false,
      error: extractMinhashError(result) ?? "Minhash service request failed",
    };
  }

  const result = await (res.json() as Promise<unknown>).catch(() => ({}));
  const errorMessage = extractMinhashError(result);
  if (
    result != null &&
    typeof result === "object" &&
    (result as Record<string, unknown>).error != null &&
    (result as Record<string, unknown>).error !== "" &&
    (result as Record<string, unknown>).error !== false
  ) {
    return {
      ok: false,
      error: errorMessage ?? "Service returned an error",
    };
  }
  return { ok: true, result };
}

/**
 * Call the genome detail API and return { ok, error?, genomes? }.
 */
async function fetchGenomeDetails(
  baseUrl: string,
  token: string,
  genomeIds: string[],
): Promise<
  | { ok: true; genomes: Record<string, string>[] }
  | { ok: false; error: string; genomes?: undefined }
> {
  const genomeRes = await fetch(
    `${baseUrl}/api/services/genome/website-query`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: token },
      body: JSON.stringify({ genome_ids: genomeIds }),
    },
  );
  if (!genomeRes.ok) {
    const genomeData = await (genomeRes.json() as Promise<unknown>).catch(
      () => ({}),
    );
    return {
      ok: false,
      error:
        typeof (genomeData as Record<string, unknown>).error === "string"
          ? ((genomeData as Record<string, unknown>).error as string)
          : "Genome detail request failed",
    };
  }

  const genomeData = await (genomeRes.json() as Promise<unknown>).catch(
    () => ({}),
  );
  const rawResults = Array.isArray(
    (genomeData as Record<string, unknown>).results,
  )
    ? ((genomeData as Record<string, unknown>).results as unknown[])
    : [];
  const genomes: Record<string, string>[] = rawResults.map((r: unknown) =>
    r && typeof r === "object"
      ? (Object.fromEntries(
          Object.entries(r as Record<string, unknown>).map(([k, v]) => [
            k,
            v !== null && v !== undefined
              ? String(v as string | number | boolean)
              : "",
          ]),
        ) as Record<string, string>)
      : {},
  );
  return { ok: true, genomes };
}

/**
 * Parse minhash result into rows and genome IDs; apply fallback when rows have no genome_id.
 */
function getMinhashRowsAndIds(result: unknown): {
  minhashRows: SimilarGenomeFinderResultRow[];
  genomeIds: string[];
} {
  let minhashRows = parseMinhashResultPayload(result);
  let genomeIds = minhashRows.reduce<string[]>((ids, row) => {
    const genomeId = row.genome_id.trim();
    if (genomeId) ids.push(genomeId);
    return ids;
  }, []);

  if (
    minhashRows.length > 0 &&
    genomeIds.length === 0 &&
    result &&
    typeof result === "object"
  ) {
    const raw = result as Record<string, unknown>;
    const resObj = raw.result;
    if (resObj && typeof resObj === "object") {
      const r = resObj as Record<string, unknown>;
      const idList = (r.genome_id ?? r.genomeId ?? r.id ?? raw.genome_ids) as
        unknown[] | undefined;
      const ids = Array.isArray(idList)
        ? idList.reduce<string[]>((values, value) => {
            const id =
              typeof value === "string" || typeof value === "number"
                ? String(value).trim()
                : "";
            if (id) values.push(id);
            return values;
          }, [])
        : [];
      if (ids.length >= minhashRows.length) {
        genomeIds = ids.slice(0, minhashRows.length);
        minhashRows = minhashRows.map((row, i) => ({
          ...row,
          genome_id: genomeIds[i] ?? row.genome_id,
        }));
      }
    }
  }
  return { minhashRows, genomeIds };
}

/**
 * Merge minhash rows with genome API results, or use minhash rows as placeholder when no genomes.
 */
function processResults(
  minhashRows: SimilarGenomeFinderResultRow[],
  genomeResult: { ok: true; genomes: Record<string, string>[] } | null,
): SimilarGenomeFinderResultRow[] {
  if (genomeResult?.ok && genomeResult.genomes.length > 0) {
    return mergeGenomeResults(minhashRows, genomeResult.genomes);
  }
  return minhashRows;
}

/**
 * Server Action: run Similar Genome Finder (Minhash + genome enrichment).
 * Orchestrates fetchMinhashResults, fetchGenomeDetails, and processResults; returns rows or error.
 */
export async function submitSimilarGenomes(
  data: SimilarGenomeFinderFormData,
): Promise<SubmitSimilarGenomesResponse> {
  try {
    const { token } = await requireAuthSession();
    const baseUrl = await getBaseUrl();
    const payload = buildMinhashServicePayload(data);
    const minhashRes = await fetchMinhashResults(baseUrl, token, payload);
    if (!minhashRes.ok) {
      return { success: false, error: minhashRes.error };
    }

    const { minhashRows, genomeIds } = getMinhashRowsAndIds(minhashRes.result);

    let genomeResult: { ok: true; genomes: Record<string, string>[] } | null =
      null;
    if (genomeIds.length > 0) {
      const res = await fetchGenomeDetails(baseUrl, token, genomeIds);
      if (res.ok) genomeResult = res;
    }

    const rows = processResults(minhashRows, genomeResult);
    return { success: true, rows };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Submission failed";
    return { success: false, error: message };
  }
}
