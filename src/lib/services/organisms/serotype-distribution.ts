import type { SerotypeDistributionData, SerotypeYear } from "./types";
import {
  getBvBrcWebsiteApiBaseUrl,
  organismBvBrcRevalidateSeconds,
  organismFetchCacheInit,
  readJsonObject,
  responseErrorMessage,
} from "./utils";

interface PivotEntry {
  value?: unknown;
  pivot?: PivotEntry[];
  count?: unknown;
}

function parseSerotypeDistributionPivot(
  payload: Record<string, unknown>,
): { year: number; serovars: Record<string, number> }[] {
  const facetCounts = payload.facet_counts;
  if (!facetCounts || typeof facetCounts !== "object" || Array.isArray(facetCounts)) {
    throw new Error("Unexpected SOLR response shape: missing facet_counts");
  }

  const facetPivot = (facetCounts as Record<string, unknown>).facet_pivot;
  if (!facetPivot || typeof facetPivot !== "object" || Array.isArray(facetPivot)) {
    throw new Error("Unexpected SOLR response shape: missing facet_pivot");
  }

  const rawPivot = (facetPivot as Record<string, unknown>)["collection_year,serovar"];
  if (!Array.isArray(rawPivot)) return [];

  return (rawPivot as PivotEntry[]).flatMap((entry) => {
    const year = entry.value;
    if (typeof year !== "number" || !Number.isInteger(year)) return [];

    const serovars: Record<string, number> = {};
    if (Array.isArray(entry.pivot)) {
      for (const sub of entry.pivot as PivotEntry[]) {
        const sv = sub.value;
        const count = sub.count;
        if (typeof sv !== "string" || sv.length === 0) continue;
        if (typeof count === "number" && Number.isFinite(count)) {
          serovars[sv] = count;
        }
      }
    }
    return [{ year, serovars }];
  });
}

function transformPivot(
  rows: { year: number; serovars: Record<string, number> }[],
): SerotypeDistributionData {
  if (rows.length === 0) return { years: [], serovars: [] };

  const allYears = rows.map((r) => r.year).sort((a, b) => a - b);
  const maxYear = allYears[allYears.length - 1];
  const startYear = maxYear - 9;

  const filtered = rows.filter((r) => r.year >= startYear);

  // Sum each serovar across the filtered window
  const serovarTotals: Record<string, number> = {};
  for (const row of filtered) {
    for (const [sv, count] of Object.entries(row.serovars)) {
      serovarTotals[sv] = (serovarTotals[sv] ?? 0) + count;
    }
  }

  const topSerovars = Object.entries(serovarTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([sv]) => sv);

  const years: SerotypeYear[] = filtered
    .sort((a, b) => a.year - b.year)
    .map(({ year, serovars }) => {
      const yearEntry: SerotypeYear = { year };
      for (const sv of topSerovars) {
        yearEntry[sv] = serovars[sv] ?? 0;
      }
      return yearEntry;
    });

  return { years, serovars: topSerovars };
}

export async function fetchSerotypeDistribution(
  taxonId: number,
): Promise<SerotypeDistributionData> {
  const baseUrl = getBvBrcWebsiteApiBaseUrl();
  const url =
    `${baseUrl}/genome/?eq(taxon_lineage_ids,${taxonId})` +
    `&facet((pivot,(collection_year,serovar)),(mincount,1))&limit(0)`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Accept: "application/solr+json" },
    ...organismFetchCacheInit(organismBvBrcRevalidateSeconds),
  });

  if (!response.ok) {
    throw new Error(await responseErrorMessage(response));
  }

  const payload = await readJsonObject(response, "serotype distribution pivot");
  const rows = parseSerotypeDistributionPivot(payload);
  return transformPivot(rows);
}
