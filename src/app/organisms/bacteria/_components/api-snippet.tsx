import { Code2 } from "lucide-react";

const snippet = `GET /v2/bacteria/overview
?taxon_id=2
&fl=taxon_id,taxon_name,
   genome_count
&sort=genome_count_desc`;

export function ApiSnippet() {
  return (
    <div className="bacteria-card p-5">
      <h2 className="text-[16px] font-semibold flex items-center gap-2 mb-3">
        <Code2 className="size-4" style={{ color: "var(--primary)" }} />
        API
      </h2>
      <pre className="font-mono text-[11.5px] p-3 rounded-md overflow-x-auto leading-snug bg-muted text-foreground">
        {snippet}
      </pre>
      <a href="#" className="mt-3 inline-block text-[13px] font-medium" style={{ color: "var(--primary)" }}>
        Open in playground →
      </a>
    </div>
  );
}
