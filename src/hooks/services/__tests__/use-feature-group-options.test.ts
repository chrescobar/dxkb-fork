import { renderHook, waitFor } from "@testing-library/react";
import { useFeatureGroupOptions } from "../use-feature-group-options";
import { createQueryClientWrapper } from "@/test-helpers/api-route-helpers";
import type { FeatureSummary } from "@/lib/services/feature";

const { mockFetchFeaturesFromGroup } = vi.hoisted(() => ({
  mockFetchFeaturesFromGroup: vi.fn(),
}));

vi.mock("@/lib/services/feature", () => ({
  fetchFeaturesFromGroup: mockFetchFeaturesFromGroup,
}));

const sampleFeatures: FeatureSummary[] = [
  { feature_id: "fg1", patric_id: "pf1", product: "Protein A" } as FeatureSummary,
];

describe("useFeatureGroupOptions", () => {
  beforeEach(() => { mockFetchFeaturesFromGroup.mockReset(); });

  it("fetches features when enabled and path is provided", async () => {
    mockFetchFeaturesFromGroup.mockResolvedValue(sampleFeatures);

    const { result } = renderHook(
      () => useFeatureGroupOptions("/user/home/group1"),
      { wrapper: createQueryClientWrapper() },
    );

    await waitFor(() => { expect(result.current.isLoading).toBe(false); });
    expect(result.current.features).toEqual(sampleFeatures);
    expect(result.current.error).toBeNull();
    expect(mockFetchFeaturesFromGroup).toHaveBeenCalledWith("/user/home/group1", expect.objectContaining({ signal: expect.any(AbortSignal) }));
  });

  it("returns empty array and does not fetch when disabled", () => {
    const { result } = renderHook(
      () => useFeatureGroupOptions("/user/home/group1", false),
      { wrapper: createQueryClientWrapper() },
    );

    expect(result.current.features).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockFetchFeaturesFromGroup).not.toHaveBeenCalled();
  });

  it("returns empty array and does not fetch when path is empty", () => {
    const { result } = renderHook(
      () => useFeatureGroupOptions(""),
      { wrapper: createQueryClientWrapper() },
    );

    expect(result.current.features).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(mockFetchFeaturesFromGroup).not.toHaveBeenCalled();
  });

  it("returns empty array and does not fetch when path is whitespace", () => {
    const { result } = renderHook(
      () => useFeatureGroupOptions("   "),
      { wrapper: createQueryClientWrapper() },
    );

    expect(result.current.features).toEqual([]);
    expect(mockFetchFeaturesFromGroup).not.toHaveBeenCalled();
  });

  it("returns error string and empty features on fetch failure", async () => {
    mockFetchFeaturesFromGroup.mockRejectedValue(new Error("Network error"));

    const { result } = renderHook(
      () => useFeatureGroupOptions("/user/home/group1"),
      { wrapper: createQueryClientWrapper() },
    );

    await waitFor(() => { expect(result.current.error).not.toBeNull(); });
    expect(result.current.error).toBe("Network error");
    expect(result.current.features).toEqual([]);
  });

  it("returns empty array and does not fetch when path is undefined", () => {
    const { result } = renderHook(
      () => useFeatureGroupOptions(undefined),
      { wrapper: createQueryClientWrapper() },
    );

    expect(result.current.features).toEqual([]);
    expect(mockFetchFeaturesFromGroup).not.toHaveBeenCalled();
  });
});
