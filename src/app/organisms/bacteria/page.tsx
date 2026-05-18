import { OrganismLandingShell } from "@/components/organisms/landing-shell/landing-shell";

import { bacteriaNavItems } from "./nav-items";
import { bacteriaLandingConfig } from "./_config";

export const dynamic = "force-dynamic";

interface BacteriaPageProps {
  searchParams?: Promise<{
    view?: string | string[];
  }>;
}

export default async function BacteriaPage({ searchParams }: BacteriaPageProps) {
  const resolvedSearchParams = await searchParams;
  const viewParam = resolvedSearchParams?.view;
  const activeViewKey = Array.isArray(viewParam) ? viewParam[0] : viewParam;

  return (
    <OrganismLandingShell
      config={bacteriaLandingConfig}
      views={bacteriaNavItems}
      activeViewKey={activeViewKey}
    />
  );
}
