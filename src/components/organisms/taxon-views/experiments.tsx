import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { taxonLineageClause, type TaxonViewScope } from "./scope";
import { TaxonDataPanel } from "./taxon-data-panel";

export function makeExperimentsView({ scope }: { scope: TaxonViewScope }) {
  function ExperimentsView() {
    const lineageClause = taxonLineageClause(scope);

    return (
      <Tabs defaultValue="experiments" className="flex h-full min-h-0 flex-1 flex-col">
        <TabsList className="w-fit shrink-0">
          <TabsTrigger value="experiments">Experiments</TabsTrigger>
          <TabsTrigger value="biosets">Biosets</TabsTrigger>
        </TabsList>
        <TabsContent value="experiments" className="mt-2 flex min-h-0 flex-1 flex-col">
          <TaxonDataPanel
            resource="experiment"
            q={lineageClause}
            guideUrl="https://www.bv-brc.org/docs/quick_references/organisms_taxon/experiments.html"
          />
        </TabsContent>
        <TabsContent value="biosets" className="mt-2 flex min-h-0 flex-1 flex-col">
          <TaxonDataPanel
            resource="bioset"
            q={`and(eq(genome_id,*),genome(${lineageClause}))`}
          />
        </TabsContent>
      </Tabs>
    );
  }
  return ExperimentsView;
}
