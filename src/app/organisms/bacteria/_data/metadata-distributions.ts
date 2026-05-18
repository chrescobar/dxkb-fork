export type DonutColor = "c1" | "c2" | "c3" | "c4" | "c5" | "muted";

export interface DonutSlice {
  label: string;
  value: string;
  pct: number;
  color: DonutColor;
}
