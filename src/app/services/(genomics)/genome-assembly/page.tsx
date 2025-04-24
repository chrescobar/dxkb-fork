"use client";

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Info,
  Upload,
  X,
  ChevronRight,
  Trash2,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { NumberInput } from "@/components/ui/number-input";

interface Library {
  id: string;
  name: string;
  type: "paired" | "single" | "sra";
}

interface ReadFile {
  id: number;
  filename: string;
}

export default function GenomeAssemblyPage() {
  const [pairedReadFiles, setPairedReadFiles] = useState<ReadFile[]>([
    { id: 1, filename: "" },
    { id: 2, filename: "" },
  ]);
  const [singleReadFiles, setSingleReadFiles] = useState<ReadFile[]>([
    { id: 1, filename: "" },
  ]);
  const [sraAccession, setSraAccession] = useState("");
  const [selectedLibraries, setSelectedLibraries] = useState<Library[]>([]);
  const [outputFolder, setOutputFolder] = useState("");
  const [outputName, setOutputName] = useState("");
  const [assemblyStrategy, setAssemblyStrategy] = useState("auto");
  const [genomeSizeUnit, setGenomeSizeUnit] = useState("M");
  const [showAdvanced, setShowAdvanced] = useState(false);

  const addPairedReadFile = () => {
    const newId =
      pairedReadFiles.length > 0
        ? Math.max(...pairedReadFiles.map((file) => file.id)) + 1
        : 1;
    setPairedReadFiles([...pairedReadFiles, { id: newId, filename: "" }]);
  };

  const addSingleReadFile = () => {
    const newId =
      singleReadFiles.length > 0
        ? Math.max(...singleReadFiles.map((file) => file.id)) + 1
        : 1;
    setSingleReadFiles([...singleReadFiles, { id: newId, filename: "" }]);
  };

  const removePairedReadFile = (id: number) => {
    setPairedReadFiles(pairedReadFiles.filter((file) => file.id !== id));
  };

  const removeSingleReadFile = (id: number) => {
    setSingleReadFiles(singleReadFiles.filter((file) => file.id !== id));
  };

  const updatePairedReadFile = (id: number, filename: string) => {
    setPairedReadFiles(
      pairedReadFiles.map((file) =>
        file.id === id ? { ...file, filename } : file,
      ),
    );
  };

  const updateSingleReadFile = (id: number, filename: string) => {
    setSingleReadFiles(
      singleReadFiles.map((file) =>
        file.id === id ? { ...file, filename } : file,
      ),
    );
  };

  const addToSelectedLibraries = (
    file: ReadFile,
    type: "paired" | "single",
  ) => {
    if (
      file.filename &&
      !selectedLibraries.some((lib) => lib.id === `${type}-${file.id}`)
    ) {
      setSelectedLibraries([
        ...selectedLibraries,
        {
          id: `${type}-${file.id}`,
          name: file.filename,
          type,
        },
      ]);
    }
  };

  const removeFromSelectedLibraries = (id: string) => {
    setSelectedLibraries(selectedLibraries.filter((lib) => lib.id !== id));
  };

  const resetForm = () => {
    setPairedReadFiles([
      { id: 1, filename: "" },
      { id: 2, filename: "" },
    ]);
    setSingleReadFiles([{ id: 1, filename: "" }]);
    setSraAccession("");
    setSelectedLibraries([]);
    setOutputFolder("");
    setOutputName("");
    setAssemblyStrategy("auto");
    setShowAdvanced(false);
  };

  return (
    <div className="service-container container">
      <div className="service-header">
        <div className="service-header-title">
          <h1>Genome Assembly</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="h-4 w-4 text-blue-500" />
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">
                  The Genome Assembly Service compares multiple assemblies to
                  find the optimal result.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="service-header-description">
          <div className="text-gray-600">
            <p>
              The Genome Assembly Service allows single or multiple assemblies to
              be involved to compare results. The service attempts to select the
              best assembly.
            </p>
            <a
              href="/docs/assembly-guide"
            >
              Quick Reference Guide
              <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column */}
        <div className="lg:col-span-7">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                Input Files
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="service-header-tooltip" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        Upload your paired-end reads, single reads, or provide
                        SRA accession numbers
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="service-subsection">
                <Label>Paired Read Library</Label>
                {pairedReadFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder={`READ FILE ${file.id}`}
                        value={file.filename}
                        onChange={(e) =>
                          updatePairedReadFile(file.id, e.target.value)
                        }
                        className="pr-10"
                      />
                      {pairedReadFiles.length > 2 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-0 right-0"
                          onClick={() => removePairedReadFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => addToSelectedLibraries(file, "paired")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="service-subsection">
                <Label>Single Read Library</Label>
                {singleReadFiles.map((file) => (
                  <div key={file.id} className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <Input
                        placeholder="READ FILE"
                        value={file.filename}
                        onChange={(e) =>
                          updateSingleReadFile(file.id, e.target.value)
                        }
                        className="pr-10"
                      />
                      {singleReadFiles.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="absolute top-0 right-0"
                          onClick={() => removeSingleReadFile(file.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => addToSelectedLibraries(file, "single")}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="service-subsection">
                <Label>SRA Run Accession</Label>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="SRR"
                    value={sraAccession}
                    onChange={(e) => setSraAccession(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => {
                      if (sraAccession) {
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
                    }}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                Parameters
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Configure the assembly parameters</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="assembly-strategy">Assembly Strategy</Label>
                    <Select
                      value={assemblyStrategy}
                      onValueChange={setAssemblyStrategy}
                    >
                      <SelectTrigger id="assembly-strategy">
                        <SelectValue placeholder="Select strategy" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto</SelectItem>
                        <SelectItem value="unicycler">Unicycler</SelectItem>
                        <SelectItem value="spades">SPAdes</SelectItem>
                        <SelectItem value="canu">Canu</SelectItem>
                        <SelectItem value="metaspades">MetaSPAdes</SelectItem>
                        <SelectItem value="plasmidspades">PlasmidSPAdes</SelectItem>
                        <SelectItem value="mda">MDA (single-cell)</SelectItem>
                        <SelectItem value="flye">Flye</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="output-name">Output Name</Label>
                    <Input
                      id="output-name"
                      value={outputName}
                      onChange={(e) => setOutputName(e.target.value)}
                      placeholder="Output Name"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="output-folder">Output Folder</Label>
                  <Input
                    id="output-folder"
                    value={outputFolder}
                    onChange={(e) => setOutputFolder(e.target.value)}
                    placeholder="Specify output folder"
                  />
                </div>

                <Collapsible
                  open={showAdvanced}
                  onOpenChange={setShowAdvanced}
                  className="service-collapsible-container"
                >
                  <CollapsibleTrigger className="service-collapsible-trigger">
                    Advanced Options
                    <ChevronDown
                      className={`h-4 w-4 transition-transform ${showAdvanced ? "rotate-180 transform" : ""}`}
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-6">
                    <div className="grid grid-cols-1 gap-4 px-2 pt-4 sm:grid-cols-3">
                      <div className="space-y-2">
                        <Label htmlFor="illumina-reads">Normalize Illumina Reads</Label>
                        <Switch id="illumina-reads" defaultChecked={true} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="trim-short-reads">Trim Short Reads</Label>
                        <Switch id="trim-short-reads" defaultChecked={true} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="filter-long-reads">Filter Long Reads</Label>
                        <Switch id="filter-long-reads" defaultChecked={true} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Genome Parameters</Label>
                      <div className="flex flex-col sm:flex-row w-full gap-2 sm:items-end">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="genome-coverage">Genome Coverage</Label>
                          <NumberInput id="genome-coverage" min={100} max={500} stepper={50} defaultValue={200} />
                        </div>
                        <p className="text-lg p-1">x</p>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="genome-size">Genome Size</Label>
                          <div className="flex flex-row gap-2 items-center">
                            <NumberInput id="genome-size" min={1} max={500} stepper={50} defaultValue={200} />
                            <Select
                            value={genomeSizeUnit}
                            onValueChange={setGenomeSizeUnit}
                            >
                              <SelectTrigger id="genome-size-unit">
                                <SelectValue placeholder="Select unit" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="M">M</SelectItem>
                                <SelectItem value="K">K</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Assembly Polishing</Label>
                      <div className="flex flex-col sm:flex-row w-full gap-2 sm:items-end">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="racon-iterations">Racon Iterations</Label>
                          <NumberInput id="racon-iterations" min={0} max={4} defaultValue={2} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="pilon-iterations">Pilon Iterations</Label>
                          <NumberInput id="pilon-iterations" min={0} max={4} defaultValue={2} />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <Label className="text-lg font-semibold">Assembly Thresholds</Label>
                      <div className="flex flex-col sm:flex-row w-full gap-2 sm:items-end">
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="genome-coverage">Genome Coverage</Label>
                          <NumberInput id="genome-coverage" min={100} max={10000} stepper={10} defaultValue={300} />
                        </div>
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="genome-size">Genome Size</Label>
                          <NumberInput id="genome-size" min={0} max={10000} stepper={5} defaultValue={5} />
                        </div>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader>
              <CardTitle className="flex items-center">
                Selected Libraries
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger className="ml-2">
                      <Info className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Files that will be used for assembly</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </CardTitle>
              <CardDescription>
                Place read files here using the arrow buttons.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="min-h-72 rounded-md border p-4">
                {selectedLibraries.length === 0 ? (
                  <div className="flex h-64 flex-col items-center justify-center text-gray-400">
                    <Upload className="mb-4 h-10 w-10 opacity-20" />
                    <p>No libraries selected</p>
                    <p className="mt-2 text-sm">
                      Use the arrow buttons to add libraries
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedLibraries.map((lib) => (
                      <div
                        key={lib.id}
                        className="flex items-center justify-between rounded border border-gray-100 bg-gray-50 p-3"
                      >
                        <div>
                          <div className="font-medium">{lib.name}</div>
                          <div className="text-xs text-gray-500">
                            {lib.type === "paired"
                              ? "Paired Read"
                              : lib.type === "single"
                                ? "Single Read"
                                : "SRA Accession"}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeFromSelectedLibraries(lib.id)}
                          className="hover:bg-red-50 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="service-form-controls">
        <Button variant="outline" onClick={resetForm}>
          Reset
        </Button>
        <Button>Assemble</Button>
      </div>
    </div>
  );
}
