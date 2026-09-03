vi.mock("@/lib/auth/server/session", () => ({ readSession: vi.fn() }));

import { readSession } from "@/lib/auth/server/session";
import { getProteinStructures } from "@/lib/protein-structure-view/server";

const originalDataApiUrl = process.env.DATA_API_URL;

afterEach(() => {
  vi.restoreAllMocks();
  if (originalDataApiUrl === undefined) delete process.env.DATA_API_URL;
  else process.env.DATA_API_URL = originalDataApiUrl;
});

describe("getProteinStructures", () => {
  it("queries metadata for AlphaFold accessions", async () => {
    process.env.DATA_API_URL = "https://data.example/";
    vi.mocked(readSession).mockResolvedValue(null);
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          { pdb_id: "AF-P12345-F1", title: "Predicted structure" },
        ]),
        { status: 200 },
      ),
    );

    await expect(getProteinStructures(["AF-P12345-F1"])).resolves.toEqual([
      {
        accession: "AF-P12345-F1",
        metadata: {
          pdb_id: "AF-P12345-F1",
          title: "Predicted structure",
        },
      },
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("keeps each metadata failure independent", async () => {
    process.env.DATA_API_URL = "https://data.example/";
    vi.mocked(readSession).mockResolvedValue(null);
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify([{ pdb_id: "1ABC", title: "One" }]), {
          status: 200,
        }),
      )
      .mockResolvedValueOnce(
        new Response("backend unavailable", { status: 503 }),
      );

    const result = await getProteinStructures(["1ABC", "2XYZ"]);
    expect(result[0]).toMatchObject({
      accession: "1ABC",
      metadata: { title: "One" },
    });
    expect(result[1]).toMatchObject({ accession: "2XYZ", metadata: null });
    expect(result[1]?.error).toContain("status 503");
  });
});
