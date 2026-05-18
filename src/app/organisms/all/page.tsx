import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";

import { allNavItems } from "./nav-items";
import { allOrganismsLandingConfig } from "./_config";

export const dynamic = "force-dynamic";

interface AllOrganismsPageProps {
  searchParams?: Promise<{
    view?: string | string[];
  }>;
}

export default async function AllOrganismsPage({ searchParams }: AllOrganismsPageProps) {
  const resolvedSearchParams = await searchParams;
  const viewParam = resolvedSearchParams?.view;
  const activeViewKey = Array.isArray(viewParam) ? viewParam[0] : viewParam;

  return (
    <OrganismLandingShell
      config={allOrganismsLandingConfig}
      views={allNavItems}
      activeViewKey={activeViewKey}
    />
  );
}
