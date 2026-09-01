import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DataApiError } from "@/lib/data-api/repository";
import { isSurveillanceSampleId } from "@/lib/surveillance-view";
import {
  getSurveillance,
  type SurveillanceLookup,
} from "@/lib/surveillance-view/server";
import { surveillanceHref } from "@/lib/views/hrefs";
import { SurveillanceAmbiguity } from "./surveillance-ambiguity";
import { SurveillanceMember } from "./surveillance-member";

type Query = Record<string, string | string[] | undefined>;

interface SurveillancePageProps {
  params: Promise<{ sampleId: string }>;
  searchParams: Promise<Query>;
}

async function loadSurveillance(
  rawSampleId: string,
  pathogenTestType?: string,
): Promise<{
  sampleId: string;
  result: Exclude<SurveillanceLookup, { status: "not-found" }>;
}> {
  let sampleId: string;

  try {
    sampleId = decodeURIComponent(rawSampleId);
  } catch {
    notFound();
  }
  if (!isSurveillanceSampleId(sampleId)) notFound();

  try {
    const result = await getSurveillance(sampleId, pathogenTestType);
    if (result.status === "not-found") notFound();
    return { sampleId, result };
  } catch (error) {
    if (error instanceof DataApiError && [401, 403, 404].includes(error.status))
      notFound();
    throw error;
  }
}

function scalar(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function generateMetadata({
  params,
  searchParams,
}: SurveillancePageProps): Promise<Metadata> {
  const [{ sampleId }, query] = await Promise.all([params, searchParams]);
  const { sampleId: decodedSampleId, result } = await loadSurveillance(
    sampleId,
    scalar(query.pathogen_test_type),
  );
  return {
    title: `${decodedSampleId} | Surveillance`,
    description:
      result.status === "ambiguous"
        ? `Select a pathogen test record for surveillance sample ${decodedSampleId}.`
        : `Surveillance sample ${result.record.sample_identifier}`,
  };
}

export default async function SurveillancePage({
  params,
  searchParams,
}: SurveillancePageProps) {
  const [{ sampleId }, query] = await Promise.all([params, searchParams]);
  const pathogenTestType = scalar(query.pathogen_test_type);
  const { sampleId: decodedSampleId, result } = await loadSurveillance(
    sampleId,
    pathogenTestType,
  );
  const requestedTab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  if (
    requestedTab !== undefined ||
    Array.isArray(query.pathogen_test_type) ||
    query.pathogen_test_type === ""
  ) {
    const next = new URLSearchParams();
    for (const [name, value] of Object.entries(query)) {
      if (
        name === "tab" ||
        name === "pathogen_test_type" ||
        value === undefined
      ) continue;
      for (const item of Array.isArray(value) ? value : [value]) next.append(name, item);
    }
    if (pathogenTestType) next.set("pathogen_test_type", pathogenTestType);
    redirect(`${surveillanceHref(decodedSampleId)}${next.size ? `?${next}` : ""}`);
  }

  if (result.status === "ambiguous") {
    return (
      <SurveillanceAmbiguity
        sampleId={decodedSampleId}
        testTypes={result.testTypes}
      />
    );
  }
  return <SurveillanceMember surveillance={result.record} />;
}
