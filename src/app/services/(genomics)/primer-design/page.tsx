"use client";

import { useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Info,
  FileDown,
  ExternalLink,
  ChevronDown,
} from "lucide-react";
import { LuLinkedin } from "react-icons/lu";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const PrimerDesignInterface = () => {
  const [sequenceInputMethod, setSequenceInputMethod] = useState("paste");
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="service-container container">
      <div className="service-header">
        <div className="service-header-title">
          <h1>Primer Design</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="service-header-tooltip" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-md">Design primers for PCR amplification</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <a href="#" className="space-x-2">
            <ExternalLink className="service-header-tooltip" />
            <LuLinkedin className="service-header-tooltip" />
          </a>
        </div>
        <div className="service-header-description">
          <p>
            The Primer Design Service utilizes Primer3 to design primers from a
            given input sequence under a variety of temperature, size, and
            concentration constraints. For further explanation, please see the
            Primer Design Service
            <a href="#" className="mx-1 text-indigo-600 hover:text-indigo-800">
              Quick Reference Guide
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
            ,
            <a href="#" className="ml-1 text-indigo-600 hover:text-indigo-800">
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
        {/* Input Sequence Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <CardTitle className="service-form-section-header">
                Input Sequence
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-md">
                        Enter your DNA sequence to design primers
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Input Method Tabs */}
            <Tabs
              defaultValue="paste"
              value={sequenceInputMethod}
              onValueChange={setSequenceInputMethod}
              className="w-full"
            >
              <TabsList className="mb-4 grid w-full grid-cols-2">
                <TabsTrigger value="paste">Paste Sequence</TabsTrigger>
                <TabsTrigger value="workspace">Workspace FASTA</TabsTrigger>
              </TabsList>

              {/* Paste Sequence Content */}
              <TabsContent value="paste" className="mt-0">
                {/* Sequence Identifier */}
                <div className="mb-4 space-y-2">
                  <Label>Sequence Identifier</Label>
                  <Input placeholder="Identifier for input sequence" />
                </div>

                <div className="space-y-2">
                  <Label>Paste Sequence</Label>
                  <Textarea
                    placeholder="Enter nucleotide sequence"
                    className="min-h-32 max-h-96 font-mono text-sm"
                  />
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <Label className="font-medium text-gray-700">
                    Mark Selected Region
                  </Label>
                  <div className="flex space-x-1">
                    <Button variant="outline" size="sm" className="h-8 px-2">
                      <span>{"< >"}</span>
                    </Button>
                    <div className="flex space-x-1">
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <span>[ ]</span>
                      </Button>
                      <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                        <span>{"{ }"} </span>
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" className="h-8">
                      clear
                    </Button>
                  </div>
                </div>
              </TabsContent>

              {/* Workspace FASTA Content */}
              <TabsContent value="workspace" className="mt-0">
                <div className="space-y-2">
                  <Label>Select FASTA File</Label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Select a FASTA file from workspace"
                      className="flex-1"
                    />
                    <Button variant="outline" type="button">
                      Browse
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>

            {/* Mark Selected Region */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center space-x-2">
                <Switch id="pick-internal-oligo" defaultChecked={true} />
                <Label htmlFor="pick-internal-oligo" className="text-sm">
                  Pick Internal Oligo
                </Label>
              </div>
            </div>

            {/* Product Size Range */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center">
                <Label>Product Size Range (BP)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-[300px] space-y-2">
                        <p>
                          Minimum, Optimum, and Maximum lengths (in bases) of the PCR product.
                          Primer3 will not generate primers with products shorter than Min or
                          longer than Max, and with default arguments Primer3 will attempt
                          to pick primers producing products close to the Optimum length.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <Input defaultValue="50-200" />
            </div>

            {/* Primer Size */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label>Primer Size (BP)</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="max-w-[300px] space-y-2">
                        <p>
                          Minimum, Optimum, and Maximum lengths (in bases) of a primer oligo.
                          Primer3 will not pick primers shorter than Min or longer than Max, and with default arguments will attempt to pick primers close with size close to Opt.
                          Min cannot be smaller than 1. Max cannot be larger than 36. (This limit is governed by maximum oligo size for which melting-temperature calculations are valid.)
                          Min cannot be greater than Max.
                        </p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Min</Label>
                  <Input defaultValue="18" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Opt</Label>
                  <Input defaultValue="20" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-gray-500">Max</Label>
                  <Input defaultValue="27" />
                </div>
              </div>
            </div>

            {/* Excluded Regions */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label>Excluded Regions</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Regions to avoid when designing primers</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex flex-row items-center">
                {"<"}
                <Input
                  placeholder="401,7 68,3 forbids primers in the 7 bases starting at 401 and the 3 bases at 68."
                  className="w-full m-2"
                />
                {">"}
              </div>
            </div>

            {/* Target Region */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label className="font-medium text-gray-700">
                  Target Region
                </Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Regions that must be included in the PCR product</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex flex-row items-center">
                {"["}
                <Input
                  placeholder="50,2 requires primers to surround the 2 bases at positions 50 and 51."
                  className="w-full m-2"
                />
                {"]"}
              </div>
            </div>

            {/* Included Regions */}
            <div className="space-y-2">
              <div className="flex items-center">
                <Label>Included Regions</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Regions where primers must be selected</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="flex flex-row items-center">
                {"{"}
                <Input
                  placeholder="20,400: only pick primers in the 400 base region starting at position 20."
                  className="w-full m-2"
                />
                {"}"}
              </div>
            </div>

            {/* Primer Overlap Positions */}
            <div className="space-y-2">
              <Label>Primer Overlap Positions</Label>
              <div className="flex flex-row items-center">
                {"-"}
                <Input
                  placeholder="Space-separated list of positions. The forward OR reverse primer will overlap one."
                  className="w-full m-2"
                />
                {"-"}
              </div>
            </div>

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
              <CollapsibleContent className="space-y-4">
                <div className="space-y-6 px-2 py-4">
                  <div className="flex flex-row items-center">
                    <div className="space-y-2 w-full">
                      <div className="flex flex-row items-center">
                        <Label className="font-medium text-gray-700">
                          Number to Return
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger className="ml-2">
                              <Info className="h-4 w-4 text-gray-500" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <div className="max-w-[300px] space-y-2">
                                <p>
                                The maximum number of primer pairs to return. Primer pairs returned are sorted by their 'quality', in
                                other words by the value of the objective function (where a lower number indicates a better primer
                                pair). Caution: setting this parameter to a large value will increase running time.
                                </p>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <Input placeholder="Max number of primers to return (5)" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label className="font-medium text-gray-700">
                        Primer Tm (°C)
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="ml-2">
                            <Info className="h-4 w-4 text-gray-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-[300px] space-y-2">
                              <p>
                                Minimum, Optimum, and Maximum melting temperatures (Celsius) for a primer oligo. Primer3 will not
                                pick oligos with temperatures smaller than Min or larger than Max, and with default conditions will try
                                to pick primers with melting temperatures close to Opt.
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Min</Label>
                        <Input defaultValue="57.0" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Opt</Label>
                        <Input defaultValue="60.0" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Max</Label>
                        <Input defaultValue="63.0" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Max TM Difference</Label>
                        <Input defaultValue="100.0" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Label className="font-medium text-gray-700">
                        Primer GC%
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger className="ml-2">
                            <Info className="h-4 w-4 text-gray-500" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="max-w-[300px] space-y-2">
                              <p>
                                Minimum, Optimum, and Maximum percentage of Gs and Cs in any primer or oligo.
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Min</Label>
                        <Input defaultValue="20.0" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Opt</Label>
                        <Input defaultValue="50.0" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-gray-500">Max</Label>
                        <Input defaultValue="80.0" />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="font-medium text-gray-700">
                        Concentration of Monovalent Cations (MM)
                      </Label>
                      <Input defaultValue="50.0" />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-gray-700">
                        Concentration of Divalent Cations (MM)
                      </Label>
                      <Input defaultValue="1.5" />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-gray-700">
                        Annealing Oligo Concentration (MM)
                      </Label>
                      <Input defaultValue="50.0" />
                    </div>

                    <div className="space-y-2">
                      <Label className="font-medium text-gray-700">
                        Concentration of DNTPS (MM)
                      </Label>
                      <Input defaultValue="0.6" />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardContent>
        </Card>
        {/* Output Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <CardTitle className="text-lg">Output</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="ml-2">
                    <Info className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-md">Configure output settings</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* TODO: Add Workspace folder picker */}
            <div className="space-y-2">
              <Label className="font-medium text-gray-700">Output Folder</Label>
              <div className="flex items-center">
                <Input placeholder="Select output folder" className="flex-1" />
                <Button variant="outline" className="ml-2" size="icon">
                  <FileDown className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-gray-700">Output Name</Label>
              <Input placeholder="Output Name" />
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-center space-x-4 pt-4">
          <Button variant="outline" type="reset">
            Reset
          </Button>
          <Button
            type="submit"
            className="bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Submit
          </Button>
        </div>
      </form>
    </div>
  );
};

export default PrimerDesignInterface;
