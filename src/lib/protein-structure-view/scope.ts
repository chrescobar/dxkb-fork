import { eq } from "@/lib/data-api";
import type { FeatureViewRecord } from "@/lib/feature-view";

function values(value: string | undefined): string[] {
  return (
    value
      ?.split(",")
      .map((item) => item.trim())
      .filter(Boolean) ?? []
  );
}

export function featureProteinStructureRql(
  feature: FeatureViewRecord,
): string | undefined {
  const predicates = [
    ...values(feature.patric_id).map((value) =>
      eq("protein_structure", "patric_id", value),
    ),
    ...values(feature.aa_sequence_md5).map((value) =>
      eq("protein_structure", "sequence_md5", value),
    ),
    ...values(feature.uniprotkb_accession).map((value) =>
      eq("protein_structure", "uniprotkb_accession", value),
    ),
    ...values(feature.pdb_accession).map((value) =>
      eq("protein_structure", "pdb_id", value.toUpperCase()),
    ),
  ];
  if (predicates.length === 0) return undefined;
  return predicates.length === 1
    ? predicates[0]
    : `or(${predicates.join(",")})`;
}
