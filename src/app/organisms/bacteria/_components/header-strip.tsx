import Link from "next/link";
import { ArrowRight, Bookmark, Share2, Download, Code2, Check } from "lucide-react";

function BacteriaIcon() {
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M10.66 21a3 3 0 0 1-2.12-.88l-1.66-1.66a3 3 0 0 1 4.24-4.24l1.66 1.66" />
      <path d="M5 10.5a3 3 0 0 1 4.24-4.24l1.66 1.66" />
      <path d="M14 12.5a3 3 0 1 1-4.24 4.24" />
      <path d="M17 8a3 3 0 1 1-4.24 4.24" />
      <path d="M14.66 11a3 3 0 0 1 4.24 4.24" />
    </svg>
  );
}

export function HeaderStrip() {
  return (
    <section className="border-b bg-card border-[var(--border)]">
      <div className="mx-auto w-full px-12 py-5 flex items-end justify-between gap-6 flex-wrap">
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{
              background: "color-mix(in oklch, var(--primary) 12%, transparent)",
              color: "var(--primary)",
            }}
          >
            <BacteriaIcon />
          </div>
          <div>
            <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
              <Link href="/" className="hover:text-[var(--primary)]">
                Organisms
              </Link>
              <span>›</span>
              <span>Bacteria</span>
            </div>
            <h1 className="text-[32px] font-medium leading-tight tracking-tight">Bacteria</h1>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="bacteria-badge bacteria-badge-primary">
                <ArrowRight className="size-2.5" />
                Domain
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button type="button" className="bacteria-icon-btn" title="Save" aria-label="Save">
            <Bookmark className="size-4" />
          </button>
          <button type="button" className="bacteria-icon-btn" title="Share" aria-label="Share">
            <Share2 className="size-4" />
          </button>
          <button type="button" className="bacteria-btn bacteria-btn-outline">
            <Download className="size-3.5" />
            Download CSV
          </button>
          <button type="button" className="bacteria-btn bacteria-btn-outline">
            <Code2 className="size-3.5" />
            API
          </button>
          <button type="button" className="bacteria-btn bacteria-btn-primary">
            <Check className="size-3.5" />
            Save view
          </button>
        </div>
      </div>
    </section>
  );
}
