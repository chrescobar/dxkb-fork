import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parseCepiNews } from "@/lib/cepi-news";

const fixture = readFileSync(join(__dirname, "fixtures", "cepi-news.fixture.html"), "utf8");

describe("parseCepiNews", () => {
  it("excludes non-news content types (blogs/articles)", () => {
    const items = parseCepiNews(fixture, 10);
    expect(items.some((i) => i.url.includes("a-blog-post-excluded"))).toBe(false);
    expect(items.every((i) => i.title.length > 0)).toBe(true);
  });

  it("sorts by date descending (newest first)", () => {
    const items = parseCepiNews(fixture, 10);
    const dates = items.map((i) => i.date);
    expect(dates).toEqual([...dates].sort((a, b) => b.localeCompare(a)));
    expect(items[0].date).toBe("2026-07-13");
  });

  it("dedupes by url", () => {
    const items = parseCepiNews(fixture, 10);
    const older = items.filter((i) => i.url.endsWith("/older-news-story"));
    expect(older).toHaveLength(1);
  });

  it("respects the limit", () => {
    expect(parseCepiNews(fixture, 2)).toHaveLength(2);
  });

  it("builds absolute, URL-encoded image URLs", () => {
    const [newest] = parseCepiNews(fixture, 1);
    expect(newest.image).toBe(
      "https://static.cepi.net/images/800x600/2026-07/Photo%20With%20Spaces%20(final).jpg",
    );
  });

  it("builds absolute article URLs and decodes HTML entities", () => {
    const [newest] = parseCepiNews(fixture, 1);
    expect(newest.url).toBe("https://cepi.net/newest-story-undruggable-targets");
    expect(newest.title).toBe('Newest story about "undruggable" targets');
    expect(newest.description).toBe("A summary with an & ampersand and an 'apostrophe'.");
  });

  it("returns an empty array when nothing parses", () => {
    expect(parseCepiNews("<html><body>no data here</body></html>")).toEqual([]);
  });
});
