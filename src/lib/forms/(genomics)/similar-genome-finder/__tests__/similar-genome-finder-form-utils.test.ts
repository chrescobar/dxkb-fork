vi.mock("../similar-genome-finder-form-schema", () => ({
  defaultSimilarGenomeFinderFormValues: {
    selectedGenomeId: "",
    fasta_file: "",
    scope: "all",
    max_pvalue: 0.01,
    max_distance: 0.01,
    max_hits: 50,
    include_bacterial: true,
    include_viral: false,
    output_path: "",
    output_file: "",
  },
}));

import {
  buildMinhashServicePayload,
  transformSimilarGenomeFinderParams,
  resetSimilarGenomeFinderValues,
} from "../similar-genome-finder-form-utils";

const baseFormData = {
  selectedGenomeId: "83332.12",
  fasta_file: "",
  scope: "all" as const,
  max_pvalue: 0.01,
  max_distance: 0.01,
  max_hits: 50,
  include_bacterial: true,
  include_viral: false,
  output_path: "/my/output",
  output_file: "results",
};

describe("buildMinhashServicePayload", () => {
  it("uses genome method when selectedGenomeId is provided", () => {
    const result = buildMinhashServicePayload(baseFormData, "test-id-1");

    expect(result.method).toBe(
      "Minhash.compute_genome_distance_for_genome2",
    );
    expect(result.params[0]).toBe("83332.12");
  });

  it("uses fasta method when only fasta_file is provided", () => {
    const data = {
      ...baseFormData,
      selectedGenomeId: "",
      fasta_file: "/path/to/file.fasta",
    };
    const result = buildMinhashServicePayload(data, "test-id-2");

    expect(result.method).toBe(
      "Minhash.compute_genome_distance_for_fasta2",
    );
    expect(result.params[0]).toBe("/path/to/file.fasta");
  });

  it("sets includeReference and includeRepresentative to 1 when scope is reference", () => {
    const data = { ...baseFormData, scope: "reference" as const };
    const result = buildMinhashServicePayload(data, "test-id-3");

    expect(result.params[4]).toBe(1); // include_reference
    expect(result.params[5]).toBe(1); // include_representative
  });

  it("sets includeReference and includeRepresentative to 0 when scope is all", () => {
    const data = { ...baseFormData, scope: "all" as const };
    const result = buildMinhashServicePayload(data, "test-id-4");

    expect(result.params[4]).toBe(0);
    expect(result.params[5]).toBe(0);
  });

  it("converts boolean flags to 0/1 integers", () => {
    const data = {
      ...baseFormData,
      include_bacterial: true,
      include_viral: false,
    };
    const result = buildMinhashServicePayload(data, "test-id-5");

    expect(result.params[6]).toBe(1); // include_bacterial
    expect(result.params[7]).toBe(0); // include_viral
  });

  it("passes numeric parameters in the correct order", () => {
    const result = buildMinhashServicePayload(baseFormData, "test-id-6");

    expect(result.params[1]).toBe(0.01); // max_pvalue
    expect(result.params[2]).toBe(0.01); // max_distance
    expect(result.params[3]).toBe(50); // max_hits
  });

  it("sets version to 1.1 and uses the provided id", () => {
    const result = buildMinhashServicePayload(baseFormData, "custom-id");

    expect(result.version).toBe("1.1");
    expect(result.id).toBe("custom-id");
  });

  it("generates an id when none is provided", () => {
    const result = buildMinhashServicePayload(baseFormData);

    expect(result.id).toBeDefined();
    expect(result.id.length).toBeGreaterThan(0);
  });

  it("trims whitespace from selectedGenomeId", () => {
    const data = { ...baseFormData, selectedGenomeId: "  83332.12  " };
    const result = buildMinhashServicePayload(data, "trim-test");

    expect(result.params[0]).toBe("83332.12");
  });

  it("trims whitespace from fasta_file", () => {
    const data = {
      ...baseFormData,
      selectedGenomeId: "",
      fasta_file: "  /path/to/file.fasta  ",
    };
    const result = buildMinhashServicePayload(data, "trim-test-2");

    expect(result.params[0]).toBe("/path/to/file.fasta");
  });
});

