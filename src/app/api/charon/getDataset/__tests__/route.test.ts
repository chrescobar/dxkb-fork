const { fetchRemoteDataset, readDataset } = vi.hoisted(() => ({
  fetchRemoteDataset: vi.fn(),
  readDataset: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/phylogeny/dataset-store", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/phylogeny/dataset-store")>()),
  fetchRemoteDataset,
  readDataset,
}));

import { NextRequest } from "next/server";

import { GET } from "../route";

function request(query = "") {
  return new NextRequest(`http://localhost/api/charon/getDataset${query}`);
}

describe("GET /api/charon/getDataset", () => {
  beforeEach(() => {
    fetchRemoteDataset.mockResolvedValue(null);
  });

  it("requires a prefix", async () => {
    const response = await GET(request());
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "prefix is required",
    });
  });

  it("returns an exact remote main dataset with cache headers", async () => {
    const body = '{"version":"v2","meta":{},"tree":{}}';
    fetchRemoteDataset.mockResolvedValue(body);

    const response = await GET(
      request("?prefix=nextstrain-viewer/Influenza-A-Virus/H3N2/HA&type=tree"),
    );

    expect(fetchRemoteDataset).toHaveBeenCalledWith(
      "Influenza-A-Virus/H3N2/HA",
      undefined,
    );
    expect(readDataset).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("application/json");
    expect(response.headers.get("cache-control")).toBe(
      "public, max-age=300, stale-while-revalidate=3600",
    );
    await expect(response.text()).resolves.toBe(body);
  });

  it("passes supported sidecars to the remote source", async () => {
    fetchRemoteDataset.mockResolvedValue("{}");

    await GET(
      request(
        "?prefix=nextstrain-viewer/Influenza-A-Virus/H3N2/HA&type=root-sequence",
      ),
    );

    expect(fetchRemoteDataset).toHaveBeenCalledWith(
      "Influenza-A-Virus/H3N2/HA",
      "root-sequence",
    );
  });

  it("rejects unsupported sidecars and malicious identifiers", async () => {
    expect((await GET(request("?prefix=tree&type=unknown"))).status).toBe(400);
    expect(
      (await GET(request("?prefix=nextstrain-viewer/../secret"))).status,
    ).toBe(400);
    expect(
      (
        await GET(
          request("?prefix=//nextstrain-viewer/Influenza-A-Virus/H3N2/HA"),
        )
      ).status,
    ).toBe(400);
    expect(readDataset).not.toHaveBeenCalled();
  });

  it.each(["missing", "unavailable"])(
    "falls back to the local store when the remote dataset is %s",
    async (state) => {
      const body = '{"version":"v2","meta":{},"tree":{}}';
      if (state === "missing") fetchRemoteDataset.mockResolvedValue(null);
      else
        fetchRemoteDataset.mockRejectedValue(new Error("remote unavailable"));
      readDataset.mockResolvedValue(body);

      const response = await GET(
        request("?prefix=nextstrain-viewer/Orthoebolavirus/100"),
      );

      expect(fetchRemoteDataset).toHaveBeenCalledWith(
        "Orthoebolavirus/100",
        undefined,
      );
      expect(readDataset).toHaveBeenCalledOnce();
      expect(readDataset).toHaveBeenCalledWith(
        "Orthoebolavirus/100",
        undefined,
      );
      expect(response.status).toBe(200);
      await expect(response.text()).resolves.toBe(body);
    },
  );

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

  it.each(["missing", "unavailable"])(
    "returns a generic 500 when the remote source is unavailable and the local store is %s",
    async (state) => {
      fetchRemoteDataset.mockRejectedValue(new Error("remote unavailable"));
      if (state === "missing") readDataset.mockResolvedValue(null);
      else readDataset.mockRejectedValue(new Error("/private/store unavailable"));

      const response = await GET(
        request("?prefix=nextstrain-viewer/Orthoebolavirus/100"),
      );

      expect(readDataset).toHaveBeenCalledOnce();
      expect(response.status).toBe(500);
      await expect(response.json()).resolves.toEqual({
        error: "dataset sources unavailable",
      });
    },
  );
});
