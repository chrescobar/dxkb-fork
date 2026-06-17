import type { Violation } from "./gate";

export interface ScanRecord {
  route: string;
  theme: string;
  blocking: Violation[];
  suppressed: Violation[];
  warnings: Violation[];
}

// Phase 1 stub: in-process log only.
// Phase 5 adds artifact file writing (a11y-report.json / a11y-report.md).
const records: ScanRecord[] = [];

export function recordScan(record: ScanRecord): void {
  records.push(record);
}

export function getRecords(): readonly ScanRecord[] {
  return records;
}

export function clearRecords(): void {
  records.length = 0;
}