describe("transformSimilarGenomeFinderParams", () => {
  it("includes numeric parameters", () => {
    const result = transformSimilarGenomeFinderParams(baseFormData);

    expect(result).toEqual(
      expect.objectContaining({
        max_pvalue: 0.01,
        max_distance: 0.01,
        max_hits: 50,
      }),
    );
  });

  it("converts include_bacterial boolean to 1", () => {
    const result = transformSimilarGenomeFinderParams(baseFormData);

    expect(result.include_bacterial).toBe(1);
  });

  it("converts include_viral boolean to 0", () => {
    const result = transformSimilarGenomeFinderParams(baseFormData);

    expect(result.include_viral).toBe(0);
  });

  it("sets include_reference and include_representative to 1 for reference scope", () => {
    const data = { ...baseFormData, scope: "reference" as const };
    const result = transformSimilarGenomeFinderParams(data);

    expect(result.include_reference).toBe(1);
    expect(result.include_representative).toBe(1);
  });

  it("sets include_reference and include_representative to 0 for all scope", () => {
    const data = { ...baseFormData, scope: "all" as const };
    const result = transformSimilarGenomeFinderParams(data);

    expect(result.include_reference).toBe(0);
    expect(result.include_representative).toBe(0);
  });

  it("includes selectedGenomeId when it is non-empty", () => {
    const result = transformSimilarGenomeFinderParams(baseFormData);

    expect(result.selectedGenomeId).toBe("83332.12");
  });

  it("excludes selectedGenomeId when it is empty", () => {
    const data = { ...baseFormData, selectedGenomeId: "" };
    const result = transformSimilarGenomeFinderParams(data);

    expect(result).not.toHaveProperty("selectedGenomeId");
  });

  it("includes fasta_file when it is non-empty", () => {
    const data = { ...baseFormData, fasta_file: "/path/to/file.fasta" };
    const result = transformSimilarGenomeFinderParams(data);

    expect(result.fasta_file).toBe("/path/to/file.fasta");
  });

  it("excludes fasta_file when it is empty", () => {
    const result = transformSimilarGenomeFinderParams(baseFormData);

    expect(result).not.toHaveProperty("fasta_file");
  });

  it("includes output_path when it is non-empty", () => {
    const result = transformSimilarGenomeFinderParams(baseFormData);

    expect(result.output_path).toBe("/my/output");
  });

  it("excludes output_path when it is empty", () => {
    const data = { ...baseFormData, output_path: "" };
    const result = transformSimilarGenomeFinderParams(data);

    expect(result).not.toHaveProperty("output_path");
  });

  it("includes output_file when it is non-empty", () => {
    const result = transformSimilarGenomeFinderParams(baseFormData);

    expect(result.output_file).toBe("results");
  });

  it("excludes output_file when it is empty", () => {
    const data = { ...baseFormData, output_file: "" };
    const result = transformSimilarGenomeFinderParams(data);

    expect(result).not.toHaveProperty("output_file");
  });
});

describe("resetSimilarGenomeFinderValues", () => {
  it("returns a copy of the default values", () => {
    const result = resetSimilarGenomeFinderValues();

    expect(result).toEqual({
      selectedGenomeId: "",
      fasta_file: "",
      scope: "all",
      max_pvalue: 0.01,
      max_distance: 0.01,
      max_hits: 50,
      include_bacterial: true,
      include_viral: false,
      output_path: "",
      output_file: "",
    });
  });

  it("returns a new object each time (not the same reference)", () => {
    const first = resetSimilarGenomeFinderValues();
    const second = resetSimilarGenomeFinderValues();

    expect(first).not.toBe(second);
    expect(first).toEqual(second);
  });
});
