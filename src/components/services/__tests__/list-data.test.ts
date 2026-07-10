import { isSameResourceQuery, deriveTableFields } from "../list-data";

// Guards the placeholderData gate: previous page rows may only carry over when the
// query is still for the same resource. A resource switch (genome → strain) must
// drop the placeholder, else genome rows render under a strain-keyed table and
// collide on React keys (duplicate/undefined `strain` values).
describe("isSameResourceQuery", () => {
  it("returns true when the previous query key's resource matches", () => {
    expect(isSameResourceQuery(["genome-full", "genome", "q"], "genome")).toBe(true);
  });

  it("returns false when the resource differs (tab switch)", () => {
    expect(isSameResourceQuery(["genome-full", "genome", "q"], "strain")).toBe(false);
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
    expect(fields.every((f) => typeof f.id === "string" && typeof f.label === "string")).toBe(true);
  });

  it("maps hidden:true to visible:false and hidden:false to visible:true", () => {
    const fields = deriveTableFields("genome");
    expect(fields.find((f) => f.id === "genome_name")?.visible).toBe(true);
    expect(fields.find((f) => f.id === "taxon_lineage_ids")?.visible).toBe(false);
  });

  it("excludes fields marked show_in_table:false", () => {
    // strain has show_in_table:false entries (e.g. taxon_lineage_ids)
    const fields = deriveTableFields("strain");
    expect(fields.find((f) => f.id === "taxon_lineage_ids")).toBeUndefined();
  });

  it("returns [] for an unknown resource", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(deriveTableFields("not_a_resource")).toEqual([]);
    spy.mockRestore();
  });
});
