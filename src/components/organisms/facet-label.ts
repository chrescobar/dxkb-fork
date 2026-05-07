export const unspecifiedFacetLabel = "Unspecified";

export function facetDisplayLabel(label: string): string {
  const trimmed = label.trim();
  return trimmed.length > 0 ? trimmed : unspecifiedFacetLabel;
}
