import { validateFastaForBlast, getBlastFastaErrorMessage } from "@/lib/fasta-validation";

vi.mock("@/types/services", () => ({
  blastPrecomputedDatabases: [
    { value: "bacteria-archaea", label: "Bacteria/Archaea" },
    { value: "viral-reference", label: "Viral Reference" },
    { value: "selGenome", label: "Genome List" },
    { value: "selGroup", label: "Genome Group" },
    { value: "selFeatureGroup", label: "Feature Group" },
    { value: "selTaxon", label: "Taxon List" },
    { value: "selFasta", label: "FASTA File" },
  ],
  blastDatabaseTypes: [
    { value: "fna", label: "Genome sequences (fna)" },
    { value: "ffn", label: "Genomic features (ffn)" },
    { value: "frn", label: "RNA features (frn)" },
    { value: "faa", label: "Protein features (faa)" },
  ],
  blastDatabaseTypeMap: {
    blastn: { "bacteria-archaea": ["fna", "ffn", "frn"], "viral-reference": ["fna"] },
    blastp: { "bacteria-archaea": ["faa"] },
    blastx: { "bacteria-archaea": ["faa"] },
    tblastn: { "bacteria-archaea": ["fna", "ffn"] },
  },
}));

vi.mock("@/lib/fasta-validation", () => ({
  validateFastaForBlast: vi.fn(() => ({ valid: true, message: "" })),
  getBlastFastaErrorMessage: vi.fn(() => ""),
}));

vi.mock("./blast-form-schema", () => ({}));

import {
  getAvailableBlastDatabaseTypes,
  getDefaultBlastDatabaseType,
  validateBlastFastaInput,
  transformBlastParams,
  resolveDbSource,
  createInputSourceOverrides,
  extractInputFields,
  createBlastFormValues,
  createDatabaseSourceOverrides,
} from "../blast-form-utils";

describe("getAvailableBlastDatabaseTypes", () => {
  it("returns filtered types for blastn + bacteria-archaea", () => {
    const result = getAvailableBlastDatabaseTypes("blastn", "bacteria-archaea");
    const values = result.map((t) => t.value);
    expect(values).toEqual(["fna", "ffn", "frn"]);
  });

  it("returns filtered types for blastn + viral-reference", () => {
    const result = getAvailableBlastDatabaseTypes("blastn", "viral-reference");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({ value: "fna" }));
  });

  it("returns only faa for blastp + bacteria-archaea", () => {
    const result = getAvailableBlastDatabaseTypes("blastp", "bacteria-archaea");
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual(expect.objectContaining({ value: "faa" }));
  });

  it("returns fna and ffn for tblastn + bacteria-archaea", () => {
    const result = getAvailableBlastDatabaseTypes("tblastn", "bacteria-archaea");
    const values = result.map((t) => t.value);
    expect(values).toEqual(["fna", "ffn"]);
  });

  it("returns all types for an unknown program/db combo", () => {
    const result = getAvailableBlastDatabaseTypes("unknown", "unknown");
    expect(result).toHaveLength(4);
  });

  it("returns all types when the program exists but db source does not", () => {
    const result = getAvailableBlastDatabaseTypes("blastp", "viral-reference");
    expect(result).toHaveLength(4);
  });
});

describe("getDefaultBlastDatabaseType", () => {
  it("returns the first available type for blastn + bacteria-archaea", () => {
    expect(getDefaultBlastDatabaseType("blastn", "bacteria-archaea")).toBe("fna");
  });

  it("returns faa for blastp + bacteria-archaea", () => {
    expect(getDefaultBlastDatabaseType("blastp", "bacteria-archaea")).toBe("faa");
  });

  it("returns fna for tblastn + bacteria-archaea", () => {
    expect(getDefaultBlastDatabaseType("tblastn", "bacteria-archaea")).toBe("fna");
  });

  it("defaults to fna when no types are mapped", () => {
    expect(getDefaultBlastDatabaseType("unknown", "unknown")).toBe("fna");
  });

  it("returns fna for blastn + viral-reference", () => {
    expect(getDefaultBlastDatabaseType("blastn", "viral-reference")).toBe("fna");
  });
});

