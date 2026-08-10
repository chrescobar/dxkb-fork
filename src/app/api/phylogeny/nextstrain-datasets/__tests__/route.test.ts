const { availableDatasetIds, remoteDatasetExists } = vi.hoisted(() => ({
  availableDatasetIds: vi.fn(),
  remoteDatasetExists: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/phylogeny/dataset-store", () => ({
  availableDatasetIds,
  remoteDatasetExists,
}));

import { NextRequest } from "next/server";

import { GET } from "../route";

function request(ids: string[] = []) {
  const url = new URL("http://localhost/api/phylogeny/nextstrain-datasets");
  for (const id of ids) url.searchParams.append("id", id);
  return new NextRequest(url);
}

describe("GET /api/phylogeny/nextstrain-datasets", () => {
  it("returns sorted dataset identifiers only", async () => {
    availableDatasetIds.mockResolvedValue(
      new Set(["Orthoebolavirus/500", "Influenza-A-Virus/H3N2/HA"]),
    );

    const response = await GET(request());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ids: ["Influenza-A-Virus/H3N2/HA", "Orthoebolavirus/500"],
    });
  });

  it("adds exact advertised datasets available from the legacy service", async () => {
    availableDatasetIds.mockResolvedValue(
      new Set(["Influenza-A-Virus/H3N2/HA"]),
    );
    remoteDatasetExists.mockImplementation((id: string) =>
      Promise.resolve(id === "Orthoebolavirus/100"),
    );

    const response = await GET(
      request([
        "Orthoebolavirus/100",
        "Orthoebolavirus/500",
        "//example.org/tree",
      ]),
    );

    await expect(response.json()).resolves.toEqual({
      ids: ["Influenza-A-Virus/H3N2/HA", "Orthoebolavirus/100"],
    });
    expect(remoteDatasetExists).toHaveBeenCalledTimes(2);
  });

  it("fails closed when the store is unavailable", async () => {
    availableDatasetIds.mockRejectedValue(new Error("missing mount"));

    const response = await GET(request());

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "dataset store unavailable",
    });
  });
});
