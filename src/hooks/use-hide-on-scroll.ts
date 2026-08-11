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
  const lastWindowY = useRef(0);
  const lastElementY = useRef(new WeakMap<Element, number>());

  useEffect(() => {
    lastWindowY.current = window.scrollY;
    function onScroll(event: Event) {
      const element = event.target instanceof Element ? event.target : null;
      const y = element ? element.scrollTop : window.scrollY;
      const previousY = element ? (lastElementY.current.get(element) ?? 0) : lastWindowY.current;
      const goingDown = y > previousY;
      // Ignore tiny jitters; never hide within the first 60px of the scroll region.
      if (Math.abs(y - previousY) > 4) {
        setHidden(!forceShow && goingDown && y > 60);
        if (element) lastElementY.current.set(element, y);
        else lastWindowY.current = y;
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("scroll", onScroll, { capture: true, passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("scroll", onScroll, { capture: true });
    };
  }, [forceShow]);

  return forceShow ? false : hidden;
}
