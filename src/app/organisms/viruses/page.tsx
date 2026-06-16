import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";

import { virusNavItems } from "./_components/nav-items";
import { virusesLandingConfig } from "./_config";

export const dynamic = "force-dynamic";

interface VirusesPageProps {
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
}

export default async function VirusesPage({ searchParams }: VirusesPageProps) {
  const resolvedSearchParams = await searchParams;
  const tabParam = resolvedSearchParams?.tab;
  const activeViewKey = Array.isArray(tabParam) ? tabParam[0] : tabParam;

  return (
    <OrganismLandingShell
      config={virusesLandingConfig}
      views={virusNavItems}
      activeViewKey={activeViewKey}
    />
  );
}
