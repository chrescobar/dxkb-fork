import { renderHook, act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { useGenomeSelection } from "@/hooks/services/use-genome-selection";
import { server } from "@/test-helpers/msw-server";
import { createQueryClientWrapper } from "@/test-helpers/api-route-helpers";
import type { GenomeSummary } from "@/lib/services/genome";
import type { WorkspaceObject } from "@/lib/services/workspace/types";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

function makeGenome(id: string, name = `Genome ${id}`): GenomeSummary {
  return { genome_id: id, genome_name: name };
}

function makeWorkspaceObject(path: string, name?: string): WorkspaceObject {
  return {
    id: path,
    name: name ?? path.split("/").pop() ?? path,
    type: "genome_group",
    path,
    isDirectory: false,
  };
}

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

describe("useGenomeSelection", () => {
  it("does not add duplicate genomes", () => {
    const { result } = renderHook(
      () => useGenomeSelection({ maxGenomes: 20 }),
      { wrapper: createQueryClientWrapper() },
    );

    act(() => {
      result.current.addGenome(makeGenome("g1"));
    });

    act(() => {
      result.current.addGenome(makeGenome("g1"));
    });

    expect(result.current.selectedGenomes).toHaveLength(1);
  });

  it("rejects genome additions beyond maxGenomes", async () => {
    const { toast } = await import("sonner");

    const { result } = renderHook(
      () => useGenomeSelection({ maxGenomes: 2 }),
      { wrapper: createQueryClientWrapper() },
    );

    act(() => {
      result.current.addGenome(makeGenome("g1"));
      result.current.addGenome(makeGenome("g2"));
    });

    act(() => {
      result.current.addGenome(makeGenome("g3"));
    });

    expect(result.current.selectedGenomes).toHaveLength(2);
    expect(toast.error).toHaveBeenCalled();
  });

  it("syncs genome_ids to the form when sync is provided", async () => {
    const setFieldValue = vi.fn();
    const mockForm = { setFieldValue };

    const { result } = renderHook(
      () =>
        useGenomeSelection({
          maxGenomes: 20,
          sync: {
            form: mockForm,
            genomeIdsFieldName: "genome_ids",
            genomeGroupPathFieldName: "genome_group_path",
          },
        }),
      { wrapper: createQueryClientWrapper() },
    );

    act(() => {
      result.current.addGenome(makeGenome("g1"));
    });

    await waitFor(() => {
      expect(setFieldValue).toHaveBeenCalledWith("genome_ids", ["g1"]);
    });
  });

  it("adds non-duplicate genomes from a group up to available slots", async () => {
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json(workspaceGetResponse(["g1", "g2", "g3"])),
      ),
      http.post("/api/services/genome/by-ids", () =>
        HttpResponse.json({
          results: [
            makeGenome("g1"),
            makeGenome("g2"),
            makeGenome("g3"),
          ],
        }),
      ),
    );

    const { result } = renderHook(
      () => useGenomeSelection({ maxGenomes: 5 }),
      { wrapper: createQueryClientWrapper() },
    );

    act(() => {
      result.current.addGenome(makeGenome("g1"));
    });

    await act(async () => {
      await result.current.addGenomeGroup(makeWorkspaceObject("/user/genome-group", "My Group"));
    });

    expect(result.current.selectedGenomes).toHaveLength(3);
    expect(result.current.selectedGenomes.map((g) => g.genome_id)).toEqual(
      expect.arrayContaining(["g1", "g2", "g3"]),
    );
    expect(result.current.lastSelectedGroup).toBe("My Group");
  });

  it("reset() clears selectedGenomes and lastSelectedGroup", async () => {
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json(workspaceGetResponse(["g1"])),
      ),
      http.post("/api/services/genome/by-ids", () =>
        HttpResponse.json({ results: [makeGenome("g1")] }),
      ),
    );

    const { result } = renderHook(
      () => useGenomeSelection({ maxGenomes: 20 }),
      { wrapper: createQueryClientWrapper() },
    );

    act(() => {
      result.current.addGenome(makeGenome("g1"));
    });

    await act(async () => {
      await result.current.addGenomeGroup(makeWorkspaceObject("/user/group"));
    });

    expect(result.current.selectedGenomes).toHaveLength(1);
    expect(result.current.lastSelectedGroup).not.toBeNull();

    act(() => {
      result.current.reset();
    });

    expect(result.current.selectedGenomes).toHaveLength(0);
    expect(result.current.lastSelectedGroup).toBeNull();
  });
});
