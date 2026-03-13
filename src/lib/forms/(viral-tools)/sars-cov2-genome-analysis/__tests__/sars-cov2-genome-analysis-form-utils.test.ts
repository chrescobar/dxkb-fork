vi.mock("./sars-cov2-genome-analysis-form-schema", () => ({}));
vi.mock("@/lib/forms/tanstack-library-selection", () => ({
  getPairedLibraryName: vi.fn((r1: string, r2: string) => r1 + " & " + r2),
  getSingleLibraryName: vi.fn((r: string) => r),
}));
vi.mock("@/types/services", () => ({}));

import {
  handleLibraryError,
  sanitizeTaxonomyForOutputName,
  computeOutputName,
  transformSarsCov2GenomeAnalysisParams,
} from "../sars-cov2-genome-analysis-form-utils";

describe("handleLibraryError", () => {
  it("shows duplicate library toast for paired duplicate message", () => {
    const toast = { error: vi.fn() };
    handleLibraryError(
      "This paired library has already been added",
      toast,
    );
    expect(toast.error).toHaveBeenCalledWith("Duplicate library", {
      description: "This paired library has already been added",
    });
  });

  it("shows duplicate library toast for single duplicate message", () => {
    const toast = { error: vi.fn() };
    handleLibraryError(
      "This single library has already been added",
      toast,
    );
    expect(toast.error).toHaveBeenCalledWith("Duplicate library", {
      description: "This single library has already been added",
    });
  });

  it("shows generic error toast for other messages", () => {
    const toast = { error: vi.fn() };
    handleLibraryError("File not found", toast);
    expect(toast.error).toHaveBeenCalledWith("File not found");
  });
});

describe("sanitizeTaxonomyForOutputName", () => {
  it("removes parentheses", () => {
    expect(sanitizeTaxonomyForOutputName("Virus (strain A)")).toBe(
      "Virus strain A",
    );
  });

  it("removes pipes", () => {
    expect(sanitizeTaxonomyForOutputName("Type|Subtype")).toBe("TypeSubtype");
  });

  it("removes forward slashes", () => {
    expect(sanitizeTaxonomyForOutputName("A/B/C")).toBe("ABC");
  });

  it("removes colons", () => {
    expect(sanitizeTaxonomyForOutputName("Genus:Species")).toBe(
      "GenusSpecies",
    );
  });

  it("removes multiple special chars at once", () => {
    expect(
      sanitizeTaxonomyForOutputName("SARS-CoV-2 (Wuhan/Hu-1:2019)"),
    ).toBe("SARS-CoV-2 WuhanHu-12019");
  });

  it("trims leading and trailing whitespace", () => {
    expect(sanitizeTaxonomyForOutputName("  name  ")).toBe("name");
  });

  it("returns empty string for empty input", () => {
    expect(sanitizeTaxonomyForOutputName("")).toBe("");
  });
});

describe("computeOutputName", () => {
  it("joins sanitized scientific name and my label", () => {
    expect(computeOutputName("SARS-CoV-2", "my-run")).toBe(
      "SARS-CoV-2 my-run",
    );
  });

  it("returns sanitized scientific name when my label is empty", () => {
    expect(computeOutputName("Virus (type)", "")).toBe("Virus type");
  });

  it("returns trimmed my label when scientific name is empty", () => {
    expect(computeOutputName("", "my-label")).toBe("my-label");
  });

  it("returns empty string when both are empty", () => {
    expect(computeOutputName("", "")).toBe("");
  });

  it("returns empty string when both are whitespace-only", () => {
    expect(computeOutputName("   ", "   ")).toBe("");
  });
});

describe("transformSarsCov2GenomeAnalysisParams", () => {
  const baseReadsData = {
    input_type: "reads" as const,
    scientific_name: "SARS-CoV-2",
    my_label: "run1",
    taxonomy_id: "2697049",
    recipe: "auto" as const,
    primers: "ARTIC" as const,
    primer_version: "v4.1" as const,
    output_path: "/workspace/user/home",
    output_file: "",
    contigs: "",
    paired_end_libs: [],
    single_end_libs: [],
    srr_ids: [],
  };

  it("includes basic fields with reads input_type", () => {
    const result = transformSarsCov2GenomeAnalysisParams(
      baseReadsData as never,
    );

    expect(result).toEqual(
      expect.objectContaining({
        input_type: "reads",
        taxonomy_id: "2697049",
        output_path: "/workspace/user/home",
        skip_indexing: true,
      }),
    );
  });

  it("computes output_file from scientific_name and my_label when output_file is empty", () => {
    const result = transformSarsCov2GenomeAnalysisParams(
      baseReadsData as never,
    );

    expect(result.output_file).toBe("SARS-CoV-2 run1");
    expect(result.scientific_name).toBe("SARS-CoV-2 run1");
  });

  it("uses provided output_file when not empty", () => {
    const data = { ...baseReadsData, output_file: "custom-output" };
    const result = transformSarsCov2GenomeAnalysisParams(data as never);

    expect(result.output_file).toBe("custom-output");
  });

  it("includes recipe, primers, and primer_version for reads input", () => {
    const result = transformSarsCov2GenomeAnalysisParams(
      baseReadsData as never,
    );

    expect(result).toEqual(
      expect.objectContaining({
        recipe: "auto",
        primers: "ARTIC",
        primer_version: "v4.1",
      }),
    );
  });

  it("maps paired_end_libs with read1, read2, and platform", () => {
    const data = {
      ...baseReadsData,
      paired_end_libs: [
        {
          read1: "/ws/r1.fq",
          read2: "/ws/r2.fq",
          platform: "illumina",
        },
      ],
    };

    const result = transformSarsCov2GenomeAnalysisParams(data as never);

    expect(result.paired_end_libs).toEqual([
      { read1: "/ws/r1.fq", read2: "/ws/r2.fq", platform: "illumina" },
    ]);
  });

  it("maps single_end_libs with read and platform", () => {
    const data = {
      ...baseReadsData,
      single_end_libs: [
        { read: "/ws/single.fq", platform: "illumina" },
      ],
    };

    const result = transformSarsCov2GenomeAnalysisParams(data as never);

    expect(result.single_end_libs).toEqual([
      { read: "/ws/single.fq", platform: "illumina" },
    ]);
  });

  it("includes srr_ids when present", () => {
    const data = {
      ...baseReadsData,
      srr_ids: ["SRR123456", "SRR789012"],
    };

    const result = transformSarsCov2GenomeAnalysisParams(data as never);

    expect(result.srr_ids).toEqual(["SRR123456", "SRR789012"]);
  });

  it("does not include empty library arrays or srr_ids", () => {
    const result = transformSarsCov2GenomeAnalysisParams(
      baseReadsData as never,
    );

    expect(result).not.toHaveProperty("paired_end_libs");
    expect(result).not.toHaveProperty("single_end_libs");
    expect(result).not.toHaveProperty("srr_ids");
  });

  it("includes contigs for contigs input_type", () => {
    const data = {
      ...baseReadsData,
      input_type: "contigs" as const,
      contigs: "/ws/contigs.fa",
    };

    const result = transformSarsCov2GenomeAnalysisParams(data as never);

    expect(result.contigs).toBe("/ws/contigs.fa");
    expect(result).not.toHaveProperty("recipe");
    expect(result).not.toHaveProperty("primers");
    expect(result).not.toHaveProperty("primer_version");
  });
});
