import Avatar from "boring-avatars";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { facetDisplayLabel } from "@/components/organisms/facet-label";
import { Card } from "@/components/ui/card";

const numberFormatter = new Intl.NumberFormat("en-US");

interface GeneraCardProps {
  name: string;
  count: number;
  taxonId: number;
}

export function GeneraCard({ name, count, taxonId }: GeneraCardProps) {
  const legacyHref = `https://www.bv-brc.org/view/Taxonomy/${taxonId}#view_tab=genomes&filter=genus:${encodeURIComponent(name)}`;
  const displayName = facetDisplayLabel(name);

  return (
    <Card className="gap-0 rounded-md py-0 shadow-none">
      <Link
        href={legacyHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View ${displayName} genomes`}
        className="hover:bg-muted/40 flex min-h-12 items-center gap-2.5 px-2.5 py-1.5 transition-colors"
      >
        <Avatar
          size={28}
          name={displayName}
          variant="beam"
          colors={["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"]}
        />
        <div className="min-w-0 flex-1 space-y-0.5">
          <h3
            className="truncate text-sm leading-tight font-semibold"
            title={displayName}
          >
            {displayName}
          </h3>
          <p className="text-muted-foreground text-[11px] leading-tight">
            {numberFormatter.format(count)}
          </p>
        </div>
        <ArrowRight size={14} className="text-muted-foreground/50 shrink-0" aria-hidden="true" />
      </Link>
    </Card>
  );
}
