import { CircleDot } from "lucide-react";
import { fetchFeaturedGenera, type FeaturedGenusData } from "@/lib/services/bacteria";
import { SectionError } from "./section-error";
import { formatCountFull } from "../_lib/format";

const surfaceByRank = [
  "bacteria-surface-1",
  "bacteria-surface-2",
  "bacteria-surface-3",
  "bacteria-surface-4",
  "bacteria-surface-5",
  "bacteria-surface-6",
] as const;

function patternFromCellShape(cellShape: string | null): string {
  if (!cellShape) return "bacteria-pattern-rods";
  const lc = cellShape.toLowerCase();
  if (lc.includes("cocc") || lc.includes("spher")) return "bacteria-pattern-cocci";
  if (lc.includes("spiral") || lc.includes("helic") || lc.includes("spirochete") || lc.includes("vibrio"))
    return "bacteria-pattern-helix";
  return "bacteria-pattern-rods";
}

export async function FeaturedGenera() {
  let genera: FeaturedGenusData[];
  try {
    genera = await fetchFeaturedGenera();
  } catch (error) {
    return (
      <div>
        <SectionError
          title="Couldn't load featured genera"
          message={error instanceof Error ? error.message : String(error)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-[19px] font-medium flex items-center gap-2">
            <CircleDot className="size-[18px]" style={{ color: "var(--primary)" }} />
            Featured Genera
          </h2>
          <p className="text-[13px] mt-1 text-muted-foreground">Top six by record density</p>
        </div>
        <a href="#all-genera" className="text-[13px] font-medium" style={{ color: "var(--primary)" }}>
          View all →
        </a>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
        {genera.map((genus) => {
          const idx = genus.rank - 1;
          const surface = surfaceByRank[idx % surfaceByRank.length];
          const pattern = patternFromCellShape(genus.cellShape);
          return (
            <article key={genus.name} className="bacteria-genus-hero">
              <a href={`#genus-${genus.name.toLowerCase()}`} className="block">
                <div className="surface">
                  <div className={`bg ${surface} ${pattern}`} />
                  <div className="overlay" />
                  <div className="content">
                    <div className="flex items-center justify-between">
                      {genus.phylum ? (
                        <span className="bacteria-badge bacteria-badge-accent text-[10px] uppercase tracking-wider">
                          {genus.phylum}
                        </span>
                      ) : (
                        <span className="bacteria-badge bacteria-badge-accent text-[10px] uppercase tracking-wider">—</span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-[19px] font-medium leading-tight">{genus.name}</h3>
                      <p className="text-[11px] text-white/80">{genus.cellShape ?? "—"}</p>
                    </div>
                  </div>
                </div>
                <div className="px-3 py-3">
                  <div className="font-mono text-[15px] bacteria-tabular font-semibold">
                    {formatCountFull(genus.genomeCount)}
                  </div>
                </div>
              </a>
            </article>
          );
        })}
      </div>
    </div>
  );
}
