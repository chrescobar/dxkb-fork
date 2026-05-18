import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { useFeatureGroupMembers } from "@/hooks/services/use-feature-group-members";
import { createQueryClientWrapper } from "@/test-helpers/api-route-helpers";
import { server } from "@/test-helpers/msw-server";

function featureGroupResponse(
  features: { feature_id: string; patric_id?: string }[],
) {
  return { results: features };
}

describe("useFeatureGroupMembers", () => {
  it("returns features when groupPath is set and enabled is true", async () => {
    server.use(
      http.post("/api/services/feature/from-group", () =>
        HttpResponse.json(
          featureGroupResponse([
            { feature_id: "f1", patric_id: "PATRIC.1" },
            { feature_id: "f2", patric_id: "PATRIC.2" },
          ]),
        ),
      ),
    );

    const { result } = renderHook(
      () => useFeatureGroupMembers("/user/group-a"),
      { wrapper: createQueryClientWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
  });

  it("stays idle when groupPath is null", () => {
    const { result } = renderHook(() => useFeatureGroupMembers(null), {
      wrapper: createQueryClientWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("stays idle when enabled is false even if groupPath is provided", () => {
    const { result } = renderHook(
      () => useFeatureGroupMembers("/user/group-a", false),
      { wrapper: createQueryClientWrapper() },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("refetches when groupPath changes from null to a value", async () => {
    server.use(
      http.post("/api/services/feature/from-group", () =>
        HttpResponse.json(featureGroupResponse([{ feature_id: "f1" }])),
      ),
    );

    let groupPath: string | null = null;
    const { result, rerender } = renderHook(
      () => useFeatureGroupMembers(groupPath),
      { wrapper: createQueryClientWrapper() },
    );

    expect(result.current.fetchStatus).toBe("idle");

    groupPath = "/user/group-a";
    rerender();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeDefined();
  });
});
