// src/app/(views)/surveillance/page.tsx
import { renderListShell } from "@/lib/views/render-list";
import { viewRegistry } from "@/lib/views/view-registry";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SurveillanceListPage({ searchParams }: PageProps) {
  return renderListShell(viewRegistry.surveillance, await searchParams);
}
