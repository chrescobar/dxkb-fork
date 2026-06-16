import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";
import { firstSearchParam } from "@/lib/views/search-params";

import { allNavItems } from "./_components/nav-items";
import { allOrganismsLandingConfig } from "./_config";

export const dynamic = "force-dynamic";

interface AllOrganismsPageProps {
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
}

export default async function AllOrganismsPage({ searchParams }: AllOrganismsPageProps) {
  const activeViewKey = firstSearchParam(await searchParams, "tab");

  return (
    <OrganismLandingShell
      config={allOrganismsLandingConfig}
      views={allNavItems}
      activeViewKey={activeViewKey}
    />
  );
}
