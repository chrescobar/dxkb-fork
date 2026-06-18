import * as fs from "fs";
import * as path from "path";
import type { Violation } from "./gate";

export interface ScanRecord {
  route: string;
  theme: string;
  blocking: Violation[];
  suppressed: Violation[];
  warnings: Violation[];
}

const scansDir = "a11y-report/scans";

export function recordScan(record: ScanRecord): void {
  fs.mkdirSync(scansDir, { recursive: true });
  const safeName = `${record.route}__${record.theme}`.replace(/[^a-z0-9_-]/gi, "_");
  const filename = `${safeName}__${String(process.pid)}.json`;
  fs.writeFileSync(path.join(scansDir, filename), JSON.stringify(record));
}
