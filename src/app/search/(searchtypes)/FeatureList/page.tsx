"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React from 'react';
import { useSearchParams } from "next/navigation";
import { FeatureData } from "../../(searchdata)/FeatureListData/page";

export default function Features() {

    const searchParams = useSearchParams();
    const q = searchParams.get('q');

    return(
        <Tabs defaultValue="features" className="w-[95%] ml-[10px] h-[85vh]">
          <TabsList className="pb-0 mb-0">
            <TabsTrigger 
                value="features" 
                className="bg-primary-800 text-white data-[state=active]:bg-secondary-800 data-[state=active]:text-white mx-[2px]"
                >
                Features
            </TabsTrigger>
          </TabsList>
          <TabsContent value="features" className="border border-black mt-0 px-0 pt-[5px] flex-1 flex flex-col overflow-hidden">
            <FeatureData q={{q}} />
          </TabsContent>
        </Tabs>
    );
}; 
