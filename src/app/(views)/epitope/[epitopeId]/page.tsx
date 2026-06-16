// src/app/(views)/epitope/[epitopeId]/page.tsx
import { renderSingularShell } from "@/lib/views/render-singular";
import { viewRegistry } from "@/lib/views/view-registry";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ epitopeId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function EpitopePage({ params, searchParams }: PageProps) {
  const { epitopeId } = await params;
  return renderSingularShell(viewRegistry.epitope, epitopeId, await searchParams);
}
