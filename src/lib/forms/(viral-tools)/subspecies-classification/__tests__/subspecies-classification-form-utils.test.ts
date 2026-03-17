vi.mock("./subspecies-classification-form-schema", () => ({}));
vi.mock("@/lib/fasta-validation", () => ({
  validateFasta: vi.fn(() => ({
    valid: true,
    message: "",
    status: "valid_dna",
  })),
}));

import {
  getSubspeciesFastaMessage,
  transformSubspeciesClassificationParams,
} from "../subspecies-classification-form-utils";

describe("getSubspeciesFastaMessage", () => {
  it("prefixes message with program name when status is need_dna", () => {
    const result = getSubspeciesFastaMessage({
      valid: false,
      message: "Protein sequences detected.",
      status: "need_dna",
    } as never);

    expect(result).toBe(
      "Subspecies Classification requires nucleotide sequences. Protein sequences detected.",
    );
  });

  it("returns message as-is for valid_dna status", () => {
    const result = getSubspeciesFastaMessage({
      valid: true,
      message: "Valid FASTA sequence.",
      status: "valid_dna",
    } as never);

    expect(result).toBe("Valid FASTA sequence.");
  });

  it("returns message as-is for other statuses", () => {
    const result = getSubspeciesFastaMessage({
      valid: false,
      message: "Invalid format.",
      status: "invalid",
    } as never);

    expect(result).toBe("Invalid format.");
  });

  it("returns empty message when message is empty and status is not need_dna", () => {
    const result = getSubspeciesFastaMessage({
      valid: true,
      message: "",
      status: "valid_dna",
    } as never);

    expect(result).toBe("");
  });
});

describe("transformSubspeciesClassificationParams", () => {
  const baseData = {
    input_source: "fasta_data" as const,
    virus_type: "SARS-CoV-2",
    input_fasta_data: ">seq1\nATCGATCG",
    input_fasta_file: "",
    output_path: "/workspace/user/home",
    output_file: "subspecies-test",
  };

  it("includes basic fields in the output", () => {
    const result = transformSubspeciesClassificationParams(
      baseData as never,
    );

    expect(result).toEqual(
      expect.objectContaining({
        input_source: "fasta_data",
        virus_type: "SARS-CoV-2",
        output_path: "/workspace/user/home",
        output_file: "subspecies-test",
      }),
    );
  });

  it("includes input_fasta_data when input_source is fasta_data", () => {
    const result = transformSubspeciesClassificationParams(
      baseData as never,
    );

    expect(result.input_fasta_data).toBe(">seq1\nATCGATCG");
  });

  it("trims input_fasta_data", () => {
    const data = {
      ...baseData,
      input_fasta_data: "  >seq1\nATCG  ",
    };

    const result = transformSubspeciesClassificationParams(data as never);

    expect(result.input_fasta_data).toBe(">seq1\nATCG");
  });

  it("includes input_fasta_file when input_source is fasta_file", () => {
    const data = {
      ...baseData,
      input_source: "fasta_file" as const,
      input_fasta_file: "/ws/sequences.fa",
    };

    const result = transformSubspeciesClassificationParams(data as never);

    expect(result.input_fasta_file).toBe("/ws/sequences.fa");
    expect(result).not.toHaveProperty("input_fasta_data");
  });

  it("trims input_fasta_file path", () => {
    const data = {
      ...baseData,
      input_source: "fasta_file" as const,
      input_fasta_file: "  /ws/sequences.fa  ",
    };

    const result = transformSubspeciesClassificationParams(data as never);

    expect(result.input_fasta_file).toBe("/ws/sequences.fa");
  });

  it("does not include fasta_file key when input_source is fasta_data", () => {
    const result = transformSubspeciesClassificationParams(
      baseData as never,
    );

    expect(result).not.toHaveProperty("input_fasta_file");
  });

  it("trims virus_type, output_path, and output_file", () => {
    const data = {
      ...baseData,
      virus_type: "  SARS-CoV-2  ",
      output_path: "  /workspace/user  ",
      output_file: "  test  ",
    };

    const result = transformSubspeciesClassificationParams(data as never);

    expect(result.virus_type).toBe("SARS-CoV-2");
    expect(result.output_path).toBe("/workspace/user");
    expect(result.output_file).toBe("test");
  });
});
