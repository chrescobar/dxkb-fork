import type { Metadata } from "next";
import { notFound, permanentRedirect, redirect } from "next/navigation";
import { DataApiError } from "@/lib/data-api/repository";
import { canonicalFeatureTab, isFeatureId } from "@/lib/feature-view";
import { getFeature, type FeatureLookup } from "@/lib/feature-view/server";
import { featureHref } from "@/lib/views/hrefs";
import { FeatureMember } from "./feature-member";

interface FeaturePageProps {
  params: Promise<{ featureId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

async function loadFeature(rawFeatureId: string) {
  let featureId: string;
  try {
    featureId = decodeURIComponent(rawFeatureId);
  } catch {
    notFound();
  }
  if (!isFeatureId(featureId)) notFound();
  let result: FeatureLookup;
  try {
    result = await getFeature(featureId);
  } catch (error) {
    if (
      error instanceof DataApiError &&
      [401, 403, 404, 409].includes(error.status)
    )
      notFound();
    throw error;
  }
  if (!result.feature) notFound();
  if (result.usedAlternateId && result.feature.feature_id !== featureId) {
    permanentRedirect(featureHref(result.feature.feature_id));
  }
  return result.feature;
}

export async function generateMetadata({
  params,
}: FeaturePageProps): Promise<Metadata> {
  const { featureId } = await params;
  const feature = await loadFeature(featureId);
  return {
    title: `${feature.patric_id ?? feature.feature_id} | Feature`,
    description: feature.product ?? `Feature record ${feature.feature_id}`,
  };
}

export default async function FeaturePage({
  params,
  searchParams,
}: FeaturePageProps) {
  const [{ featureId }, query] = await Promise.all([params, searchParams]);
  const feature = await loadFeature(featureId);
  const activeTab = canonicalFeatureTab(query.tab, feature);
  const requestedTab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  const canonicalTab = activeTab === "overview" ? undefined : activeTab;
  if (requestedTab !== canonicalTab || Array.isArray(query.tab)) {
    const next = new URLSearchParams();
    for (const [name, value] of Object.entries(query)) {
      if (name === "tab" || value === undefined) continue;
      for (const item of Array.isArray(value) ? value : [value])
        next.append(name, item);
    }
    if (canonicalTab) next.set("tab", canonicalTab);
    redirect(
      `${featureHref(feature.feature_id)}${next.size ? `?${next}` : ""}`,
    );
  }
  return <FeatureMember feature={feature} activeTab={activeTab} />;
}
