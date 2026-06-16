// src/app/(views)/genome/[genomeId]/page.tsx
import { renderSingularShell } from "@/lib/views/render-singular";
import { viewRegistry } from "@/lib/views/view-registry";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ genomeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function GenomePage({ params, searchParams }: PageProps) {
  const { genomeId } = await params;
  return renderSingularShell(viewRegistry.genome, genomeId, await searchParams);
}
