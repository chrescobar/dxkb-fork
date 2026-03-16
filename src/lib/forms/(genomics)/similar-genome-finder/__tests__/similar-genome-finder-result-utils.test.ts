import {
  parseMinhashResultPayload,
  mergeGenomeResults,
  type SimilarGenomeFinderResultRow,
} from "../similar-genome-finder-result-utils";

describe("parseMinhashResultPayload", () => {
  it("returns [] for null input", () => {
    expect(parseMinhashResultPayload(null)).toEqual([]);
  });

  it("returns [] for undefined input", () => {
    expect(parseMinhashResultPayload(undefined)).toEqual([]);
  });

  it("parses object with result array of row objects", () => {
    const payload = {
      result: [
        {
          genome_id: "123.4",
          genome_name: "Genome A",
          organism_name: "Org A",
          distance: 0.01,
          pvalue: 0.001,
          counts: 500,
        },
      ],
    };
    const rows = parseMinhashResultPayload(payload);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        genome_id: "123.4",
        genome_name: "Genome A",
        organism_name: "Org A",
        distance: 0.01,
        pvalue: 0.001,
        counts: 500,
      }),
    );
  });

  it("unwraps nested array (result: [[...]])", () => {
    const payload = {
      result: [
        [
          {
            genome_id: "456.7",
            genome_name: "Nested",
            organism_name: "Org N",
            distance: 0.05,
            pvalue: 0.01,
            counts: 100,
          },
        ],
      ],
    };
    const rows = parseMinhashResultPayload(payload);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        genome_id: "456.7",
        genome_name: "Nested",
      }),
    );
  });

  it("converts columnar format (genome_id: [...], distance: [...]) to rows", () => {
    const payload = {
      result: {
        genome_id: ["g1", "g2"],
        genome_name: ["Name1", "Name2"],
        organism_name: ["Org1", "Org2"],
        distance: [0.1, 0.2],
        pvalue: [0.01, 0.02],
        counts: [10, 20],
      },
    };
    const rows = parseMinhashResultPayload(payload);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        genome_id: "g1",
        genome_name: "Name1",
        organism_name: "Org1",
        distance: 0.1,
        pvalue: 0.01,
        counts: 10,
      }),
    );
    expect(rows[1]).toEqual(
      expect.objectContaining({
        genome_id: "g2",
        genome_name: "Name2",
        organism_name: "Org2",
        distance: 0.2,
        pvalue: 0.02,
        counts: 20,
      }),
    );
  });

  it("handles alternate key names (genomeId, dist, p_value, kmer_count) in columnar format", () => {
    const payload = {
      result: {
        genomeId: ["a1"],
        dist: [0.3],
        p_value: [0.003],
        kmer_count: [42],
      },
    };
    const rows = parseMinhashResultPayload(payload);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        genome_id: "a1",
        distance: 0.3,
        pvalue: 0.003,
        counts: 42,
      }),
    );
  });

  it("preserves fractional counts string (e.g. '5/1000')", () => {
    const payload = {
      result: [
        {
          genome_id: "g1",
          distance: 0.1,
          pvalue: 0.01,
          counts: "5/1000",
        },
      ],
    };
    const rows = parseMinhashResultPayload(payload);
    expect(rows[0].counts).toBe("5/1000");
  });

  it("parses array items positionally ([id, distance, pvalue, counts])", () => {
    const payload = {
      data: [["genome_x", 0.15, 0.005, 300]],
    };
    const rows = parseMinhashResultPayload(payload);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toEqual(
      expect.objectContaining({
        genome_id: "genome_x",
        distance: 0.15,
        pvalue: 0.005,
        counts: 300,
      }),
    );
  });

  it("handles result.data array", () => {
    const payload = {
      result: {
        data: [
          { genome_id: "d1", distance: 0.1, pvalue: 0.01 },
        ],
      },
    };
    const rows = parseMinhashResultPayload(payload);
    expect(rows).toHaveLength(1);
    expect(rows[0].genome_id).toBe("d1");
  });

  it("handles result.hits array", () => {
    const payload = {
      result: {
        hits: [
          { genome_id: "h1", distance: 0.2, pvalue: 0.02 },
        ],
      },
    };
    const rows = parseMinhashResultPayload(payload);
    expect(rows).toHaveLength(1);
    expect(rows[0].genome_id).toBe("h1");
  });

  it("handles result.results array", () => {
    const payload = {
      result: {
        results: [
          { genome_id: "r1", distance: 0.3, pvalue: 0.03 },
        ],
      },
    };
    const rows = parseMinhashResultPayload(payload);
    expect(rows).toHaveLength(1);
    expect(rows[0].genome_id).toBe("r1");
  });

  it("handles top-level data array", () => {
    const payload = {
      data: [{ genome_id: "td1", distance: 0.1, pvalue: 0.01 }],
    };
    const rows = parseMinhashResultPayload(payload);
    expect(rows).toHaveLength(1);
    expect(rows[0].genome_id).toBe("td1");
  });

  it("handles top-level hits array", () => {
    const payload = {
      hits: [{ genome_id: "th1", distance: 0.2, pvalue: 0.02 }],
    };
    const rows = parseMinhashResultPayload(payload);
    expect(rows).toHaveLength(1);
    expect(rows[0].genome_id).toBe("th1");
  });

  it("handles top-level results array", () => {
    const payload = {
      results: [{ genome_id: "tr1", distance: 0.3, pvalue: 0.03 }],
    };
    const rows = parseMinhashResultPayload(payload);
    expect(rows).toHaveLength(1);
    expect(rows[0].genome_id).toBe("tr1");
  });

  it("returns [] for empty result array", () => {
    expect(parseMinhashResultPayload({ result: [] })).toEqual([]);
  });

  it("returns [] for empty object", () => {
    expect(parseMinhashResultPayload({})).toEqual([]);
  });

  it("defaults non-finite numbers to 0", () => {
    const payload = {
      result: [
        {
          genome_id: "g1",
          distance: "not-a-number",
          pvalue: NaN,
          counts: Infinity,
        },
      ],
    };
    const rows = parseMinhashResultPayload(payload);
    expect(rows[0].distance).toBe(0);
    expect(rows[0].pvalue).toBe(0);
    expect(rows[0].counts).toBeUndefined();
  });

  it("handles top-level columnar format with genome_id array", () => {
    const payload = {
      genome_id: ["c1", "c2"],
      distance: [0.11, 0.22],
      pvalue: [0.001, 0.002],
    };
    const rows = parseMinhashResultPayload(payload);
    expect(rows).toHaveLength(2);
    expect(rows[0].genome_id).toBe("c1");
    expect(rows[1].genome_id).toBe("c2");
  });
});

