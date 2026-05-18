import { renderHook, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { useGenomeGroupMembers } from "@/hooks/services/use-genome-group-members";
import { createQueryClientWrapper } from "@/test-helpers/api-route-helpers";
import { server } from "@/test-helpers/msw-server";

function workspaceGetResponse(genomeIds: string[]) {
  return {
    result: [
      [
        [
          {},
          { id_list: { genome_id: genomeIds } },
        ],
      ],
    ],
  };
}

describe("useGenomeGroupMembers", () => {
  it("returns genomes when groupPath is set and enabled is true", async () => {
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json(workspaceGetResponse(["g1", "g2"])),
      ),
      http.post("/api/services/genome/by-ids", () =>
        HttpResponse.json({
          results: [
            { genome_id: "g1", genome_name: "Genome One" },
            { genome_id: "g2", genome_name: "Genome Two" },
          ],
        }),
      ),
    );

    const { result } = renderHook(
      () => useGenomeGroupMembers("/user/genome-group"),
      { wrapper: createQueryClientWrapper() },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ genome_id: "g1" }),
        expect.objectContaining({ genome_id: "g2" }),
      ]),
    );
  });

  it("stays idle when groupPath is null", () => {
    const { result } = renderHook(() => useGenomeGroupMembers(null), {
      wrapper: createQueryClientWrapper(),
    });

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("stays idle when enabled is false", () => {
    const { result } = renderHook(
      () => useGenomeGroupMembers("/user/genome-group", false),
      { wrapper: createQueryClientWrapper() },
    );

    expect(result.current.fetchStatus).toBe("idle");
    expect(result.current.data).toBeUndefined();
  });

  it("surfaces an error when the workspace request fails", async () => {
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json({ error: "Failed" }, { status: 500 }),
      ),
    );

    const { result } = renderHook(
      () => useGenomeGroupMembers("/user/genome-group"),
      { wrapper: createQueryClientWrapper() },
    );

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
