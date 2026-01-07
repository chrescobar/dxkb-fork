import type { SequenceItem } from "./gene-protein-tree-form-schema";

export type Alphabet = "DNA" | "Protein";

export function formatMetadataLabel(field: string): string {
  return field
    .replace(/_/g, " ")
    .split(" ")
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

export function getDisplayName(name: string): string {
  const maxName = 36;
  if (name.length <= maxName) return name;
  return `${name.slice(0, maxName / 2 - 2)}...${name.slice(
    name.length - (maxName / 2) + 2,
  )}`;
}

export function getSequenceTypeLabel(
  type: SequenceItem["type"],
  alphabet: Alphabet,
): string {
  if (type === "feature_group") return "Feature Group";
  if (type === "aligned_dna_fasta" || type === "aligned_protein_fasta") {
    return `${alphabet} Aligned FASTA`;
  }
  return `${alphabet} Unaligned FASTA`;
}

