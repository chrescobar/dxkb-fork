import { TaxonBreadcrumb } from "@/components/organisms/taxon-breadcrumb";
import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";
import { fetchOrganismTaxonomy } from "@/lib/services/organisms/taxonomy";

import { taxonomyNavItems } from "./_components/nav-items";
import { brucellaTaxonomyConfig } from "./_config";

export const dynamic = "force-dynamic";

interface TaxonomyPageProps {
  searchParams?: Promise<{
    view?: string | string[];
  }>;
}

export default async function TaxonomyPage({ searchParams }: TaxonomyPageProps) {
  const resolvedSearchParams = await searchParams;
  const viewParam = resolvedSearchParams?.view;
  const activeViewKey = Array.isArray(viewParam) ? viewParam[0] : viewParam;

  const taxon = await fetchOrganismTaxonomy(brucellaTaxonomyConfig.taxonId).catch(() => null);

  return (
    <OrganismLandingShell
      config={brucellaTaxonomyConfig}
      views={taxonomyNavItems}
      activeViewKey={activeViewKey}
      headerContent={
        <TaxonBreadcrumb
          taxon={taxon}
          displayName={brucellaTaxonomyConfig.displayName}
        />
      }
    />
  );
}
