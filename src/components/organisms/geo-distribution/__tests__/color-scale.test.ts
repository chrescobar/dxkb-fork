import {
  accentPalettes,
  isUsaTopoName,
  lookupCountryCount,
  makeColorScale,
  resolveCountryDataKey,
} from "@/components/organisms/geo-distribution/color-scale";

describe("makeColorScale", () => {
  it("returns the zero color for count=0 regardless of accent", () => {
    const scale = makeColorScale(100, "bacteria");
    expect(scale(0)).toBe(accentPalettes.bacteria.zero);
  });

  it("returns the zero color for negative or non-finite counts", () => {
    const scale = makeColorScale(100, "viruses");
    expect(scale(-5)).toBe(accentPalettes.viruses.zero);
    expect(scale(Number.NaN)).toBe(accentPalettes.viruses.zero);
  });

  it("returns the light end of the palette for count=1", () => {
    const scale = makeColorScale(999, "fungi");
    // log10(2)/log10(1000) ≈ 0.1, near the light end
    expect(scale(1)).not.toBe(accentPalettes.fungi.dark);
    expect(scale(1)).not.toBe(accentPalettes.fungi.zero);
  });

  it("returns the dark end of the palette for count=maxCount", () => {
    const scale = makeColorScale(500, "all");
    // d3-interpolateRgb returns "rgb(R, G, B)"; compare RGB triple to the dark hex
    expect(scale(500)).toBe("rgb(21, 128, 61)");
  });

  it("monotonically darkens as the count grows", () => {
    const scale = makeColorScale(1000, "bacteria");
    // Each call returns "rgb(r, g, b)"; parse and compare brightness
    const brightness = (rgb: string) => {
      const match = rgb.match(/\d+/g);
      if (!match) return 0;
      const [r, g, b] = match.map(Number);
      return r + g + b;
    };
    expect(brightness(scale(10))).toBeGreaterThan(brightness(scale(100)));
    expect(brightness(scale(100))).toBeGreaterThan(brightness(scale(1000)));
  });

  it("returns only the zero color when maxCount is zero", () => {
    const scale = makeColorScale(0, "bacteria");
    expect(scale(10)).toBe(accentPalettes.bacteria.zero);
    expect(scale(0)).toBe(accentPalettes.bacteria.zero);
  });
});

describe("lookupCountryCount", () => {
  const data = {
    USA: 260,
    Italy: 188,
    Czechia: 12,
    Eswatini: 3,
  };

  it("matches direct names", () => {
    expect(lookupCountryCount("Italy", data)).toBe(188);
  });

  it("matches via alias when TopoJSON name differs from API name", () => {
    expect(lookupCountryCount("United States of America", data)).toBe(260);
    expect(lookupCountryCount("Czech Republic", data)).toBe(12);
    expect(lookupCountryCount("eSwatini", data)).toBe(3);
  });

  it("falls back to normalized comparison for stray punctuation", () => {
    expect(lookupCountryCount("italy ", data)).toBe(188);
  });

  it("returns 0 when no match exists", () => {
    expect(lookupCountryCount("Atlantis", data)).toBe(0);
  });

  it("skips zero-valued direct matches in favor of aliases", () => {
    expect(lookupCountryCount("United States of America", { ...data, "United States of America": 0 })).toBe(260);
  });
});

describe("resolveCountryDataKey", () => {
  const data = { USA: 260, Italy: 188 };

  it("returns the direct key when present", () => {
    expect(resolveCountryDataKey("Italy", data)).toBe("Italy");
  });

  it("returns the alias key when the topo name differs", () => {
    expect(resolveCountryDataKey("United States of America", data)).toBe("USA");
  });

  it("returns null when no match exists", () => {
    expect(resolveCountryDataKey("Atlantis", data)).toBeNull();
  });
});

describe("isUsaTopoName", () => {
  it("matches all three USA aliases", () => {
    expect(isUsaTopoName("United States of America")).toBe(true);
    expect(isUsaTopoName("United States")).toBe(true);
    expect(isUsaTopoName("USA")).toBe(true);
  });

  it("rejects other countries", () => {
    expect(isUsaTopoName("Canada")).toBe(false);
    expect(isUsaTopoName("Mexico")).toBe(false);
  });
});
