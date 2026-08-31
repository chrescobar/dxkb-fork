import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DataApiError } from "@/lib/data-api/repository";
import { isEpitopeId, parseEpitopeTab } from "@/lib/epitope-view";
import { getEpitope } from "@/lib/epitope-view/server";
import { epitopeHref } from "@/lib/views/hrefs";
import { EpitopeMember } from "./epitope-member";

type Query = Record<string, string | string[] | undefined>;

async function loadEpitope(rawEpitopeId: string) {
  let epitopeId: string;
  try {
    epitopeId = decodeURIComponent(rawEpitopeId);
  } catch {
    notFound();
  }
  if (!isEpitopeId(epitopeId)) notFound();
  try {
    const epitope = await getEpitope(epitopeId);
    if (!epitope) notFound();
    return epitope;
  } catch (error) {
    if (error instanceof DataApiError && [401, 403, 404].includes(error.status)) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ epitopeId: string }> }): Promise<Metadata> {
  const { epitopeId } = await params;
  const epitope = await loadEpitope(epitopeId);
  return {
    title: `${epitope.epitope_sequence ?? epitope.epitope_id} | Epitope`,
    description: epitope.protein_name ?? `Epitope record ${epitope.epitope_id}`,
  };
}

export default async function EpitopePage({ params, searchParams }: { params: Promise<{ epitopeId: string }>; searchParams: Promise<Query> }) {
  const [{ epitopeId }, query] = await Promise.all([params, searchParams]);
  const epitope = await loadEpitope(epitopeId);
  const activeTab = parseEpitopeTab(query.tab);
  const requestedTab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  const canonicalTab = activeTab === "overview" ? undefined : activeTab;
  if (requestedTab !== canonicalTab || Array.isArray(query.tab)) {
    const next = new URLSearchParams();
    for (const [name, value] of Object.entries(query)) {
      if (name === "tab" || value === undefined) continue;
      for (const item of Array.isArray(value) ? value : [value]) next.append(name, item);
    }
    if (canonicalTab) next.set("tab", canonicalTab);
    redirect(`${epitopeHref(epitope.epitope_id)}${next.size ? `?${next}` : ""}`);
  }
  return <EpitopeMember epitope={epitope} activeTab={activeTab} />;
}
