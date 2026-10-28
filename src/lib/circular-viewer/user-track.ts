import type { ScoreScale } from "./paths";

/** Legacy `TrackController`'s plot types (`tiles` is the default). */
export const userPlotTypes = ["tiles", "line", "histogram", "heatmap"] as const;
export type UserPlotType = (typeof userPlotTypes)[number];

export function isUserPlotType(value: unknown): value is UserPlotType {
  return (userPlotTypes as readonly unknown[]).includes(value);
}

/** One uploaded row, 1-based inclusive like the Data API's features. */
export interface UserTrackItem {
  accession: string;
  start: number;
  end: number;
  score: number | null;
}

export interface ParsedUserTrack {
  items: UserTrackItem[];
  scale: ScoreScale;
  /** Lines that were neither blank nor readable (a header, a bad number). */
  skipped: number;
}

/** A file this large would stall the tab while it is parsed and drawn. */
export const maxUserFileBytes = 20 * 1024 * 1024;

/** Legacy took `text/plain` only; a `.tsv` file has its own type. */
export const userFileAccept = ".txt,.tsv,.tab,text/plain,text/tab-separated-values";

/**
 * Legacy `validateUserFileSelection`'s range: `[0, 1]` for shares, `[-1, 1]`
 * for skews, `[0, max]` for positive data, else symmetric about 0. `min` and
 * `max` start at 0, as legacy's did.
 */
export function userScoreScale(min: number, max: number): ScoreScale {
  if (max <= 1 && max > 0 && min >= 0) return { min: 0, max: 1 };
  if (max <= 1 && max > 0 && min < 0 && min >= -1) return { min: -1, max: 1 };
  if (max > 1 && min >= 0) return { min: 0, max };
  const magnitude = Math.max(Math.abs(max), Math.abs(min));
  return { min: -magnitude, max: magnitude };
}

/** The scale of the items' scores; `min` and `max` start at 0, as legacy's did. */
function itemsScale(items: readonly UserTrackItem[]): ScoreScale {
  let min = 0;
  let max = 0;
  for (const { score } of items) {
    if (score === null) continue;
    min = Math.min(min, score);
    max = Math.max(max, score);
  }
  return userScoreScale(min, max);
}

/**
 * Tab-separated `accession start end [score]`, as legacy read uploads: a
 * fourth column is a score for every plot type, a three-column row counts
 * only for tiles, and anything else is skipped. Sorted by start, then end.
 */
export function parseUserTrack(text: string, plot: UserPlotType): ParsedUserTrack {
  const items: UserTrackItem[] = [];
  let skipped = 0;
  for (const line of text.split(/\r\n|\r|\n/)) {
    if (line.trim() === "") continue;
    const cells = line.split("\t");
    const [rawAccession = "", rawStart = "", rawEnd = "", rawScore = ""] = cells;
    const accession = rawAccession.trim();
    const start = Number.parseInt(rawStart, 10);
    const end = Number.parseInt(rawEnd, 10);
    const readable =
      accession !== "" && Number.isInteger(start) && Number.isInteger(end) && end >= start;
    if (readable && cells.length > 3) {
      const score = Number.parseFloat(rawScore);
      if (Number.isFinite(score)) {
        items.push({ accession, start, end, score });
        continue;
      }
    } else if (readable && cells.length === 3 && plot === "tiles") {
      items.push({ accession, start, end, score: null });
      continue;
    }
    skipped += 1;
  }
  items.sort((a, b) => a.start - b.start || a.end - b.end);
  return { items, scale: itemsScale(items), skipped };
}

/**
 * Drops the rows whose accession is not in `accessions` (the sequences the
 * figure draws; legacy threw on the first) and rescales the scores without
 * them, so the plot range is the drawn one. `skipped` still counts only the
 * unreadable lines.
 */
export function keepAccessions(
  parsed: ParsedUserTrack,
  accessions: ReadonlySet<string>,
): { parsed: ParsedUserTrack; dropped: number } {
  const items = parsed.items.filter((item) => accessions.has(item.accession));
  const dropped = parsed.items.length - items.length;
  if (dropped === 0) return { parsed, dropped };
  return { parsed: { ...parsed, items, scale: itemsScale(items) }, dropped };
}
