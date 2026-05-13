import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";

import { getVirusNavItems } from "./_components/virus-nav-items";
import { virusesLandingConfig } from "./_config";

export const dynamic = "force-dynamic";

interface VirusesPageProps {
  searchParams?: Promise<{
    view?: string | string[];
  }>;
}

export default async function VirusesPage({ searchParams }: VirusesPageProps) {
  const resolvedSearchParams = await searchParams;
  const viewParam = resolvedSearchParams?.view;
  const activeViewKey = Array.isArray(viewParam) ? viewParam[0] : viewParam;

  return (
    <OrganismLandingShell
      config={virusesLandingConfig}
      views={getVirusNavItems()}
      activeViewKey={activeViewKey}
    />
  );
}
