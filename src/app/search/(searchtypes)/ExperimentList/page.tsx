"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React from 'react';
import { useSearchParams } from "next/navigation";
import { ExperimentData } from "../../(searchdata)/ExperimentsData/page";
import { BiosetData } from "../../(searchdata)/BiosetData/page";

export default function Experiments() {

    const searchParams = useSearchParams();
    const q = searchParams.get('q');

    return(
        <Tabs defaultValue="experiments" className="w-[95%] ml-[10px] h-[85vh]">
          <TabsList className="pb-0 mb-0">
          <TabsTrigger 
                value="experiments" 
                className="bg-primary-800 text-white data-[state=active]:bg-secondary-800 data-[state=active]:text-white mx-[2px]"
                >
                Experiments
            </TabsTrigger>
            <TabsTrigger 
                value="biosets" 
                className="bg-primary-800 text-white data-[state=active]:bg-secondary-800 data-[state=active]:text-white mx-[2px]"
                >
                Biosets
            </TabsTrigger>
          </TabsList>
          <TabsContent value="experiments" className="border border-black mt-0 px-0 pt-[5px] flex-1 flex flex-col overflow-hidden">
            <ExperimentData q={{q}} />
          </TabsContent>
          <TabsContent value="biosets" className="border border-black mt-0 px-0 pt-[5px] flex-1 flex flex-col overflow-hidden">
            <BiosetData q={{q}} />
          </TabsContent>
        </Tabs>
    );
}; 
