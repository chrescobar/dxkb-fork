vi.mock("./taxonomic-classification-form-schema", () => ({}));

import {
  transformTaxonomicClassificationParams,
  getDefaultAnalysisType,
  getDefaultDatabase,
  isHostFilteringAvailable,
  isAnalysisTypeSelectable,
} from "@/lib/forms/(metagenomics)/taxonomic-classification/taxonomic-classification-form-utils";

describe("transformTaxonomicClassificationParams", () => {
  const baseData = {
    paired_end_libs: [],
    single_end_libs: [],
    srr_libs: [],
    sequence_type: "wgs" as const,
    analysis_type: "microbiome" as const,
    database: "bvbrc" as const,
    host_genome: "no_host" as const,
    confidence_interval: "0.1",
    save_classified_sequences: false,
    save_unclassified_sequences: false,
    paired_sample_id: "",
    single_sample_id: "",
    srr_sample_id: "",
    output_path: "/workspace/output",
    output_file: "taxonomic_result",
  };

  it("returns basic fields (output_path, output_file, database, confidence_interval)", () => {
    const result = transformTaxonomicClassificationParams(baseData as never);

    expect(result).toEqual(
      expect.objectContaining({
        output_path: "/workspace/output",
        output_file: "taxonomic_result",
        database: "bvbrc",
        confidence_interval: "0.1",
      }),
    );
  });

  it("trims output_file whitespace", () => {
    const data = { ...baseData, output_file: "  taxonomic_result  " };
    const result = transformTaxonomicClassificationParams(data as never);

    expect(result.output_file).toBe("taxonomic_result");
  });

  it("converts sequence_type 16s to sixteenS", () => {
    const data = {
      ...baseData,
      sequence_type: "16s" as const,
      analysis_type: "default" as const,
      database: "SILVA" as const,
    };
    const result = transformTaxonomicClassificationParams(data as never);

    expect(result.sequence_type).toBe("sixteenS");
  });

  it("passes through wgs sequence_type as-is", () => {
    const result = transformTaxonomicClassificationParams(baseData as never);

    expect(result.sequence_type).toBe("wgs");
  });

  it("converts save_classified_sequences boolean to string", () => {
    const data = { ...baseData, save_classified_sequences: true };
    const result = transformTaxonomicClassificationParams(data as never);

    expect(result.save_classified_sequences).toBe("true");
  });

  it("converts save_unclassified_sequences boolean to string", () => {
    const data = { ...baseData, save_unclassified_sequences: true };
    const result = transformTaxonomicClassificationParams(data as never);

    expect(result.save_unclassified_sequences).toBe("true");
  });

  describe("wgs-specific fields", () => {
    it("includes analysis_type and host_genome for wgs", () => {
      const result = transformTaxonomicClassificationParams(baseData as never);

      expect(result.analysis_type).toBe("microbiome");
      expect(result.host_genome).toBe("no_host");
    });

    it("omits analysis_type and host_genome for 16s", () => {
      const data = {
        ...baseData,
        sequence_type: "16s" as const,
        analysis_type: "default" as const,
        database: "SILVA" as const,
      };
      const result = transformTaxonomicClassificationParams(data as never);

      expect(result).not.toHaveProperty("analysis_type");
      expect(result).not.toHaveProperty("host_genome");
    });
  });

  describe("library arrays with sample_id", () => {
    it("includes paired_end_libs with sample_id", () => {
      const data = {
        ...baseData,
        paired_sample_id: "sample-paired",
        paired_end_libs: [
          { _id: "p1", _type: "paired", read1: "/r1.fq", read2: "/r2.fq", sample_id: "lib-s1" },
        ],
      };
      const result = transformTaxonomicClassificationParams(data as never);

      expect(result.paired_end_libs).toEqual([
        { read1: "/r1.fq", read2: "/r2.fq", sample_id: "lib-s1" },
      ]);
      expect(result.paired_sample_id).toBe("sample-paired");
    });

    it("includes single_end_libs with sample_id", () => {
      const data = {
        ...baseData,
        single_sample_id: "sample-single",
        single_end_libs: [
          { _id: "s1", _type: "single", read: "/single.fq", sample_id: "lib-s2" },
        ],
      };
      const result = transformTaxonomicClassificationParams(data as never);

      expect(result.single_end_libs).toEqual([
        { read: "/single.fq", sample_id: "lib-s2" },
      ]);
      expect(result.single_sample_id).toBe("sample-single");
    });

    it("includes srr_libs with sample_id and optional title", () => {
      const data = {
        ...baseData,
        srr_sample_id: "sample-srr",
        srr_libs: [
          { srr_accession: "SRR123456", sample_id: "srr-s1", title: "My Run" },
          { srr_accession: "SRR789012", sample_id: "srr-s2" },
        ],
      };
      const result = transformTaxonomicClassificationParams(data as never);

      expect(result.srr_libs).toEqual([
        { srr_accession: "SRR123456", sample_id: "srr-s1", title: "My Run" },
        { srr_accession: "SRR789012", sample_id: "srr-s2" },
      ]);
      expect(result.srr_sample_id).toBe("sample-srr");
    });

    it("does not include empty library arrays", () => {
      const result = transformTaxonomicClassificationParams(baseData as never);

      expect(result).not.toHaveProperty("paired_end_libs");
      expect(result).not.toHaveProperty("single_end_libs");
      expect(result).not.toHaveProperty("srr_libs");
    });

    it("does not include top-level sample ids when empty", () => {
      const result = transformTaxonomicClassificationParams(baseData as never);

      expect(result).not.toHaveProperty("paired_sample_id");
      expect(result).not.toHaveProperty("single_sample_id");
      expect(result).not.toHaveProperty("srr_sample_id");
    });
  });
});

describe("getDefaultAnalysisType", () => {
  it("returns microbiome for wgs", () => {
    expect(getDefaultAnalysisType("wgs")).toBe("microbiome");
  });

  it("returns default for 16s", () => {
    expect(getDefaultAnalysisType("16s")).toBe("default");
  });
});

describe("getDefaultDatabase", () => {
  it("returns bvbrc for wgs", () => {
    expect(getDefaultDatabase("wgs")).toBe("bvbrc");
  });

  it("returns SILVA for 16s", () => {
    expect(getDefaultDatabase("16s")).toBe("SILVA");
  });
});

describe("isHostFilteringAvailable", () => {
  it("returns true for wgs", () => {
    expect(isHostFilteringAvailable("wgs")).toBe(true);
  });

  it("returns false for 16s", () => {
    expect(isHostFilteringAvailable("16s")).toBe(false);
  });
});

describe("isAnalysisTypeSelectable", () => {
  it("returns true for wgs", () => {
    expect(isAnalysisTypeSelectable("wgs")).toBe(true);
  });

  it("returns false for 16s", () => {
    expect(isAnalysisTypeSelectable("16s")).toBe(false);
  });
});
