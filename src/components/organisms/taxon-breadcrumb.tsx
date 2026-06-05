import Link from "next/link";

import type { OrganismTaxonomy } from "@/lib/services/organisms/types";
import { numberFormatter } from "@/lib/services/organisms/utils";

interface TaxonBreadcrumbProps {
  taxon: OrganismTaxonomy | null;
  displayName: string;
}

interface LineageEntry {
  name: string;
  id: number | null;
}

function buildLineage(names: string[], ids: number[]): LineageEntry[] {
  return names
    .map((name, i) => ({ name, id: ids[i] ?? null }))
    .filter(({ name }) => name !== "cellular organisms");
}

export function TaxonBreadcrumb({ taxon, displayName }: TaxonBreadcrumbProps) {
  if (!taxon) {
    return (
      <div>
        <p className="text-foreground text-[12px] font-bold tracking-widest uppercase">
          Taxon View
        </p>
        <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
      </div>
    );
  }

  const lineage = buildLineage(taxon.lineageNames, taxon.lineageIds);
  const ancestors = lineage.slice(0, -1);
  const current = lineage.at(-1);
  const currentName = current?.name ?? taxon.taxonName;

  return (
    <div>
      <p className="text-foreground text-[12px] font-bold tracking-widest uppercase">
        Taxon View
      </p>
      <div className="flex flex-wrap items-baseline gap-x-1 text-sm">
        {ancestors.map(({ name, id }, index) => (
          <span key={id ?? `name-${index}`} className="flex items-baseline gap-x-1">
            {id === null ? (
              <span className="text-muted-foreground">{name}</span>
            ) : (
              <Link
                href={`/taxonomy/${id}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {name}
              </Link>
            )}
            <span className="text-muted-foreground/50 select-none">»</span>
          </span>
        ))}
        <h1 className="text-secondary inline text-sm font-bold leading-none m-0">
          {currentName}
        </h1>
        {taxon.genomes !== null && taxon.genomes > 0 && (
          <span className="text-muted-foreground text-xs">
            ({numberFormatter.format(taxon.genomes)} Genomes)
          </span>
        )}
      </div>
    </div>
  );
}
