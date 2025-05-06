"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Info, ChevronRight, CircleHelp } from "lucide-react";
import { ServiceHeader } from "@/components/services/service-header";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import SearchWorkspaceInput from "@/components/services/search-workspace-input";
import { Library, primerOptions } from "@/types/services";
import SearchReadLibrary from "@/components/services/search-read-library";
import {
  handlePairedLibraryAdd,
  handleSingleLibraryAdd,
  handleSraAdd,
  removeFromSelectedLibraries,
} from "@/lib/service-utils";
import SelectedItemsTable from "@/components/services/selected-items-table";
import SraRunAccession from "@/components/services/sra-run-accession";

export default function GenomeAnalysis() {
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [outputFolder, setOutputFolder] = useState<string>("");
  const [outputName, setOutputName] = useState<string>("");
  const [analysisInput, setAnalysisInput] = useState<string>("read-file");
  const [strategy, setStrategy] = useState<string>("one-codex");
  const [primer, setPrimer] = useState<string>("artic");
  const [version, setVersion] = useState<string>(
    primerOptions.find((option) => option.id === primer)?.versions[0] ?? "",
  );
  const [taxonomyName, setTaxonomyName] = useState<string>("sars");
  const [contigsFolder, setContigsFolder] = useState<string>("");
  const [selectedLibraries, setSelectedLibraries] = useState<Library[]>([]);
  const [sraAccession, setSraAccession] = useState("");
  const [prlPlatform, setPrlPlatform] = useState<string>("");
  const [srlPlatform, setSrlPlatform] = useState<string>("");

  const handleReset = () => {
    setSelectedFiles([]);
    setOutputFolder("");
    setOutputName("");
    setAnalysisInput("read-file");
  };

  return (
    <section>
      <ServiceHeader
        title="SARS-CoV-2 Genome Analysis"
        tooltipContent="SARS-CoV-2 Genome Analysis Information"
        description="The SARS-CoV-2 Genome Analysis Service provides a streamlined
          meta-service that accepts raw reads and performs genome assembly,
          annotation, and variation analysis."
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Start With Section */}
        <Card>
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">
              Start With:
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="service-card-tooltip-icon" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-sm sm:max-w-md md:max-w-lg">
                      The service can accept either read files or assembled
                      contigs. If the "Read Files" option is selected, the
                      Assembly Service will be invoked automatically to assemble
                      the reads into contigs before invoking the Annotation
                      Service. If the "Assembled Contigs" option is chosen, the
                      Annotation Service will automatically be invoked,
                      bypassing the Assembly Service.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>

          <CardContent className="service-card-content">
            <RadioGroup
              defaultValue="read-file"
              className="service-radio-group"
              onValueChange={setAnalysisInput}
            >
              <div className="service-radio-group-item">
                <RadioGroupItem value="read-file" id="read-file" />
                <Label htmlFor="read-file">Read File</Label>
              </div>
              <div className="service-radio-group-item">
                <RadioGroupItem
                  value="assembly-contigs"
                  id="assembly-contigs"
                />
                <Label htmlFor="assembly-contigs">Assembly/Contigs</Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Parameters Section */}
        <Card className="lg:col-span-2">
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

          <CardContent className="service-card-content">
            {analysisInput === "read-file" && (
              <div className="flex flex-col gap-4">
                <div className="space-y-2">
                  <Label className="service-card-label">Strategy</Label>

                  <Select defaultValue="one-codex" onValueChange={setStrategy}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a strategy" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="one-codex">One Codex</SelectItem>
                      <SelectItem value="cdc-illumina">CDC-Illumina</SelectItem>
                      <SelectItem value="cdc-nanopore">CDC-Nanopore</SelectItem>
                      <SelectItem value="artic-nanopore">
                        ARTIC-Nanopore
                      </SelectItem>
                      <SelectItem value="auto">Auto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex w-full flex-col gap-4 sm:flex-row md:gap-8">
                    <div className="w-full space-y-2">
                      <Label className="service-card-label">Primer</Label>

                      <Select
                        defaultValue="artic"
                        onValueChange={(value) => {
                          setPrimer(value);
                          const selectedPrimer = primerOptions.find(
                            (option) => option.id === value,
                          );
                          setVersion(selectedPrimer?.versions[0] ?? "");
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select primer" />
                        </SelectTrigger>
                        <SelectContent>
                          {primerOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-[25%] space-y-2">
                      <Label className="service-card-label">Version</Label>

                      <Select value={version} onValueChange={setVersion}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select version" />
                        </SelectTrigger>
                        <SelectContent>
                          {primerOptions
                            .find((option) => option.id === primer)
                            ?.versions.map((version) => (
                              <SelectItem key={version} value={version}>
                                {version}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-4 sm:flex-row md:gap-8">
              <div className="w-full">
                <div className="flex items-center">
                  <Label className="service-card-label">Taxonomy Name</Label>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="service-card-tooltip-icon mb-2 ml-2" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select the taxonomy name</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <Select defaultValue="sars" onValueChange={setTaxonomyName}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select taxonomy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sars">
                      Severe acute respiratory syndrome
                    </SelectItem>
                    <SelectItem value="other">Other Taxonomy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex w-[50%] flex-col">
                <Label className="service-card-label">Taxonomy ID</Label>
                <Select defaultValue="2697049">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select taxonomy ID" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2697049">2697049</SelectItem>
                    <SelectItem value="other">Other ID</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="service-card-label">My Label</Label>
              <Input className="service-card-input" placeholder="My identifier123" />
            </div>

            <div className="flex flex-col gap-4 sm:flex-row sm:gap-8">
              <div className="w-full">
                <SearchWorkspaceInput
                  title="Output Folder"
                  placeholder="Select Output Folder"
                  onChange={setOutputFolder}
                />
              </div>

              <div className="w-full">
                <Label className="service-card-label">Output Name</Label>
                <Input
                  className="service-card-input"
                  defaultValue=""
                  placeholder="Taxonomy + My Label"
                  onChange={(e) => setOutputName(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {analysisInput === "read-file" && (
          <>
            {/* Input File Section */}
            <Card className="lg:col-span-2">
              <CardHeader className="service-card-header">
                <CardTitle className="service-card-title">
                  Input File
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <Info className="service-card-tooltip-icon" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Select input files for analysis</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardTitle>
              </CardHeader>

              <CardContent className="service-card-content">
                {/* TODO: Should only be able to submit Libraries once a platform is selected */}
                <div className="flex flex-col gap-4">
                  <SearchReadLibrary
                    title="Paired Read Library"
                    firstPlaceholder="Select File 1..."
                    secondPlaceholder="Select File 2..."
                    variant="pair"
                    onAdd={(files) => {
                      const newLibraries = handlePairedLibraryAdd(
                        files,
                        selectedLibraries,
                      );
                      setSelectedLibraries(newLibraries);
                    }}
                  />
                  <Select
                    value={prlPlatform}
                    onValueChange={(value) => setPrlPlatform(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a platform..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="illumina">Illumina</SelectItem>
                      <SelectItem value="ion-torrent">Ion Torrent</SelectItem>
                      <SelectItem value="infer-platform">
                        Infer Platform
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* TODO: Should only be able to submit Libraries once a platform is selected */}
                <div className="flex flex-col gap-4">
                  <SearchReadLibrary
                    title="Single Read Library"
                    firstPlaceholder="Select File 1..."
                    variant="single"
                    onAdd={(files) => {
                      const newLibraries = handleSingleLibraryAdd(
                        files,
                        selectedLibraries,
                      );
                      setSelectedLibraries(newLibraries);
                    }}
                  />

                  <Select
                    value={srlPlatform}
                    onValueChange={(value) => setSrlPlatform(value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select a platform..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="illumina">Illumina</SelectItem>
                      <SelectItem value="ion-torrent">Ion Torrent</SelectItem>
                      <SelectItem value="nanopore">Nanopore</SelectItem>
                      <SelectItem value="pacbio">PacBio</SelectItem>
                      <SelectItem value="infer-platform">
                        Infer Platform
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <SraRunAccession
                    selectedLibraries={selectedLibraries}
                    setSelectedLibraries={setSelectedLibraries}
                  />
                </div>
              </CardContent>
            </Card>

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
              </CardHeader>

              <CardContent className="service-card-content">
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
                  onRemove={(id) => {
                    const newLibraries = removeFromSelectedLibraries(
                      id,
                      selectedLibraries,
                    );
                    setSelectedLibraries(newLibraries);
                  }}
                  className="max-h-84 overflow-y-auto"
                />
              </CardContent>
            </Card>
          </>
        )}

        {analysisInput === "assembly-contigs" && (
          <Card className="lg:col-span-3">
            <CardHeader className="service-card-header">
              <CardTitle className="service-card-title">
                Input File
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="service-card-tooltip-icon" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select input files for analysis</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>

            <CardContent className="service-card-content">
              <SearchWorkspaceInput
                title="Contigs"
                placeholder="Select Contigs Folder"
                onChange={setContigsFolder}
              />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Action Buttons */}
      <div className="service-form-controls">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit">Submit</Button>
      </div>
    </section>
  );
}
