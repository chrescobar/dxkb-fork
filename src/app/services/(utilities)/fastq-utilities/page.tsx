"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ServiceHeader } from "@/components/services/service-header";
import { Info, Plus, ChevronRight } from "lucide-react";
import SearchWorkspaceInput from "@/components/services/search-workspace-input";
import SelectedItemsTable from "@/components/services/selected-items-table";
import SearchReadLibrary from "@/components/services/search-read-library";
import {
  handlePairedLibraryAdd,
  handleSingleLibraryAdd,
  handleSraAdd,
} from "@/lib/service-utils";
import { Library } from "@/types/services";

const pipelineActions = [
  { id: "trim", name: "Trim" },
  { id: "paired_filter", name: "Paired Filter" },
  { id: "fastqc", name: "FastQC" },
  { id: "align", name: "Align" },
  { id: "scrub_human", name: "Scrub Human" },
] as const;

// Define a set of colors to cycle through
const actionColors = [
  "bg-purple-500",
  "bg-red-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
] as const;

const actionShapes = [
  "circle",
  "square",
  "diamond",
] as const;

interface PipelineAction {
  id: string;
  name: string;
  color?: string;
  shape?: string;
}

const FastqUtilitiesService = () => {
  const [sraAccession, setSraAccession] = useState("");
  const [selectedLibraries, setSelectedLibraries] = useState<Library[]>([]);
  const [srlPlatform, setSRLPlatform] = useState("illumina");
  const [selectedPipelineActions, setSelectedPipelineActions] = useState<PipelineAction[]>([]);
  const [selectedAction, setSelectedAction] = useState<string>("");
  const [lastColorIndex, setLastColorIndex] = useState(0);
  const [lastShapeIndex, setLastShapeIndex] = useState(0);

  const getNextColor = () => {
    const color = actionColors[lastColorIndex % actionColors.length];
    setLastColorIndex(prev => prev + 1);
    return color;
  };

  const getNextShape = () => {
    const shape = actionShapes[lastShapeIndex % actionShapes.length];
    setLastShapeIndex(prev => prev + 1);
    return shape;
  };

  const removeFromSelectedPipelineActions = (id: string) => {
    setSelectedPipelineActions(
      selectedPipelineActions.filter((action) => action.id !== id),
    );
  };

  const removeFromSelectedLibraries = (id: string) => {
    setSelectedLibraries(selectedLibraries.filter((lib) => lib.id !== id));
  };

  return (
    <section>
      <ServiceHeader
        title="FastQ Utilities"
        tooltipContent="FastQ Utilities Information"
        description="The FastQ Utilities Service provides capability for aligning,
          measuring base call quality, and trimming fastq read files."
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="md:col-span-7">
          {/* Parameters Section */}
          <Card>
            <CardHeader className="service-card-header">
              <CardTitle className="service-card-title">
                Parameters
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="service-card-tooltip-icon" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Configure output parameters</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>

            <CardContent className="service-card-content">
              <SearchWorkspaceInput
                title="Output Folder"
                placeholder="Select Output Folder"
              />

              <div>
                <Label className="service-card-label">Output Name</Label>
                <Input
                  placeholder="Output Name"
                  className="service-card-input"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-5">
          {/* Pipeline Section */}
          <Card>
            <CardHeader className="service-card-header">
              <CardTitle className="service-card-title">
                Pipeline
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="service-card-tooltip-icon" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Configure pipeline settings</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>

            <CardContent className="service-card-content space-y-4">
              <div>
                <Label className="service-card-label mb-2 block">Select Action</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={selectedAction}
                    onValueChange={setSelectedAction}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Action" />
                    </SelectTrigger>
                    <SelectContent>
                      {pipelineActions.map((action) => (
                        <SelectItem 
                          key={action.id} 
                          value={action.id}
                        >
                          {action.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (selectedAction) {
                        const actionInfo = pipelineActions.find(
                          (action) => action.id === selectedAction
                        );
                        if (actionInfo) {
                          setSelectedPipelineActions([
                            ...selectedPipelineActions,
                            {
                              id: `${selectedAction}_${Date.now()}`,
                              name: actionInfo.name,
                              color: getNextColor(),
                              shape: getNextShape(),
                            },
                          ]);
                          // setSelectedAction(""); // Reset selection after adding
                        }
                      }
                    }}
                    disabled={!selectedAction}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <SelectedItemsTable
                title=""
                description=""
                items={selectedPipelineActions}
                onRemove={removeFromSelectedPipelineActions}
                className="max-h-48 overflow-y-auto"
              />

              <div>
                <Label className="service-card-label">Target Genome</Label>
                <Select disabled={true}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="e.g. Mycobacterium tuberculosis H37Rv" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="trim">Trim</SelectItem>
                    <SelectItem value="paired_filter">Paired Filter</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-7">
          {/* Input Sections */}
          <div className="space-y-6">
            {/* Paired Read Library */}
            <Card>
              <CardHeader className="service-card-header">
                <CardTitle className="service-card-title">
                  Paired Read Library
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="service-card-tooltip-icon" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select paired-end read files</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>

              <CardContent className="service-card-content">
                <SearchReadLibrary
                  title="Paired Read Library"
                  firstPlaceholder="Select File 1..."
                  secondPlaceholder="Select File 2..."
                  variant="pair"
                  onAdd={(files) => {
                    const newLibraries = handlePairedLibraryAdd(files, selectedLibraries);
                    setSelectedLibraries(newLibraries);
                  }}
                />
              </CardContent>
            </Card>

            {/* Single Read Library */}
            <Card>
              <CardHeader className="service-card-header">
                <CardTitle className="service-card-title">
                  Single Read Library
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="service-card-tooltip-icon" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select single-end read file</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>

              <CardContent className="service-card-content">
                <div className="flex flex-col gap-2">
                  <Label className="service-card-label">Platform</Label>
                  <Select value={srlPlatform} onValueChange={setSRLPlatform}>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        defaultValue="illumina"
                        placeholder="Select a Platform..."
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="illumina">Illumina</SelectItem>
                      <SelectItem value="pacbio">PacBio</SelectItem>
                      <SelectItem value="nanopore">Nanopore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <SearchReadLibrary
                  title="Paired Read Library"
                  firstPlaceholder="Select File 1..."
                  secondPlaceholder="Select File 2..."
                  variant="single"
                  onAdd={(files) => {
                    const newLibraries = handleSingleLibraryAdd(files, selectedLibraries);
                    setSelectedLibraries(newLibraries);
                  }}
                />
              </CardContent>
            </Card>

            {/* SRA Run Accession */}
            <Card>
              <CardHeader className="service-card-header">
                <CardTitle className="service-card-title">
                  SRA Run Accession
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="service-card-tooltip-icon" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Provide SRA accession number</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>

              <CardContent className="service-card-content">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="mb-1 block text-sm font-medium">
                      SRA Run Accession
                    </Label>
                    <div className="bg-border mx-4 h-[1px] flex-1" />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        const newLibraries = handleSraAdd(sraAccession, selectedLibraries);
                        if (newLibraries) {
                          setSelectedLibraries(newLibraries);
                          setSraAccession("");
                        }
                      }}
                      disabled={!sraAccession.trim()}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      className="flex-1"
                      placeholder="SRR"
                      value={sraAccession}
                      onChange={(e) => setSraAccession(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="md:col-span-5">
          {/* Selected Libraries Section */}
          <Card className="h-full max-h-full">
            <CardHeader className="service-card-header">
              <CardTitle className="service-card-title">
                Selected Libraries
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="service-card-tooltip-icon" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Place read files here using the arrow buttons</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription className="text-xs">
                Place read files here using the arrow buttons.
              </CardDescription>
            </CardHeader>

            <CardContent className="service-card-content max-h-150 overflow-y-auto">
              <SelectedItemsTable
                title="Selected Libraries"
                items={selectedLibraries.map((lib) => ({
                  id: lib.id,
                  name: lib.name,
                  type:
                    lib.type === "paired"
                      ? "Paired Read"
                      : lib.type === "single"
                        ? "Single Read"
                        : "SRA Accession",
                }))}
                onRemove={removeFromSelectedLibraries}
                className="max-h-150 overflow-y-auto"
              />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="service-form-controls">
        <Button variant="outline">Reset</Button>
        <Button>Submit</Button>
      </div>
    </section>
  );
};

export default FastqUtilitiesService;
