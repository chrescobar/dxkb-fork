import type { ViewRegistry } from "../view-types";
import { viewRegistry, viewSegments, legacyToSegment } from "../view-registry";

// Cast to the loose ViewRegistry type so TypeScript treats every entry as
// ViewTypeEntry (with optional singular/legacySingular) rather than the
// narrow literal shapes inferred from `satisfies ViewRegistry`.
const reg = viewRegistry as ViewRegistry;

describe("viewRegistry", () => {
  it("has exactly 10 segments", () => {
    expect(viewSegments).toHaveLength(10);
  });

  it("keys each entry by its own segment", () => {
    for (const [key, entry] of Object.entries(reg)) {
      expect(entry.segment).toBe(key);
    }
  });

  it("marks strain and domains-and-motifs as list-only (no singular)", () => {
    expect(reg.strain.singular).toBeUndefined();
    expect(reg["domains-and-motifs"].singular).toBeUndefined();
  });

  it("gives experiment an int singular with ExperimentComparison legacy name", () => {
    expect(reg.experiment.singular?.idKind).toBe("int");
    expect(reg.experiment.legacySingular).toBe("ExperimentComparison");
  });

  it("gives protein-structure an id-less singular", () => {
    expect(reg["protein-structure"].singular?.idKind).toBe("none");
  });

  it("uses int id kind for taxonomy", () => {
    expect(reg.taxonomy.singular?.idKind).toBe("int");
  });

  it("maps every legacy name to a unique existing segment", () => {
    const names = Object.values(reg).flatMap(
      (e) =>
        [
          e.legacySingular,
          ...(e.legacySingularAliases ?? []),
          e.legacyList,
          ...(e.legacyListAliases ?? []),
        ].filter(Boolean) as string[],
    );
    expect(names.length).toBeGreaterThanOrEqual(10);
    expect(new Set(names).size).toBe(names.length); // unique
    for (const name of names) {
      expect(legacyToSegment[name]).toBeDefined();
      expect(reg[legacyToSegment[name]]).toBeDefined();
    }
  });

  it("reverse-maps a known legacy name", () => {
    expect(legacyToSegment.GenomeList).toBe("genome");
    expect(legacyToSegment.Taxonomy).toBe("taxonomy");
    expect(legacyToSegment.Protein).toBe("feature");
    expect(legacyToSegment.ProteinList).toBe("feature");
    expect(legacyToSegment.DomainsAndMotifsList).toBe("domains-and-motifs");
    expect(legacyToSegment.ProteinFeaturesList).toBe("domains-and-motifs");
  });
});
