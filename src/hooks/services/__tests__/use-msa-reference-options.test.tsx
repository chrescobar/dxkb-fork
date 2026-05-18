import { renderHook, act, waitFor } from "@testing-library/react";
import { useForm } from "@tanstack/react-form";
import { http, HttpResponse } from "msw";
import React from "react";

import { useMsaReferenceOptions } from "@/hooks/services/use-msa-reference-options";
import { server } from "@/test-helpers/msw-server";
import { createQueryClientWrapper } from "@/test-helpers/api-route-helpers";

vi.mock("sonner", () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  },
}));

const testFields = {
  refType: "ref_type",
  featureGroupPath: "feature_groups",
  genomeGroupPaths: "select_genomegroup",
  refString: "ref_string",
};

function makeWrapper(defaultValues: Record<string, unknown> = {}) {
  const QueryWrapper = createQueryClientWrapper();

  function HookWrapper({ children }: { children: React.ReactNode }) {
    return <QueryWrapper>{children}</QueryWrapper>;
  }

  return {
    wrapper: HookWrapper,
    defaultValues,
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

describe("useMsaReferenceOptions", () => {
  it("reads refType from the form store", () => {
    const { wrapper } = makeWrapper();

    const { result } = renderHook(
      () => {
        const form = useForm({
          defaultValues: {
            ref_type: "none",
            feature_groups: "",
            select_genomegroup: [] as string[],
            ref_string: "",
          },
          onSubmit: vi.fn(),
        });

        const options = useMsaReferenceOptions({ form, fields: testFields });
        return { form, options };
      },
      { wrapper },
    );

    expect(result.current.options.refType).toBe("none");
  });

  it("loads featureOptions when refType is feature_id and featureGroupPath is set", async () => {
    server.use(
      http.post("/api/services/feature/from-group", () =>
        HttpResponse.json({
          results: [
            { feature_id: "feat1", patric_id: "PATRIC.1.1", product: "Protein A" },
            { feature_id: "feat2", patric_id: "PATRIC.1.2", product: "Protein B" },
          ],
        }),
      ),
    );

    const { wrapper } = makeWrapper();

    const { result } = renderHook(
      () => {
        const form = useForm({
          defaultValues: {
            ref_type: "feature_id",
            feature_groups: "/user/my-feature-group",
            select_genomegroup: [] as string[],
            ref_string: "",
          },
          onSubmit: vi.fn(),
        });

        const options = useMsaReferenceOptions({ form, fields: testFields });
        return { form, options };
      },
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.options.featureOptions).toHaveLength(2);
    });

    expect(result.current.options.featureOptions[0]).toMatchObject({
      feature_id: "feat1",
    });
  });

  it("clears featureOptions and selectedFeatureId when refType changes away from feature_id", async () => {
    server.use(
      http.post("/api/services/feature/from-group", () =>
        HttpResponse.json({
          results: [{ feature_id: "feat1" }],
        }),
      ),
    );

    const { wrapper } = makeWrapper();

    const { result } = renderHook(
      () => {
        const form = useForm({
          defaultValues: {
            ref_type: "feature_id",
            feature_groups: "/user/my-feature-group",
            select_genomegroup: [] as string[],
            ref_string: "",
          },
          onSubmit: vi.fn(),
        });

        const options = useMsaReferenceOptions({ form, fields: testFields });
        return { form, options };
      },
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.options.featureOptions).toHaveLength(1);
    });

    await act(async () => {
      result.current.form.setFieldValue("ref_type", "none" as never);
    });

    await waitFor(() => {
      expect(result.current.options.featureOptions).toHaveLength(0);
    });

    expect(result.current.options.selectedFeatureId).toBe("");
  });

  it("loads genomeOptions when refType is genome_id and genomeGroupPath is set", async () => {
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json(workspaceGetResponse(["genome1", "genome2"])),
      ),
      http.post("/api/services/genome/by-ids", () =>
        HttpResponse.json({
          results: [
            { genome_id: "genome1", genome_name: "Genome One" },
            { genome_id: "genome2", genome_name: "Genome Two" },
          ],
        }),
      ),
    );

    const { wrapper } = makeWrapper();

    const { result } = renderHook(
      () => {
        const form = useForm({
          defaultValues: {
            ref_type: "genome_id",
            feature_groups: "",
            select_genomegroup: ["/user/my-genome-group"] as string[],
            ref_string: "",
          },
          onSubmit: vi.fn(),
        });

        const options = useMsaReferenceOptions({ form, fields: testFields });
        return { form, options };
      },
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.options.genomeOptions).toHaveLength(2);
    });

    expect(result.current.options.genomeOptions[0]).toMatchObject({
      genome_id: "genome1",
      genome_name: "Genome One",
    });
  });

  it("clears genomeOptions and selectedGenomeId when refType changes away from genome_id", async () => {
    server.use(
      http.post("/api/services/workspace", () =>
        HttpResponse.json(workspaceGetResponse(["genome1"])),
      ),
      http.post("/api/services/genome/by-ids", () =>
        HttpResponse.json({
          results: [{ genome_id: "genome1", genome_name: "Genome One" }],
        }),
      ),
    );

    const { wrapper } = makeWrapper();

    const { result } = renderHook(
      () => {
        const form = useForm({
          defaultValues: {
            ref_type: "genome_id",
            feature_groups: "",
            select_genomegroup: ["/user/my-genome-group"] as string[],
            ref_string: "",
          },
          onSubmit: vi.fn(),
        });

        const options = useMsaReferenceOptions({ form, fields: testFields });
        return { form, options };
      },
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.options.genomeOptions).toHaveLength(1);
    });

    await act(async () => {
      result.current.form.setFieldValue("ref_type", "none" as never);
    });

    await waitFor(() => {
      expect(result.current.options.genomeOptions).toHaveLength(0);
    });

    expect(result.current.options.selectedGenomeId).toBe("");
  });

  it("reset() clears all options and selections", async () => {
    server.use(
      http.post("/api/services/feature/from-group", () =>
        HttpResponse.json({
          results: [{ feature_id: "feat1" }],
        }),
      ),
    );

    const { wrapper } = makeWrapper();

    const { result } = renderHook(
      () => {
        const form = useForm({
          defaultValues: {
            ref_type: "feature_id",
            feature_groups: "/user/my-feature-group",
            select_genomegroup: [] as string[],
            ref_string: "",
          },
          onSubmit: vi.fn(),
        });

        const options = useMsaReferenceOptions({ form, fields: testFields });
        return { form, options };
      },
      { wrapper },
    );

    await waitFor(() => {
      expect(result.current.options.featureOptions).toHaveLength(1);
    });

    await act(async () => {
      result.current.options.setSelectedFeatureId("feat1");
    });

    expect(result.current.options.selectedFeatureId).toBe("feat1");

    act(() => {
      result.current.options.reset();
    });

    expect(result.current.options.featureOptions).toHaveLength(0);
    expect(result.current.options.genomeOptions).toHaveLength(0);
    expect(result.current.options.selectedFeatureId).toBe("");
    expect(result.current.options.selectedGenomeId).toBe("");
  });
});
