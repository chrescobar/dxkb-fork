const { availableDatasetIds } = vi.hoisted(() => ({
  availableDatasetIds: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/phylogeny/dataset-store", () => ({ availableDatasetIds }));

import { GET } from "../route";

describe("GET /api/phylogeny/nextstrain-datasets", () => {
  it("returns sorted dataset identifiers only", async () => {
    availableDatasetIds.mockResolvedValue(
      new Set(["Orthoebolavirus/500", "Influenza-A-Virus/H3N2/HA"]),
    );

    const response = await GET();

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      ids: ["Influenza-A-Virus/H3N2/HA", "Orthoebolavirus/500"],
    });
  });

  it("fails closed when the store is unavailable", async () => {
    availableDatasetIds.mockRejectedValue(new Error("missing mount"));

    const response = await GET();

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({
      error: "dataset store unavailable",
    });
  });
});
