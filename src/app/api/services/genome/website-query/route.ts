import { NextRequest, NextResponse } from "next/server";
import { getServerAuthToken } from "@/lib/auth";

/**
 * Base URL for PATRIC/BV-BRC genome API (e.g. https://patricbrc.org/api or BV-BRC equivalent).
 * Genome endpoint: ${BVBRC_WEBSITE_API_URL}/genome/
 */
const GENOME_WEBSITE_API = `${process.env.BVBRC_WEBSITE_API_URL}/genome/`;

const MAX_ROWS = 25_000;

/**
 * Parse CSV line handling quoted fields (handles commas inside quotes).
 */
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Parse CSV text into array of objects (first row = headers).
 */
function csvToJson(csvText: string): Record<string, string>[] {
  const lines = csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  const headers = parseCsvLine(lines[0]);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    rows.push(row);
  }
  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const token = await getServerAuthToken();

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json().catch(() => ({}));
    const genomeIds: string[] = Array.isArray(body?.genome_ids)
      ? (body.genome_ids as string[]).map((id: unknown) => String(id).trim())
      : [];

    if (genomeIds.length === 0) {
      return NextResponse.json({ results: [] });
    }

    // Build Solr-style query: genome_id:(id1 OR id2 OR ...)
    const escapedIds = genomeIds
      .filter((id) => id.length > 0)
      .map((id) => (id.includes(" ") ? `"${id}"` : id));
    const q = `genome_id:(${escapedIds.join(" OR ")})`;
    const rowsParam = String(Math.min(MAX_ROWS, Math.max(genomeIds.length, 25000)));

    // PATRIC/BV-BRC genome API expects POST with form body (solrquery or x-www-form-urlencoded)
    const formBody = new URLSearchParams({ rows: rowsParam, q });

    const response = await fetch(GENOME_WEBSITE_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/solrquery+x-www-form-urlencoded",
        Accept: "application/json",
        Authorization: token,
      },
      body: formBody.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Genome website query error:", response.status, errorText);
      return NextResponse.json(
        {
          error: `BV-BRC genome query failed: ${response.status} ${response.statusText}`,
        },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type") ?? "";
    const text = await response.text();

    if (contentType.includes("application/json")) {
      const data = JSON.parse(text);
      const results = Array.isArray(data) ? data : data?.items ?? data?.results ?? [];
      return NextResponse.json({ results });
    }

    // CSV response (e.g. api-for-website returns CSV)
    const results = csvToJson(text);
    return NextResponse.json({ results });
  } catch (error) {
    console.error("Genome website query API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
