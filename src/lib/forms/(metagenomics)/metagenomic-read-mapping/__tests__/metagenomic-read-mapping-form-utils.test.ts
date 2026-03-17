vi.mock("./metagenomic-read-mapping-form-schema", () => ({}));

import { transformMetagenomicReadMappingParams } from "@/lib/forms/(metagenomics)/metagenomic-read-mapping/metagenomic-read-mapping-form-utils";

describe("transformMetagenomicReadMappingParams", () => {
  const baseData = {
    paired_end_libs: [],
    single_end_libs: [],
    srr_ids: [],
    gene_set_type: "predefined_list" as const,
    gene_set_name: "CARD" as const,
    gene_set_fasta: "",
    gene_set_feature_group: "",
    output_path: "/workspace/output",
    output_file: "read_mapping_result",
  };

  it("returns basic fields (output_path, output_file, gene_set_type)", () => {
    const result = transformMetagenomicReadMappingParams(baseData as never);

    expect(result).toEqual(
      expect.objectContaining({
        output_path: "/workspace/output",
        output_file: "read_mapping_result",
        gene_set_type: "predefined_list",
      }),
    );
  });

  it("trims output_file whitespace", () => {
    const data = { ...baseData, output_file: "  read_mapping_result  " };
    const result = transformMetagenomicReadMappingParams(data as never);

    expect(result.output_file).toBe("read_mapping_result");
  });

  describe("read libraries", () => {
    it("includes paired_end_libs when provided", () => {
      const data = {
        ...baseData,
        paired_end_libs: [
          { _id: "p1", _type: "paired", read1: "/reads/r1.fq", read2: "/reads/r2.fq" },
        ],
      };
      const result = transformMetagenomicReadMappingParams(data as never);

      expect(result.paired_end_libs).toEqual([
        { read1: "/reads/r1.fq", read2: "/reads/r2.fq" },
      ]);
    });

    it("includes single_end_libs when provided", () => {
      const data = {
        ...baseData,
        single_end_libs: [
          { _id: "s1", _type: "single", read: "/reads/single.fq" },
        ],
      };
      const result = transformMetagenomicReadMappingParams(data as never);

      expect(result.single_end_libs).toEqual([{ read: "/reads/single.fq" }]);
    });

    it("includes srr_ids when provided", () => {
      const data = {
        ...baseData,
        srr_ids: ["SRR123456", "SRR789012"],
      };
      const result = transformMetagenomicReadMappingParams(data as never);

      expect(result.srr_ids).toEqual(["SRR123456", "SRR789012"]);
    });

    it("does not include empty library arrays or srr_ids", () => {
      const result = transformMetagenomicReadMappingParams(baseData as never);

      expect(result).not.toHaveProperty("paired_end_libs");
      expect(result).not.toHaveProperty("single_end_libs");
      expect(result).not.toHaveProperty("srr_ids");
    });
  });

  describe("gene set type: predefined_list", () => {
    it("includes gene_set_name for predefined_list", () => {
      const result = transformMetagenomicReadMappingParams(baseData as never);

      expect(result.gene_set_name).toBe("CARD");
      expect(result).not.toHaveProperty("gene_set_fasta");
      expect(result).not.toHaveProperty("gene_set_feature_group");
    });

    it("includes VFDB as gene_set_name", () => {
      const data = { ...baseData, gene_set_name: "VFDB" as const };
      const result = transformMetagenomicReadMappingParams(data as never);

      expect(result.gene_set_name).toBe("VFDB");
    });
  });

  describe("gene set type: fasta_file", () => {
    it("includes gene_set_fasta for fasta_file", () => {
      const data = {
        ...baseData,
        gene_set_type: "fasta_file" as const,
        gene_set_fasta: "/workspace/genes.fasta",
      };
      const result = transformMetagenomicReadMappingParams(data as never);

      expect(result.gene_set_fasta).toBe("/workspace/genes.fasta");
      expect(result).not.toHaveProperty("gene_set_name");
      expect(result).not.toHaveProperty("gene_set_feature_group");
    });
  });

  describe("gene set type: feature_group", () => {
    it("includes gene_set_feature_group for feature_group", () => {
      const data = {
        ...baseData,
        gene_set_type: "feature_group" as const,
        gene_set_feature_group: "/workspace/feature_group",
      };
      const result = transformMetagenomicReadMappingParams(data as never);

      expect(result.gene_set_feature_group).toBe("/workspace/feature_group");
      expect(result).not.toHaveProperty("gene_set_name");
      expect(result).not.toHaveProperty("gene_set_fasta");
    });
  });
});
