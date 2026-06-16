// src/app/(views)/protein-structure/page.tsx
import { renderListShell } from "@/lib/views/render-list";
import { renderSingularShell } from "@/lib/views/render-singular";
import { viewRegistry } from "@/lib/views/view-registry";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProteinStructurePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const accession = Array.isArray(params.accession) ? params.accession[0] : params.accession;
  const path = Array.isArray(params.path) ? params.path[0] : params.path;
  // id-less singular: accession or workspace path present
  if (accession || path) {
    return renderSingularShell(viewRegistry["protein-structure"], accession ?? path ?? "", params);
  }
  return renderListShell(viewRegistry["protein-structure"], params);
}
