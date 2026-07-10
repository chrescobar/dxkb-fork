import { isSameResourceQuery } from "../list-data";

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
