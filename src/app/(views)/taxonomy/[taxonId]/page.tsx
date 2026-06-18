import { notFound } from "next/navigation";

import { TaxonBreadcrumb } from "@/components/organisms/taxon-breadcrumb";
import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";
import { TaxonomyNotFoundError, fetchOrganismTaxonomy } from "@/lib/services/organisms/taxonomy";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

import { firstSearchParam } from "@/lib/views/search-params";

import { buildTaxonomyNavItems } from "./_components/nav-items";
import { buildTaxonomyConfig } from "./_config";

export const dynamic = "force-dynamic";

interface TaxonomyPageProps {
  params: Promise<{ taxonId: string }>;
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
}

export default async function TaxonomyPage({ params, searchParams }: TaxonomyPageProps) {
  const { taxonId: rawTaxonId } = await params;
  const taxonId = Number(rawTaxonId);
  if (!Number.isInteger(taxonId) || taxonId <= 0) {
    notFound();
  }

  const activeViewKey = firstSearchParam(await searchParams, "tab");

  let taxon: OrganismTaxonomy;
  try {
    taxon = await fetchOrganismTaxonomy(taxonId);
  } catch (err) {
    if (err instanceof TaxonomyNotFoundError) {
      notFound();
    }
    throw err;
  }
  const config = buildTaxonomyConfig(taxonId, taxon);
  const navItems = buildTaxonomyNavItems(config, taxon);

  return (
    <OrganismLandingShell
      config={config}
      views={navItems}
      activeViewKey={activeViewKey}
      headerContent={
        <TaxonBreadcrumb
          taxon={taxon}
          displayName={config.displayName}
        />
      }
    />
  );
}
