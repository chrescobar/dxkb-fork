import { fetchReferenceGenomes } from "@/lib/services/organisms/reference-genomes";

import { ReferenceGenomesClient } from "./reference-genomes-client";

export async function ReferenceGenomes({ taxonId }: { taxonId: number }) {
  const genomes = await fetchReferenceGenomes(taxonId);
  return <ReferenceGenomesClient genomes={genomes} />;
}
