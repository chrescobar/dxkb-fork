const { readDataset } = vi.hoisted(() => ({ readDataset: vi.fn() }));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/phylogeny/dataset-store", async importOriginal => ({
  ...(await importOriginal<typeof import("@/lib/phylogeny/dataset-store")>()),
  readDataset,
}));

import { NextRequest } from "next/server";

import { GET } from "../route";

function request(query = "") {
  return new NextRequest(`http://localhost/api/charon/getDataset${query}`);
}

describe("GET /api/charon/getDataset", () => {
  it("requires a prefix", async () => {
    const response = await GET(request());
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ error: "prefix is required" });
  });

  it("returns an exact main dataset with cache headers", async () => {
    const body = '{"version":"v2","meta":{},"tree":{}}';
    readDataset.mockResolvedValue(body);

    const response = await GET(
      request("?prefix=nextstrain-viewer/Influenza-A-Virus/H3N2/HA&type=tree"),
    );

    expect(readDataset).toHaveBeenCalledWith(
      "Influenza-A-Virus/H3N2/HA",
      undefined,
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=300, stale-while-revalidate=3600",
    );
    await expect(response.text()).resolves.toBe(body);
  });

  it("passes supported sidecars to the store", async () => {
    readDataset.mockResolvedValue("{}");

    await GET(
      request(
        "?prefix=nextstrain-viewer/Influenza-A-Virus/H3N2/HA&type=root-sequence",
      ),
    );

    expect(readDataset).toHaveBeenCalledWith(
      "Influenza-A-Virus/H3N2/HA",
      "root-sequence",
    );
  });

  it("rejects unsupported sidecars and malicious identifiers", async () => {
    expect(
      (await GET(request("?prefix=tree&type=unknown"))).status,
    ).toBe(400);
    expect(
      (await GET(request("?prefix=nextstrain-viewer/../secret"))).status,
    ).toBe(400);
    expect(readDataset).not.toHaveBeenCalled();
  });

  it("returns 404 without redirect for an exact miss", async () => {
    readDataset.mockResolvedValue(null);

    const response = await GET(
      request("?prefix=nextstrain-viewer/Influenza-A-Virus/H5N1/HA"),
    );

    expect(response.status).toBe(404);
    expect(response.headers.get("location")).toBeNull();
    expect(readDataset).toHaveBeenCalledWith(
      "Influenza-A-Virus/H5N1/HA",
      undefined,
    );
  });

  it("returns a generic 500 when the store fails", async () => {
    readDataset.mockRejectedValue(new Error("/private/store unavailable"));

    const response = await GET(
      request("?prefix=nextstrain-viewer/Orthoebolavirus/100"),
    );

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "dataset store unavailable",
    });
  });
});
