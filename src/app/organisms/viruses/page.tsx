import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";
import { firstSearchParam } from "@/lib/views/search-params";

import { virusNavItems } from "./_components/nav-items";
import { virusesLandingConfig } from "./_config";

export const dynamic = "force-dynamic";

interface VirusesPageProps {
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
}

export default async function VirusesPage({ searchParams }: VirusesPageProps) {
  const activeViewKey = firstSearchParam(await searchParams, "tab");

  return (
    <OrganismLandingShell
      config={virusesLandingConfig}
      views={virusNavItems}
      activeViewKey={activeViewKey}
    />
  );
}
