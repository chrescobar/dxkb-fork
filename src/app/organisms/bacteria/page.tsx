import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";
import { firstSearchParam } from "@/lib/views/search-params";

import { bacteriaNavItems } from "./_components/nav-items";
import { bacteriaLandingConfig } from "./_config";

export const dynamic = "force-dynamic";

interface BacteriaPageProps {
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
}

export default async function BacteriaPage({ searchParams }: BacteriaPageProps) {
  const activeViewKey = firstSearchParam(await searchParams, "tab");

  return (
    <OrganismLandingShell
      config={bacteriaLandingConfig}
      views={bacteriaNavItems}
      activeViewKey={activeViewKey}
    />
  );
}
