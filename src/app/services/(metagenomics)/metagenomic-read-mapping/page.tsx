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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ServiceHeader } from "@/components/services/service-header";
import { ChevronRight, Info } from "lucide-react";
import SearchReadLibrary from "@/components/services/search-read-library";
import SelectedItemsTable from "@/components/services/selected-items-table";
import SearchWorkspaceInput from "@/components/services/search-workspace-input";

interface Library {
  id: string;
  name: string;
  type: "paired" | "single" | "sra";
}

const MetagenomicReadMappingService = () => {
  const [sraAccession, setSraAccession] = useState("");
  const [selectedLibraries, setSelectedLibraries] = useState<Library[]>([]);
  const [geneSetType, setGeneSetType] = useState("predefined_list");

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

  return (
    <section>
      <ServiceHeader
        title="Metagenomic Read Mapping"
        tooltipContent="Metagenomic Read Mapping Information"
        description="The Metagenomic Read Mapping Service uses KMA to align reads against
          antibiotic resistance genes from CARD and virulence factors from VFDB."
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="md:col-span-7">
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
                  <Label className="service-card-label">
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
                    className="service-card-input"
                    placeholder="SRR"
                    value={sraAccession}
                    onChange={(e) => setSraAccession(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-5">
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

        <div className="md:col-span-12">
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
                <div className="flex w-full flex-col gap-4 space-y-4 md:flex-row md:space-y-0">
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
                      defaultValue="predefined_list"
                      className="service-radio-group"
                      onValueChange={setGeneSetType}
                    >
                      <div className="service-radio-group-item">
                        <RadioGroupItem
                          value="predefined_list"
                          id="predefined_list"
                        />
                        <Label htmlFor="predefined_list" className="text-sm">
                          Predefined List
                        </Label>
                      </div>
                      <div className="service-radio-group-item">
                        <RadioGroupItem value="fasta_file" id="fasta_file" />
                        <Label htmlFor="fasta_file" className="text-sm">
                          FASTA File
                        </Label>
                      </div>
                      <div className="service-radio-group-item">
                        <RadioGroupItem
                          value="feature_group"
                          id="feature_group"
                        />
                        <Label htmlFor="feature_group" className="text-sm">
                          Feature Group
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                {geneSetType === "predefined_list" && (
                  <div className="w-full">
                    <Label className="service-card-label">
                      Predefined Gene Set Name
                    </Label>
                    <Select defaultValue="card">
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select Genome Group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="card">CARD</SelectItem>
                        <SelectItem value="vfdb">VFDB</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {geneSetType === "fasta_file" && (
                  <div className="w-full">
                    <SearchWorkspaceInput
                      title="Gene Set FASTA"
                      placeholder="Select Gene Set FASTA File..."
                    />
                  </div>
                )}

                {geneSetType === "feature_group" && (
                  <div className="w-full">
                    <SearchWorkspaceInput
                      title="Gene Set Feature Group"
                      placeholder="Select Gene Set Feature Group..."
                    />
                  </div>
                )}

                <div className="space-y-6">
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
                </div>
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

export default MetagenomicReadMappingService;
