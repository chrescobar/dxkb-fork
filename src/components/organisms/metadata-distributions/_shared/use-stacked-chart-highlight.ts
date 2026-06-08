import { useState } from "react";

interface Highlight {
  idx: number;
  locked: boolean;
}

export interface StackedChartHighlight {
  activeIdx: number | null;
  isLocked: boolean;
  pressedFor: (idx: number) => boolean;
  activatePill: (idx: number) => void;
  deactivatePill: () => void;
  togglePillLock: (idx: number) => void;
  clearHighlight: () => void;
}

/**
 * State machine for stacked-bar chart legend interactions. A pill can be:
 *   - inactive (no highlight)
 *   - hovered (activated by mouseenter, cleared by mouseleave)
 *   - locked (clicked — survives mouse movement, click again to release).
 *
 * Hover-activate / hover-deactivate are gated on the locked flag so a locked
 * pill keeps its dim/highlight state until explicitly cleared. `togglePillLock`
 * ignores the gate so users can swap the locked pill directly.
 */
export function useStackedChartHighlight(): StackedChartHighlight {
  const [highlight, setHighlight] = useState<Highlight | null>(null);

  return {
    activeIdx: highlight?.idx ?? null,
    isLocked: highlight?.locked === true,
    pressedFor: (idx) => highlight?.locked === true && highlight.idx === idx,
    activatePill: (idx) => {
      if (highlight?.locked) return;
      setHighlight({ idx, locked: false });
    },
    deactivatePill: () => {
      if (highlight?.locked) return;
      setHighlight(null);
    },
    togglePillLock: (idx) => {
      setHighlight((prev) =>
        prev?.locked && prev.idx === idx ? null : { idx, locked: true },
      );
    },
    clearHighlight: () => setHighlight(null),
  };
}
