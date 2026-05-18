import { renderHook, act, waitFor } from "@testing-library/react";
import { http, HttpResponse } from "msw";

import { useMetaCatsAutoGrouping } from "@/hooks/services/use-meta-cats-auto-grouping";
import { server } from "@/test-helpers/msw-server";
import { createQueryClientWrapper } from "@/test-helpers/api-route-helpers";
import type { AutoGroupItem } from "@/lib/forms/(protein-tools)/meta-cats/meta-cats-form-schema";
import type { WorkspaceObject } from "@/lib/services/workspace/types";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

function makeAutoGroupItem(
  patricId: string,
  genomeId: string,
  group = "Group A",
): AutoGroupItem {
  return {
    id: `row-${patricId}`,
    patric_id: patricId,
    metadata: group,
    group,
    genome_id: genomeId,
    genbank_accessions: "",
    strain: "",
  };
}

function makeForm(autoGroups: AutoGroupItem[] = []) {
  const setFieldValue = vi.fn();
  const form = {
    setFieldValue,
    state: {
      values: {
        auto_groups: autoGroups,
        metadata_group: "host_name",
        year_ranges: "",
      } as Record<string, unknown>,
    },
  };
  return { form, setFieldValue };
}

const defaultFields = {
  autoGroups: "auto_groups",
  metadataGroup: "metadata_group",
  yearRanges: "year_ranges",
};

function makeFeatureGroupObject(path: string): WorkspaceObject {
  return {
    id: path,
    name: path.split("/").pop() ?? path,
    type: "feature_group",
    path,
    isDirectory: false,
  };
}

function featureGroupResponse(features: { genome_id: string; patric_id: string }[]) {
  return { results: features };
}

function genomesByIdsResponse(genomes: { genome_id: string; genome_name: string; host_name?: string }[]) {
  return { results: genomes };
}

