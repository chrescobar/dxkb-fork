import { fetchFeaturesFromGroup } from "../feature";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

afterEach(() => {
  vi.resetAllMocks();
});

describe("fetchFeaturesFromGroup", () => {
  it("returns [] for an empty path", async () => {
    const result = await fetchFeaturesFromGroup("");
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("returns [] for a whitespace-only path", async () => {
    const result = await fetchFeaturesFromGroup("   ");
    expect(result).toEqual([]);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("fetches features and returns data.results on success", async () => {
    const features = [
      { feature_id: "fig|123.4.peg.1", product: "hypothetical protein" },
      { feature_id: "fig|123.4.peg.2", product: "kinase" },
    ];

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ results: features }),
    });

    const result = await fetchFeaturesFromGroup("/my/feature/group");

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(mockFetch).toHaveBeenCalledWith(
      "/api/services/feature/from-group",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ feature_group_path: "/my/feature/group" }),
      }),
    );
    expect(result).toEqual(features);
  });

  it("throws on HTTP error", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "group not found" }),
    });

    await expect(fetchFeaturesFromGroup("/bad/path")).rejects.toThrow("group not found");
  });

  it("returns [] when the request is aborted", async () => {
    const abortError = new DOMException("The operation was aborted.", "AbortError");
    mockFetch.mockRejectedValueOnce(abortError);

    const result = await fetchFeaturesFromGroup("/some/path", {
      signal: AbortSignal.abort(),
    });

    expect(result).toEqual([]);
  });
});
