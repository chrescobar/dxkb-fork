const datasetSegment = /^[A-Za-z0-9][A-Za-z0-9.-]*$/;

export const maxDatasetIdLength = 256;
export const maxDatasetSegments = 8;

export function parseDatasetId(value: string): string[] | null {
  if (!value || value.length > maxDatasetIdLength || value.startsWith("//"))
    return null;

  const normalized = value.replace(/^\//, "").replace(/\/$/, "");
  if (!normalized) return null;

  const parts = normalized.split("/");
  if (parts.length > maxDatasetSegments) return null;
  if (
    !parts.every(
      (part) => datasetSegment.test(part) && part !== "." && part !== "..",
    )
  ) {
    return null;
  }

  return parts;
}

export function canonicalDatasetId(value: string): string | null {
  const parts = parseDatasetId(value);
  return parts?.join("/") ?? null;
}

export function viewerUrl(datasetId: string): string | null {
  const parts = parseDatasetId(datasetId);
  return parts
    ? `/nextstrain-viewer/${parts.map(encodeURIComponent).join("/")}`
    : null;
}

export function datasetFilename(parts: string[], sidecar?: string): string {
  const base = parts.join("_");
  return sidecar ? `${base}_${sidecar}.json` : `${base}.json`;
}

export function stripViewerPrefix(prefix: string): string {
  const trimmed = prefix.replace(/^\/+/, "");
  return trimmed.startsWith("nextstrain-viewer/")
    ? trimmed.slice("nextstrain-viewer/".length)
    : trimmed;
}
