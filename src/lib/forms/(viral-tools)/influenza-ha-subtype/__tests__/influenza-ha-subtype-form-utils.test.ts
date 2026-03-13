vi.mock("./influenza-ha-subtype-form-schema", () => ({}));

import { transformHaSubtypeParams } from "../influenza-ha-subtype-form-utils";

describe("transformHaSubtypeParams", () => {
  const baseData = {
    input_source: "fasta_data" as const,
    input_fasta_data: ">seq1\nATCG",
    input_fasta_file: "",
    input_feature_group: "",
    output_file: "ha-subtype-test",
    output_path: "/workspace/user/home",
    types: ["H1", "H3"],
  };

  it("includes basic fields in the output", () => {
    const result = transformHaSubtypeParams(baseData as never);

    expect(result).toEqual(
      expect.objectContaining({
        input_source: "fasta_data",
        output_file: "ha-subtype-test",
        output_path: "/workspace/user/home",
        types: ["H1", "H3"],
      }),
    );
  });

  it("includes input_fasta_data when input_source is fasta_data", () => {
    const result = transformHaSubtypeParams(baseData as never);

    expect(result.input_fasta_data).toBe(">seq1\nATCG");
  });

  it("normalizes fasta_data by prepending header when missing", () => {
    const data = {
      ...baseData,
      input_fasta_data: "ATCGATCG",
    };

    const result = transformHaSubtypeParams(data as never);

    expect(result.input_fasta_data).toBe(">fasta_record1\nATCGATCG");
  });

  it("does not alter fasta_data that already has a header", () => {
    const data = {
      ...baseData,
      input_fasta_data: ">my_header\nATCGATCG",
    };

    const result = transformHaSubtypeParams(data as never);

    expect(result.input_fasta_data).toBe(">my_header\nATCGATCG");
  });

  it("includes input_fasta_file when input_source is fasta_file", () => {
    const data = {
      ...baseData,
      input_source: "fasta_file" as const,
      input_fasta_file: "/ws/sequences.fa",
    };

    const result = transformHaSubtypeParams(data as never);

    expect(result.input_fasta_file).toBe("/ws/sequences.fa");
    expect(result).not.toHaveProperty("input_fasta_data");
  });

  it("includes input_feature_group when input_source is feature_group", () => {
    const data = {
      ...baseData,
      input_source: "feature_group" as const,
      input_feature_group: "/ws/feature_group.json",
    };

    const result = transformHaSubtypeParams(data as never);

    expect(result.input_feature_group).toBe("/ws/feature_group.json");
    expect(result).not.toHaveProperty("input_fasta_data");
    expect(result).not.toHaveProperty("input_fasta_file");
  });

  it("trims whitespace from output_file and output_path", () => {
    const data = {
      ...baseData,
      output_file: "  ha-test  ",
      output_path: "  /workspace/user/home  ",
    };

    const result = transformHaSubtypeParams(data as never);

    expect(result.output_file).toBe("ha-test");
    expect(result.output_path).toBe("/workspace/user/home");
  });
});
