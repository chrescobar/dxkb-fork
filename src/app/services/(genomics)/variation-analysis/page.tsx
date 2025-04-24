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
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Info,
  FileDown,
  Search,
  Plus,
  ArrowRight,
  CircleX,
  ExternalLink,
  FileText,
  Dna,
} from "lucide-react";

interface Library {
  id: string;
  type: "paired" | "single" | "sra";
  name: string;
}

const VariationAnalysisInterface = () => {
  const [selectedLibraries, setSelectedLibraries] = useState<Library[]>([]);

  const addLibrary = (type: Library["type"], name?: string) => {
    const newLibrary: Library = {
      id: `lib_${selectedLibraries.length + 1}`,
      type,
      name: name || `Sample_${Math.floor(Math.random() * 9000) + 1000}.fastq`,
    };

    setSelectedLibraries([...selectedLibraries, newLibrary]);
  };

  const removeLibrary = (id: string) => {
    setSelectedLibraries(selectedLibraries.filter((lib) => lib.id !== id));
  };

  return (
    <section className="service-container container">
      <div className="service-header">
        <div className="service-header-title">
          <h1>Variation Analysis</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="service-header-tooltip" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="max-w-md space-y-2">
                  <p>Identify and annotate sequence variations</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <a href="#">
            <ExternalLink className="h-5 w-5" />
          </a>
        </div>
        <div className="service-header-description">
          <p>
            The Variation Analysis Service can be used to identify and annotate
            sequence variations. For further explanation, please see the
            Variation Analysis Service
            <a href="#">
              Quick Reference Guide
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>{" "}
            and
            <a href="#">
              Tutorial
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
            .
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="mx-auto grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Input File Section */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center">
                <CardTitle className="text-lg">Input File</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-md">
                        Select input files for analysis
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Paired Read Library */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-gray-700">
                    Paired Read Library
                  </Label>
                  <CircleX className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex space-x-2">
                  <Input placeholder="READ FILE 1" className="flex-1" />
                  <Button variant="outline" className="ml-2" size="icon">
                    <FileDown className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex space-x-2">
                  <Input placeholder="READ FILE 2" className="flex-1" />
                  <Button variant="outline" className="ml-2" size="icon">
                    <FileDown className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => addLibrary("paired", "Paired_Sample.fastq")}
                    variant="outline"
                    className="ml-2"
                    size="icon"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Single Read Library */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-gray-700">
                    Single Read Library
                  </Label>
                  <CircleX className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex space-x-2">
                  <Input placeholder="READ FILE" className="flex-1" />
                  <Button variant="outline" className="ml-2" size="icon">
                    <FileDown className="h-4 w-4" />
                  </Button>
                  <Button
                    onClick={() => addLibrary("single", "Single_Sample.fastq")}
                    variant="outline"
                    className="ml-2"
                    size="icon"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Separator />

              {/* SRA Run Accession */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-medium text-gray-700">
                    SRA Run Accession
                  </Label>
                  <CircleX className="h-4 w-4 text-gray-400" />
                </div>
                <div className="flex space-x-2">
                  <Input placeholder="SRR" className="flex-1" />
                  <Button
                    onClick={() => addLibrary("sra", "SRR1234567")}
                    variant="outline"
                    className="ml-2"
                    size="icon"
                  >
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selected Libraries Section */}
          <Card>
            <CardHeader className="service-card-header">
              <div className="flex items-center">
                <CardTitle className="text-lg">Selected Libraries</CardTitle>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-500" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-md">Files selected for analysis</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <CardDescription>
                Place read files here using the arrow buttons.
              </CardDescription>
            </CardHeader>
            <CardContent className="service-card-content">
              <div className="h-full max-h-72 overflow-y-scroll rounded-md border">
                {selectedLibraries.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-gray-400 italic">
                    No libraries selected
                  </div>
                ) : (
                  <div className="divide-y">
                    {selectedLibraries.map((lib) => (
                      <div
                        key={lib.id}
                        className="flex items-center justify-between p-2"
                      >
                        <div className="flex items-center">
                          <FileText className="mr-2 h-4 w-4 text-gray-500" />
                          <span className="text-sm">{lib.name}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-500"
                          onClick={() => removeLibrary(lib.id)}
                        >
                          <CircleX className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Parameters Section */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center">
              <CardTitle className="text-lg">Parameters</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="ml-2">
                    <Info className="h-4 w-4 text-gray-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-md">
                      Configure variation analysis parameters
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="service-card-content">
            <div className="space-y-2">
              <Label className="font-medium text-gray-700">
                Target Genome
              </Label>
              <div className="relative">
                <Input
                  placeholder="e.g. Mycobacterium tuberculosis H37Rv"
                  className="pl-9"
                />
                <Dna className="absolute top-2.5 left-3 h-4 w-4 text-gray-400" />
              </div>
            </div>

            <div className="flex flex-row w-full space-x-2">
              <div className="space-y-2 w-full">
                <Label className="font-medium text-gray-700">SNP Caller</Label>
                <Select defaultValue="freebayes">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select SNP caller" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freebayes">FreeBayes</SelectItem>
                    <SelectItem value="bcftools">BCFtools</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2 w-full">
                <Label className="font-medium text-gray-700">Aligner</Label>
                <Select defaultValue="bwa-mem">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select aligner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bwa-mem">BWA-mem</SelectItem>
                    <SelectItem value="bwa-mem-strict">BWA-mem-strict</SelectItem>
                    <SelectItem value="bowtie2">Bowtie2</SelectItem>
                    <SelectItem value="last">LAST</SelectItem>
                    <SelectItem value="minimap2">Minimap2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-row w-full space-x-2">
              <div className="space-y-2 w-full">
                <Label className="font-medium text-gray-700">Output Name</Label>
                <Input placeholder="Output Name" className="w-full" />
              </div>

              <div className="space-y-2 w-full">
                <Label className="font-medium text-gray-700">
                  Output Folder
                </Label>
                <div className="flex space-x-2">
                  <Input
                    placeholder="Select output folder"
                    className="w-full"
                  />
                  <Button variant="outline" className="ml-2" size="icon">
                    <FileDown className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Submit Buttons */}
      <div className="service-form-controls">
        <Button variant="outline" type="reset">
          Reset
        </Button>
        <Button type="submit">Submit</Button>
      </div>
    </section>
  );
};

export default VariationAnalysisInterface;
