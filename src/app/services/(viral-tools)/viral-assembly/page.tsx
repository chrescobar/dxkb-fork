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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { HelpCircle } from "lucide-react";
import { ServiceHeader } from "@/components/services/service-header";
import SearchReadLibrary from "@/components/services/search-read-library";
import OutputFolder from "@/components/services/output-folder";

export default function ViralAssembly() {
  // States for the form
  const [inputType, setInputType] = useState("paired");
  const [assemblyStrategy, setAssemblyStrategy] = useState("irma");
  const [virusGenome, setVirusGenome] = useState("flu");
  const [outputFolder, setOutputFolder] = useState("");
  const [outputName, setOutputName] = useState("");
  const [readFiles, setReadFiles] = useState([
    { id: 1, name: "READ FILE 1" },
    { id: 2, name: "READ FILE 2" },
  ]);

  const handleSubmit = () => {
    // Handle form submission logic here
    console.log({
      inputType,
      readFiles,
      assemblyStrategy,
      virusGenome,
      outputFolder,
      outputName,
    });
  };

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
        tooltipContent="Viral Assembly Information"
        description='The Viral Assembly Service utilizes IRMA (Iterative Refinement
          Meta-Assembler) to assemble viral genomes. Users must select the virus
          genome for processing. This service is currently in beta; any feedback
          or improvement is welcomed.'
        quickReferenceGuide="#"
        tutorial="#"
        instructionalVideo="#"
      />

      {/* Main Form Content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Input File Section */}
        <Card>
          <CardHeader className="service-card-header">
            <CardTitle className="service-card-title">
              Input File
            </CardTitle>
          </CardHeader>

          <CardContent className="service-card-content">
            <RadioGroup
              defaultValue={inputType}
              onValueChange={setInputType}
              className="service-radio-group"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paired" id="paired" />
                <Label htmlFor="paired">Paired Read Library</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single">Single Read Library</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sra" id="sra" />
                <Label htmlFor="sra">SRA Run Accession</Label>
              </div>
            </RadioGroup>

            {inputType === "paired" && (
              <SearchReadLibrary
                title="Paired Read Library"
                firstPlaceholder="Select File 1..."
                secondPlaceholder="Select File 2..."
                variant="pair"
                justInput={true}
              />
            )}

            {inputType === "single" && (
              <SearchReadLibrary
                title="Single Read Library"
                firstPlaceholder="Select File 1..."
                variant="single"
                justInput={true}
              />
            )}

            {inputType === "sra" && (
              <div className="pt-2">
                <Input placeholder="SRA Accession Number" />
              </div>
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
            <div className="flex flex-col sm:flex-row gap-4 sm:gap-8">
              <div className="w-full">
                <Label className="service-card-label">Assembly Strategy</Label>

                <Select
                  value={assemblyStrategy}
                  onValueChange={setAssemblyStrategy}
                  >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select assembly strategy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="irma">IRMA</SelectItem>
                    <SelectItem value="other">Other Strategy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-full">
                <Label className="service-card-label">Virus Genome</Label>

                <Select value={virusGenome} onValueChange={setVirusGenome}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select virus genome" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="flu">Flu</SelectItem>
                    <SelectItem value="cov">CoV</SelectItem>
                    <SelectItem value="rsv">RSV</SelectItem>
                    <SelectItem value="ebola">Ebola</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <OutputFolder
              value={outputFolder}
              onChange={(value) => setOutputFolder(value)}
            />

            <div className="w-full">
              <Label className="service-card-label">Output Name</Label>

              <Input
                placeholder="Output Name"
                value={outputName}
                onChange={(e) => setOutputName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="service-form-controls">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button onClick={handleSubmit}>Assemble</Button>
      </div>
    </section>
  );
}
