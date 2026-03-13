vi.mock("./viral-assembly-form-schema", () => ({}));
vi.mock("@/lib/forms/tanstack-library-selection", () => ({
  getPairedLibraryName: vi.fn((r1: string, r2: string) => r1 + " & " + r2),
  getSingleLibraryName: vi.fn((r: string) => r),
}));
vi.mock("@/types/services", () => ({}));

import {
  handleLibraryError,
  singleLibraryDuplicateMatcher,
  transformViralAssemblyParams,
} from "../viral-assembly-form-utils";

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
    handleLibraryError("Unknown error occurred", toast);
    expect(toast.error).toHaveBeenCalledWith("Unknown error occurred");
  });
});

describe("singleLibraryDuplicateMatcher", () => {
  it("returns true when id and type match", () => {
    const library = { id: "/ws/reads.fq", type: "single" } as never;
    expect(singleLibraryDuplicateMatcher(library, "/ws/reads.fq")).toBe(true);
  });

  it("returns false when id matches but type is not single", () => {
    const library = { id: "/ws/reads.fq", type: "paired" } as never;
    expect(singleLibraryDuplicateMatcher(library, "/ws/reads.fq")).toBe(false);
  });

  it("returns false when type matches but id differs", () => {
    const library = { id: "/ws/other.fq", type: "single" } as never;
    expect(singleLibraryDuplicateMatcher(library, "/ws/reads.fq")).toBe(false);
  });

  it("returns false when neither id nor type match", () => {
    const library = { id: "/ws/other.fq", type: "paired" } as never;
    expect(singleLibraryDuplicateMatcher(library, "/ws/reads.fq")).toBe(false);
  });
});

describe("transformViralAssemblyParams", () => {
  const baseData = {
    strategy: "map" as const,
    module: "irma" as const,
    input_type: "paired" as const,
    output_path: "/workspace/user/home",
    output_file: "viral-assembly-test",
    paired_end_libs: [],
    single_end_libs: [],
    srr_ids: [],
  };

  it("includes basic fields in the output", () => {
    const result = transformViralAssemblyParams(baseData as never);

    expect(result).toEqual(
      expect.objectContaining({
        strategy: "map",
        module: "irma",
        output_path: "/workspace/user/home",
        output_file: "viral-assembly-test",
      }),
    );
  });

  it("includes paired_end_lib for paired input_type", () => {
    const data = {
      ...baseData,
      input_type: "paired" as const,
      paired_end_libs: [
        { read1: "/ws/r1.fq", read2: "/ws/r2.fq" },
      ],
    };

    const result = transformViralAssemblyParams(data as never);

    expect(result.paired_end_lib).toEqual({
      read1: "/ws/r1.fq",
      read2: "/ws/r2.fq",
    });
  });

  it("uses only the first paired library", () => {
    const data = {
      ...baseData,
      input_type: "paired" as const,
      paired_end_libs: [
        { read1: "/ws/r1.fq", read2: "/ws/r2.fq" },
        { read1: "/ws/r3.fq", read2: "/ws/r4.fq" },
      ],
    };

    const result = transformViralAssemblyParams(data as never);

    expect(result.paired_end_lib).toEqual({
      read1: "/ws/r1.fq",
      read2: "/ws/r2.fq",
    });
  });

  it("includes single_end_lib for single input_type", () => {
    const data = {
      ...baseData,
      input_type: "single" as const,
      single_end_libs: [{ read: "/ws/single.fq" }],
    };

    const result = transformViralAssemblyParams(data as never);

    expect(result.single_end_lib).toEqual({ read: "/ws/single.fq" });
  });

  it("includes srr_id for srr_accession input_type", () => {
    const data = {
      ...baseData,
      input_type: "srr_accession" as const,
      srr_ids: ["SRR123456"],
    };

    const result = transformViralAssemblyParams(data as never);

    expect(result.srr_id).toBe("SRR123456");
  });

  it("does not include paired_end_lib when input_type is single", () => {
    const data = {
      ...baseData,
      input_type: "single" as const,
      paired_end_libs: [{ read1: "/ws/r1.fq", read2: "/ws/r2.fq" }],
      single_end_libs: [{ read: "/ws/single.fq" }],
    };

    const result = transformViralAssemblyParams(data as never);

    expect(result).not.toHaveProperty("paired_end_lib");
    expect(result.single_end_lib).toEqual({ read: "/ws/single.fq" });
  });

  it("does not include library keys when paired_end_libs is empty for paired input", () => {
    const result = transformViralAssemblyParams(baseData as never);

    expect(result).not.toHaveProperty("paired_end_lib");
    expect(result).not.toHaveProperty("single_end_lib");
    expect(result).not.toHaveProperty("srr_id");
  });
});
