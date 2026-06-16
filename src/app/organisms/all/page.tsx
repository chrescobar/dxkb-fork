import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";

import { allNavItems } from "./_components/nav-items";
import { allOrganismsLandingConfig } from "./_config";

export const dynamic = "force-dynamic";

interface AllOrganismsPageProps {
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
}

export default async function AllOrganismsPage({ searchParams }: AllOrganismsPageProps) {
  const resolvedSearchParams = await searchParams;
  const tabParam = resolvedSearchParams?.tab;
  const activeViewKey = Array.isArray(tabParam) ? tabParam[0] : tabParam;

  return (
    <OrganismLandingShell
      config={allOrganismsLandingConfig}
      views={allNavItems}
      activeViewKey={activeViewKey}
    />
  );
}
