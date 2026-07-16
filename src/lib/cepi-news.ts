/**
 * CEPI news feed.
 *
 * CEPI (cepi.net) exposes no RSS feed or public API. Its /news page is an Astro
 * site that embeds every article as structured JSON in its server-rendered
 * hydration state (HTML-entity-encoded). We parse that blob to surface the most
 * recent news stories.
 *
 * This is an UNVERSIONED, internal data shape — it can change on any CEPI
 * redeploy. `fetchCepiNews` therefore never throws: on any failure it returns an
 * empty array and the caller falls back to a hardcoded list.
 */

export interface CepiNewsItem {
  title: string;
  description: string;
  image: string;
  url: string;
  date: string;
}

const cepiOrigin = "https://cepi.net";
const cepiNewsUrl = `${cepiOrigin}/news`;
// CEPI serves derivative image sizes under /images/<WxH>/. 800x600 is the size
// reliably generated for news card JPGs (other sizes 404 for many images).
const cepiImageBase = "https://static.cepi.net/images/800x600";
const fetchTimeoutMs = 5000;
const revalidateSeconds = 86400; // once per day

// Astro serializes each list item as an object literal in the hydration state.
// Match objects that carry a contentType so we can distinguish news from blogs.
const itemPattern = /\{"id":\[0,"\d+"\][\s\S]*?"contentType":\[0,"(news|article)"\]/g;

/** Decode the HTML entities Astro uses when inlining JSON into the page. */
function decodeEntities(html: string): string {
  return html
    .replaceAll("&quot;", '"')
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .replaceAll("&amp;", "&");
}

/** Reverse the backslash-escaping Astro applies to quotes inside inlined strings. */
function unescape(value: string): string {
  return value.replaceAll('\\"', '"').replaceAll("\\\\", "\\");
}

/** Extract a `"key":[0,"value"]` string field from a serialized object span. */
function stringField(obj: string, key: string): string | undefined {
  const match = new RegExp(`"${key}":\\[0,"((?:[^"\\\\]|\\\\.)*)"\\]`).exec(obj);
  return match ? unescape(match[1]) : undefined;
}

/** Extract the nested `"image":[0,{"src":[0,"value"]...}]` source path. */
function imageSrc(obj: string): string | undefined {
  const match = /"image":\[0,\{"src":\[0,"((?:[^"\\]|\\.)*)"\]/.exec(obj);
  return match ? unescape(match[1]) : undefined;
}

/** Build an absolute, URL-encoded CEPI image URL from a relative src path. */
function toImageUrl(src: string | undefined): string {
  if (!src) return "";
  // Filenames contain spaces and parentheses; encodeURI keeps the path separators.
  return `${cepiImageBase}${encodeURI(src)}`;
}

/**
 * Parse CEPI's /news HTML into the top `limit` news items (newest first).
 * Filters strictly to `contentType === "news"` (excludes blogs/features), dedupes
 * by URL, and sorts by descending ISO date. Returns [] if nothing parses.
 */
export function parseCepiNews(html: string, limit = 4): CepiNewsItem[] {
  const decoded = decodeEntities(html);
  const seen = new Set<string>();
  const items: CepiNewsItem[] = [];

  for (const match of decoded.matchAll(itemPattern)) {
    const obj = match[0];
    if (match[1] !== "news") continue;

    const title = stringField(obj, "title")?.trim();
    const url = stringField(obj, "url");
    if (!title || !url || seen.has(url)) continue;
    seen.add(url);

    items.push({
      title,
      description: stringField(obj, "summary")?.trim() ?? "",
      image: toImageUrl(imageSrc(obj)),
      url: url.startsWith("http") ? url : `${cepiOrigin}${url}`,
      date: stringField(obj, "date") ?? "",
    });
  }

  items.sort((a, b) => b.date.localeCompare(a.date));
  return items.slice(0, limit);
}

/**
 * Fetch and parse the latest CEPI news. Server-side only; cached daily via ISR.
 * Never throws — returns [] on any network/parse failure so the caller can fall
 * back to a hardcoded list.
 */
export async function fetchCepiNews(limit = 4): Promise<CepiNewsItem[]> {
  try {
    const response = await fetch(cepiNewsUrl, {
      next: { revalidate: revalidateSeconds },
      signal: AbortSignal.timeout(fetchTimeoutMs),
    });
    if (!response.ok) return [];
    const html = await response.text();
    return parseCepiNews(html, limit);
  } catch {
    return [];
  }
}
