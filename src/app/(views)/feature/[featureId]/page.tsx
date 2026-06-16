// src/app/(views)/feature/[featureId]/page.tsx
import { renderSingularShell } from "@/lib/views/render-singular";
import { viewRegistry } from "@/lib/views/view-registry";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ featureId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function FeaturePage({ params, searchParams }: PageProps) {
  const { featureId } = await params;
  return renderSingularShell(viewRegistry.feature, featureId, await searchParams);
}
