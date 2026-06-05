import { notFound } from "next/navigation";

import { TaxonBreadcrumb } from "@/components/organisms/taxon-breadcrumb";
import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";
import { fetchOrganismTaxonomy } from "@/lib/services/organisms/taxonomy";

import { buildTaxonomyNavItems } from "./_components/nav-items";
import { buildTaxonomyConfig } from "./_config";

export const dynamic = "force-dynamic";

interface TaxonomyPageProps {
  params: Promise<{ taxonId: string }>;
  searchParams?: Promise<{
    view?: string | string[];
  }>;
}

// Taxa that publish a serovar pivot in BV-BRC SOLR. Other taxa get a blank
// chart whose only content is "No distribution data was returned."
const serotypeTaxa = new Set<number>([
  590, // Salmonella
]);

export default async function TaxonomyPage({ params, searchParams }: TaxonomyPageProps) {
  const { taxonId: rawTaxonId } = await params;
  const taxonId = Number(rawTaxonId);
  if (!Number.isInteger(taxonId) || taxonId <= 0) {
    notFound();
  }

  const resolvedSearchParams = await searchParams;
  const viewParam = resolvedSearchParams?.view;
  const activeViewKey = Array.isArray(viewParam) ? viewParam[0] : viewParam;

  const taxon = await fetchOrganismTaxonomy(taxonId).catch(() => null);
  const config = buildTaxonomyConfig(taxonId, taxon);
  const showSerotype = serotypeTaxa.has(taxonId);
  const navItems = buildTaxonomyNavItems(config, showSerotype);

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
