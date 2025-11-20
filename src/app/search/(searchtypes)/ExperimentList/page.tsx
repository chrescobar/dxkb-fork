"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React from 'react';
import { useSearchParams } from "next/navigation";
import { ListData } from "@/components/services/ListData";
import { useSelection } from "../SelectionContext";
import { WithGenomePanel } from "@/components/layouts/WithGenomePanel";

export default function Experiments() {

    const searchParams = useSearchParams();
    const q = searchParams.get('q');
    const { setSelectedRows } = useSelection();

    return(
           <WithGenomePanel tabs={['experiment','bioset']}>
             {({ activeTab, setActiveTab }) => (
          <Tabs className="h-[85vh]" value={activeTab} onValueChange={setActiveTab} >
            <TabsList className="pb-0 mb-0 bg-background">
          <TabsTrigger 
                value="experiment" 
                className="border-primary bg-primary text-secondary data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary hover:text-primary mx-[2px]"
                >
                Experiments
            </TabsTrigger>
            <TabsTrigger 
                value="bioset" 
                className="border-primary bg-primary text-secondary data-[state=active]:bg-secondary data-[state=active]:text-primary hover:bg-secondary hover:text-primary mx-[2px]"
                >
                Biosets
            </TabsTrigger>
          </TabsList>
          <TabsContent value="experiment" className="border-0 mt-0 px-0 pt-[5px] flex-1 flex flex-col overflow-hidden">
            <ListData resource="experiment" q={{q}} onSelectionChange={setSelectedRows} />
          </TabsContent>
          <TabsContent value="bioset" className="border-0 mt-0 px-0 pt-[5px] flex-1 flex flex-col overflow-hidden">
            <ListData resource="bioset" q={{q}} onSelectionChange={setSelectedRows} />
          </TabsContent>
        </Tabs>
          )}
        </WithGenomePanel>
    );
}; 
