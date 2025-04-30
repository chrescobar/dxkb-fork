"use client";

import React, { useState, useEffect } from "react";
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
import SearchReadLibrary from "@/components/services/search-read-library";
import { ChevronRight, Info } from "lucide-react";
import SelectedItemsTable from "@/components/services/selected-items-table";
import SearchWorkspaceInput from "@/components/services/search-workspace-input";

interface Library {
  id: string;
  name: string;
  type: "paired" | "single" | "sra";
}

const TaxonomicClassificationService = () => {
  const [sraAccession, setSraAccession] = useState("");
  const [selectedLibraries, setSelectedLibraries] = useState<Library[]>([]);
  const [sequencingType, setSequencingType] = useState("wgs");
  const [selectedDatabase, setSelectedDatabase] = useState(
    sequencingType === "wgs" ? "bvbrc" : "silva",
  );
  const [selectedAnalysisType, setSelectedAnalysisType] = useState(
    sequencingType === "wgs" ? "microbiome" : "default",
  );

  useEffect(() => {
    setSelectedDatabase(sequencingType === "wgs" ? "bvbrc" : "silva");
  }, [sequencingType]);

  useEffect(() => {
    setSelectedAnalysisType(
      sequencingType === "wgs" ? "microbiome" : "default",
    );
  }, [sequencingType]);

  const [sampleIdentifiers, setSampleIdentifiers] = useState({
    paired: "Sample ID",
    single: "Sample ID",
    sra: "Sample ID",
  });

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

  const removeFromSelectedLibraries = (id: string) => {
    setSelectedLibraries(selectedLibraries.filter((lib) => lib.id !== id));
  };

  return (
    <section>
      <ServiceHeader
        title="Taxonomic Classification"
        tooltipContent="Taxonomic Classification Information"
        description="The Taxonomic Classification Service computes taxonomic classification
          for read data."
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
              <div className="space-y-6">
                <SearchReadLibrary
                  title="Paired Read Library"
                  firstPlaceholder="Select File 1..."
                  secondPlaceholder="Select File 2..."
                  variant="pair"
                  onAdd={handlePairedLibraryAdd}
                />

                <div className="mt-2">
                  <Label className="service-card-label">
                    Sample Identifier
                  </Label>
                  <Input
                    onChange={(e) =>
                      setSampleIdentifiers({
                        ...sampleIdentifiers,
                        paired: e.target.value,
                      })
                    }
                    className="service-card-input"
                    placeholder="Sample ID"
                  />
                </div>
              </div>

              <br />

              <div className="space-y-6">
                <SearchReadLibrary
                  title="Single Read Library"
                  firstPlaceholder="Select File 1..."
                  variant="single"
                  onAdd={handleSingleLibraryAdd}
                />

                <div className="mt-2">
                  <Label className="service-card-label">
                    Sample Identifier
                  </Label>
                  <Input
                    onChange={(e) =>
                      setSampleIdentifiers({
                        ...sampleIdentifiers,
                        single: e.target.value,
                      })
                    }
                    className="service-card-input"
                    placeholder="Sample ID"
                  />
                </div>
              </div>

              <br />

              <div className="space-y-6">
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

                <div className="mt-2">
                  <Label className="service-card-label">
                    Sample Identifier
                  </Label>
                  <Input
                    onChange={(e) =>
                      setSampleIdentifiers({
                        ...sampleIdentifiers,
                        sra: e.target.value,
                      })
                    }
                    className="service-card-input"
                    placeholder="Sample ID"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-5">
          {/* Selected Libraries Section */}
          <Card className="h-full">
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
                <div className="space-y-6">
                  <div id="sequencing-type-container">
                    <div className="flex items-center gap-2">
                      <Label className="service-card-label">
                        Sequencing Type
                      </Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Info className="service-card-tooltip-icon" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Please select the sequencing type according to
                              your input reads or SRA run accession.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <RadioGroup
                      defaultValue="wgs"
                      className="service-radio-group"
                      onValueChange={setSequencingType}
                    >
                      <div className="service-radio-group-item">
                        <RadioGroupItem value="wgs" id="wgs" />
                        <Label htmlFor="wgs" className="text-sm">
                          Whole Genome Sequencing (WGS)
                        </Label>
                      </div>
                      <div className="service-radio-group-item">
                        <RadioGroupItem value="16s" id="16s" />
                        <Label htmlFor="16s" className="text-sm">
                          16S Ribosomal RNA
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                    <div
                      id="analysis-type"
                      className="service-card-content-grid-item"
                    >
                      <div className="flex items-center gap-2">
                        <Label className="service-card-label">
                          Analysis Type
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="service-card-tooltip-icon" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Select the analysis type</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <Select
                        value={selectedAnalysisType}
                        onValueChange={setSelectedAnalysisType}
                        disabled={sequencingType === "16s"}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select analysis type" />
                        </SelectTrigger>
                        <SelectContent>
                          {sequencingType === "wgs" && (
                            <>
                              <SelectItem value="microbiome">
                                Microbiome Analysis
                              </SelectItem>
                              <SelectItem value="species">
                                Species Identification
                              </SelectItem>
                            </>
                          )}
                          {sequencingType === "16s" && (
                            <SelectItem value="default">Default</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div
                      id="database"
                      className="service-card-content-grid-item"
                    >
                      <div className="flex items-center gap-2">
                        <Label className="service-card-label">Database</Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="service-card-tooltip-icon" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Select the reference database</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <Select
                        value={selectedDatabase}
                        onValueChange={setSelectedDatabase}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select database" />
                        </SelectTrigger>
                        <SelectContent>
                          {sequencingType === "wgs" && (
                            <>
                              <SelectItem value="bvbrc">
                                BV-BRC Database
                              </SelectItem>
                              <SelectItem value="kraken2">
                                Kraken2 Standard Database
                              </SelectItem>
                            </>
                          )}
                          {sequencingType === "16s" && (
                            <>
                              <SelectItem value="silva">SILVA</SelectItem>
                              <SelectItem value="greengenes">
                                Greengenes
                              </SelectItem>
                            </>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div
                      id="filter-host-reads"
                      className="service-card-content-grid-item"
                    >
                      <div className="flex items-center gap-2">
                        <Label className="service-card-label">
                          Filter Host Reads
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="service-card-tooltip-icon" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                If a host is chosen in the Filter Host Reads
                                dropdown, Hisat2 will align the reads to the
                                host genome then remove any aligned reads that
                                aligned to the host genome from the sample.
                                FastQC will run on the host removed reads. Then
                                the host removed reads are used in thee Kraken2
                                command.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <Select
                        defaultValue="none"
                        disabled={sequencingType === "16s"}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select filter option" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="human">Homo sapiens</SelectItem>
                          <SelectItem value="mouse">Mus musculus</SelectItem>
                          <SelectItem value="rat">Rattus norvegicus</SelectItem>
                          <SelectItem value="celegans">
                            Caenorhabditis elegans
                          </SelectItem>
                          <SelectItem value="drosophila">
                            Drosophila melanogaster strain y
                          </SelectItem>
                          <SelectItem value="danio">
                            Danio rerio strain tuebingen
                          </SelectItem>
                          <SelectItem value="gallus">Gallus gallus</SelectItem>
                          <SelectItem value="macaca">Macaca mulatta</SelectItem>
                          <SelectItem value="mustela">
                            Mustela putorius furo
                          </SelectItem>
                          <SelectItem value="sus">Sus scrofa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div
                      id="confidence-interval"
                      className="service-card-content-grid-item"
                    >
                      <div className="flex items-center gap-2">
                        <Label className="service-card-label">
                          Confidence Interval
                        </Label>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger>
                              <Info className="service-card-tooltip-icon" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                The default confidence interval is 0.1. The
                                classifier then will adjust labels up the tree
                                until the label's score meets or exceeds that
                                threshold.
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>

                      <Select defaultValue="0.1">
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select confidence interval" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0.1">0.1</SelectItem>
                          <SelectItem value="0.2">0.2</SelectItem>
                          <SelectItem value="0.3">0.3</SelectItem>
                          <SelectItem value="0.4">0.4</SelectItem>
                          <SelectItem value="0.5">0.5</SelectItem>
                          <SelectItem value="0.6">0.6</SelectItem>
                          <SelectItem value="0.7">0.7</SelectItem>
                          <SelectItem value="0.8">0.8</SelectItem>
                          <SelectItem value="0.9">0.9</SelectItem>
                          <SelectItem value="1.0">1.0</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div
                      id="save-classified-sequences"
                      className="service-card-content-grid-item"
                    >
                      <Label className="service-card-label">
                        Save Classified Sequences
                      </Label>

                      <RadioGroup
                        defaultValue="no"
                        className="service-radio-group"
                      >
                        <div className="service-radio-group-item">
                          <RadioGroupItem value="no" id="classified-no" />
                          <Label htmlFor="classified-no" className="text-sm">
                            No
                          </Label>
                        </div>
                        <div className="service-radio-group-item">
                          <RadioGroupItem value="yes" id="classified-yes" />
                          <Label htmlFor="classified-yes" className="text-sm">
                            Yes
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div id="save-unclassified-sequences">
                      <Label className="service-card-label">
                        Save Unclassified Sequences
                      </Label>

                      <RadioGroup
                        defaultValue="no"
                        className="service-radio-group"
                      >
                        <div className="service-radio-group-item">
                          <RadioGroupItem value="no" id="unclassified-no" />
                          <Label htmlFor="unclassified-no" className="text-sm">
                            No
                          </Label>
                        </div>
                        <div className="service-radio-group-item">
                          <RadioGroupItem value="yes" id="unclassified-yes" />
                          <Label htmlFor="unclassified-yes" className="text-sm">
                            Yes
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 md:col-span-2">
                  <div>
                    <SearchWorkspaceInput
                      title="Output Folder"
                      placeholder="Select Output Folder"
                    />
                  </div>

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

export default TaxonomicClassificationService;
