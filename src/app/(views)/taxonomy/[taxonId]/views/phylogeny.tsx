import { BacterialPhylogenyPanel } from "@/components/phylogeny/bacterial-phylogeny-panel";
import { ViralPhylogenyPanel } from "@/components/phylogeny/viral-phylogeny-panel";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

export function makePhylogenyView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function PhylogenyView() {
    if (!taxon) return null;
    return taxon.lineageNames.includes("Bacteria") ? (
      <BacterialPhylogenyPanel taxonId={taxon.taxonId} taxonName={taxon.taxonName} />
    ) : (
      <ViralPhylogenyPanel taxonId={taxon.taxonId} taxonName={taxon.taxonName} />
    );
  }
  return PhylogenyView;
}
