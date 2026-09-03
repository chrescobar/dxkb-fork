import { redirect } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  canonicalProteinStructureQuery,
  parseProteinStructureCollectionState,
  parseProteinStructureMode,
} from "@/lib/protein-structure-view";
import { getProteinStructures } from "@/lib/protein-structure-view/server";
import { ProteinStructureCollection } from "./protein-structure-collection";
import { ProteinStructureMember } from "./protein-structure-member";

export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ProteinStructurePage({
  searchParams,
}: PageProps) {
  const params = await searchParams;
  const mode = parseProteinStructureMode(params);
  if (mode.kind === "invalid") {
    return (
      <Alert variant="destructive" className="m-4">
        <AlertTitle>Invalid protein structure request</AlertTitle>
        <AlertDescription>{mode.reason}</AlertDescription>
      </Alert>
    );
  }
  if (mode.kind === "collection") {
    return (
      <ProteinStructureCollection
        initialState={parseProteinStructureCollectionState(params)}
      />
    );
  }
  const canonicalUrl = canonicalProteinStructureQuery(params, mode);
  if (canonicalUrl) redirect(canonicalUrl);
  if (mode.kind === "path") {
    return <ProteinStructureMember workspacePath={mode.path} />;
  }
  return (
    <ProteinStructureMember
      lookups={await getProteinStructures(mode.accessions)}
    />
  );
}
