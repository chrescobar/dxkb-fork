import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";

import { bacteriaNavItems } from "./_components/nav-items";
import { bacteriaLandingConfig } from "./_config";

export const dynamic = "force-dynamic";

interface BacteriaPageProps {
  searchParams?: Promise<{
    tab?: string | string[];
  }>;
}

export default async function BacteriaPage({ searchParams }: BacteriaPageProps) {
  const resolvedSearchParams = await searchParams;
  const tabParam = resolvedSearchParams?.tab;
  const activeViewKey = Array.isArray(tabParam) ? tabParam[0] : tabParam;

  return (
    <OrganismLandingShell
      config={bacteriaLandingConfig}
      views={bacteriaNavItems}
      activeViewKey={activeViewKey}
    />
  );
}
