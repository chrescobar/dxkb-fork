import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";
import { firstSearchParam } from "@/lib/views/search-params";

import { bacteriaNavItems } from "./_components/nav-items";
import { bacteriaLandingConfig } from "./_config";

export const dynamic = "force-dynamic";

interface BacteriaPageProps {
  searchParams?: Promise<{
    tab?: string | string[];
    view?: string | string[];
  }>;
}

export default async function BacteriaPage({ searchParams }: BacteriaPageProps) {
  const resolvedParams = await searchParams;
  const activeViewKey =
    firstSearchParam(resolvedParams, "tab") ?? firstSearchParam(resolvedParams, "view");

  return (
    <OrganismLandingShell
      config={bacteriaLandingConfig}
      views={bacteriaNavItems}
      activeViewKey={activeViewKey}
    />
  );
}
