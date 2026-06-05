export interface YearDatum {
  year: number;
  count: number;
}

export function parseYearData(data: { label: string; value: number }[]): YearDatum[] {
  return data
    .filter((d) => Number.isInteger(Number(d.label)) && d.label.trim() !== "" && Number(d.label) > 0)
    .map((d) => ({ year: Number(d.label), count: d.value }))
    .sort((a, b) => a.year - b.year);
}

// Choose how many year labels to render along the x-axis so they don't overlap.
export function labelStep(count: number): number {
  if (count <= 15) return 1;
  if (count <= 30) return 2;
  if (count <= 60) return 5;
  return 10;
}
