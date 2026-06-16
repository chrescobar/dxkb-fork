// src/app/(views)/serology/[sampleId]/page.tsx
import { renderSingularShell } from "@/lib/views/render-singular";
import { viewRegistry } from "@/lib/views/view-registry";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ sampleId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SerologyPage({ params, searchParams }: PageProps) {
  const { sampleId } = await params;
  return renderSingularShell(viewRegistry.serology, sampleId, await searchParams);
}