describe("useMetaCatsAutoGrouping", () => {
  it("starts with no selected feature group and empty state", () => {
    const { form } = makeForm();
    const { result } = renderHook(
      () => useMetaCatsAutoGrouping({ form, fields: defaultFields }),
      { wrapper: createQueryClientWrapper() },
    );

    expect(result.current.selectedFeatureGroupObject).toBeNull();
    expect(result.current.isLoadingAutoGroup).toBe(false);
    expect(result.current.selectedGridRows.size).toBe(0);
    expect(result.current.groupNames).toHaveLength(0);
    expect(result.current.selectedGroupName).toBe("");
  });

  it("shows error toast when adding without a selected feature group", async () => {
    const { toast } = await import("sonner");
    const { form } = makeForm();

    const { result } = renderHook(
      () => useMetaCatsAutoGrouping({ form, fields: defaultFields }),
      { wrapper: createQueryClientWrapper() },
    );

    await act(async () => {
      await result.current.addSelectedFeatureGroup();
    });

    expect(toast.error).toHaveBeenCalledWith(
      "No feature group selected",
      expect.objectContaining({ description: expect.any(String) }),
    );
  });

  it("shows error toast when feature group is empty", async () => {
    server.use(
      http.post("/api/services/feature/from-group", () =>
        HttpResponse.json({ results: [] }),
      ),
    );

    const { toast } = await import("sonner");
    const { form } = makeForm();

    const { result } = renderHook(
      () => useMetaCatsAutoGrouping({ form, fields: defaultFields }),
      { wrapper: createQueryClientWrapper() },
    );

    act(() => {
      result.current.setSelectedFeatureGroupObject(
        makeFeatureGroupObject("/user/empty-group"),
      );
    });

    await act(async () => {
      await result.current.addSelectedFeatureGroup();
    });

    expect(toast.error).toHaveBeenCalledWith(
      "Empty feature group",
      expect.objectContaining({ description: expect.any(String) }),
    );
  });

  it("adds rows from a feature group and sets groupNames", async () => {
    server.use(
      http.post("/api/services/feature/from-group", () =>
        HttpResponse.json(
          featureGroupResponse([
            { genome_id: "g1", patric_id: "p1" },
            { genome_id: "g2", patric_id: "p2" },
          ]),
        ),
      ),
      http.post("/api/services/genome/by-ids", () =>
        HttpResponse.json(
          genomesByIdsResponse([
            { genome_id: "g1", genome_name: "Genome 1", host_name: "Human" },
            { genome_id: "g2", genome_name: "Genome 2", host_name: "Swine" },
          ]),
        ),
      ),
    );

    const { form, setFieldValue } = makeForm();

    const { result } = renderHook(
      () => useMetaCatsAutoGrouping({ form, fields: defaultFields }),
      { wrapper: createQueryClientWrapper() },
    );

    act(() => {
      result.current.setSelectedFeatureGroupObject(
        makeFeatureGroupObject("/user/my-group"),
      );
    });

    await act(async () => {
      await result.current.addSelectedFeatureGroup();
    });

    await waitFor(() => {
      expect(setFieldValue).toHaveBeenCalledWith(
        "auto_groups",
        expect.arrayContaining([
          expect.objectContaining({ patric_id: "p1" }),
          expect.objectContaining({ patric_id: "p2" }),
        ]),
      );
    });

    expect(result.current.groupNames.length).toBeGreaterThan(0);
    expect(result.current.selectedFeatureGroupObject).toBeNull();
  });

  it("does not add duplicate rows", async () => {
    server.use(
      http.post("/api/services/feature/from-group", () =>
        HttpResponse.json(
          featureGroupResponse([{ genome_id: "g1", patric_id: "p1" }]),
        ),
      ),
      http.post("/api/services/genome/by-ids", () =>
        HttpResponse.json(
          genomesByIdsResponse([
            { genome_id: "g1", genome_name: "Genome 1", host_name: "Human" },
          ]),
        ),
      ),
    );

    const existingRows = [makeAutoGroupItem("p1", "g1")];
    const { form, setFieldValue } = makeForm(existingRows);

    const { result } = renderHook(
      () => useMetaCatsAutoGrouping({ form, fields: defaultFields }),
      { wrapper: createQueryClientWrapper() },
    );

    act(() => {
      result.current.setSelectedFeatureGroupObject(
        makeFeatureGroupObject("/user/my-group"),
      );
    });

    await act(async () => {
      await result.current.addSelectedFeatureGroup();
    });

    const call = setFieldValue.mock.calls.find((c) => c[0] === "auto_groups");
    if (call) {
      const addedRows = call[1] as AutoGroupItem[];
      const p1Count = addedRows.filter((r) => r.patric_id === "p1").length;
      expect(p1Count).toBe(1);
    }
  });

  it("deleteSelectedRows removes selected rows and updates groupNames", () => {
    const row1 = makeAutoGroupItem("p1", "g1", "Group A");
    const row2 = makeAutoGroupItem("p2", "g2", "Group B");
    const { form, setFieldValue } = makeForm([row1, row2]);

    const { result } = renderHook(
      () => useMetaCatsAutoGrouping({ form, fields: defaultFields }),
      { wrapper: createQueryClientWrapper() },
    );

    act(() => {
      result.current.setSelectedGridRows(new Set(["row-p1"]));
    });

    act(() => {
      result.current.deleteSelectedRows();
    });

    expect(setFieldValue).toHaveBeenCalledWith(
      "auto_groups",
      expect.arrayContaining([
        expect.objectContaining({ patric_id: "p2" }),
      ]),
    );

    const call = setFieldValue.mock.calls.find((c) => c[0] === "auto_groups");
    if (call) {
      const remaining = call[1] as AutoGroupItem[];
      expect(remaining.some((r) => r.patric_id === "p1")).toBe(false);
    }

    expect(result.current.selectedGridRows.size).toBe(0);
  });

  it("changeSelectedRowsGroup updates group names for selected rows", () => {
    const row1 = makeAutoGroupItem("p1", "g1", "Group A");
    const row2 = makeAutoGroupItem("p2", "g2", "Group B");
    const { form, setFieldValue } = makeForm([row1, row2]);

    const { result } = renderHook(
      () => useMetaCatsAutoGrouping({ form, fields: defaultFields }),
      { wrapper: createQueryClientWrapper() },
    );

    act(() => {
      result.current.setSelectedGridRows(new Set(["row-p1"]));
      result.current.setSelectedGroupName("New Group");
    });

    act(() => {
      result.current.changeSelectedRowsGroup();
    });

    const call = setFieldValue.mock.calls.find((c) => c[0] === "auto_groups");
    expect(call).toBeDefined();
    const updated = (call ?? [])[1] as AutoGroupItem[];
    const p1Row = updated.find((r) => r.patric_id === "p1");
    expect(p1Row?.group).toBe("New Group");
    const p2Row = updated.find((r) => r.patric_id === "p2");
    expect(p2Row?.group).toBe("Group B");

    expect(result.current.groupNames).toContain("New Group");
  });

  it("reset() clears all auto-grouping state", async () => {
    server.use(
      http.post("/api/services/feature/from-group", () =>
        HttpResponse.json(
          featureGroupResponse([{ genome_id: "g1", patric_id: "p1" }]),
        ),
      ),
      http.post("/api/services/genome/by-ids", () =>
        HttpResponse.json(
          genomesByIdsResponse([
            { genome_id: "g1", genome_name: "Genome 1", host_name: "Human" },
          ]),
        ),
      ),
    );

    const { form } = makeForm();

    const { result } = renderHook(
      () => useMetaCatsAutoGrouping({ form, fields: defaultFields }),
      { wrapper: createQueryClientWrapper() },
    );

    act(() => {
      result.current.setSelectedFeatureGroupObject(
        makeFeatureGroupObject("/user/my-group"),
      );
      result.current.setSelectedGroupName("Some Group");
      result.current.setSelectedGridRows(new Set(["row-p1"]));
    });

    await act(async () => {
      await result.current.addSelectedFeatureGroup();
    });

    await waitFor(() => {
      expect(result.current.groupNames.length).toBeGreaterThan(0);
    });

    act(() => {
      result.current.reset();
    });

    expect(result.current.selectedFeatureGroupObject).toBeNull();
    expect(result.current.selectedGridRows.size).toBe(0);
    expect(result.current.groupNames).toHaveLength(0);
    expect(result.current.selectedGroupName).toBe("");
  });
});
