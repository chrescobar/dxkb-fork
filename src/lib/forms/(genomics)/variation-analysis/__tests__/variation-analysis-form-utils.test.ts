vi.mock("../variation-analysis-form-schema", () => ({}));

import { transformVariationAnalysisParams } from "../variation-analysis-form-utils";

describe("transformVariationAnalysisParams", () => {
  const baseData = {
    reference_genome_id: "83332.12",
    mapper: "BWA-mem" as const,
    caller: "FreeBayes" as const,
    output_path: "/workspace/user@bvbrc/home",
    output_file: "variation-test",
    paired_end_libs: [],
    single_end_libs: [],
    srr_ids: [],
  };

  it("includes basic fields in the output", () => {
    const result = transformVariationAnalysisParams(baseData);

    expect(result).toEqual(
      expect.objectContaining({
        reference_genome_id: "83332.12",
        mapper: "BWA-mem",
        caller: "FreeBayes",
        output_path: "/workspace/user@bvbrc/home",
        output_file: "variation-test",
      }),
    );
  });

  it("strips _ prefixed keys from paired_end_libs", () => {
    const data = {
      ...baseData,
      paired_end_libs: [
        {
          _id: "r1r2",
          _type: "paired" as const,
          read1: "/ws/r1.fq",
          read2: "/ws/r2.fq",
        },
      ],
    };

    const result = transformVariationAnalysisParams(data);

    expect(result.paired_end_libs).toEqual([
      { read1: "/ws/r1.fq", read2: "/ws/r2.fq" },
    ]);
  });

  it("strips _ prefixed keys from single_end_libs", () => {
    const data = {
      ...baseData,
      single_end_libs: [
        {
          _id: "single-1",
          _type: "single" as const,
          read: "/ws/reads.fq",
        },
      ],
    };

    const result = transformVariationAnalysisParams(data);

    expect(result.single_end_libs).toEqual([{ read: "/ws/reads.fq" }]);
  });

  it("includes srr_ids when present", () => {
    const data = {
      ...baseData,
      srr_ids: ["SRR12345", "SRR67890"],
    };

    const result = transformVariationAnalysisParams(data);

    expect(result.srr_ids).toEqual(["SRR12345", "SRR67890"]);
  });

  it("does not include empty arrays in the output", () => {
    const result = transformVariationAnalysisParams(baseData);

    expect(result).not.toHaveProperty("paired_end_libs");
    expect(result).not.toHaveProperty("single_end_libs");
    expect(result).not.toHaveProperty("srr_ids");
  });
});
