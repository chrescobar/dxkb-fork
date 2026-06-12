export const unspecifiedFacetLabel = "Unspecified";

export function facetDisplayLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length === 0) return unspecifiedFacetLabel;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}
