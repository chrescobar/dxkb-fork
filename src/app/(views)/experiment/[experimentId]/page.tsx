import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DataApiError } from "@/lib/data-api/repository";
import { isExperimentId, parseExperimentTab } from "@/lib/experiment-view";
import { getExperiment } from "@/lib/experiment-view/server";
import { experimentHref } from "@/lib/views/hrefs";
import { ExperimentMember } from "./experiment-member";

type Query = Record<string, string | string[] | undefined>;

async function loadExperiment(rawExperimentId: string) {
  let experimentId: string;
  try {
    experimentId = decodeURIComponent(rawExperimentId);
  } catch {
    notFound();
  }
  if (!isExperimentId(experimentId)) notFound();
  try {
    const experiment = await getExperiment(experimentId);
    if (!experiment) notFound();
    return experiment;
  } catch (error) {
    if (error instanceof DataApiError && [401, 403, 404].includes(error.status)) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: { params: Promise<{ experimentId: string }> }): Promise<Metadata> {
  const { experimentId } = await params;
  const experiment = await loadExperiment(experimentId);
  return {
    title: `${experiment.exp_title ?? experiment.exp_name ?? experiment.exp_id} | Experiment`,
    description: experiment.exp_description ?? `Experiment record ${experiment.exp_id}`,
  };
}

export default async function ExperimentPage({ params, searchParams }: { params: Promise<{ experimentId: string }>; searchParams: Promise<Query> }) {
  const [{ experimentId }, query] = await Promise.all([params, searchParams]);
  const experiment = await loadExperiment(experimentId);
  const activeTab = parseExperimentTab(query.tab);
  const requestedTab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  const canonicalTab = activeTab === "overview" ? undefined : activeTab;
  if (requestedTab !== canonicalTab || Array.isArray(query.tab)) {
    const next = new URLSearchParams();
    for (const [name, value] of Object.entries(query)) {
      if (name === "tab" || value === undefined) continue;
      for (const item of Array.isArray(value) ? value : [value]) next.append(name, item);
    }
    if (canonicalTab) next.set("tab", canonicalTab);
    redirect(`${experimentHref(experiment.exp_id)}${next.size ? `?${next}` : ""}`);
  }
  return <ExperimentMember experiment={experiment} activeTab={activeTab} />;
}
