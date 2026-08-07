import { renderHook, waitFor } from "@testing-library/react";

import { createQueryClientWrapper } from "@/test-helpers/api-route-helpers";

import { useNextstrainInventory } from "../use-phylogeny-data";

describe("useNextstrainInventory", () => {
  it("canonicalizes, deduplicates, and preserves case-sensitive IDs", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ids: [
            "/Influenza-A-Virus/H3N2/HA/",
            "Influenza-A-Virus/H3N2/HA",
            "influenza-A-Virus/H3N2/HA",
          ],
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );

    const { result } = renderHook(() => useNextstrainInventory(), {
      wrapper: createQueryClientWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(
      new Set(["Influenza-A-Virus/H3N2/HA", "influenza-A-Virus/H3N2/HA"]),
    );
    expect(fetch).toHaveBeenCalledWith("/api/phylogeny/nextstrain-datasets", {
      headers: { Accept: "application/json" },
    });
  });

  it.each([
    ["HTTP failure", new Response("error", { status: 500 })],
    ["non-object body", new Response("[]", { status: 200 })],
    ["missing ids", new Response("{}", { status: 200 })],
    ["non-array ids", new Response('{"ids":{}}', { status: 200 })],
    ["non-string id", new Response('{"ids":[1]}', { status: 200 })],
    [
      "invalid id",
      new Response('{"ids":["//example.org/tree"]}', { status: 200 }),
    ],
  ])("rejects %s", async (_name, response) => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(response);

    const { result } = renderHook(() => useNextstrainInventory(), {
      wrapper: createQueryClientWrapper(),
    });
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
    expect(result.current.data).toBeUndefined();
  });
});
