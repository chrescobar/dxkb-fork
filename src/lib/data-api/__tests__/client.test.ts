import { afterEach, describe, expect, it, vi } from "vitest";
import { DataRepository, DataRepositoryError } from "../client";

const originalFetch = global.fetch;

afterEach(() => {
  global.fetch = originalFetch;
});

describe("DataRepository", () => {
  it("uses the same-origin gateway and forwards abort signals", async () => {
    const signal = new AbortController().signal;
    global.fetch = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          rows: [],
          total: 0,
          facets: {},
          page: 2,
          pageSize: 200,
        }),
      ),
    );
    const repository = new DataRepository();

    await repository.collection(
      "genome",
      {
        page: 2,
        sort: { field: "genome_name", direction: "desc" },
        fields: ["genome_id"],
      },
      signal,
    );

    expect(global.fetch).toHaveBeenCalledWith(
      "/api/data/genome?operation=collection&page=2&sort=genome_name%3Adesc&field=genome_id",
      { credentials: "include", signal },
    );
  });

  it("uses POST for selected rows", async () => {
    global.fetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response(JSON.stringify({ rows: [] })));
    await new DataRepository().selected("genome", { ids: ["1.1"] });
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/data/genome",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ operation: "selected", ids: ["1.1"] }),
      }),
    );
  });

  it("exports every row across capped server batches", async () => {
    const firstBatch = Array.from({ length: 10_000 }, (_, index) => ({
      genome_id: String(index),
    }));
    global.fetch = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ rows: firstBatch })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ rows: [{ genome_id: "10000" }] })),
      );

    const result = await new DataRepository().exportAll("genome", {
      fields: ["genome_id"],
    });

    expect(result.rows).toHaveLength(10_001);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      "/api/data/genome",
      expect.objectContaining({
        body: JSON.stringify({
          operation: "export",
          fields: ["genome_id"],
          limit: 10_000,
          offset: 0,
        }),
      }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      "/api/data/genome",
      expect.objectContaining({
        body: JSON.stringify({
          operation: "export",
          fields: ["genome_id"],
          limit: 10_000,
          offset: 10_000,
        }),
      }),
    );
  });

  it("surfaces gateway errors", async () => {
    global.fetch = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response(
          JSON.stringify({ error: "Too many requests", code: "rate_limited" }),
          { status: 429 },
        ),
      );
    await expect(
      new DataRepository().member("genome", { id: "1.1" }),
    ).rejects.toEqual(
      new DataRepositoryError("Too many requests", 429, "rate_limited"),
    );
  });
});
