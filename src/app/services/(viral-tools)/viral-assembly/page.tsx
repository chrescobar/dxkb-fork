"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HelpCircle } from "lucide-react";
import { ServiceHeader } from "@/components/services/service-header";
import SearchReadLibrary from "@/components/services/search-read-library";
import OutputFolder from "@/components/services/output-folder";
import SraRunAccession from "@/components/services/sra-run-accession";
import { Library } from "@/types/services";
import {
  handlePairedLibraryAdd,
  handleSingleLibraryAdd,
  handleFormSubmit,
} from "@/lib/services/service-utils";

export default function ViralAssembly() {
  // States for the form
  const [inputType, setInputType] = useState("paired");
  const [assemblyStrategy, setAssemblyStrategy] = useState("irma");
  const [virusGenome, setVirusGenome] = useState("flu");
  const [_outputFolder, setOutputFolder] = useState("");
  const [_outputName, setOutputName] = useState("");
  const [isOutputNameValid, setIsOutputNameValid] = useState(true);
  const [selectedLibraries, setSelectedLibraries] = useState<Library[]>([]);
  const [_readFiles, setReadFiles] = useState([
    { id: 1, name: "READ FILE 1" },
    { id: 2, name: "READ FILE 2" },
  ]);

  const handleReset = () => {
    setInputType("paired");
    setAssemblyStrategy("irma");
    setVirusGenome("flu");
    setOutputFolder("");
    setOutputName("");
    setReadFiles([
      { id: 1, name: "READ FILE 1" },
      { id: 2, name: "READ FILE 2" },
    ]);
  };

  return (
    <section>
      <ServiceHeader
        title="Viral Assembly - BETA"
        description="The Viral Assembly Service utilizes IRMA (Iterative Refinement Meta-Assembler)
          to assemble viral genomes. Users must select the virus genome for processing.
          This service is currently in beta, any feedback or improvement is welcomed."
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      {/* Main Form Content */}
      <form onSubmit={handleFormSubmit} className="flex flex-col gap-6">
        {/* Input File Section */}
        <Card>
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">Input File</CardTitle>
          </CardHeader>

          <CardContent className="service-card-content">
            <RadioGroup
              defaultValue={inputType}
              onValueChange={setInputType}
              className="grid gap-2 w-full"
            >
              <div className="flex items-center gap-3">
                <RadioGroupItem value="paired" id="paired" />
                <Label htmlFor="paired">Paired Read Library</Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single">Single Read Library</Label>
              </div>
              <div className="flex items-center gap-3">
                <RadioGroupItem value="sra" id="sra" />
                <Label htmlFor="sra">SRA Run Accession</Label>
              </div>
            </RadioGroup>

            {inputType === "paired" && (
              <SearchReadLibrary
                title="Select Files"
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
            )}

            {inputType === "single" && (
              <SearchReadLibrary
                title="Select File"
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
            )}

            {inputType === "sra" && (
              <SraRunAccession
                title="Select Accession"
                selectedLibraries={selectedLibraries}
                setSelectedLibraries={setSelectedLibraries}
              />
            )}
          </CardContent>
        </Card>

        {/* Parameters Section */}
        <Card>
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">
              Parameters
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <HelpCircle className="service-card-tooltip-icon" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Configure assembly parameters</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardTitle>
          </CardHeader>

          <CardContent className="service-card-content">
            <div className="flex flex-col gap-4 sm:flex-row sm:gap-6">
              <div className="w-full">
                <Label className="service-card-label">Assembly Strategy</Label>

                <Select
                  items={[
                    { value: "irma", label: "IRMA" },
                    { value: "other", label: "Other Strategy" },
                  ]}
                  value={assemblyStrategy}
                  onValueChange={(value) => setAssemblyStrategy(value ?? "")}
                >
                  <SelectTrigger className="service-card-select-trigger">
                    <SelectValue placeholder="Select assembly strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="irma">IRMA</SelectItem>
                      <SelectItem value="other">Other Strategy</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full">
                <Label className="service-card-label">Virus Genome</Label>

                <Select
                  items={[
                    { value: "flu", label: "Flu" },
                    { value: "cov", label: "CoV" },
                    { value: "rsv", label: "RSV" },
                    { value: "ebola", label: "Ebola" },
                  ]}
                  value={virusGenome}
                  onValueChange={(value) => setVirusGenome(value ?? "")}
                >
                  <SelectTrigger className="service-card-select-trigger">
                    <SelectValue placeholder="Select virus genome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectItem value="flu">Flu</SelectItem>
                      <SelectItem value="cov">CoV</SelectItem>
                      <SelectItem value="rsv">RSV</SelectItem>
                      <SelectItem value="ebola">Ebola</SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="service-card-row">
              <div className="w-full">
                <OutputFolder onChange={setOutputFolder} />
              </div>
              <div className="w-full">
                <OutputFolder
                  variant="name"
                  value={_outputName}
                  onChange={setOutputName}
                  outputFolderPath={_outputFolder}
                  onValidationChange={setIsOutputNameValid}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </form>

      {/* Action Buttons */}
      <div className="service-form-controls">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit" disabled={!isOutputNameValid}>
          Assemble
        </Button>
      </div>
    </section>
  );
}
