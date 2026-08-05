import { BacterialPhylogenyPanel } from "@/components/phylogeny/bacterial-phylogeny-panel";
import { ViralPhylogenyPanel } from "@/components/phylogeny/viral-phylogeny-panel";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

export function makePhylogenyView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function PhylogenyView() {
    if (!taxon) return null;
    // Border + top-left radius live here so every phylogeny state (tree picker,
    // Archaeopteryx, Auspice iframe) is framed identically. overflow-hidden
    // clips child backgrounds to the rounded corner.
    return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-tl-lg border">
        {taxon.lineageNames.includes("Bacteria") ? (
          <BacterialPhylogenyPanel taxonId={taxon.taxonId} taxonName={taxon.taxonName} />
        ) : (
          <ViralPhylogenyPanel taxonId={taxon.taxonId} taxonName={taxon.taxonName} />
        )}
      </div>
    );
  }
  return PhylogenyView;
}
