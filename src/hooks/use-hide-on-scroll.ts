"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Hide-on-scroll-down, reveal-on-scroll-up. Tracks window scroll direction.
 * Stays visible near the top of the page and whenever `forceShow` is set
 * (e.g. while an attached sheet/menu is open).
 *
 * SSR-safe: starts visible (`hidden = false`) and only reads `window` inside
 * the effect, so the server render and first client render agree.
 */
export function useHideOnScroll(forceShow = false): boolean {
  const [hidden, setHidden] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    function onScroll() {
      const y = window.scrollY;
      const goingDown = y > lastY.current;
      // Ignore tiny jitters; never hide within the first 60px of the page.
      if (Math.abs(y - lastY.current) > 4) {
        setHidden(goingDown && y > 60);
        lastY.current = y;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); };
  }, []);

  return forceShow ? false : hidden;
}
