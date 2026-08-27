"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Legacy BV-BRC put the active tab in the URL hash (#view_tab=x), which the server
 * cannot read. After a legacy /view/* link is server-redirected (proxy.ts), this client
 * component promotes supported hash parameters into the canonical query string via
 * router.replace so Next.js re-renders without requiring a manual reload.
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
    const keyword = hashParams.get("keyword");
    const defaultSort = hashParams.get("defaultSort");
    if (
      tab === null &&
      filter === null &&
      accession === null &&
      path === null &&
      keyword === null &&
      defaultSort === null
    )
      return;

    const url = new URL(window.location.href);
    if (tab !== null) url.searchParams.set("tab", tab);
    if (filter !== null && filter !== "false")
      url.searchParams.set("filter", filter);
    if (accession !== null) url.searchParams.set("accession", accession);
    if (path !== null) url.searchParams.set("path", path);
    if (keyword && !url.searchParams.has("keyword")) {
      url.searchParams.set("keyword", keyword);
    }
    if (
      defaultSort === "-score" &&
      url.searchParams.get("keyword") &&
      !url.searchParams.has("sort")
    ) {
      url.searchParams.set("sort", "score:desc");
    }
    url.hash = "";
    router.replace(url.pathname + url.search);
  }, [router]);

  return null;
}
