import { colors, edgeAlpha, renderEdge, renderEdgeExperimental } from "../graph-theme";

// Premultiplied edge colors must converge back to the opaque theme swatch the
// legend renders: as translucent edges stack in dense regions they approach
// premultRGB / alpha. Guarding this keeps legend and canvas a single source of
// truth (regression: hardcoded #0A0D0D / #080D1C drifted from the theme).
//
// Convergence is not bit-exact: at ~16% alpha each ±1 premultiply rounding step
// maps back to ~±6 here, so compare per channel within tolerance. The historical
// bug (R premult 0x0A vs correct 0x0D) lands ~19 off — well outside tolerance.
const tolerance = Math.ceil(255 / edgeAlpha); // one premult step, in converged space

function channels(hex: string): number[] {
  return [0, 1, 2].map((i) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16));
}

function convergedChannels(hex8: string, alpha: number): number[] {
  const a = alpha / 255;
  return [0, 1, 2].map((i) => Math.round(parseInt(hex8.slice(1 + i * 2, 3 + i * 2), 16) / a));
}

describe("graph-theme render edges", () => {
  it("carry the shared edge alpha", () => {
    expect(renderEdge.slice(7)).toBe(edgeAlpha.toString(16).padStart(2, "0"));
    expect(renderEdgeExperimental.slice(7)).toBe(edgeAlpha.toString(16).padStart(2, "0"));
  });

  it("converge to the opaque legend swatches within rounding tolerance", () => {
    const cases: [string, string][] = [
      [renderEdge, colors.edge],
      [renderEdgeExperimental, colors.edgeExperimental],
    ];
    for (const [rendered, swatch] of cases) {
      const got = convergedChannels(rendered, edgeAlpha);
      const want = channels(swatch);
      got.forEach((v, i) => {
        expect(Math.abs(v - want[i])).toBeLessThanOrEqual(tolerance);
      });
    }
  });
});
