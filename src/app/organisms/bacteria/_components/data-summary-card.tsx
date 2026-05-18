import { BarChart3 } from "lucide-react";
import { fetchKpis, type KpiKey } from "@/lib/services/bacteria";
import { SectionError } from "./section-error";
import { formatCountFull, formatCount } from "../_lib/format";

const summaryRows: { key: KpiKey; label: string; useCompact?: boolean }[] = [
  { key: "families", label: "Families" },
  { key: "genera", label: "Genera" },
  { key: "species", label: "Species" },
  { key: "genomes", label: "Genomes / Segments" },
  { key: "cds", label: "Protein Coding Genes", useCompact: true },
  { key: "matPeptides", label: "Mature Peptides" },
  { key: "pdbStructures", label: "3D Structures · PDB", useCompact: true },
];

export async function DataSummaryCard() {
  let kpis: Awaited<ReturnType<typeof fetchKpis>>;
  try {
    kpis = await fetchKpis();
  } catch (error) {
    return (
      <div className="bacteria-card p-5">
        <SectionError message={error instanceof Error ? error.message : String(error)} />
      </div>
    );
  }

  const byKey = new Map(kpis.map((k) => [k.key, k]));

  return (
    <div className="bacteria-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[16px] font-semibold flex items-center gap-2">
          <BarChart3 className="size-4" style={{ color: "var(--primary)" }} />
          Data Summary
        </h2>
      </div>
      <div>
        {summaryRows.map((row) => {
          const kpi = byKey.get(row.key);
          const formatter = row.useCompact ? formatCount : formatCountFull;
          return (
            <div key={row.key} className="bacteria-stat-row">
              <span className="label">{row.label}</span>
              <span className="value bacteria-tabular flex items-center gap-1.5">
                {kpi?.count !== null && kpi?.count !== undefined ? (
                  formatter(kpi.count)
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
