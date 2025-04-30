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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";
import { Info, ChevronRight, ChevronDown } from "lucide-react";
import { ServiceHeader } from "@/components/services/service-header";
import SearchWorkspaceInput from "@/components/services/search-workspace-input";
import SearchReadLibrary from "@/components/services/search-read-library";
import SelectedItemsTable from "@/components/services/selected-items-table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { NumberInput } from "@/components/ui/number-input";

interface Library {
  id: string;
  name: string;
  type: "paired" | "single" | "sra";
}

const MetagenomicBinningService = () => {
  const [sraAccession, setSraAccession] = useState("");
  const [selectedLibraries, setSelectedLibraries] = useState<Library[]>([]);
  const [showAdvanced, setAdvanced] = useState(false);
  const [startingDataType, setStartingDataType] = useState("read_file");

  const removeFromSelectedLibraries = (id: string) => {
    setSelectedLibraries(selectedLibraries.filter((lib) => lib.id !== id));
  };

  const handlePairedLibraryAdd = (files: {
    first: string;
    second?: string;
  }) => {
    if (!files.second) return;
    const newId = Date.now();
    setSelectedLibraries([
      ...selectedLibraries,
      {
        id: `paired-${newId}`,
        name: `${files.first} / ${files.second}`,
        type: "paired",
      },
    ]);
  };

  const handleSingleLibraryAdd = (files: { first: string }) => {
    const newId = Date.now();
    setSelectedLibraries([
      ...selectedLibraries,
      {
        id: `single-${newId}`,
        name: files.first,
        type: "single",
      },
    ]);
  };

  const handleSraAdd = () => {
    if (
      sraAccession.trim() &&
      !selectedLibraries.some((lib) => lib.name === sraAccession)
    ) {
      setSelectedLibraries([
        ...selectedLibraries,
        {
          id: `sra-${Date.now()}`,
          name: sraAccession,
          type: "sra",
        },
      ]);
      setSraAccession("");
    }
  };

  return (
    <section>
      <ServiceHeader
        title="Metagenomic Binning"
        tooltipContent="Metagenomic Binning Information"
        description="The Metagenomic Binning Service accepts either reads or contigs, and
          attempts to 'bin' the data into a set of genomes. This service can be
          used to reconstruct bacterial and archaeal genomes from environmental
          samples."
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="md:col-span-12" id="start-with-section">
          {/* Start With Section */}
          <Card>
            <CardHeader className="service-card-header">
              <CardTitle className="service-card-title">
                Start With
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="service-card-tooltip-icon" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select your starting data type</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>

            <CardContent className="service-card-content">
              <RadioGroup
                defaultValue="read_file"
                className="flex flex-row gap-4"
                onValueChange={setStartingDataType}
              >
                <div className="service-radio-group-item">
                  <RadioGroupItem value="read_file" id="read_file" />
                  <Label htmlFor="read_file">Read Files</Label>
                </div>
                <div className="service-radio-group-item">
                  <RadioGroupItem
                    value="assembled_contigs"
                    id="assembled_contigs"
                  />
                  <Label htmlFor="assembled_contigs">Assembled Contigs</Label>
                </div>
              </RadioGroup>
            </CardContent>
          </Card>
        </div>

        {startingDataType === "read_file" && (
          <>
            <div className="md:col-span-7" id="input-file-section">
              {/* Input File Section */}
              <Card>
                <CardHeader className="service-card-header">
                  <CardTitle className="service-card-title">
                    Input File
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          <Info className="service-card-tooltip-icon" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Select your input files here</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </CardTitle>
                </CardHeader>

                <CardContent className="service-card-content space-y-6">
                  <SearchReadLibrary
                    title="Paired Read Library"
                    firstPlaceholder="Select File 1..."
                    secondPlaceholder="Select File 2..."
                    variant="pair"
                    onAdd={handlePairedLibraryAdd}
                  />

                  <SearchReadLibrary
                    title="Single Read Library"
                    firstPlaceholder="Select File 1..."
                    variant="single"
                    onAdd={handleSingleLibraryAdd}
                  />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="mb-1 block text-sm font-medium">
                        SRA Run Accession
                      </Label>
                      <div className="bg-border mx-4 h-[1px] flex-1" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleSraAdd}
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

            <div className="md:col-span-5" id="selected-libraries-section">
              {/* Selected Libraries Section */}
              <Card>
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
                <CardContent>
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
                  />
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {startingDataType === "assembled_contigs" && (
          <div className="md:col-span-12" id="assembled-contigs-section">
            <Card>
              <CardHeader className="service-card-header">
                <CardTitle className="service-card-title">
                  Input File
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="service-card-tooltip-icon" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select your input files here</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>

              <CardContent className="service-card-content space-y-6">
                <SearchWorkspaceInput
                  title="Assembled Contigs"
                  placeholder="Select Assembled Contigs..."
                />
              </CardContent>
            </Card>
          </div>
        )}

        <div className="md:col-span-12" id="parameters-section">
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
                      <p>Configure analysis parameters</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-6">
                <div className="flex w-full flex-col gap-4 md:flex-row">
                  {startingDataType === "read_file" && (
                    <div className="w-full">
                      <div className="flex items-center gap-2">
                        <Label className="service-card-label">
                          Assembly Strategy
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="service-card-tooltip-icon" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Select the assembly strategy</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <RadioGroup
                        defaultValue="metaspades"
                        className="service-radio-group"
                      >
                        <div className="service-radio-group-item">
                          <RadioGroupItem value="metaspades" id="metaspades" />
                          <Label htmlFor="metaspades" className="text-sm">
                            MetaSPAdes
                          </Label>
                        </div>
                        <div className="service-radio-group-item">
                          <RadioGroupItem value="megahit" id="megahit" />
                          <Label htmlFor="megahit" className="text-sm">
                            MEGAHIT
                          </Label>
                        </div>
                        <div className="service-radio-group-item">
                          <RadioGroupItem value="auto" id="auto" />
                          <Label htmlFor="auto" className="text-sm">
                            Auto
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  )}

                  <div className="w-full">
                    <div className="flex items-center gap-2">
                      <Label className="service-card-label">
                        Organisms of Interest
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="service-card-tooltip-icon" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Select organisms of interest</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <RadioGroup
                      defaultValue="bacteria_archaea"
                      className="service-radio-group"
                    >
                      <div className="service-radio-group-item">
                        <RadioGroupItem
                          value="bacteria_archaea"
                          id="bacteria_archaea"
                        />
                        <Label htmlFor="bacteria_archaea" className="text-sm">
                          Bacteria/Archaea
                        </Label>
                      </div>
                      <div className="service-radio-group-item">
                        <RadioGroupItem value="viruses" id="viruses" />
                        <Label htmlFor="viruses" className="text-sm">
                          Viruses
                        </Label>
                      </div>
                      <div className="service-radio-group-item">
                        <RadioGroupItem value="both" id="both" />
                        <Label htmlFor="both" className="text-sm">
                          Both
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <div className="mt-4 space-y-6">
                  <SearchWorkspaceInput
                    title="Output Folder"
                    placeholder="Select Output Folder"
                  />

                  <div>
                    <Label className="service-card-label">Output Name</Label>
                    <Input defaultValue="" placeholder="Output Name" />
                  </div>

                  <div>
                    <Label className="service-card-label">
                      Genome Group Name
                    </Label>
                    <Input defaultValue="" placeholder="My Genome Group" />
                  </div>
                </div>

                <Collapsible
                  open={showAdvanced}
                  onOpenChange={setAdvanced}
                  className="service-collapsible-container"
                >
                  <CollapsibleTrigger className="service-collapsible-trigger text-sm font-medium">
                    Advanced Parameters
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180 transform" : ""}`}
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="mt-6 space-y-2">
                      <div className="mx-2 flex items-center gap-2">
                        <Checkbox id="disable_search" />
                        <Label htmlFor="disable_search">
                          Disable Search For Dangling Contigs (Decreases Memory
                          Use)
                        </Label>
                      </div>

                      <div className="service-card-content-grid">
                        <div>
                          <Label className="service-card-sublabel">
                            Minimum Contig Length
                          </Label>
                          <NumberInput
                            id="minimum-contig-length"
                            defaultValue={300}
                            min={100}
                            max={100000}
                            stepper={10}
                          />
                        </div>

                        <div>
                          <Label className="service-card-sublabel">
                            Minimum Contig Coverage
                          </Label>
                          <NumberInput
                            id="minimum-contig-coverage"
                            defaultValue={5}
                            min={0}
                            max={100000}
                            stepper={1}
                          />
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>

          <div className="service-form-controls">
            <Button variant="outline">Reset</Button>
            <Button>Submit</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default MetagenomicBinningService;
