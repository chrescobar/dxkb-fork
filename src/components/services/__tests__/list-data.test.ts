import {
  isSameResourceQuery,
  deriveTableFields,
  findPageRow,
  downloadResourceRows,
} from "../list-data-utils";

afterEach(() => {
  vi.restoreAllMocks();
});

// Guards the placeholderData gate: previous page rows may only carry over when the
// query is still for the same resource. A resource switch (genome → strain) must
// drop the placeholder, else genome rows render under a strain-keyed table and
// collide on React keys (duplicate/undefined `strain` values).
describe("isSameResourceQuery", () => {
  it("returns true when the previous query key's resource matches", () => {
    expect(isSameResourceQuery(["genome-full", "genome", "q"], "genome")).toBe(
      true,
    );
  });

  it("returns false when the resource differs (tab switch)", () => {
    expect(isSameResourceQuery(["genome-full", "genome", "q"], "strain")).toBe(
      false,
    );
  });

  it("returns false when there is no previous query key (first load)", () => {
    expect(isSameResourceQuery(undefined, "genome")).toBe(false);
  });
});

// Fields are derived synchronously from a static registry (not a dynamic import),
// so DataTable can mount with real columns on the first render — no pre-metadata
// skeleton phase, no width regime change from placeholder → real columns.
describe("deriveTableFields", () => {
  it("returns synchronous fields for a known resource", () => {
    const fields = deriveTableFields("genome");
    expect(fields.length).toBeGreaterThan(0);
    expect(
      fields.every(
        (f) => typeof f.id === "string" && typeof f.label === "string",
      ),
    ).toBe(true);
  });

  it("maps hidden:true to visible:false and hidden:false to visible:true", () => {
    const fields = deriveTableFields("genome");
    expect(fields.find((f) => f.id === "genome_name")?.visible).toBe(true);
    expect(fields.find((f) => f.id === "taxon_lineage_ids")?.visible).toBe(
      false,
    );
  });

  it("excludes fields marked show_in_table:false", () => {
    // strain has show_in_table:false entries (e.g. taxon_lineage_ids)
    const fields = deriveTableFields("strain");
    expect(fields.find((f) => f.id === "taxon_lineage_ids")).toBeUndefined();
  });

  it("returns a stable empty array for unknown resources", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    const first = deriveTableFields("not_a_resource");
    expect(first).toEqual([]);
    expect(deriveTableFields("another_unknown_resource")).toBe(first);
  });
});

// Regression: row click used to fire a fresh detail-panel fetch on every selection
// because the TanStack Query cache had no entry for the new row. The fix pre-populates
// the cache from pageData in handleRowSelectionChange. findPageRow is the lookup that
// decides whether pre-population fires — if it's broken (returns undefined), the
// setQueryData call is skipped and the loading flash returns.
// Regression: genome_sequence API returns the raw `sequence` DNA field by default,
// inflating each page response from ~80KB to ~18MB. The fix restricts fetches to the
// fields defined in genomeSequenceFields. Confirm `sequence` stays out of that map.
describe("genome_sequence field registry", () => {
  it("does not include the raw 'sequence' DNA field — its absence prevents 18MB responses", () => {
    const fields = deriveTableFields("genome_sequence");
    expect(fields.map((f) => f.id)).not.toContain("sequence");
  });

  it("includes the key table fields for genome_sequence", () => {
    const fields = deriveTableFields("genome_sequence");
    const ids = fields.map((f) => f.id);
    expect(ids).toContain("sequence_id");
    expect(ids).toContain("genome_id");
    expect(ids).toContain("accession");
    expect(ids).toContain("gc_content");
    expect(ids).toContain("length");
  });
});

describe("downloadResourceRows", () => {
  it("requests only exported columns and omits the selection column", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([{ genome_id: "1", genome_name: "Example" }]),
        {
          status: 200,
        },
      ),
    );
    vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:download");
    vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined);
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(
      () => undefined,
    );

    await downloadResourceRows({
      dataApi: "https://data.example",
      resource: "genome",
      query: "eq(public,true)",
      totalItems: 1,
      format: "csv",
      visibleColumns: ["__select__", "genome_id", "genome_name"],
      fields: [
        { id: "genome_id", label: "Genome ID", visible: true },
        { id: "genome_name", label: "Genome Name", visible: true },
      ],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://data.example/genome/?eq(public,true)&select(genome_id,genome_name)",
      expect.any(Object),
    );
  });
});

describe("findPageRow", () => {
  const rows = [
    { sequence_id: "abc.1", length: 100 },
    { sequence_id: "def.2", length: 200 },
    { sequence_id: "42", length: 300 },
  ];

  it("returns the matching row when the id is present", () => {
    expect(findPageRow(rows, "sequence_id", "def.2")).toEqual({
      sequence_id: "def.2",
      length: 200,
    });
  });

  it("returns undefined when the id is not in pageData", () => {
    expect(findPageRow(rows, "sequence_id", "not-there")).toBeUndefined();
  });

  it("coerces non-string id field values to string for comparison", () => {
    // API rows may carry numeric ids (e.g. taxon_id: 234). String(234) === "234".
    const numericRows = [{ taxon_id: 234, name: "Brucella" }];
    expect(findPageRow(numericRows, "taxon_id", "234")).toEqual({
      taxon_id: 234,
      name: "Brucella",
    });
  });

  it("returns undefined for an empty pageData array", () => {
    expect(findPageRow([], "sequence_id", "abc.1")).toBeUndefined();
  });
});
