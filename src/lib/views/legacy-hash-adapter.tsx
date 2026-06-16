// src/lib/views/legacy-hash-adapter.tsx
"use client";

import { useEffect } from "react";

/**
 * Legacy BV-BRC put the active tab in the URL hash (#view_tab=x), which the server
 * cannot read. After a legacy /view/* link is server-redirected (proxy.ts), this client
 * component rewrites any leftover #view_tab= (and #filter=) into the new ?tab= query
 * param via history.replaceState — no reload.
 */
export function LegacyHashAdapter() {
  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const hashParams = new URLSearchParams(hash);
    const tab = hashParams.get("view_tab");
    const filter = hashParams.get("filter");
    if (tab === null && filter === null) return;

    const url = new URL(window.location.href);
    if (tab !== null) url.searchParams.set("tab", tab);
    if (filter !== null && filter !== "false") url.searchParams.set("filter", filter);
    url.hash = "";
    window.history.replaceState(window.history.state, "", url.toString());
  }, []);

  return null;
}
