import { Sun } from "lucide-react";

export function PromoCard() {
  return (
    <div
      className="bacteria-card p-5"
      style={{
        background: "color-mix(in oklch, var(--accent) 22%, transparent)",
        borderColor: "color-mix(in oklch, var(--accent) 40%, transparent)",
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: "color-mix(in oklch, var(--secondary) 30%, transparent)",
            color: "var(--foreground)",
          }}
        >
          <Sun className="size-[18px]" />
        </div>
        <div>
          <h3 className="text-[14px] font-semibold mb-1">New: Bacterial AMR explorer</h3>
          <p className="text-[12.5px] leading-snug text-muted-foreground">
            Browse 142K resistance phenotypes across 12 antibiotic classes, with curated MIC data.
          </p>
          <a
            href="#amr"
            className="mt-2 inline-flex items-center gap-1 text-[12.5px] font-medium"
            style={{ color: "var(--primary)" }}
          >
            Open AMR panel <span aria-hidden>→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
