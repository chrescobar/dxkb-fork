import { ExternalLink, ArrowUpRight } from "lucide-react";
import { externalTools } from "../_data/sidebars";

export function ExternalToolsCard() {
  return (
    <div className="bacteria-card p-5">
      <h2 className="text-[16px] font-semibold flex items-center gap-2 mb-3">
        <ExternalLink className="size-4" style={{ color: "var(--primary)" }} />
        External Tools
      </h2>
      <ul className="space-y-1 text-[13.5px]">
        {externalTools.map((tool) => (
          <li key={tool.label}>
            <a
              href={tool.href}
              className="flex items-center justify-between py-2 px-2 rounded-md hover:bg-[var(--muted)] transition-colors"
            >
              <span className="font-medium">{tool.label}</span>
              <ArrowUpRight className="size-3.5 text-muted-foreground" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
