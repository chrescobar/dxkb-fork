"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React from 'react';
import { useSearchParams } from "next/navigation";
import { ListData } from '@/components/services/ListData';
import { useSelection } from "../SelectionContext";
import { WithGenomePanel } from "@/components/layouts/WithGenomePanel";

export default function Genomes() {

  const searchParams = useSearchParams();
  const q = searchParams.get("q");
  const { setSelectedRows } = useSelection();
  const activeTabParam = searchParams.get('activeTab');

    return(
      <WithGenomePanel tabs={['genome','genome_sequence','genome_amr','genome_feature']}
        {...(activeTabParam ? { activeTab: activeTabParam } : {})}>
        {({ activeTab, setActiveTab }) => (
        <Tabs className="h-[85vh]" value={activeTab} onValueChange={setActiveTab} >
          <TabsList className="pb-0 mb-0 bg-background">
          <TabsTrigger 
              value="genome" 
              className="border-primary bg-primary text-secondary data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary hover:text-primary mx-[2px]"
            >
              Genomes
            </TabsTrigger>
            <TabsTrigger 
              value="genome_sequence" 
              className="border-primary bg-primary text-secondary data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary hover:text-primary mx-[2px]"
            >
              Sequences
            </TabsTrigger>
            <TabsTrigger 
              value="genome_amr" 
              className="border-primary bg-primary text-secondary data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary hover:text-primary mx-[2px]"
            >
              AMR Phenotypes
            </TabsTrigger>
            <TabsTrigger 
              value="genome_feature" 
              className="border-primary bg-primary text-secondary data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary hover:text-primary mx-[2px]"
            >
              Features
            </TabsTrigger>
          </TabsList>
          <TabsContent value="genome" className="border-0 mt-0 px-0 pt-[5px] flex-1 flex flex-col overflow-hidden">
            <ListData resource="genome" q={{q}} onSelectionChange={setSelectedRows} />
          </TabsContent>
          <TabsContent value="genome_sequence" className="border-0 mt-0 px-0 pt-[5px] flex-1 flex flex-col overflow-hidden">
            <ListData resource="genome_sequence" q={{q}} onSelectionChange={setSelectedRows} />
          </TabsContent>
          <TabsContent value="genome_amr" className="border-0 mt-0 px-0 pt-[5px] flex-1 flex flex-col overflow-hidden">
            <ListData resource="genome_amr" q={{q}} onSelectionChange={setSelectedRows} />
          </TabsContent>
          <TabsContent value="genome_feature" className="border-0 mt-0 px-0 pt-[5px] flex-1 flex flex-col overflow-hidden">
            <ListData resource="genome_feature" q={{q}} onSelectionChange={setSelectedRows} />
          </TabsContent>
        </Tabs>
        )}
      </WithGenomePanel>
    );
}; 
