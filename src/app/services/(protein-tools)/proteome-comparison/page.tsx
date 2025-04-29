"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Upload,
  Plus,
  Search,
  ChevronDown,
  FolderSearch,
  Info,
} from "lucide-react";
import { CiCircleInfo } from "react-icons/ci";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { NumberInput } from "@/components/ui/number-input";
import { ServiceHeader } from "@/components/services/service-header";
import SearchWorkspaceInput from "@/components/services/search-workspace-input";
export default function ProteomeComparisonPage() {
  const [selectedGenomes, setSelectedGenomes] = useState([
    "Mycobacterium tuberculosis H37Rv",
  ]);
  const [selectedGenome, setSelectedGenome] = useState("tuberculosis");
  const [showAdvancedParams, setAdvancedParams] = useState(false);
  const [proteinFastaInput, setProteinFastaInput] = useState("");
  const [featureGroupInput, setFeatureGroupInput] = useState("");
  const [genomeGroupInput, setGenomeGroupInput] = useState("");

  const MAX_GENOMES = 9;

  const genomeOptions = {
    tuberculosis: "Mycobacterium tuberculosis H37Rv",
    coli: "Escherichia coli K-12",
    subtilis: "Bacillus subtilis 168",
    cerevisiae: "Saccharomyces cerevisiae S288C",
  };

  const addGenome = () => {
    const genomeName =
      genomeOptions[selectedGenome as keyof typeof genomeOptions];
    if (
      !selectedGenomes.includes(genomeName) &&
      selectedGenomes.length < MAX_GENOMES
    ) {
      setSelectedGenomes([...selectedGenomes, genomeName]);
    }
  };

  const addProteinFasta = () => {
    if (
      proteinFastaInput.trim() &&
      !selectedGenomes.includes(proteinFastaInput) &&
      selectedGenomes.length < MAX_GENOMES
    ) {
      setSelectedGenomes([...selectedGenomes, proteinFastaInput]);
      setProteinFastaInput("");
    }
  };

  const addFeatureGroup = () => {
    if (
      featureGroupInput.trim() &&
      !selectedGenomes.includes(featureGroupInput) &&
      selectedGenomes.length < MAX_GENOMES
    ) {
      setSelectedGenomes([...selectedGenomes, featureGroupInput]);
      setFeatureGroupInput("");
    }
  };

  const addGenomeGroup = () => {
    if (
      genomeGroupInput.trim() &&
      !selectedGenomes.includes(genomeGroupInput) &&
      selectedGenomes.length < MAX_GENOMES
    ) {
      setSelectedGenomes([...selectedGenomes, genomeGroupInput]);
      setGenomeGroupInput("");
    }
  };

  const removeGenome = (genome: string) => {
    setSelectedGenomes(selectedGenomes.filter((g) => g !== genome));
  };

  return (
    <section>
      <ServiceHeader
        title="Proteome Comparison"
        tooltipContent="Proteome Comparison Information"
        description=" The Proteome Comparison Service performs protein sequence-based genome
          comparison using bidirectional BLASTP. This service allows users to
          select genomes and compare them to reference genome."
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      {/* Main Content */}
      <div className="service-form-section">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Parameters */}
          <Card>
            <CardHeader className="service-card-header">
              <CardTitle className="service-card-title">
                Parameters
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={16} className="text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Configure analysis parameters</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>

            <CardContent className="service-card-content">
              <div className="space-y-4">
                <Collapsible
                  open={showAdvancedParams}
                  onOpenChange={setAdvancedParams}
                  className="service-collapsible-container"
                >
                  <CollapsibleTrigger className="service-collapsible-trigger text-sm font-medium">
                    Advanced Parameters
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showAdvancedParams ? "rotate-180 transform" : ""}`}
                    />
                  </CollapsibleTrigger>

                  <CollapsibleContent>
                    <div className="service-card-content-grid">
                      <div>
                        <Label className="service-card-sublabel">
                          Minimum % Coverage
                        </Label>
                        <NumberInput
                          id="minimum-coverage"
                          defaultValue={30}
                          min={10}
                          max={100}
                          stepper={5}
                        />
                      </div>

                      <div>
                        <Label className="service-card-sublabel">
                          BLAST E-Value
                        </Label>
                        <Input
                          defaultValue="1e-5"
                          className="service-card-input"
                        />
                      </div>

                      <div>
                        <Label className="service-card-sublabel">
                          Minimum % Identity
                        </Label>
                        <NumberInput
                          id="minimum-identity"
                          defaultValue={10}
                          min={10}
                          max={100}
                          stepper={5}
                        />
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>

                <SearchWorkspaceInput
                  title="Output Folder"
                  placeholder="Select Output Folder..."
                />

                <div>
                  <Label className="service-card-label">Output Name</Label>
                  <Input placeholder="Output Name" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Genomes */}
          <Card>
            <CardHeader className="service-card-header">
              <CardTitle className="service-card-title">
                Comparison Genomes
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info size={16} className="text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Add up to {MAX_GENOMES} genomes to compare (use plus
                        buttons to add)
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Add up to {MAX_GENOMES} genomes to compare (use plus buttons to
                add)
              </CardDescription>
            </CardHeader>
            <CardContent className="service-card-content">
              <div className="space-y-4">
                <div>
                  <Label className="service-card-label">Select Genome</Label>
                  <div className="flex gap-2">
                    <Select
                      value={selectedGenome}
                      onValueChange={setSelectedGenome}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Select genome" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="tuberculosis">
                          Mycobacterium tuberculosis H37Rv
                        </SelectItem>
                        <SelectItem value="coli">
                          Escherichia coli K-12
                        </SelectItem>
                        <SelectItem value="subtilis">
                          Bacillus subtilis 168
                        </SelectItem>
                        <SelectItem value="cerevisiae">
                          Saccharomyces cerevisiae S288C
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={addGenome}
                      disabled={selectedGenomes.length >= MAX_GENOMES}
                    >
                      <Plus size={16} />
                    </Button>
                  </div>
                </div>

                <SearchWorkspaceInput
                  title="And/Or Select Protein FASTA File"
                  placeholder="(Optional)"
                  variant="add"
                  value={proteinFastaInput}
                  onChange={setProteinFastaInput}
                  onAdd={addProteinFasta}
                  disabled={selectedGenomes.length >= MAX_GENOMES}
                />

                <SearchWorkspaceInput
                  title="And/Or Select Feature Group"
                  placeholder="(Optional)"
                  variant="add"
                  value={featureGroupInput}
                  onChange={setFeatureGroupInput}
                  onAdd={addFeatureGroup}
                  disabled={selectedGenomes.length >= MAX_GENOMES}
                />

                <SearchWorkspaceInput
                  title="And/Or Select Genome Group"
                  placeholder="(Optional)"
                  variant="add"
                  value={genomeGroupInput}
                  onChange={setGenomeGroupInput}
                  onAdd={addGenomeGroup}
                  disabled={selectedGenomes.length >= MAX_GENOMES}
                />

                <div>
                  <Label className="service-card-label">
                    Selected Genome Table
                  </Label>
                  <div className="overflow-hidden rounded-md border">
                    {selectedGenomes.length === 0 ? (
                      <div className="text-muted-foreground p-4 text-center text-sm">
                        No genomes selected
                      </div>
                    ) : (
                      <div className="divide-y">
                        {selectedGenomes.map((genome, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between bg-white px-4 py-2 hover:bg-gray-50"
                          >
                            <span className="text-sm">{genome}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => removeGenome(genome)}
                            >
                              <span className="text-gray-400 hover:text-gray-600">
                                ×
                              </span>
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reference Genome */}
        <Card>
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">
              Reference Genome
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info size={16} className="text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Select 1 reference genome from the following options
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
            <CardDescription>
              Select 1 reference genome from the following options
            </CardDescription>
          </CardHeader>
          <CardContent className="service-card-content">
            <div className="space-y-4">
              <div>
                <Label className="service-card-label">
                  SELECT A GENOME
                </Label>
                <div className="flex gap-2">
                  <Select defaultValue="tuberculosis">
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select genome" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="tuberculosis">
                        Mycobacterium tuberculosis H37Rv
                      </SelectItem>
                      <SelectItem value="coli">
                        Escherichia coli K-12
                      </SelectItem>
                      <SelectItem value="subtilis">
                        Bacillus subtilis 168
                      </SelectItem>
                      <SelectItem value="cerevisiae">
                        Saccharomyces cerevisiae S288C
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <SearchWorkspaceInput
                title="Or A FASTA File"
                placeholder="(Optional)"
              />

              <SearchWorkspaceInput
                title="Or A Feature Group"
                placeholder="(Optional)"
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Controls */}
        <div className="service-form-controls">
          <Button variant="outline">Reset</Button>
          <Button>Submit</Button>
        </div>
      </div>
    </section>
  );
}
