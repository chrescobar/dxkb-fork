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
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  HelpCircle,
} from "lucide-react";

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
    <div className="container mx-auto max-w-5xl px-4 py-8">
      {/* Header Section */}
      <div className="mb-8 text-center">
        <div className="mb-2 flex items-center justify-center gap-2">
          <h1 className="text-2xl font-bold">Viral Assembly - BETA</h1>
          <Badge
            variant="outline"
            className="border-amber-200 bg-amber-50 text-amber-600"
          >
            BETA
          </Badge>
        </div>
        <p className="text-muted-foreground mx-auto max-w-3xl text-sm">
          The Viral Assembly Service utilizes IRMA (Iterative Refinement
          Meta-Assembler) to assemble viral genomes. Users must select the virus
          genome for processing. This service is currently in beta; any feedback
          or improvement is welcomed. For further explanation, please see the{" "}
          <a href="#" className="text-primary-600 hover:underline">
            Viral Assembly - BETA Service Tutorial
          </a>
          .
        </p>
      </div>

      {/* Main Form Content */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Input File Section */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                Input File
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="text-muted-foreground h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-64">
                        Select input files for viral assembly
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup
              defaultValue={inputType}
              onValueChange={setInputType}
              className="space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="paired" id="paired" />
                <Label htmlFor="paired">PAIRED READ LIBRARY</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single" />
                <Label htmlFor="single">SINGLE READ LIBRARY</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sra" id="sra" />
                <Label htmlFor="sra">SRA RUN ACCESSION</Label>
              </div>
            </RadioGroup>

            {inputType === "paired" && (
              <div className="space-y-3 pt-2">
                {readFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-2">
                    <Input value={file.name} readOnly className="flex-1" />
                    <Button variant="ghost" size="icon">
                      <FileText className="text-muted-foreground h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {inputType === "single" && (
              <div className="pt-2">
                <div className="flex items-center gap-2">
                  <Input placeholder="READ FILE" className="flex-1" />
                  <Button variant="ghost" size="icon">
                    <FileText className="text-muted-foreground h-4 w-4" />
                  </Button>
                </div>
              </div>
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
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                Parameters
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger>
                      <HelpCircle className="text-muted-foreground h-4 w-4" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="w-64">Configure assembly parameters</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <Label>ASSEMBLY STRATEGY</Label>
              <Select
                value={assemblyStrategy}
                onValueChange={setAssemblyStrategy}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select assembly strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="irma">IRMA</SelectItem>
                  <SelectItem value="other">Other Strategy</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>VIRUS GENOME</Label>
              <Select value={virusGenome} onValueChange={setVirusGenome}>
                <SelectTrigger>
                  <SelectValue placeholder="Select virus genome" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flu">FLU</SelectItem>
                  <SelectItem value="sars-cov-2">SARS-CoV-2</SelectItem>
                  <SelectItem value="hiv">HIV</SelectItem>
                  <SelectItem value="rsv">RSV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label>OUTPUT FOLDER</Label>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Select output folder"
                  className="flex-1"
                  value={outputFolder}
                  onChange={(e) => setOutputFolder(e.target.value)}
                />
                <Button variant="outline" size="icon">
                  <FileText className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <Label>OUTPUT NAME</Label>
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
      <div className="mt-8 flex justify-center gap-4">
        <Button variant="outline" onClick={handleReset}>
          Reset
        </Button>
        <Button onClick={handleSubmit}>Assemble</Button>
      </div>
    </div>
  );
}
