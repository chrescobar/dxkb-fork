export interface Library {
  id: string;
  name: string;
  type: "paired" | "single" | "sra";
}