"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import React, { useState} from "react";
import { useSearchParams } from "next/navigation";
import { ListData } from "@/components/services/ListData";
import { WithGenomePanel } from "@/components/layouts/WithGenomePanel";

// ---- Props interface ----
export interface TypeSearchProps {
  q?: string | null;
  searchtype?: string | null;
}

// ---- Type for search types ----
interface SearchTypesMap {
  [category: string]: {
    [term: string]: string; // term label
  };
}

export function TypeSearch({ q, searchtype }: TypeSearchProps) {

  const searchParams = useSearchParams();

  // fallback to URL params if props not provided
  const finalQ = q ?? searchParams.get("q");
  const thistype = searchtype ?? searchParams.get("searchtype");

  const [selectedRows, setSelectedRows] = React.useState<any[]>([]);

  const searchTypes: SearchTypesMap = {
    genome: {
      genome: "Genomes",
      genome_sequence: "Sequences",
      genome_amr: "AMR Phenotypes",
      genome_feature: "Features",
    },
    genome_feature: {
      genome_feature: "Genome Features",
    },
    epitope: {
      epitope: "Epitopes",
    },
    experiment: {
      experiment: "Experiments",
      bioset: "Biosets",
    },
    protein_feature: {
      protein_feature: "Domains and Motifs",
    },
    protein_structure: {
      protein_structure: "Protein Structures",
    },
    serology: {
      serology: "Serology",
    },
    strain: {
      strain: "Strains",
    },
    surveillance: {
      surveillance: "Surveillance",
    },
    taxonomy: {
      taxonomy: "Taxa",
    },
  };

  const tabsForType = searchTypes[thistype || "genome"];
  const tablist = Object.keys(tabsForType);

  return (
    <WithGenomePanel
      tabs={tablist}
      selectedRows={selectedRows}
      setSelectedRows={setSelectedRows} // cascade down
    >
      {({ activeTab, setActiveTab }) => (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[85vh]">
          <TabsList className="pb-0 mb-0 bg-background">
            {Object.entries(tabsForType).map(([term, label]) => (
              <TabsTrigger key={term} value={term} className="...">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.keys(tabsForType).map((term) => (
            <TabsContent
              key={term}
              value={term}
              className="border-0 mt-0 px-0 pt-[5px] flex-1 flex flex-col overflow-hidden"
            >
              <ListData
                resource={term}
                q={finalQ}
                onSelectionChange={setSelectedRows} // still passed to ListData
              />
            </TabsContent>
          ))}
        </Tabs>
      )}
    </WithGenomePanel>
  );
}
