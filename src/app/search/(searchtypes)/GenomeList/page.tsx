"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import React from 'react';
import { useSearchParams } from "next/navigation";
import { GenomeData } from "@/app/search/(searchdata)/GenomeListData/page";

export default function Genomes() {

    const searchParams = useSearchParams();
    const q = searchParams.get('q');

    return(
      <Tabs defaultValue="genomes" className="w-[95%] px-0 ml-[10px] h-[90%]">
        <TabsList className="pb-0 mb-0">
          <TabsTrigger value="genomes" className="mb-0">Genomes</TabsTrigger>
          <TabsTrigger value="features" className="mb-0">Features</TabsTrigger>
        </TabsList>
        <TabsContent value="genomes" className="border border-black mt-0 px-0">
          <GenomeData q={{q}} />
        </TabsContent>
        <TabsContent value="features">Change your password here.</TabsContent>
      </Tabs>
    );
}; 
