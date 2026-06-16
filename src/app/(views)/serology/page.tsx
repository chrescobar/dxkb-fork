// src/app/(views)/serology/page.tsx
import { renderListShell } from "@/lib/views/render-list";
import { viewRegistry } from "@/lib/views/view-registry";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function SerologyListPage({ searchParams }: PageProps) {
  return renderListShell(viewRegistry.serology, await searchParams);
}
