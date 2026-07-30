export const colors = {
  microbial: "#90CAF9",
  host: "#A5D6A7",
  selected: "#FFAB00",
  edge: "#555555",
  edgeExperimental: "#3F51B5",
  // Bright opaque magenta so a selected edge pops off the ~4,400 translucent
  // blue/grey threads. Paired with zIndex:1 + a larger size in the reducer so it
  // draws on top and reads as a single bold line, not another mesh strand.
  edgeSelected: "#FF1493",
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

// Hover highlight: translucent pink so a hovered edge reads as pink-tinted yet
// stays distinct from the opaque selected edge. Premultiplied for the same
// reason as the mesh edges (see premultiply) — a straight-alpha pink washes out
// under Sigma's premultiplied blend. 0x99 = 153/255 ≈ 60%.
export const renderEdgeHover = premultiply(colors.edgeSelected, 0x99);

type SelectedKind = "node" | "edge" | null;

// Sigma reducers that recolor the selected node/edge and raise its zIndex so it
// paints above the mesh (relies on the `zIndex: true` container setting). Pure
// factories so the highlight logic is unit-testable without a WebGL context.
// `highlighted: true` makes Sigma draw the selected node's hover-label pill
// persistently — the same pill a mouse-hover shows — so a click keeps the label
// on screen instead of clearing it when the pointer leaves.
export function nodeHighlightReducer<T extends object>(selectedId: string | null, selectedKind: SelectedKind) {
  return (node: string, data: T): T =>
    selectedKind === "node" && node === selectedId
      ? { ...data, color: colors.selected, zIndex: 1, highlighted: true }
      : data;
}

export function edgeHighlightReducer<T extends object>(
  selectedId: string | null,
  selectedKind: SelectedKind,
  hoveredId: string | null = null,
) {
  return (edge: string, data: T): T => {
    if (selectedKind === "edge" && edge === selectedId) {
      return { ...data, color: colors.edgeSelected, size: 2, zIndex: 1 };
    }
    // Hover loses to selection: don't re-tint the already-highlighted edge.
    if (hoveredId && edge === hoveredId) {
      return { ...data, color: renderEdgeHover, size: 2, zIndex: 1 };
    }
    return data;
  };
}
