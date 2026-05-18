import { AlignJustify, LayoutGrid, Filter } from "lucide-react";
import { fetchFeaturedGenera, fetchGeneraTable, type GeneraTableRowData } from "@/lib/services/bacteria";
import { SectionError } from "./section-error";
import { formatCountFull } from "../_lib/format";

const surfaces = [
  "bacteria-surface-1",
  "bacteria-surface-2",
  "bacteria-surface-3",
  "bacteria-surface-4",
  "bacteria-surface-5",
  "bacteria-surface-6",
] as const;

export async function GeneraTable() {
  let rows: GeneraTableRowData[];
  let totalGeneraHint: number | null = null;
  try {
    const featured = await fetchFeaturedGenera().catch(() => []);
    const exclude = featured.map((g) => g.name);
    rows = await fetchGeneraTable(exclude);
    totalGeneraHint = rows.length + featured.length;
  } catch (error) {
    return (
      <SectionError
        title="Couldn't load genera table"
        message={error instanceof Error ? error.message : String(error)}
      />
    );
  }

  return (
    <div className="bacteria-card overflow-hidden" id="all-genera">
      <div className="px-5 py-3 flex items-center justify-between border-b border-[var(--border)]">
        <div>
          <h3 className="text-[14px] font-semibold">All bacteria genera</h3>
          <p className="text-[12px] mt-0.5 text-muted-foreground">
            {rows.length} additional · alphabetical
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="bacteria-icon-btn"
            data-active="true"
            title="Compact"
            aria-label="Compact view"
          >
            <AlignJustify className="size-3.5" />
          </button>
          <button type="button" className="bacteria-icon-btn" title="Grid" aria-label="Grid view">
            <LayoutGrid className="size-3.5" />
          </button>
          <button type="button" className="bacteria-icon-btn" title="Filter" aria-label="Filter">
            <Filter className="size-3.5" />
          </button>
        </div>
      </div>

      <div
        className="grid items-center gap-3 px-3.5 py-2 text-[10.5px] font-mono uppercase tracking-wider border-b text-muted-foreground"
        style={{
          gridTemplateColumns: "28px 28px 1fr 110px 80px 1fr",
          borderColor: "var(--border)",
          background: "color-mix(in oklch, var(--muted) 40%, transparent)",
        }}
      >
        <span />
        <span>id</span>
        <span>genus</span>
        <span>phylum</span>
        <span className="text-right">genomes</span>
        <span>distribution</span>
      </div>

      <ul>
        {rows.map((row, idx) => {
          const surface = surfaces[idx % surfaces.length];
          return (
            <li key={row.name}>
              <a href={`#genus-${row.name.toLowerCase()}`} className="bacteria-genus-row">
                <span className={`bacteria-genus-dot ${surface}`}>{row.name.charAt(0).toUpperCase()}</span>
                <span className="font-mono text-[11px] text-muted-foreground">{row.id}</span>
                <span>
                  <span className="block text-[14px] font-medium">{row.name}</span>
                </span>
                <span className="font-mono text-[10.5px] uppercase text-muted-foreground">
                  {row.phylum ?? "—"}
                </span>
                <span className="font-mono text-[12.5px] bacteria-tabular text-right">
                  {formatCountFull(row.genomeCount)}
                </span>
                <span>
                  <div className="bacteria-bar-track">
                    <div className="bacteria-bar-fill" style={{ width: `${row.distributionPct}%` }} />
                  </div>
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      <div
        className="px-5 py-3 border-t flex items-center justify-between"
        style={{ borderColor: "var(--border)", background: "color-mix(in oklch, var(--muted) 40%, transparent)" }}
      >
        <span className="text-[12px] text-muted-foreground">
          Showing {totalGeneraHint ?? rows.length} curated entries
        </span>
        <a href="#taxonomy" className="text-[13px] font-medium" style={{ color: "var(--primary)" }}>
          Browse full taxonomy →
        </a>
      </div>
    </div>
  );
}
