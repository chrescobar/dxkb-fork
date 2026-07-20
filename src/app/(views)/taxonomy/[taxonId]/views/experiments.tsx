import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { OrganismTaxonomy } from "@/lib/services/organisms/types";

import { TaxonDataPanel } from "../_components/taxon-data-panel";

export function makeExperimentsView({ taxon }: { taxon: OrganismTaxonomy | null }) {
  function ExperimentsView() {
    if (!taxon) return null;

    const taxonId = String(taxon.taxonId);

    return (
      <Tabs defaultValue="experiments" className="flex h-full min-h-0 flex-1 flex-col">
        <TabsList className="w-fit shrink-0">
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="biosets">Biosets</TabsTrigger>
        </TabsList>
        <TabsContent value="experiments" className="mt-2 flex min-h-0 flex-1 flex-col">
          <TaxonDataPanel
            resource="experiment"
            q={`eq(taxon_lineage_ids,${taxonId})`}
            guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/experiments.html"
          />
        </TabsContent>
        <TabsContent value="biosets" className="mt-2 flex min-h-0 flex-1 flex-col">
          <TaxonDataPanel
            resource="bioset"
            q={`and(eq(genome_id,*),genome(eq(taxon_lineage_ids,${taxonId})))`}
          />
        </TabsContent>
      </Tabs>
    );
  }
  return ExperimentsView;
}
