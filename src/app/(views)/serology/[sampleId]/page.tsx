import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { DataApiError } from "@/lib/data-api/repository";
import { isSerologySampleId } from "@/lib/serology-view";
import { getSerology, type SerologyLookup } from "@/lib/serology-view/server";
import { serologyHref } from "@/lib/views/hrefs";
import { SerologyAmbiguity } from "./serology-ambiguity";
import { SerologyMember } from "./serology-member";

type Query = Record<string, string | string[] | undefined>;

interface SerologyPageProps {
  params: Promise<{ sampleId: string }>;
  searchParams: Promise<Query>;
}

async function loadSerology(
  rawSampleId: string,
  testType?: string,
): Promise<{
  sampleId: string;
  result: Exclude<SerologyLookup, { status: "not-found" }>;
}> {
  let sampleId: string;

  try {
    sampleId = decodeURIComponent(rawSampleId);
  } catch {
    notFound();
  }
  if (!isSerologySampleId(sampleId)) notFound();

  try {
    const result = await getSerology(sampleId, testType);
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
}: SerologyPageProps): Promise<Metadata> {
  const [{ sampleId }, query] = await Promise.all([params, searchParams]);
  const { sampleId: decodedSampleId, result } = await loadSerology(
    sampleId,
    scalar(query.test_type),
  );
  return {
    title: `${decodedSampleId} | Serology`,
    description:
      result.status === "ambiguous"
        ? `Select a test record for serology sample ${decodedSampleId}.`
        : `Serology sample ${result.record.sample_identifier}`,
  };
}

export default async function SerologyPage({
  params,
  searchParams,
}: SerologyPageProps) {
  const [{ sampleId }, query] = await Promise.all([params, searchParams]);
  const testType = scalar(query.test_type);
  const { sampleId: decodedSampleId, result } = await loadSerology(
    sampleId,
    testType,
  );
  const requestedTab = Array.isArray(query.tab) ? query.tab[0] : query.tab;
  if (
    requestedTab !== undefined ||
    Array.isArray(query.test_type) ||
    query.test_type === ""
  ) {
    const next = new URLSearchParams();
    for (const [name, value] of Object.entries(query)) {
      if (name === "tab" || name === "test_type" || value === undefined)
        continue;
      for (const item of Array.isArray(value) ? value : [value])
        next.append(name, item);
    }
    if (testType) next.set("test_type", testType);
    redirect(`${serologyHref(decodedSampleId)}${next.size ? `?${next}` : ""}`);
  }

  if (result.status === "ambiguous") {
    return (
      <SerologyAmbiguity
        sampleId={decodedSampleId}
        testTypes={result.testTypes}
      />
    );
  }
  return <SerologyMember serology={result.record} />;
}
