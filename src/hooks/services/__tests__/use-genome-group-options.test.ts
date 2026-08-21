import { renderHook, waitFor } from "@testing-library/react";
import { useGenomeGroupOptions } from "../use-genome-group-options";
import { createQueryClientWrapper } from "@/test-helpers/react";
import type { GenomeSummary } from "@/lib/services/genome";

const { mockGetGenomeIdsFromGroup, mockFetchGenomesByIds } = vi.hoisted(() => ({
  mockGetGenomeIdsFromGroup: vi.fn(),
  mockFetchGenomesByIds: vi.fn(),
}));

vi.mock("@/lib/services/genome", () => ({
  getGenomeIdsFromGroup: mockGetGenomeIdsFromGroup,
  fetchGenomesByIds: mockFetchGenomesByIds,
}));

const sampleGenomes: GenomeSummary[] = [
  { genome_id: "1.1", genome_name: "Genome A" },
  { genome_id: "2.2", genome_name: "Genome B" },
];

describe("useGenomeGroupOptions", () => {
  beforeEach(() => {
    mockGetGenomeIdsFromGroup.mockReset();
    mockFetchGenomesByIds.mockReset();
  });

  it("fetches genomes when enabled and path is provided", async () => {
    mockGetGenomeIdsFromGroup.mockResolvedValue(["1.1", "2.2"]);
    mockFetchGenomesByIds.mockResolvedValue(sampleGenomes);

    const { result } = renderHook(
      () => useGenomeGroupOptions("/user/home/group1"),
      { wrapper: createQueryClientWrapper() },
    );

    await waitFor(() => { expect(result.current.isLoading).toBe(false); });
    expect(result.current.options).toEqual(sampleGenomes);
    expect(result.current.error).toBeNull();
    expect(mockGetGenomeIdsFromGroup).toHaveBeenCalledWith("/user/home/group1", expect.objectContaining({ signal: expect.any(AbortSignal) as unknown as AbortSignal }));
    expect(mockFetchGenomesByIds).toHaveBeenCalledWith(["1.1", "2.2"], expect.objectContaining({ signal: expect.any(AbortSignal) as unknown as AbortSignal }));
  });

  it("returns empty array and skips fetchGenomesByIds when group has no genome IDs", async () => {
    mockGetGenomeIdsFromGroup.mockResolvedValue([]);

    const { result } = renderHook(
      () => useGenomeGroupOptions("/user/home/group1"),
      { wrapper: createQueryClientWrapper() },
    );

    await waitFor(() => { expect(result.current.isLoading).toBe(false); });
    expect(result.current.options).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(mockFetchGenomesByIds).not.toHaveBeenCalled();
  });

  it("returns empty array and does not fetch when disabled", () => {
    const { result } = renderHook(
      () => useGenomeGroupOptions("/user/home/group1", false),
      { wrapper: createQueryClientWrapper() },
    );

    expect(result.current.options).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockGetGenomeIdsFromGroup).not.toHaveBeenCalled();
  });

  it("returns empty array and does not fetch when path is empty", () => {
    const { result } = renderHook(
      () => useGenomeGroupOptions(""),
      { wrapper: createQueryClientWrapper() },
    );

    expect(result.current.options).toEqual([]);
    expect(mockGetGenomeIdsFromGroup).not.toHaveBeenCalled();
  });

  it("returns empty array and does not fetch when path is undefined", () => {
    const { result } = renderHook(
      () => useGenomeGroupOptions(undefined),
      { wrapper: createQueryClientWrapper() },
    );

    expect(result.current.options).toEqual([]);
    expect(mockGetGenomeIdsFromGroup).not.toHaveBeenCalled();
  });

  it("returns error string and empty options when getGenomeIdsFromGroup fails", async () => {
    mockGetGenomeIdsFromGroup.mockRejectedValue(new Error("Group fetch failed"));

    const { result } = renderHook(
      () => useGenomeGroupOptions("/user/home/group1"),
      { wrapper: createQueryClientWrapper() },
    );

    await waitFor(() => { expect(result.current.error).not.toBeNull(); });
    expect(result.current.error).toBe("Group fetch failed");
    expect(result.current.options).toEqual([]);
  });

  it("returns error string and empty options when fetchGenomesByIds fails", async () => {
    mockGetGenomeIdsFromGroup.mockResolvedValue(["1.1"]);
    mockFetchGenomesByIds.mockRejectedValue(new Error("Genome fetch failed"));

    const { result } = renderHook(
      () => useGenomeGroupOptions("/user/home/group1"),
      { wrapper: createQueryClientWrapper() },
    );

    await waitFor(() => { expect(result.current.error).not.toBeNull(); });
    expect(result.current.error).toBe("Genome fetch failed");
    expect(result.current.options).toEqual([]);
  });
});
