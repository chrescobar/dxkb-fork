// src/app/(views)/taxonomy/page.tsx
import { renderListShell } from "@/lib/views/render-list";
import { viewRegistry } from "@/lib/views/view-registry";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TaxonomyListPage({ searchParams }: PageProps) {
  return renderListShell(viewRegistry.taxonomy, await searchParams);
}
