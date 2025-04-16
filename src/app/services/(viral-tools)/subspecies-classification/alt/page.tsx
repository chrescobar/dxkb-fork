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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Info,
  Upload,
  FileText,
  X,
  FileCode,
  Download,
  Copy,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  TreePine,
  Microscope,
  FileType,
  ChevronRight,
  Database,
  Dna,
} from "lucide-react";

export default function SubspeciesClassificationCreative() {
  // States for the form
  const [activeTab, setActiveTab] = useState("input");
  const [inputMethod, setInputMethod] = useState("paste");
  const [querySequence, setQuerySequence] = useState("");
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState("adenoviridae");
  const [outputFolder, setOutputFolder] = useState("");
  const [outputName, setOutputName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleSubmit = () => {
    setIsProcessing(true);

    // Simulate processing with progress updates
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 10;
      setProgress(currentProgress);

      if (currentProgress >= 100) {
        clearInterval(interval);
        setIsProcessing(false);
        setIsComplete(true);
      }
    }, 800);
  };

  const handleReset = () => {
    setQuerySequence("");
    setSelectedFile(null);
    setOutputFolder("");
    setOutputName("");
    setActiveTab("input");
    setIsProcessing(false);
    setIsComplete(false);
    setProgress(0);
  };

  // Sample data for species options
  const speciesOptions = [
    {
      id: "adenoviridae",
      name: "Adenoviridae - Human mastadenovirus A",
      genome: "Complete genome, genomic RNA",
      description:
        "Responsible for respiratory, ocular, and gastrointestinal infections in humans.",
    },
    {
      id: "coronaviridae",
      name: "Coronaviridae - SARS-CoV-2",
      genome: "Complete genome",
      description:
        "Causative agent of COVID-19 pandemic, with multiple variants of concern.",
    },
    {
      id: "herpesviridae",
      name: "Herpesviridae - Human herpesvirus 1",
      genome: "Complete genome",
      description:
        "Causes oral herpes infections and can establish lifelong latency in host neurons.",
    },
    {
      id: "orthomyxoviridae",
      name: "Orthomyxoviridae - Influenza A virus",
      genome: "Segment 4, HA gene",
      description:
        "Highly variable respiratory pathogen with multiple subtypes based on HA and NA genes.",
    },
  ];

  // Example sequence
  const exampleSequence = `>Sample_Adenovirus_Sequence
ATGCCGGTCGATGCGGTCGCGAGGCGAGGCGGCTATCCTGCGGATGCTGCCCGGCGACTCGCGCACGCGG
GGGATGCGGCGGGACGCGGCCGCCGGGCTCGATCCCGTCGCGGGCGATGCGCACCTATCCCGGCATGACG
GTGGTGCGGCCTAGCACGGTGCTAGCGCTGGGACGCACCGTGCCCACGCTGCTGGCGTGCCCGCCGGAGA
CGCTGGTGAAGGACCGCGCCGTGATCCTGGCCGACGCTATCCCCACCGGCGTGCACACTGTGTGGGTGGG
CGGGGTCGAGGACGACGCCGACAGCAGCAACACCCCCTTCGACGTGGTGACGCTGCCGCCCACGTACTTC
GCGCTGGTGCAGCACTGGTACGACGATAACGACCTCTGGAACGTGGTGGGACCCATGGCGCGCGTGCGG`;

  // Sample classification results
  const classificationResult = {
    query: "Sample_Adenovirus_Sequence",
    classification: "Human mastadenovirus A",
    subtype: "Type 5",
    confidence: 98.2,
    references: [
      {
        id: "AY339865.1",
        description: "Human adenovirus type 5 strain NHRC Ad5-5",
        similarity: "99.1%",
      },
      {
        id: "KY968900.1",
        description: "Human adenovirus 5 isolate HAdV-C-UK4",
        similarity: "98.7%",
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-white">
      {/* Header */}
      <header className="bg-gradient-to-r from-indigo-700 to-purple-800 py-6 text-white">
        <div className="container mx-auto px-6">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-white/20 p-2">
                <Dna className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  Subspecies Classification
                </h1>
                <p className="text-sm text-indigo-100">
                  Viral taxonomy and phylogenetic placement
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="border-none bg-white/20 text-white transition-colors hover:bg-white/30">
                <a href="#" className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5" />
                  <span>Reference Guide</span>
                </a>
              </Badge>
              <Badge className="border-none bg-white/20 text-white transition-colors hover:bg-white/30">
                <a href="#" className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5" />
                  <span>Tutorial</span>
                </a>
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-6 py-8">
        <div className="mb-8">
          <Alert className="border-indigo-200 bg-indigo-50">
            <Info className="h-4 w-4 text-indigo-600" />
            <AlertDescription className="text-indigo-700">
              This tool assigns genotype/subtype of a virus based on ICTV
              taxonomy by placing your query sequence within a reference tree
              using pplacer and Cladinator for interpretation.
            </AlertDescription>
          </Alert>
        </div>

        {!isProcessing && !isComplete ? (
          <Tabs
            defaultValue={activeTab}
            className="w-full"
            onValueChange={setActiveTab}
          >
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger
                value="input"
                className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700"
              >
                <FileCode className="mr-2 h-4 w-4" />
                Input Sequence
              </TabsTrigger>
              <TabsTrigger
                value="species"
                className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700"
              >
                <Microscope className="mr-2 h-4 w-4" />
                Select Species
              </TabsTrigger>
              <TabsTrigger
                value="output"
                className="data-[state=active]:bg-indigo-100 data-[state=active]:text-indigo-700"
              >
                <FileType className="mr-2 h-4 w-4" />
                Output Settings
              </TabsTrigger>
            </TabsList>

            {/* Input Sequence Tab */}
            <TabsContent value="input" className="mt-6">
              <Card className="border-none shadow-md">
                <CardHeader className="rounded-t-lg bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2 text-lg text-indigo-800">
                    <FileCode className="h-5 w-5 text-indigo-600" />
                    Input Sequence
                  </CardTitle>
                  <CardDescription>
                    Provide the viral sequence for subspecies classification
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 pb-6">
                  <div className="space-y-6">
                    <div className="flex gap-4 rounded-lg bg-gray-50 p-2">
                      <Button
                        variant={
                          inputMethod === "paste" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setInputMethod("paste")}
                        className={
                          inputMethod === "paste" ? "bg-indigo-600" : ""
                        }
                      >
                        Paste Sequence
                      </Button>
                      <Button
                        variant={
                          inputMethod === "upload" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => setInputMethod("upload")}
                        className={
                          inputMethod === "upload" ? "bg-indigo-600" : ""
                        }
                      >
                        Upload FASTA
                      </Button>
                      <Button
                        variant={
                          inputMethod === "example" ? "default" : "outline"
                        }
                        size="sm"
                        onClick={() => {
                          setInputMethod("example");
                          setQuerySequence(exampleSequence);
                        }}
                        className={
                          inputMethod === "example" ? "bg-indigo-600" : ""
                        }
                      >
                        Use Example
                      </Button>
                    </div>

                    {inputMethod === "paste" && (
                      <div>
                        <Label
                          htmlFor="sequence"
                          className="mb-2 block text-sm text-gray-600"
                        >
                          Enter one or more query nucleotide or protein
                          sequences in FASTA format
                        </Label>
                        <Textarea
                          id="sequence"
                          placeholder="Enter sequence in FASTA format, starting with a header line '>' followed by sequence lines..."
                          className="min-h-[240px] font-mono text-sm"
                          value={querySequence}
                          onChange={(e) => setQuerySequence(e.target.value)}
                        />
                      </div>
                    )}

                    {inputMethod === "upload" && (
                      <div className="rounded-lg border-2 border-dashed border-indigo-200 p-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="mb-4 rounded-full bg-indigo-100 p-3">
                            <UploadCloud className="h-6 w-6 text-indigo-600" />
                          </div>
                          <h3 className="mb-2 font-medium">
                            Upload FASTA file
                          </h3>
                          <p className="mb-6 max-w-md text-sm text-gray-500">
                            Select a FASTA format file containing one or more
                            viral sequences
                          </p>
                          <Button
                            variant="outline"
                            className="flex items-center gap-2"
                            onClick={() => {
                              // Would trigger file upload in real implementation
                              setSelectedFile("virus_sequence.fasta");
                            }}
                          >
                            <Upload className="h-4 w-4" />
                            Browse Files
                          </Button>

                          {selectedFile && (
                            <div className="mt-4 flex items-center gap-2 rounded-md bg-indigo-50 p-2 text-sm">
                              <FileText className="h-4 w-4 text-indigo-600" />
                              <span className="font-medium">
                                {selectedFile}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="ml-2 h-6 w-6"
                                onClick={() => setSelectedFile(null)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {inputMethod === "example" && (
                      <div>
                        <Label className="mb-2 block text-sm text-gray-600">
                          Example adenovirus sequence for demonstration
                        </Label>
                        <div className="relative">
                          <Textarea
                            value={exampleSequence}
                            readOnly
                            className="min-h-[240px] bg-gray-50 font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="absolute top-2 right-2 flex h-7 items-center gap-1.5"
                            onClick={() => {
                              navigator.clipboard.writeText(exampleSequence);
                              // Would show a toast in real implementation
                            }}
                          >
                            <Copy className="h-3.5 w-3.5" />
                            <span className="text-xs">Copy</span>
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between border-t bg-gray-50 pt-2">
                  <div></div>
                  <Button
                    onClick={() => setActiveTab("species")}
                    disabled={!querySequence && !selectedFile}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Continue to Species Selection
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* Species Selection Tab */}
            <TabsContent value="species" className="mt-6">
              <Card className="border-none shadow-md">
                <CardHeader className="rounded-t-lg bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2 text-lg text-indigo-800">
                    <Microscope className="h-5 w-5 text-indigo-600" />
                    Select Target Species
                  </CardTitle>
                  <CardDescription>
                    Choose the viral species for subspecies/genotype
                    classification
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 pb-6">
                  <div className="grid grid-cols-1 gap-4">
                    {speciesOptions.map((species) => (
                      <div
                        key={species.id}
                        className={`cursor-pointer rounded-lg border-2 p-4 transition-colors ${
                          selectedSpecies === species.id
                            ? "border-indigo-500 bg-indigo-50"
                            : "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50/50"
                        }`}
                        onClick={() => setSelectedSpecies(species.id)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedSpecies === species.id}
                            className="mt-1"
                          />
                          <div>
                            <p className="font-medium">{species.name}</p>
                            <p className="mt-0.5 text-xs text-indigo-600">
                              {species.genome}
                            </p>
                            <p className="mt-1 text-sm text-gray-600">
                              {species.description}
                            </p>
                            {selectedSpecies === species.id && (
                              <div className="mt-3 rounded bg-indigo-100/50 p-2 text-xs text-indigo-700">
                                <div className="flex items-start gap-2">
                                  <TreePine className="mt-0.5 h-4 w-4 text-indigo-600" />
                                  <div>
                                    <p className="font-medium">
                                      Reference tree includes:
                                    </p>
                                    <p>
                                      57 reference sequences across all known
                                      subtypes and genetic lineages
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between border-t bg-gray-50 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("input")}
                  >
                    Back to Input
                  </Button>
                  <Button
                    onClick={() => setActiveTab("output")}
                    className="bg-indigo-600 hover:bg-indigo-700"
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
                <CardHeader className="rounded-t-lg bg-gradient-to-r from-indigo-50 to-purple-50">
                  <CardTitle className="flex items-center gap-2 text-lg text-indigo-800">
                    <FileType className="h-5 w-5 text-indigo-600" />
                    Output Settings
                  </CardTitle>
                  <CardDescription>
                    Configure output files and analysis parameters
                  </CardDescription>
                </CardHeader>

                <CardContent className="pt-6 pb-6">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-4">
                      <div>
                        <Label>Output Format</Label>
                        <Select defaultValue="standard">
                          <SelectTrigger>
                            <SelectValue placeholder="Select output format" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="standard">
                              Standard Report (HTML)
                            </SelectItem>
                            <SelectItem value="detailed">
                              Detailed Report (PDF)
                            </SelectItem>
                            <SelectItem value="csv">
                              Tabular Results (CSV)
                            </SelectItem>
                            <SelectItem value="json">
                              Machine-Readable (JSON)
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="mt-1 text-xs text-gray-500">
                          Format for classification results
                        </p>
                      </div>

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
                          Directory where output files will be saved
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Output Filename</Label>
                        <Input
                          placeholder="virus_classification_results"
                          value={outputName}
                          onChange={(e) => setOutputName(e.target.value)}
                        />
                        <p className="text-xs text-gray-500">
                          Base name for output files (extension will be added
                          based on format)
                        </p>
                      </div>

                      <div className="mt-4 space-y-3">
                        <Label>Analysis Options</Label>
                        <div className="flex items-center gap-2">
                          <Checkbox id="include-tree" defaultChecked />
                          <Label
                            htmlFor="include-tree"
                            className="text-sm font-normal"
                          >
                            Include phylogenetic tree visualization
                          </Label>
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox id="show-bootstrap" defaultChecked />
                          <Label
                            htmlFor="show-bootstrap"
                            className="text-sm font-normal"
                          >
                            Show bootstrap values
                          </Label>
                        </div>

                        <div className="flex items-center gap-2">
                          <Checkbox id="include-alignment" defaultChecked />
                          <Label
                            htmlFor="include-alignment"
                            className="text-sm font-normal"
                          >
                            Include sequence alignment data
                          </Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6">
                    <Alert className="border-indigo-100 bg-indigo-50">
                      <Database className="h-4 w-4 text-indigo-600" />
                      <AlertDescription className="text-indigo-700">
                        This analysis will compare your sequence against a
                        reference database of validated viral genomes to
                        determine the most likely subspecies classification
                        according to ICTV standards.
                      </AlertDescription>
                    </Alert>
                  </div>
                </CardContent>

                <CardFooter className="flex justify-between border-t bg-gray-50 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setActiveTab("species")}
                  >
                    Back to Species Selection
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    Run Classification
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        ) : isProcessing ? (
          <div className="mx-auto mt-8 max-w-2xl rounded-lg border bg-white p-8 text-center shadow-sm">
            <div className="space-y-6">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100">
                <TreePine className="h-8 w-8 animate-pulse text-indigo-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-800">
                Processing Your Sequence
              </h2>
              <p className="mx-auto max-w-md text-gray-500">
                Classifying your sequence using{" "}
                {speciesOptions.find((s) => s.id === selectedSpecies)?.name}{" "}
                reference data
              </p>

              <div className="mx-auto max-w-md">
                <div className="mb-2 flex justify-between text-sm">
                  <span>Placing sequence in reference tree</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />

                <div className="mt-6 space-y-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${progress >= 25 ? "bg-green-100 text-green-600" : "animate-pulse bg-indigo-100 text-indigo-600"}`}
                    >
                      {progress >= 25 ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      Aligning query sequence
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${progress >= 50 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                    >
                      {progress >= 50 ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      Running placement algorithm
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${progress >= 75 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                    >
                      {progress >= 75 ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      Determining classification
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${progress >= 100 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}
                    >
                      {progress >= 100 ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <AlertCircle className="h-4 w-4" />
                      )}
                    </div>
                    <span className="text-sm text-gray-600">
                      Generating report
                    </span>
                  </div>
                </div>
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
                Classification Complete
              </h2>
              <p className="mx-auto mt-2 max-w-md text-gray-500">
                Your sequence has been successfully classified
              </p>
            </div>

            <div className="mb-6 rounded-lg border border-indigo-100 bg-indigo-50 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-indigo-800">
                  Classification Results
                </h3>
                <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200">
                  Confidence: {classificationResult.confidence}%
                </Badge>
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-indigo-600">
                        Query Sequence
                      </p>
                      <p className="font-medium">
                        {classificationResult.query}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-indigo-600">
                        Species
                      </p>
                      <p className="font-medium">
                        {classificationResult.classification}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-medium text-indigo-600">
                        Subtype/Genotype
                      </p>
                      <p className="font-medium">
                        {classificationResult.subtype}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-sm font-medium text-indigo-600">
                    Closest References
                  </p>
                  <div className="space-y-3">
                    {classificationResult.references.map((ref, index) => (
                      <div
                        key={index}
                        className="rounded border border-indigo-100 bg-white p-3"
                      >
                        <div className="flex items-start gap-2">
                          <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-100">
                            <span className="text-xs font-medium text-indigo-700">
                              {index + 1}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium">{ref.id}</p>
                            <p className="text-xs text-gray-600">
                              {ref.description}
                            </p>
                            <p className="mt-1 text-xs font-medium text-indigo-600">
                              Similarity: {ref.similarity}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-indigo-200 pt-4">
                <div className="flex items-start gap-3">
                  <Info className="mt-0.5 h-5 w-5 text-indigo-600" />
                  <p className="text-sm text-indigo-700">
                    This classification is based on phylogenetic placement
                    within a reference tree of validated viral genomes. The
                    confidence score reflects the statistical support for this
                    placement.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Download className="h-4 w-4" />
                Download Full Report
              </Button>
              <Button variant="outline" onClick={handleReset}>
                Start New Classification
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