describe("validateBlastFastaInput", () => {
  beforeEach(() => {
    vi.mocked(validateFastaForBlast).mockReturnValue({ valid: true, message: "" } as ReturnType<typeof validateFastaForBlast>);
    vi.mocked(getBlastFastaErrorMessage).mockReturnValue("");
  });

  it("returns invalid for empty text", () => {
    const result = validateBlastFastaInput("", "blastn");
    expect(result.isValid).toBe(false);
    expect(result.message).toBe("FASTA input is required");
  });

  it("returns invalid for whitespace-only text", () => {
    const result = validateBlastFastaInput("   ", "blastn");
    expect(result.isValid).toBe(false);
    expect(result.message).toBe("FASTA input is required");
  });

  it("calls validateFastaForBlast with the text and input type", () => {
    validateBlastFastaInput(">seq1\nACGT", "blastp");
    expect(validateFastaForBlast).toHaveBeenCalledWith(">seq1\nACGT", "blastp");
  });

  it("returns valid when validation passes", () => {
    const result = validateBlastFastaInput(">seq1\nACGT", "blastn");
    expect(result.isValid).toBe(true);
    expect(result.message).toBe("");
  });

  it("returns invalid with error message when validation fails", () => {
    vi.mocked(validateFastaForBlast).mockReturnValue({ valid: false, message: "bad" } as ReturnType<typeof validateFastaForBlast>);
    vi.mocked(getBlastFastaErrorMessage).mockReturnValue("Invalid FASTA sequence");

    const result = validateBlastFastaInput(">bad\nXXX", "blastx");
    expect(result.isValid).toBe(false);
    expect(result.message).toBe("Invalid FASTA sequence");
  });
});

describe("transformBlastParams", () => {
  const baseData = {
    input_type: "dna",
    input_source: "fasta_data",
    db_type: "fna",
    db_source: "precomputed_database",
    db_precomputed_database: "bacteria-archaea",
    blast_program: "blastn",
    output_file: "output.json",
    output_path: "/workspace/user/",
    blast_max_hits: 10,
    blast_evalue_cutoff: 0.001,
    input_fasta_data: ">seq\nACGT",
  };

  it("maps all basic fields correctly", () => {
    const result = transformBlastParams(baseData);
    expect(result).toEqual(expect.objectContaining({
      input_type: "dna",
      input_source: "fasta_data",
      db_type: "fna",
      db_source: "precomputed_database",
      db_precomputed_database: "bacteria-archaea",
      blast_program: "blastn",
      output_file: "output.json",
      output_path: "/workspace/user/",
      blast_max_hits: 10,
    }));
  });

  it("converts blast_evalue_cutoff to string", () => {
    const result = transformBlastParams(baseData);
    expect(result.blast_evalue_cutoff).toBe("0.001");
  });

  it("includes input_fasta_data when input_source is fasta_data", () => {
    const result = transformBlastParams(baseData);
    expect(result.input_fasta_data).toBe(">seq\nACGT");
    expect(result).not.toHaveProperty("input_fasta_file");
    expect(result).not.toHaveProperty("input_feature_group");
  });

  it("includes input_fasta_file when input_source is fasta_file", () => {
    const data = {
      ...baseData,
      input_source: "fasta_file",
      input_fasta_file: "/path/to/file.fasta",
    };
    const result = transformBlastParams(data);
    expect(result.input_fasta_file).toBe("/path/to/file.fasta");
    expect(result).not.toHaveProperty("input_fasta_data");
  });

  it("includes input_feature_group when input_source is feature_group", () => {
    const data = {
      ...baseData,
      input_source: "feature_group",
      input_feature_group: "/my/feature/group",
    };
    const result = transformBlastParams(data);
    expect(result.input_feature_group).toBe("/my/feature/group");
    expect(result).not.toHaveProperty("input_fasta_data");
  });

  it("includes db_genome_list when db_precomputed_database is selGenome", () => {
    const data = {
      ...baseData,
      db_precomputed_database: "selGenome",
      db_genome_list: ["genome1", "genome2"],
    };
    const result = transformBlastParams(data);
    expect(result.db_genome_list).toEqual(["genome1", "genome2"]);
  });

  it("includes db_genome_group when db_precomputed_database is selGroup", () => {
    const data = {
      ...baseData,
      db_precomputed_database: "selGroup",
      db_genome_group: "/my/genome/group",
    };
    const result = transformBlastParams(data);
    expect(result.db_genome_group).toBe("/my/genome/group");
  });

  it("includes db_feature_group when db_precomputed_database is selFeatureGroup", () => {
    const data = {
      ...baseData,
      db_precomputed_database: "selFeatureGroup",
      db_feature_group: "/my/feature/group",
    };
    const result = transformBlastParams(data);
    expect(result.db_feature_group).toBe("/my/feature/group");
  });

  it("includes db_taxon_list when db_precomputed_database is selTaxon", () => {
    const data = {
      ...baseData,
      db_precomputed_database: "selTaxon",
      db_taxon_list: ["taxon1"],
    };
    const result = transformBlastParams(data);
    expect(result.db_taxon_list).toEqual(["taxon1"]);
  });

  it("includes db_fasta_file when db_precomputed_database is selFasta", () => {
    const data = {
      ...baseData,
      db_precomputed_database: "selFasta",
      db_fasta_file: "/path/to/db.fasta",
    };
    const result = transformBlastParams(data);
    expect(result.db_fasta_file).toBe("/path/to/db.fasta");
  });

  it("does not include conditional db fields for precomputed databases", () => {
    const result = transformBlastParams(baseData);
    expect(result).not.toHaveProperty("db_genome_list");
    expect(result).not.toHaveProperty("db_genome_group");
    expect(result).not.toHaveProperty("db_feature_group");
    expect(result).not.toHaveProperty("db_taxon_list");
    expect(result).not.toHaveProperty("db_fasta_file");
  });
});

