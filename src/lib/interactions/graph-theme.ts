export const colors = {
  microbial: "#90CAF9",
  host: "#A5D6A7",
  selected: "#FFAB00",
  edge: "#555555",
  edgeExperimental: "#3F51B5",
  edgeSelected: "#BBBB55",
} as const;

// Alpha applied to graph edges so ~4,400 overlapping threads accumulate into a
// density gradient instead of a solid disk. 0x28 = 40/255 ≈ 16%.
export const edgeAlpha = 0x28;

// Sigma blends with premultiplied alpha (blendFunc ONE, ONE_MINUS_SRC_ALPHA)
// but its edge shader emits STRAIGHT alpha, so a plain #rrggbbaa washes out to
// white. We premultiply RGB by alpha ourselves. Because premultiplied edges
// converge to (premultRGB / alpha) = the original hue as they stack, deriving
// these from the theme `colors` keeps the dense-region color identical to the
// opaque swatches the legend renders (single source of truth).
function premultiply(hex: string, alpha: number): string {
  const a = alpha / 255;
  const channel = (i: number) =>
    Math.round(parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) * a)
      .toString(16)
      .padStart(2, "0");
  return `#${channel(0)}${channel(1)}${channel(2)}${alpha.toString(16).padStart(2, "0")}`;
}

export const renderEdge = premultiply(colors.edge, edgeAlpha);
export const renderEdgeExperimental = premultiply(colors.edgeExperimental, edgeAlpha);
