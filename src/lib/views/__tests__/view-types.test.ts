import { isViewSegment, type ViewRegistry } from "../view-types";

// Inline fixture so this task has no dependency on view-registry.ts (created in Task 2).
const fixture = {
  genome: {
    segment: "genome",
    label: "Genome",
    list: { endpoint: "genome", defaultTab: "genomes", friendlyParams: ["keyword"] },
  },
} satisfies ViewRegistry;

describe("isViewSegment", () => {
  it("returns true for a real segment", () => {
    expect(isViewSegment("genome", fixture)).toBe(true);
  });
  it("returns false for an unknown segment", () => {
    expect(isViewSegment("not-a-view", fixture)).toBe(false);
  });
});
