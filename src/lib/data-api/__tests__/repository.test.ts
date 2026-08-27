import { describe, expect, it, vi } from "vitest";
import { ServerDataRepository } from "../repository";

function jsonResponse(value: unknown, init?: ResponseInit): Response {
  return new Response(JSON.stringify(value), {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("ServerDataRepository", () => {
  it("combines rows, count, and facets with exclusive-end range and stable sorting", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      jsonResponse({
        response: {
          numFound: 251,
          docs: [{ genome_id: "1.1", genome_name: "One" }],
        },
        facet_counts: { facet_fields: { genus: ["Escherichia", 20] } },
      }),
    );
    const repository = new ServerDataRepository({
      baseUrl: "https://data.test",
      fetch: fetcher,
    });

    const result = await repository.collection("genome", {
      operation: "collection",
      page: 1,
      pageSize: 200,
      rql: "eq(genome_id,1.1)",
      fields: ["genome_id", "genome_name"],
      facets: ["genus"],
      sort: { field: "genome_name", direction: "asc" },
    });

    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBeInstanceOf(URL);
    const requestedUrl = (url as URL).href;
    expect(requestedUrl).toContain("eq(genome_id,1.1)");
    expect(requestedUrl).toContain("sort(+genome_name,+genome_id)");
    expect(new Headers(init?.headers).get("Range")).toBe("items=0-200");
    expect(result).toEqual({
      rows: [{ genome_id: "1.1", genome_name: "One" }],
      total: 251,
      facets: { genus: [{ value: "Escherichia", count: 20 }] },
      page: 1,
      pageSize: 200,
    });
  });

  it("uses tokenized prefix matching for keywords", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse({ response: { numFound: 0, docs: [] } }));
    const repository = new ServerDataRepository({
      baseUrl: "https://data.test",
      fetch: fetcher,
    });

    await repository.collection("genome", {
      operation: "collection",
      keyword: "influenza virus",
    });

    const [url] = fetcher.mock.calls[0];
    expect((url as URL).href).toContain(
      "and(keyword(influenza%2A),keyword(virus%2A))",
    );
  });

  it("forwards auth and returns null for a missing member", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(jsonResponse([]));
    const repository = new ServerDataRepository({
      baseUrl: "https://data.test/",
      token: "raw-token",
      fetch: fetcher,
    });
    await expect(
      repository.member("epitope", { operation: "member", id: "12" }),
    ).resolves.toEqual({ row: null });
    expect(
      new Headers(fetcher.mock.calls[0][1]?.headers).get("Authorization"),
    ).toBe("raw-token");
  });

  it("validates genome fields used by consumers", async () => {
    const repository = new ServerDataRepository({
      baseUrl: "https://data.test",
      fetch: vi
        .fn<typeof fetch>()
        .mockResolvedValue(jsonResponse([{ genome_name: "missing id" }])),
    });
    await expect(
      repository.member("genome", { operation: "member", id: "1" }),
    ).rejects.toThrow(/Malformed genome response/);
  });

  it.each([401, 403])("preserves inaccessible status %s", async (status) => {
    const repository = new ServerDataRepository({
      baseUrl: "https://data.test",
      fetch: vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          jsonResponse({ message: "Inaccessible" }, { status }),
        ),
    });

    await expect(
      repository.member("genome", { operation: "member", id: "1.1" }),
    ).rejects.toMatchObject({ status });
  });

  it("retains a concise meaningful upstream error", async () => {
    const repository = new ServerDataRepository({
      baseUrl: "https://data.test",
      fetch: vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          jsonResponse(
            { error: { msg: "Invalid query near genome_id\nstack details" } },
            { status: 400 },
          ),
        ),
    });
    await expect(
      repository.member("genome", { operation: "member", id: "1" }),
    ).rejects.toMatchObject({
      message: "Invalid query near genome_id stack details",
      status: 502,
      code: "upstream_error",
    });
  });

  it.each([
    [401, "unauthorized"],
    [403, "forbidden"],
    [404, "not_found"],
    [429, "rate_limited"],
  ] as const)("preserves safe upstream status %i", async (status, code) => {
    const repository = new ServerDataRepository({
      baseUrl: "https://data.test",
      fetch: vi
        .fn<typeof fetch>()
        .mockResolvedValue(
          jsonResponse({ message: "Upstream denied request" }, { status }),
        ),
    });

    await expect(
      repository.member("genome", { operation: "member", id: "1" }),
    ).rejects.toMatchObject({
      status,
      code,
      message: "Upstream denied request",
    });
  });

  it("forwards abort signals and cache options to the upstream request", async () => {
    const signal = new AbortController().signal;
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(jsonResponse([{ genome_id: "1.1" }]));
    const repository = new ServerDataRepository({
      baseUrl: "https://data.test",
      fetch: fetcher,
      cache: "force-cache",
      revalidate: 300,
    });

    await repository.member(
      "genome",
      { operation: "member", id: "1.1" },
      signal,
    );

    expect(fetcher).toHaveBeenCalledWith(
      expect.any(URL),
      expect.objectContaining({
        signal,
        cache: "force-cache",
        next: { revalidate: 300 },
      }),
    );
  });
});
