"use client";

import React, { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Info,
  Upload,
  FileText,
  X,
  HelpCircle,
  FileCode,
  Download,
  Copy,
  UploadCloud,
  FilePlus2,
  ChevronRight,
  Settings,
  AlignLeft,
  FileBarChart2,
  Dna,
  ExternalLink,
  AlertTriangle,
  Check,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export default function ViralAssemblyCreative() {
  // States for the form
  const [activeTab, setActiveTab] = useState("input");
  const [inputType, setInputType] = useState("paired");
  const [assemblyStrategy, setAssemblyStrategy] = useState("irma");
  const [virusGenome, setVirusGenome] = useState("flu");
  interface ReadFile {
    id: number;
    name: string;
  }
  const [readFiles, setReadFiles] = useState<ReadFile[]>([]);
  const [outputFolder, setOutputFolder] = useState("");
  const [outputName, setOutputName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [assemblyProgress, setAssemblyProgress] = useState(0);
  const [assemblyStage, setAssemblyStage] = useState(0);

  const addFile = () => {
    const newId =
      readFiles.length > 0 ? Math.max(...readFiles.map((f) => f.id)) + 1 : 1;
    setReadFiles([
      ...readFiles,
      { id: newId, name: `sample_read_${newId}.fastq` },
    ]);
  };

  const removeFile = (id: number) => {
    setReadFiles(readFiles.filter((file) => file.id !== id));
  };

  const handleSubmit = () => {
    setIsProcessing(true);

    // Simulate assembly progress
    const totalSteps = 5;
    let currentStep = 0;

    const interval = setInterval(() => {
      if (currentStep < totalSteps) {
        currentStep++;
        setAssemblyStage(currentStep);
        setAssemblyProgress(Math.floor((currentStep / totalSteps) * 100));
      } else {
        clearInterval(interval);
        setIsProcessing(false);
        setIsComplete(true);
      }
    }, 2000);
  };

  const handleReset = () => {
    setInputType("paired");
    setAssemblyStrategy("irma");
    setVirusGenome("flu");
    setReadFiles([]);
    setOutputFolder("");
    setOutputName("");
    setActiveTab("input");
    setIsProcessing(false);
    setIsComplete(false);
    setAssemblyProgress(0);
    setAssemblyStage(0);
  };

  // Virus genome options
  const virusOptions = [
    {
      id: "flu",
      name: "Influenza",
      description: "Influenza A and B viruses",
      segments: "8 segments",
      totalLength: "~13.5 kb",
      icon: <span className="text-amber-500">🦠</span>,
    },
    {
      id: "sars-cov-2",
      name: "SARS-CoV-2",
      description: "COVID-19 causative agent",
      segments: "Single-stranded RNA",
      totalLength: "~30 kb",
      icon: <span className="text-red-500">🦠</span>,
    },
    {
      id: "rsv",
      name: "Respiratory Syncytial Virus",
      description: "Common respiratory pathogen",
      segments: "Non-segmented RNA",
      totalLength: "~15 kb",
      icon: <span className="text-green-500">🦠</span>,
    },
    {
      id: "hiv",
      name: "Human Immunodeficiency Virus",
      description: "Retrovirus causing AIDS",
      segments: "Single-stranded RNA",
      totalLength: "~9.7 kb",
      icon: <span className="text-purple-500">🦠</span>,
    },
  ];

  // Assembly steps for progress indicator
  const assemblySteps = [
    { label: "Quality control", icon: <FileBarChart2 className="h-4 w-4" /> },
    { label: "Read preprocessing", icon: <AlignLeft className="h-4 w-4" /> },
    { label: "Initial assembly", icon: <Settings className="h-4 w-4" /> },
    { label: "Refinement", icon: <Dna className="h-4 w-4" /> },
    { label: "Final assembly", icon: <CheckCircle className="h-4 w-4" /> },
  ];

  // Assembly results data (mock)
  const assemblyResults = {
    virusName:
      virusGenome === "flu"
        ? "Influenza A virus"
        : virusGenome === "sars-cov-2"
          ? "SARS-CoV-2"
          : virusGenome === "rsv"
            ? "Respiratory Syncytial Virus"
            : "HIV",
    segments: virusGenome === "flu" ? 8 : 1,
    coverage: "98.7%",
    meanDepth: 1243,
    totalReads: "2.3M",
    totalBases:
      virusGenome === "flu"
        ? "13,588 bp"
        : virusGenome === "sars-cov-2"
          ? "29,903 bp"
          : virusGenome === "rsv"
            ? "15,191 bp"
            : "9,749 bp",
    assemblyDate: "April 15, 2025",
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-sky-600 to-blue-700 py-6 text-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Dna className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">Viral Assembly</h1>
                  <Badge className="border-amber-400/50 bg-amber-400/20 text-amber-100">
                    BETA
                  </Badge>
                </div>
                <p className="text-sm text-sky-100">
                  Viral genome assembly pipeline
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="border-none bg-white/20 text-white transition-colors hover:bg-white/30">
                <a href="#" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Tutorial</span>
                </a>
              </Badge>
              <Badge className="border-none bg-white/20 text-white transition-colors hover:bg-white/30">
                <a href="#" className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  <span>About IRMA</span>
                  <ExternalLink className="ml-0.5 h-3 w-3" />
                </a>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6">
          <Alert className="border-blue-100 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="flex items-center justify-between text-blue-700">
              <span>
                This service is in BETA. It utilizes IRMA (Iterative Refinement
                Meta-Assembler) to assemble viral genomes from NGS data.
              </span>
              <Button
                variant="link"
                className="h-auto p-0 text-blue-600"
                asChild
              >
                <a href="#">Leave Feedback</a>
              </Button>
            </AlertDescription>
          </Alert>
        </div>

        {!isProcessing && !isComplete ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="input"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                <UploadCloud className="mr-2 h-4 w-4" />
                Input Files
              </TabsTrigger>
              <TabsTrigger
                value="virus"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                <Settings className="mr-2 h-4 w-4" />
                Virus Selection
              </TabsTrigger>
              <TabsTrigger
                value="output"
                className="data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
              >
                <FileBarChart2 className="mr-2 h-4 w-4" />
                Output Settings
              </TabsTrigger>
            </TabsList>

            {/* Input Files Tab */}
            <TabsContent value="input" className="mt-6">
              <Card className="border-none shadow-md">
                <CardHeader className="rounded-t-lg bg-gradient-to-r from-blue-50 to-sky-50">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                    <UploadCloud className="h-5 w-5 text-blue-600" />
                    Input Sequence Files
                  </CardTitle>
                  <CardDescription>
                    Provide sequencing data for viral genome assembly
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 pb-6">
                  <div className="space-y-6">
                    <RadioGroup
                      defaultValue={inputType}
                      onValueChange={setInputType}
                      className="flex space-x-4 pb-2"
                    >
                      <div className="flex items-center">
                        <RadioGroupItem
                          value="paired"
                          id="paired"
                          className="mr-2"
                        />
                        <Label htmlFor="paired">Paired-End Reads</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem
                          value="single"
                          id="single"
                          className="mr-2"
                        />
                        <Label htmlFor="single">Single-End Reads</Label>
                      </div>
                      <div className="flex items-center">
                        <RadioGroupItem value="sra" id="sra" className="mr-2" />
                        <Label htmlFor="sra">SRA Accession</Label>
                      </div>
                    </RadioGroup>

                    {inputType === "paired" && (
                      <div>
                        <div className="mb-4">
                          <p className="text-sm text-gray-500">
                            Upload paired-end FASTQ files for your viral samples
                          </p>
                        </div>

                        {readFiles.length === 0 ? (
                          <div
                            className="cursor-pointer rounded-lg border-2 border-dashed border-blue-200 p-12 text-center transition-colors hover:bg-blue-50/50"
                            onClick={addFile}
                          >
                            <div className="flex flex-col items-center">
                              <div className="mb-4 rounded-full bg-blue-100 p-3">
                                <UploadCloud className="h-6 w-6 text-blue-600" />
                              </div>
                              <h3 className="mb-2 font-medium">
                                Drop your read files here
                              </h3>
                              <p className="mb-6 max-w-md text-sm text-gray-500">
                                Upload FASTQ files for viral genome assembly, or
                                click to browse
                              </p>
                              <Button
                                variant="outline"
                                className="flex items-center gap-2"
                              >
                                <Upload className="h-4 w-4" />
                                Browse Files
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {readFiles.map((file) => (
                              <div
                                key={file.id}
                                className="flex items-center gap-3 rounded-md border border-blue-100 bg-blue-50 p-3"
                              >
                                <div className="rounded-md bg-blue-100 p-2">
                                  <FileText className="h-5 w-5 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">
                                    {file.name}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    4.3 MB • FASTQ
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(file.id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}

                            <Button
                              variant="outline"
                              className="mt-4 flex items-center gap-2"
                              onClick={addFile}
                            >
                              <FilePlus2 className="h-4 w-4" />
                              Add Another File
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {inputType === "single" && (
                      <div className="rounded-lg border-2 border-dashed border-blue-200 p-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="mb-4 rounded-full bg-blue-100 p-3">
                            <UploadCloud className="h-6 w-6 text-blue-600" />
                          </div>
                          <h3 className="mb-2 font-medium">
                            Upload single-end read files
                          </h3>
                          <p className="mb-6 max-w-md text-sm text-gray-500">
                            Select FASTQ files containing single-end sequencing
                            reads
                          </p>
                          <Button
                            variant="outline"
                            className="flex items-center gap-2"
                            onClick={addFile}
                          >
                            <Upload className="h-4 w-4" />
                            Browse Files
                          </Button>
                        </div>
                      </div>
                    )}

                    {inputType === "sra" && (
                      <div className="space-y-4">
                        <div className="rounded-md bg-blue-50 p-4">
                          <div className="flex items-start gap-3">
                            <Info className="mt-0.5 h-5 w-5 text-blue-600" />
                            <p className="text-sm text-blue-700">
                              Enter an SRA accession number to fetch data
                              directly from NCBI. This may take longer depending
                              on the size of the dataset.
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <Input
                            placeholder="e.g. SRR12345678"
                            className="flex-1"
                          />
                          <Button>Validate</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between border-t bg-gray-50 pt-2">
                  <div></div>
                  <Button
                    onClick={() => setActiveTab("virus")}
                    disabled={readFiles.length === 0 && inputType !== "sra"}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continue to Virus Selection
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Virus Selection Tab */}
            <TabsContent value="virus" className="mt-6">
              <Card className="border-none shadow-md">
                <CardHeader className="rounded-t-lg bg-gradient-to-r from-blue-50 to-sky-50">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                    <Settings className="h-5 w-5 text-blue-600" />
                    Virus and Assembly Settings
                  </CardTitle>
                  <CardDescription>
                    Select the target virus and assembly method
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 pb-6">
                  <div className="space-y-6">
                    <div>
                      <Label className="mb-2 block text-sm font-medium text-gray-700">
                        Assembly Strategy
                      </Label>
                      <Select
                        defaultValue={assemblyStrategy}
                        onValueChange={setAssemblyStrategy}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select assembly strategy" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="irma">
                            IRMA (Iterative Refinement Meta-Assembler)
                          </SelectItem>
                          <SelectItem value="experimental" disabled>
                            Experimental Assembler (Coming Soon)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="mt-1 text-xs text-gray-500">
                        IRMA is specialized for viral genome assembly with
                        iterative refinement
                      </p>
                    </div>

                    <div>
                      <Label className="mb-3 block text-sm font-medium text-gray-700">
                        Target Virus
                      </Label>

                      <RadioGroup
                        value={virusGenome}
                        onValueChange={setVirusGenome}
                        className="grid grid-cols-1 gap-3 md:grid-cols-2"
                      >
                        {virusOptions.map((virus) => (
                          <div
                            key={virus.id}
                            className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                              virusGenome === virus.id
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/50"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <RadioGroupItem
                                value={virus.id}
                                id={`virus-${virus.id}`}
                                className="mt-1"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  {virus.icon}
                                  <p className="font-medium">{virus.name}</p>
                                </div>
                                <p className="mt-1 text-sm text-gray-600">
                                  {virus.description}
                                </p>
                                <div className="mt-2 flex gap-3">
                                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                    {virus.segments}
                                  </span>
                                  <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                                    {virus.totalLength}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>

                    <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-500" />
                        <div>
                          <h4 className="font-medium text-amber-800">
                            Beta Feature Notice
                          </h4>
                          <p className="mt-1 text-sm text-amber-700">
                            Assembly for{" "}
                            {virusGenome === "flu"
                              ? "Influenza"
                              : virusGenome === "sars-cov-2"
                                ? "SARS-CoV-2"
                                : virusGenome === "rsv"
                                  ? "RSV"
                                  : "HIV"}{" "}
                            is currently in beta testing. Results should be
                            validated using additional methods.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between border-t bg-gray-50 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("input")}
                  >
                    Back to Input Files
                  </Button>
                  <Button
                    onClick={() => setActiveTab("output")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Continue to Output Settings
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Output Settings Tab */}
            <TabsContent value="output" className="mt-6">
              <Card className="border-none shadow-md">
                <CardHeader className="rounded-t-lg bg-gradient-to-r from-blue-50 to-sky-50">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                    <FileBarChart2 className="h-5 w-5 text-blue-600" />
                    Output Settings
                  </CardTitle>
                  <CardDescription>
                    Configure assembly output options
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 pb-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Output Folder</Label>
                        <div className="flex gap-2">
                          <Input
                            placeholder="/path/to/output"
                            value={outputFolder}
                            onChange={(e) => setOutputFolder(e.target.value)}
                            className="flex-1"
                          />
                          <Button variant="outline" size="icon">
                            <FileText className="h-4 w-4" />
                          </Button>
                        </div>
                        <p className="text-xs text-gray-500">
                          Directory where assembly results will be saved
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>Output Name</Label>
                        <Input
                          placeholder="viral_assembly_results"
                          value={outputName}
                          onChange={(e) => setOutputName(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          Base name for output files
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Advanced Settings</Label>
                        <div className="rounded-lg border bg-gray-50 p-4">
                          <p className="mb-3 text-sm text-gray-600">
                            Default IRMA parameters will be used for:
                          </p>
                          <ul className="space-y-2 text-sm">
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-blue-600" />
                              <span>Quality threshold: Q30</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-blue-600" />
                              <span>Minimum coverage: 100x</span>
                            </li>
                            <li className="flex items-center gap-2">
                              <Check className="h-4 w-4 text-blue-600" />
                              <span>Reference-guided assembly mode</span>
                            </li>
                          </ul>
                          <Button
                            variant="link"
                            className="mt-2 h-auto p-0 text-sm text-blue-600"
                          >
                            Customize parameters
                          </Button>
                        </div>
                      </div>

                      <div className="rounded-lg bg-blue-50 p-4">
                        <div className="flex items-start gap-3">
                          <Info className="mt-0.5 h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm text-blue-700">
                              Assembly may take 30-60 minutes depending on input
                              data size and complexity.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between border-t bg-gray-50 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("virus")}
                  >
                    Back to Virus Settings
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Start Assembly
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        ) : isProcessing ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-lg border bg-white p-8 shadow-sm">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
                <Dna className="h-8 w-8 animate-pulse text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Assembling{" "}
                {virusOptions.find((v) => v.id === virusGenome)?.name} Genome
              </h2>
              <p className="mx-auto mt-2 max-w-md text-gray-500">
                Please wait while IRMA processes your sequence data
              </p>
            </div>

            <div className="mx-auto max-w-md">
              <div className="mb-2 flex justify-between text-sm">
                <span>Overall progress</span>
                <span>{assemblyProgress}%</span>
              </div>
              <Progress value={assemblyProgress} className="h-2" />

              <div className="mt-8 space-y-4">
                {assemblySteps.map((step, index) => {
                  const stepNumber = index + 1;
                  const isActive = assemblyStage === stepNumber;
                  const isComplete = assemblyStage > stepNumber;

                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                          isComplete
                            ? "bg-green-100 text-green-600"
                            : isActive
                              ? "animate-pulse bg-blue-100 text-blue-600"
                              : "bg-gray-100 text-gray-400"
                        }`}
                      >
                        {isComplete ? (
                          <CheckCircle className="h-4 w-4" />
                        ) : (
                          step.icon
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm font-medium ${
                            isActive
                              ? "text-blue-600"
                              : isComplete
                                ? "text-green-600"
                                : "text-gray-500"
                          }`}
                        >
                          {step.label}
                        </p>
                        {isActive && (
                          <p className="mt-1 text-xs text-gray-500">
                            {virusGenome === "flu"
                              ? "Processing segment " +
                                Math.floor(Math.random() * 8 + 1) +
                                " of 8..."
                              : "Processing genome..."}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 border-t border-gray-100 pt-4 text-center">
                <p className="text-sm text-gray-500">
                  You can close this window. We'll email you when assembly is
                  complete.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto mt-8 max-w-3xl rounded-lg border bg-white p-8 shadow-sm">
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Assembly Complete
              </h2>
              <p className="mx-auto mt-2 max-w-md text-gray-500">
                Your {virusOptions.find((v) => v.id === virusGenome)?.name}{" "}
                genome has been successfully assembled
              </p>
            </div>

            <div className="mb-8 grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-6">
                <h3 className="mb-4 text-lg font-bold text-blue-800">
                  Assembly Summary
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between border-b border-blue-200 py-2">
                    <span className="font-medium text-blue-700">Virus</span>
                    <span className="font-medium">
                      {assemblyResults.virusName}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-blue-200 py-2">
                    <span className="font-medium text-blue-700">Segments</span>
                    <span className="font-medium">
                      {assemblyResults.segments}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-blue-200 py-2">
                    <span className="font-medium text-blue-700">
                      Genome Coverage
                    </span>
                    <span className="font-medium">
                      {assemblyResults.coverage}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-blue-200 py-2">
                    <span className="font-medium text-blue-700">
                      Mean Depth
                    </span>
                    <span className="font-medium">
                      {assemblyResults.meanDepth}x
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-blue-200 py-2">
                    <span className="font-medium text-blue-700">
                      Total Reads
                    </span>
                    <span className="font-medium">
                      {assemblyResults.totalReads}
                    </span>
                  </div>

                  <div className="flex justify-between border-b border-blue-200 py-2">
                    <span className="font-medium text-blue-700">
                      Total Bases
                    </span>
                    <span className="font-medium">
                      {assemblyResults.totalBases}
                    </span>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-gray-50 p-6">
                <h3 className="mb-4 text-lg font-bold text-gray-800">
                  Output Files
                </h3>

                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded border bg-white p-3">
                    <div className="rounded bg-green-100 p-2">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        assembly_consensus.fasta
                      </p>
                      <p className="text-xs text-gray-500">
                        Final consensus sequence
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 rounded border bg-white p-3">
                    <div className="rounded bg-blue-100 p-2">
                      <FileBarChart2 className="h-5 w-5 text-blue-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">
                        coverage_report.html
                      </p>
                      <p className="text-xs text-gray-500">
                        Coverage analysis report
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-3 rounded border bg-white p-3">
                    <div className="rounded bg-amber-100 p-2">
                      <AlignLeft className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">alignment.bam</p>
                      <p className="text-xs text-gray-500">
                        Read alignment file
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="mt-3 text-right">
                    <Button
                      variant="link"
                      className="mt-2 h-auto p-0 text-sm text-blue-600"
                    >
                      Download all files (ZIP)
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button className="bg-blue-600 hover:bg-blue-700">
                View Detailed Report
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Start New Assembly
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
