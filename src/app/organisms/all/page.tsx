import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";
import { firstSearchParam } from "@/lib/views/search-params";

import { allNavItems } from "./_components/nav-items";
import { allOrganismsLandingConfig } from "./_config";

export const dynamic = "force-dynamic";

interface AllOrganismsPageProps {
  searchParams?: Promise<{
    tab?: string | string[];
    view?: string | string[];
  }>;
}

export default async function AllOrganismsPage({ searchParams }: AllOrganismsPageProps) {
  const resolvedParams = await searchParams;
  const activeViewKey =
    firstSearchParam(resolvedParams, "tab") ?? firstSearchParam(resolvedParams, "view");

  return (
    <OrganismLandingShell
      config={allOrganismsLandingConfig}
      views={allNavItems}
      activeViewKey={activeViewKey}
    />
  );
}
