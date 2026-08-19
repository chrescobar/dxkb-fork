"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Legacy BV-BRC put the active tab in the URL hash (#view_tab=x), which the server
 * cannot read. After a legacy /view/* link is server-redirected (proxy.ts), this client
 * component promotes any leftover #view_tab= (and #filter=, #accession=, #path=) into
 * the new ?tab= query param via router.replace so that Next.js re-renders with the
 * correct searchParams and the right tab is active without a manual reload.
 */
export function LegacyHashAdapter() {
  const router = useRouter();

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return;
    const hashParams = new URLSearchParams(hash);
    const tab = hashParams.get("view_tab");
    const filter = hashParams.get("filter");
    const accession = hashParams.get("accession");
    const path = hashParams.get("path");
    if (tab === null && filter === null && accession === null && path === null) return;

    const url = new URL(window.location.href);
    if (tab !== null) url.searchParams.set("tab", tab);
    if (filter !== null && filter !== "false") url.searchParams.set("filter", filter);
    if (accession !== null) url.searchParams.set("accession", accession);
    if (path !== null) url.searchParams.set("path", path);
    url.hash = "";
    router.replace(url.pathname + url.search);
  }, [router]);

  return null;
}