describe("resolveDbSource", () => {
  it("returns precomputed_database for bacteria-archaea", () => {
    expect(resolveDbSource("bacteria-archaea")).toBe("precomputed_database");
  });

  it("returns precomputed_database for viral-reference", () => {
    expect(resolveDbSource("viral-reference")).toBe("precomputed_database");
  });

  it("returns genome_list for selGenome", () => {
    expect(resolveDbSource("selGenome")).toBe("genome_list");
  });

  it("returns genome_group for selGroup", () => {
    expect(resolveDbSource("selGroup")).toBe("genome_group");
  });

  it("returns feature_group for selFeatureGroup", () => {
    expect(resolveDbSource("selFeatureGroup")).toBe("feature_group");
  });

  it("returns taxon_list for selTaxon", () => {
    expect(resolveDbSource("selTaxon")).toBe("taxon_list");
  });

  it("returns fasta_file for selFasta", () => {
    expect(resolveDbSource("selFasta")).toBe("fasta_file");
  });

  it("defaults to precomputed_database when undefined", () => {
    expect(resolveDbSource(undefined)).toBe("precomputed_database");
  });
});

describe("createInputSourceOverrides", () => {
  it("returns fasta_data source with preserved data", () => {
    const result = createInputSourceOverrides("fasta_data", ">seq\nACGT");
    expect(result).toEqual({
      input_source: "fasta_data",
      input_fasta_data: ">seq\nACGT",
    });
  });

  it("returns fasta_data source with empty string when no preserved data", () => {
    const result = createInputSourceOverrides("fasta_data");
    expect(result).toEqual({
      input_source: "fasta_data",
      input_fasta_data: "",
    });
  });

  it("returns fasta_file source with empty file path", () => {
    const result = createInputSourceOverrides("fasta_file");
    expect(result).toEqual({
      input_source: "fasta_file",
      input_fasta_file: "",
    });
  });

  it("returns feature_group source with empty group", () => {
    const result = createInputSourceOverrides("feature_group");
    expect(result).toEqual({
      input_source: "feature_group",
      input_feature_group: "",
    });
  });

  it("returns only input_source for unknown source type", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = createInputSourceOverrides("unknown" as any);
    expect(result).toEqual({ input_source: "unknown" });
  });
});

describe("extractInputFields", () => {
  it("extracts input_source and all input fields", () => {
    const values = {
      input_source: "fasta_data" as const,
      input_fasta_data: ">seq\nACGT",
      input_fasta_file: "/some/file.fasta",
      input_feature_group: "/some/group",
      blast_program: "blastn" as const,
      db_type: "fna" as const,
    };

    const result = extractInputFields(values);
    expect(result).toEqual({
      input_source: "fasta_data",
      input_fasta_data: ">seq\nACGT",
      input_fasta_file: "/some/file.fasta",
      input_feature_group: "/some/group",
    });
  });

  it("does not include non-input fields", () => {
    const values = {
      input_source: "fasta_data" as const,
      input_fasta_data: ">seq\nACGT",
      blast_program: "blastn" as const,
      db_type: "fna" as const,
      output_file: "result.json",
    };

    const result = extractInputFields(values);
    expect(result).not.toHaveProperty("blast_program");
    expect(result).not.toHaveProperty("db_type");
    expect(result).not.toHaveProperty("output_file");
  });

  it("defaults missing input fields to empty strings", () => {
    const values = {
      input_source: "fasta_file" as const,
    };

    const result = extractInputFields(values);
    expect(result).toEqual({
      input_source: "fasta_file",
      input_fasta_data: "",
      input_fasta_file: "",
      input_feature_group: "",
    });
  });

  it("converts non-string input field values to strings", () => {
    const values = {
      input_source: "fasta_data" as const,
      input_fasta_data: undefined,
      input_fasta_file: null,
      input_feature_group: undefined,
    } as unknown as Parameters<typeof extractInputFields>[0];

    const result = extractInputFields(values);
    expect(result.input_fasta_data).toBe("");
    expect(result.input_fasta_file).toBe("");
    expect(result.input_feature_group).toBe("");
  });
});

