vi.mock("./metagenomic-binning-form-schema", () => ({}));

import { transformMetagenomicBinningParams } from "@/lib/forms/(metagenomics)/metagenomic-binning/metagenomic-binning-form-utils";

describe("transformMetagenomicBinningParams", () => {
  const baseData = {
    start_with: "reads" as const,
    paired_end_libs: [],
    single_end_libs: [],
    srr_ids: [],
    contigs: "",
    assembler: "auto" as const,
    organism: "both" as const,
    output_path: "/workspace/output",
    output_file: "binning_result",
    genome_group: "",
    min_contig_len: 300,
    min_contig_cov: 5,
    disable_dangling: false,
  };

  it("returns basic fields (output_path, output_file)", () => {
    const result = transformMetagenomicBinningParams(baseData as never);

    expect(result).toEqual(
      expect.objectContaining({
        output_path: "/workspace/output",
        output_file: "binning_result",
      }),
    );
  });

  it("trims output_file whitespace", () => {
    const data = { ...baseData, output_file: "  binning_result  " };
    const result = transformMetagenomicBinningParams(data as never);

    expect(result.output_file).toBe("binning_result");
  });

  it("includes genome_group when present and non-empty", () => {
    const data = { ...baseData, genome_group: "my_group" };
    const result = transformMetagenomicBinningParams(data as never);

    expect(result.genome_group).toBe("my_group");
  });

  it("does not include genome_group when empty", () => {
    const result = transformMetagenomicBinningParams(baseData as never);

    expect(result).not.toHaveProperty("genome_group");
  });

  it("does not include genome_group when only whitespace", () => {
    const data = { ...baseData, genome_group: "   " };
    const result = transformMetagenomicBinningParams(data as never);

    expect(result).not.toHaveProperty("genome_group");
  });

  describe("start_with reads", () => {
    it("adds paired_end_libs when provided", () => {
      const data = {
        ...baseData,
        paired_end_libs: [
          { _id: "p1", _type: "paired", read1: "/reads/r1.fq", read2: "/reads/r2.fq" },
        ],
      };
      const result = transformMetagenomicBinningParams(data as never);

      expect(result.paired_end_libs).toEqual([
        { read1: "/reads/r1.fq", read2: "/reads/r2.fq" },
      ]);
    });

    it("adds single_end_libs when provided", () => {
      const data = {
        ...baseData,
        single_end_libs: [
          { _id: "s1", _type: "single", read: "/reads/single.fq" },
        ],
      };
      const result = transformMetagenomicBinningParams(data as never);

      expect(result.single_end_libs).toEqual([{ read: "/reads/single.fq" }]);
    });

    it("adds srr_ids when provided", () => {
      const data = {
        ...baseData,
        srr_ids: ["SRR123456", "SRR789012"],
      };
      const result = transformMetagenomicBinningParams(data as never);

      expect(result.srr_ids).toEqual(["SRR123456", "SRR789012"]);
    });

    it("does not include empty library arrays", () => {
      const result = transformMetagenomicBinningParams(baseData as never);

      expect(result).not.toHaveProperty("paired_end_libs");
      expect(result).not.toHaveProperty("single_end_libs");
      expect(result).not.toHaveProperty("srr_ids");
    });

    it("includes assembler for reads", () => {
      const result = transformMetagenomicBinningParams(baseData as never);

      expect(result.assembler).toBe("auto");
    });
  });

  describe("start_with contigs", () => {
    it("adds contigs and omits read libraries and assembler", () => {
      const data = {
        ...baseData,
        start_with: "contigs" as const,
        contigs: "/workspace/contigs.fa",
      };
      const result = transformMetagenomicBinningParams(data as never);

      expect(result.contigs).toBe("/workspace/contigs.fa");
      expect(result).not.toHaveProperty("paired_end_libs");
      expect(result).not.toHaveProperty("single_end_libs");
      expect(result).not.toHaveProperty("srr_ids");
      expect(result).not.toHaveProperty("assembler");
    });
  });

  describe("organism selection", () => {
    it("sets perform_bacterial_annotation for bacteria", () => {
      const data = { ...baseData, organism: "bacteria" as const };
      const result = transformMetagenomicBinningParams(data as never);

      expect(result.perform_bacterial_annotation).toBe(true);
      expect(result).not.toHaveProperty("perform_viral_annotation");
      expect(result).not.toHaveProperty("perform_viral_binning");
    });

    it("sets viral annotation and binning for viral", () => {
      const data = { ...baseData, organism: "viral" as const };
      const result = transformMetagenomicBinningParams(data as never);

      expect(result.perform_viral_annotation).toBe(true);
      expect(result.perform_viral_binning).toBe(true);
      expect(result.perform_bacterial_binning).toBe(false);
      expect(result).not.toHaveProperty("perform_bacterial_annotation");
    });

    it("sets both annotations for both", () => {
      const data = { ...baseData, organism: "both" as const };
      const result = transformMetagenomicBinningParams(data as never);

      expect(result.perform_bacterial_annotation).toBe(true);
      expect(result.perform_viral_annotation).toBe(true);
      expect(result.perform_viral_binning).toBe(true);
    });
  });

  describe("advanced parameters", () => {
    it("includes min_contig_len and min_contig_cov", () => {
      const result = transformMetagenomicBinningParams(baseData as never);

      expect(result.min_contig_len).toBe(300);
      expect(result.min_contig_cov).toBe(5);
    });

    it("sets danglen to 0 when disable_dangling is true", () => {
      const data = { ...baseData, disable_dangling: true };
      const result = transformMetagenomicBinningParams(data as never);

      expect(result.danglen).toBe(0);
    });

    it("does not include danglen when disable_dangling is false", () => {
      const result = transformMetagenomicBinningParams(baseData as never);

      expect(result).not.toHaveProperty("danglen");
    });
  });
});
