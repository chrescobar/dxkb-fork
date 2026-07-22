import * as fs from "fs";
import * as path from "path";
import type { ScanRecord } from "./report";

export default function globalTeardown(): void {
  const scansDir = "a11y-report/scans";
  if (!fs.existsSync(scansDir)) return;

  const files = fs.readdirSync(scansDir).filter((f) => f.endsWith(".json"));
  const records: ScanRecord[] = files.map(
    (f) => JSON.parse(fs.readFileSync(path.join(scansDir, f), "utf8")) as ScanRecord,
  );

  // Deduplicate by route+theme (same test may run in multiple workers).
  const seen = new Map<string, ScanRecord>();
  for (const r of records) {
    const key = `${r.route}::${r.theme}`;
    if (!seen.has(key)) seen.set(key, r);
  }

  const summary = [...seen.values()].sort(
    (a, b) => a.route.localeCompare(b.route) || a.theme.localeCompare(b.theme),
  );

  fs.mkdirSync("a11y-report", { recursive: true });
  fs.writeFileSync("a11y-report/a11y-summary.json", JSON.stringify(summary, null, 2));
}
