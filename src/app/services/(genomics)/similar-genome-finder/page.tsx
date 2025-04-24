"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Info,
  FileDown,
  Search,
  ExternalLink,
  Database,
  BarChart4,
  ChevronDown,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { LuLinkedin } from "react-icons/lu";
const SimilarGenomeFinderInterface = () => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="service-container container">
      <div className="service-header">
        <div className="service-header-title">
          <h1>Similar Genome Finder</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="service-header-tooltip" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-[300px] space-y-2">
                  <p>
                    Specifies the genome to use as the basis for finding other
                    similar genomes. Search by Genome Name or Genome ID.
                    Selection box for specifying genome to use as the basis of
                    comparison, or upload a FASTA file.
                  </p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <a href="#">
            <ExternalLink className="h-5 w-5" />
          </a>
          <a href="#">
            <LuLinkedin className="service-header-tooltip" />
          </a>
        </div>
        <div className="service-header-description">
          <p>
            The Similar Genome Finder Service will find similar public genomes in
            BV-BRC or compute genome distance estimation using Mash/MinHash. It
            returns a set of genomes matching the specified similarity criteria.
            {" "}
            <a
              href="#"
            >
              Link to Mash/MinHash
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
            . For further explanation, please see the Similar Genome Finder
            Service:
            <a href="#" className="mx-1 text-indigo-600 hover:text-indigo-800">
              Quick Reference Guide
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
            ,
            <a href="#" className="mx-1 text-indigo-600 hover:text-indigo-800">
              Tutorial
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>{" "}
            and
            <a href="#" className="ml-1 text-indigo-600 hover:text-indigo-800">
              Instructional Video
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
            .
          </p>
        </div>
      </div>

      <form className="service-form-section">
        {/* Select a Genome Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <CardTitle className="text-lg">Select a Genome</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="ml-2">
                    <Info className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-md">
                      Choose a genome to find similar matches
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="font-medium text-gray-700">
                  Search by Genome Name or Genome ID
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter a genome name or ID to search</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>

              <div className="flex space-x-2">
                <Input
                  placeholder="e.g. Mycobacterium tuberculosis H37Rv"
                  className="flex-1"
                />
                <Button variant="outline" className="flex-shrink-0">
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-gray-700">
                Or Upload FASTA/FASTQ
              </Label>
              <div className="flex space-x-2">
                <Input type="file" className="flex-1" />
                <Button variant="outline" className="ml-2" size="icon">
                  <FileDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Parameters Section */}
            <Collapsible
              open={showAdvanced}
              onOpenChange={setShowAdvanced}
              className="service-collapsible-container"
            >
              <CollapsibleTrigger className="service-collapsible-trigger">
                Advanced Options
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180 transform" : ""}`}
                />
              </CollapsibleTrigger>
              <CollapsibleContent className="service-collapsible-content">
                <div className="flex flex-col justify-between w-full space-y-4">
                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label className="font-medium text-gray-700">
                          Max Hits
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="ml-2">
                              <Info className="h-4 w-4 text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Maximum number of similar genomes to return</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select defaultValue="50">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="50" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1</SelectItem>
                          <SelectItem value="10">10</SelectItem>
                          <SelectItem value="50">50</SelectItem>
                          <SelectItem value="100">100</SelectItem>
                          <SelectItem value="200">200</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label className="font-medium text-gray-700">
                          P-Value Threshold
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="ml-2">
                              <Info className="h-4 w-4 text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Statistical significance threshold</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select defaultValue="1">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="1" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.001">0.001</SelectItem>
                          <SelectItem value="0.01">0.01</SelectItem>
                          <SelectItem value="0.1">0.1</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Label className="font-medium text-gray-700">
                          Distance
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="ml-2">
                              <Info className="h-4 w-4 text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Maximum Mash distance to include</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Select defaultValue="1">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="1" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.01">0.01</SelectItem>
                          <SelectItem value="0.05">0.05</SelectItem>
                          <SelectItem value="0.1">0.1</SelectItem>
                          <SelectItem value="0.5">0.5</SelectItem>
                          <SelectItem value="1">1</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <div className="flex flex-col gap-2">
                        <Label className="font-medium text-gray-700">
                          Organism Type
                        </Label>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="bacteria" defaultChecked />
                          <Label
                            htmlFor="bacteria"
                            className="text-sm font-normal"
                            >
                            Bacterial and Archaeal Genomes
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="viral" />
                          <Label
                            htmlFor="viral"
                            className="text-sm font-normal"
                            >
                            Viral Genomes
                          </Label>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label className="font-medium text-gray-700">
                          Scope
                        </Label>
                        <RadioGroup className="gap-2">
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="all" />
                            <Label htmlFor="all" className="text-sm font-normal">
                              All Public Genomes
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="reference" />
                            <Label htmlFor="reference" className="text-sm font-normal">
                              Reference and Representative Genomes
                            </Label>
                          </div>
                        </RadioGroup>
                      </div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center pt-4">
          <Button
            type="submit"
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </form>

      {/* Results Section - Would appear after search */}
      <div className="mx-auto mt-12 hidden max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Search Results</CardTitle>
            <CardDescription>
              Found 15 similar genomes (showing top 10)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Results table would go here */}
            <div className="overflow-hidden rounded-md border">
              <table className="w-full text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-2 text-left">Genome</th>
                    <th className="px-4 py-2 text-left">Organism</th>
                    <th className="px-4 py-2 text-left">Distance</th>
                    <th className="px-4 py-2 text-left">P-value</th>
                    <th className="px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Sample result rows */}
                  <tr className="border-t">
                    <td className="px-4 py-2">Genome 1</td>
                    <td className="px-4 py-2">Organism A</td>
                    <td className="px-4 py-2">0.02</td>
                    <td className="px-4 py-2">0.001</td>
                    <td className="px-4 py-2">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Database className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-t">
                    <td className="px-4 py-2">Genome 2</td>
                    <td className="px-4 py-2">Organism B</td>
                    <td className="px-4 py-2">0.05</td>
                    <td className="px-4 py-2">0.003</td>
                    <td className="px-4 py-2">
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Database className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline">
              <FileDown className="mr-2 h-4 w-4" />
              Export Results
            </Button>
            <Button variant="outline">
              <BarChart4 className="mr-2 h-4 w-4" />
              Visualize Comparisons
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default SimilarGenomeFinderInterface;
