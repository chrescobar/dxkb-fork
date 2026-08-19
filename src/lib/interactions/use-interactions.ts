import { useQuery } from "@tanstack/react-query";

import type { PpiRecord } from "./types";

const selectClause =
  "&select(id,interactor_a,interactor_b,interactor_type_a,interactor_type_b,interactor_desc_a,interactor_desc_b,feature_id_a,feature_id_b,gene_a,gene_b,genome_name_a,genome_name_b,refseq_locus_tag_a,refseq_locus_tag_b,domain_a,domain_b,evidence,interaction_type,detection_method)";

export function useInteractions(taxonId: number, q: string) {
  const dataApi = process.env.NEXT_PUBLIC_DATA_API;
  if (!dataApi) {
    throw new Error("NEXT_PUBLIC_DATA_API environment variable is not configured");
  }
  const cleanQ = q.split("#")[0];

  return useQuery<PpiRecord[]>({
    queryKey: ["ppi-graph", taxonId, cleanQ],
    queryFn: async () => {
      const url = `${dataApi}/ppi/?${cleanQ}${selectClause}`;
      const res = await fetch(url, {
        headers: {
          "Content-type": "application/rqlquery+x-www-form-urlencoded",
          Accept: "application/json",
          Range: "items=0-5000",
          "X-Range": "items=0-5000",
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch interactions (${String(res.status)} ${res.statusText})`);
      }
      return res.json() as Promise<PpiRecord[]>;
    },
    staleTime: 5 * 60 * 1000,
  });
}
