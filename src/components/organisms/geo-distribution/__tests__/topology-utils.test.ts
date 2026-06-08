import {
  crossesAntimeridian,
  featureName,
} from "../topology-utils";

describe("featureName", () => {
  it("prefers .name when present", () => {
    expect(featureName({ name: "Idaho", NAME: "ID" })).toBe("Idaho");
  });

  it("falls back to .NAME when .name is absent", () => {
    expect(featureName({ NAME: "Idaho" })).toBe("Idaho");
  });

  it("returns empty string when neither field is present", () => {
    expect(featureName({})).toBe("");
  });

  it("returns empty string when feature props are undefined", () => {
    expect(featureName(undefined)).toBe("");
  });
});

describe("crossesAntimeridian", () => {
  function featureFromCoords(coords: number[][][]): GeoJSON.Feature {
    return {
      type: "Feature",
      properties: {},
      geometry: { type: "Polygon", coordinates: coords },
    };
  }

  it("returns false for a contiguous-US feature", () => {
    expect(
      crossesAntimeridian(
        featureFromCoords([[[-100, 40], [-90, 40], [-90, 45], [-100, 45], [-100, 40]]]),
      ),
    ).toBe(false);
  });

  it("returns true for a polygon that straddles 180/-180 (Aleutians-shaped)", () => {
    expect(
      crossesAntimeridian(
        featureFromCoords([[[170, 51], [179, 51], [-179, 52], [-170, 52], [170, 51]]]),
      ),
    ).toBe(true);
  });

  it("returns false for a polygon with only negative longitudes (mainland Alaska)", () => {
    expect(
      crossesAntimeridian(
        featureFromCoords([[[-165, 60], [-145, 60], [-145, 70], [-165, 70], [-165, 60]]]),
      ),
    ).toBe(false);
  });

  it("returns false when coordinates field is missing", () => {
    const feature: GeoJSON.Feature = {
      type: "Feature",
      properties: {},
      geometry: { type: "Point", coordinates: [] } as unknown as GeoJSON.Geometry,
    };
    expect(crossesAntimeridian(feature)).toBe(false);
  });
});