describe("mergeGenomeResults", () => {
  const baseMinhashRows: SimilarGenomeFinderResultRow[] = [
    {
      genome_id: "123.4",
      genome_name: "",
      organism_name: "",
      distance: 0.01,
      pvalue: 0.001,
      counts: 500,
    },
    {
      genome_id: "456.7",
      genome_name: "Original Name",
      organism_name: "Original Org",
      distance: 0.05,
      pvalue: 0.01,
      counts: 200,
    },
  ];

  it("enriches minhash rows with genome API data", () => {
    const genomeApiResults = [
      {
        genome_id: "123.4",
        genome_name: "Enriched Name",
        species: "Enriched Species",
        genome_status: "Complete",
        genome_quality: "Good",
      },
    ];
    const merged = mergeGenomeResults(baseMinhashRows, genomeApiResults);
    expect(merged[0]).toEqual(
      expect.objectContaining({
        genome_id: "123.4",
        genome_name: "Enriched Name",
        organism_name: "Enriched Species",
        genome_status: "Complete",
        genome_quality: "Good",
        distance: 0.01,
        pvalue: 0.001,
      }),
    );
  });

  it("keeps original values when genome API has no match", () => {
    const merged = mergeGenomeResults(baseMinhashRows, []);
    expect(merged[1]).toEqual(
      expect.objectContaining({
        genome_id: "456.7",
        genome_name: "Original Name",
        organism_name: "Original Org",
        genome_status: undefined,
        genome_quality: undefined,
      }),
    );
  });

  it("uses species field for organism_name (fallback chain)", () => {
    const genomeApiResults = [
      {
        genome_id: "123.4",
        species: "Species Val",
        genome_name: "Some Name",
      },
    ];
    const merged = mergeGenomeResults(baseMinhashRows, genomeApiResults);
    expect(merged[0].organism_name).toBe("Species Val");
  });

  it("falls back to organism_name when species is empty", () => {
    const genomeApiResults = [
      {
        genome_id: "123.4",
        species: "",
        organism_name: "Org Name Fallback",
        genome_name: "GN",
      },
    ];
    const merged = mergeGenomeResults(baseMinhashRows, genomeApiResults);
    expect(merged[0].organism_name).toBe("Org Name Fallback");
  });

  it("adds genome_status and genome_quality when present", () => {
    const genomeApiResults = [
      {
        genome_id: "456.7",
        genome_name: "G",
        genome_status: "WGS",
        genome_quality: "High",
      },
    ];
    const merged = mergeGenomeResults(baseMinhashRows, genomeApiResults);
    expect(merged[1].genome_status).toBe("WGS");
    expect(merged[1].genome_quality).toBe("High");
  });

  it("does not match rows with empty genome_id", () => {
    const minhashRows: SimilarGenomeFinderResultRow[] = [
      {
        genome_id: "",
        genome_name: "NoId",
        organism_name: "NoIdOrg",
        distance: 0,
        pvalue: 0,
      },
    ];
    const genomeApiResults = [
      { genome_id: "", genome_name: "Should Not Match" },
    ];
    const merged = mergeGenomeResults(minhashRows, genomeApiResults);
    expect(merged[0].genome_name).toBe("NoId");
    expect(merged[0].genome_status).toBeUndefined();
  });

  it("trims genome_id for matching", () => {
    const minhashRows: SimilarGenomeFinderResultRow[] = [
      {
        genome_id: "  789.1  ",
        genome_name: "",
        organism_name: "",
        distance: 0.1,
        pvalue: 0.01,
      },
    ];
    const genomeApiResults = [
      {
        genome_id: "789.1",
        genome_name: "Trimmed Match",
        species: "Trimmed Org",
      },
    ];
    const merged = mergeGenomeResults(minhashRows, genomeApiResults);
    expect(merged[0].genome_name).toBe("Trimmed Match");
    expect(merged[0].organism_name).toBe("Trimmed Org");
  });
});
