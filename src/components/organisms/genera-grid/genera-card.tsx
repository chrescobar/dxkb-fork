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
    <Card className="gap-0 rounded-md py-0">
      <Link
        href={legacyHref}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`View ${displayName} genomes`}
        className="hover:bg-muted/40 flex min-h-16 items-center gap-3 px-3 py-2.5 transition-colors"
      >
        <Avatar
          size={36}
          name={displayName}
          variant="beam"
          colors={["#264653", "#2a9d8f", "#e9c46a", "#f4a261", "#e76f51"]}
        />
        <div className="min-w-0 flex-1">
          <h3
            className="truncate text-sm leading-snug font-medium"
            title={displayName}
          >
            {displayName}
          </h3>
          <p className="text-muted-foreground text-xs">
            {numberFormatter.format(count)} genomes
          </p>
        </div>
        <span className="text-primary inline-flex shrink-0 items-center gap-1 text-xs font-medium">
          View
          <ArrowRight size={16} aria-hidden="true" />
        </span>
      </Link>
    </Card>
  );
}