describe("createBlastFormValues", () => {
  it("merges currentValues with overrides", () => {
    const current = {
      blast_program: "blastn" as const,
      output_file: "my-output",
      blast_max_hits: 50,
    };
    const overrides = { blast_max_hits: 100 };

    const result = createBlastFormValues(current, overrides);

    expect(result.output_file).toBe("my-output");
    expect(result.blast_max_hits).toBe(100);
  });

  it("derives input_type as dna from blastn", () => {
    const result = createBlastFormValues({}, { blast_program: "blastn" });
    expect(result.input_type).toBe("dna");
  });

  it("derives input_type as aa from blastp", () => {
    const result = createBlastFormValues({}, { blast_program: "blastp" });
    expect(result.input_type).toBe("aa");
  });

  it("derives input_type as aa from tblastn", () => {
    const result = createBlastFormValues({}, { blast_program: "tblastn" });
    expect(result.input_type).toBe("aa");
  });

  it("derives db_source from db_precomputed_database", () => {
    const result = createBlastFormValues({}, { db_precomputed_database: "selGenome" });
    expect(result.db_source).toBe("genome_list");
  });

  it("override values take precedence over derived values", () => {
    const result = createBlastFormValues(
      {},
      { blast_program: "blastn", input_type: "aa", db_source: "fasta_file" },
    );

    expect(result.input_type).toBe("aa");
    expect(result.db_source).toBe("fasta_file");
  });

  it("defaults missing fields", () => {
    const result = createBlastFormValues({}, {});

    expect(result.blast_program).toBe("blastn");
    expect(result.db_precomputed_database).toBe("bacteria-archaea");
    expect(result.input_source).toBe("fasta_data");
    expect(result.blast_evalue_cutoff).toBe(0.0001);
  });
});

describe("createDatabaseSourceOverrides", () => {
  it("returns correct overrides for selGenome", () => {
    const result = createDatabaseSourceOverrides("selGenome", {});

    expect(result.db_source).toBe("genome_list");
    expect(result.db_precomputed_database).toBe("selGenome");
    expect(result.db_genome_list).toEqual([]);
  });

  it("returns correct overrides for selGroup", () => {
    const result = createDatabaseSourceOverrides("selGroup", {});

    expect(result.db_source).toBe("genome_group");
    expect(result.db_genome_group).toBe("");
  });

  it("returns correct overrides for selFasta", () => {
    const result = createDatabaseSourceOverrides("selFasta", {});

    expect(result.db_source).toBe("fasta_file");
    expect(result.db_fasta_file).toBe("");
  });

  it("returns correct overrides for selFeatureGroup", () => {
    const result = createDatabaseSourceOverrides("selFeatureGroup", {});

    expect(result.db_source).toBe("feature_group");
    expect(result.db_feature_group).toBe("");
  });

  it("returns correct overrides for selTaxon", () => {
    const result = createDatabaseSourceOverrides("selTaxon", {});

    expect(result.db_source).toBe("taxon_list");
    expect(result.db_taxon_list).toEqual([]);
  });

  it("resets all db-conditional fields when switching", () => {
    const result = createDatabaseSourceOverrides("selGenome", {});

    expect(result.db_genome_group).toBe("");
    expect(result.db_feature_group).toBe("");
    expect(result.db_taxon_list).toEqual([]);
    expect(result.db_fasta_file).toBe("");
  });

  it("preserves input fields passed as second argument", () => {
    const preserved = { input_source: "fasta_data" as const, input_fasta_data: ">seq\nACGT" };
    const result = createDatabaseSourceOverrides("bacteria-archaea", preserved);

    expect(result.input_source).toBe("fasta_data");
    expect(result.input_fasta_data).toBe(">seq\nACGT");
  });

  it("throws for invalid database source", () => {
    expect(() =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      createDatabaseSourceOverrides("nonexistent" as any, {}),
    ).toThrow("Invalid database source: nonexistent");
  });
});
